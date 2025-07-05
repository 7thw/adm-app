import { query } from "./_generated/server";

// Get current user via Clerk authentication
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Look for user in our users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    return {
      ...user,
      clerkUser: {
        id: identity.subject,
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
      }
    };
  },
});

// Get current user profile with role information
export const getCurrentUserProfile = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    // Get user profile with role information
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return {
      user,
      profile,
      clerkUser: {
        id: identity.subject,
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
      }
    };
  },
});
