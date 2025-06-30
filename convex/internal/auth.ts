import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Sync user data from Clerk
export const syncUserFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find existing profile
    let profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    // Find or create auth user
    let authUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!authUser) {
      const authUserId = await ctx.db.insert("users", {
        email: args.email,
        name: args.firstName && args.lastName ? `${args.firstName} ${args.lastName}` : undefined,
        image: args.imageUrl,
      });
      authUser = await ctx.db.get(authUserId);
    }

    if (!authUser) {
      throw new Error("Failed to create auth user");
    }

    if (profile) {
      // Update existing profile
      await ctx.db.patch(profile._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        lastActiveAt: Date.now(),
      });
    } else {
      // Create new profile
      await ctx.db.insert("userProfiles", {
        userId: authUser._id,
        clerkUserId: args.clerkUserId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        role: "subscriber",
        subscriptionStatus: "inactive",
        lastActiveAt: Date.now(),
        isActive: true,
      });
    }
  },
});

// Update subscription status
export const updateSubscriptionStatus = internalMutation({
  args: {
    clerkUserId: v.string(),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("canceled"),
      v.literal("past_due")
    ),
    subscriptionId: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        subscriptionStatus: args.subscriptionStatus,
        subscriptionId: args.subscriptionId,
        subscriptionPlan: args.subscriptionPlan,
        subscriptionExpiresAt: args.subscriptionExpiresAt,
        lastActiveAt: Date.now(),
      });
    }
  },
});
