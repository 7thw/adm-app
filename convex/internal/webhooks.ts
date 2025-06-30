import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const logWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    source: v.union(v.literal("clerk"), v.literal("stripe")),
    data: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      ...args,
      processed: false,
      retryCount: 0,
    });
  },
});

export const markEventProcessed = internalMutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();

    if (event) {
      await ctx.db.patch(event._id, {
        processed: true,
        processedAt: Date.now(),
      });
    }
  },
});

export const logWebhookError = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    source: v.union(v.literal("clerk"), v.literal("stripe")),
    data: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      source: args.source,
      data: args.data,
      processed: false,
      errorMessage: args.errorMessage,
      retryCount: 0,
    });
  },
});

export const handleUserDeletion = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // Find user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (profile) {
      // Soft delete - mark as inactive instead of hard delete
      await ctx.db.patch(profile._id, {
        isActive: false,
        subscriptionStatus: "canceled",
      });

      // Deactivate user playlists
      const userPlaylists = await ctx.db
        .query("userPlaylists")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .collect();

      for (const playlist of userPlaylists) {
        await ctx.db.patch(playlist._id, { isActive: false });
      }
    }
  },
});

export const handleOrganizationMembership = internalMutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    role: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find existing organization role
    const existingRole = await ctx.db
      .query("organizationRoles")
      .withIndex("by_user_organization", (q) => 
        q.eq("userId", args.userId as any).eq("organizationId", args.organizationId)
      )
      .unique();

    const permissions = args.role === "admin" ? ["read", "write", "delete", "manage_users"] : ["read"];

    if (existingRole) {
      await ctx.db.patch(existingRole._id, {
        role: args.role === "admin" ? "admin" : "member",
        permissions,
        isActive: args.isActive,
      });
    } else if (args.isActive) {
      await ctx.db.insert("organizationRoles", {
        userId: args.userId as any,
        organizationId: args.organizationId,
        role: args.role === "admin" ? "admin" : "member",
        permissions,
        isActive: true,
      });
    }

    // Update user profile role if they're an admin
    if (args.role === "admin" && args.isActive) {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.userId))
        .unique();

      if (profile && profile.role !== "admin") {
        await ctx.db.patch(profile._id, { role: "admin" });
      }
    }
  },
});
