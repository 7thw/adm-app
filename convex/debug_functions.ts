import { query, mutation } from "./_generated/server";

// =================================================================
// DEBUG AND UTILITY FUNCTIONS FOR SUBSCRIBERS
// =================================================================

export const debugUserAuth = query({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      
      if (!identity) {
        return {
          authenticated: false,
          error: "No identity found"
        };
      }

      const clerkUserId = identity.subject;
      
      // Try to find user profile
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
        .unique();

      return {
        authenticated: true,
        clerkUserId,
        email: identity.email,
        name: identity.name,
        hasProfile: !!profile,
        profileId: profile?._id,
        subscriptionStatus: profile?.subscriptionStatus || 'none',
        identity
      };
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const ensureUserProfile = mutation({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      
      if (!identity) {
        throw new Error("Authentication required");
      }

      const clerkUserId = identity.subject;
      const email = identity.email || '';
      const firstName = typeof identity.given_name === 'string' ? identity.given_name : undefined;
      const lastName = typeof identity.family_name === 'string' ? identity.family_name : undefined;
      
      // Get issuer for token identifier
      const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
      if (!issuer) {
        throw new Error("CLERK_JWT_ISSUER_DOMAIN environment variable not set");
      }
      
      // Check if profile already exists
      const existingProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
        .unique();

      if (existingProfile) {
        // Update existing profile
        await ctx.db.patch(existingProfile._id, {
          email,
          firstName,
          lastName,
          lastActiveAt: Date.now(),
        });
        
        return {
          success: true,
          profileId: existingProfile._id,
          action: 'updated'
        };
      } else {
        // Create user record first, then profile
        let userRecord = await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", `${issuer}|${clerkUserId}`))
          .unique();

        if (!userRecord) {
          const userRecordId = await ctx.db.insert("users", {
            tokenIdentifier: `${issuer}|${clerkUserId}`,
          });
          userRecord = await ctx.db.get(userRecordId);
          if (!userRecord) {
            throw new Error("Failed to create user record");
          }
        }

        // Create new profile
        const newProfileId = await ctx.db.insert("userProfiles", {
          userId: userRecord._id,
          clerkUserId,
          email,
          firstName,
          lastName,
          role: "subscriber",
          subscriptionStatus: "active", // Default for now
          subscriptionPlan: "premium", // Default for now
          isActive: true,
          lastActiveAt: Date.now(),
        });
        
        return {
          success: true,
          profileId: newProfileId,
          action: 'created'
        };
      }
    } catch (error) {
      throw new Error(`Failed to ensure user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
