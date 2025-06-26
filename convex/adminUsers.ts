import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin-only function to get current admin user
export const getAdminUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return user;
  },
});

// Admin-only function to get all users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if user is an admin
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Return all users (admin only)
    return await ctx.db.query("adminUsers").collect();
  },
});

// Admin-only function to create an admin user
export const storeAdminUser = mutation({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeAdminUser without authentication present");
    }

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }

      // Ensure the user has admin role
      if (user.role !== "admin") {
        await ctx.db.patch(user._id, { role: "admin" });
      }

      return user._id;
    }

    // If it's a new identity, create a new admin user
    return await ctx.db.insert("adminUsers", {
      clerkId: identity.subject ?? identity.tokenIdentifier.split("|")[1],
      name: identity.name ?? "Admin",
      tokenIdentifier: identity.tokenIdentifier,
      role: "admin",
      subscriptionStatus: "active", // Default subscription status for admins
      email: args.email ?? identity.email ?? "", // Ensure email is never undefined
      lastLogin: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
