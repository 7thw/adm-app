import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const syncUserFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, email, firstName, lastName, imageUrl }) => {
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) {
      throw new Error("CLERK_JWT_ISSUER_DOMAIN environment variable not set");
    }
    const tokenIdentifier = `${issuer}|${clerkUserId}`;

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!userRecord) {
      console.error(`Could not find user in 'users' table for Clerk ID: ${clerkUserId}`);
      return null;
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userRecord._id))
      .unique();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        email,
        firstName,
        lastName,
        imageUrl,
        lastActiveAt: Date.now(),
      });
      console.log(`Updated user profile for Clerk ID: ${clerkUserId}`);
      return userProfile._id;
    } else {
      const newProfileId = await ctx.db.insert("userProfiles", {
        userId: userRecord._id,
        clerkUserId,
        email,
        firstName,
        lastName,
        imageUrl,
        role: "subscriber",
        subscriptionStatus: "inactive",
        lastActiveAt: Date.now(),
        isActive: true,
      });
      console.log(`Created new user profile for Clerk ID: ${clerkUserId}`);
      return newProfileId;
    }
  },
});

export const handleUserDeletion = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) {
      throw new Error("CLERK_JWT_ISSUER_DOMAIN environment variable not set");
    }
    const tokenIdentifier = `${issuer}|${clerkUserId}`;

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (userRecord) {
      const userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userRecord._id))
        .unique();

      if (userProfile) {
        await ctx.db.delete(userProfile._id);
        console.log(`Deleted user profile for Clerk ID: ${clerkUserId}`);
      }

      await ctx.db.delete(userRecord._id);
      console.log(`Deleted user from 'users' table for Clerk ID: ${clerkUserId}`);
    } else {
      console.warn(`Could not find user to delete for Clerk ID: ${clerkUserId}`);
    }
  },
});
