import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

// Helper function to check subscriber access using Clerk authentication
async function requireSubscriberAccess(ctx: QueryCtx | MutationCtx): Promise<{ clerkUserId: string; profile: Doc<"userProfiles"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const clerkUserId = identity.subject;
  
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();

  if (!profile) {
    throw new Error("User profile not found");
  }

  // Check active subscription
  const hasActiveSubscription = profile.subscriptionStatus === "active" &&
    profile.isActive &&
    (!profile.subscriptionExpiresAt || profile.subscriptionExpiresAt > Date.now());

  if (!hasActiveSubscription) {
    throw new Error("Active subscription required");
  }

  return { clerkUserId, profile };
}

// =================================================================
// PUBLISHED CORE CONTENT ACCESS
// =================================================================

export const getPublishedCorePlaylists = query({
  args: { categoryId: v.optional(v.id("coreCategories")) },
  handler: async (ctx, args): Promise<any[]> => {
    await requireSubscriberAccess(ctx);

    let corePlaylists;

    if (args.categoryId) {
      corePlaylists = await ctx.db
        .query("corePlaylists")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "published")
        )
        .order("desc")
        .collect();
    } else {
      corePlaylists = await ctx.db
        .query("corePlaylists")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .order("desc")
        .collect();
    }

    // Get core sections and core medias for each core playlist
    return await Promise.all(
      corePlaylists.map(async (corePlaylist) => {
        const coreSections = await ctx.db
          .query("coreSections")
          .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", corePlaylist._id))
          .order("asc")
          .collect();

        const coreSectionsWithCoreMedias = await Promise.all(
          coreSections.map(async (coreSection) => {
            const coreSectionMedias = await ctx.db
              .query("coreSectionMedias")
              .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", coreSection._id))
              .order("asc")
              .collect();

            const coreMedias = await Promise.all(
              coreSectionMedias.map(async (coreSectionMedia) => {
                const coreMedia = await ctx.db.get(coreSectionMedia.coreMediaId);
                if (!coreMedia) return null;

                return {
                  ...coreMedia,
                  url: coreMedia.storageId ? await ctx.storage.getUrl(coreMedia.storageId) : coreMedia.embedUrl,
                  thumbnailUrl: coreMedia.thumbnailStorageId
                    ? await ctx.storage.getUrl(coreMedia.thumbnailStorageId)
                    : coreMedia.thumbnailUrl,
                  coreSectionMediaInfo: {
                    order: coreSectionMedia.order,
                    isOptional: coreSectionMedia.isOptional,
                    defaultSelected: coreSectionMedia.defaultSelected,
                  },
                };
              })
            );

            return {
              ...coreSection,
              coreMedias: coreMedias.filter(Boolean),
            };
          })
        );

        return {
          ...corePlaylist,
          coreSections: coreSectionsWithCoreMedias,
        };
      })
    );
  },
});

export const getCorePlaylistDetails = query({
  args: { corePlaylistId: v.id("corePlaylists") },
  handler: async (ctx, args): Promise<any> => {
    await requireSubscriberAccess(ctx);

    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist || corePlaylist.status !== "published") {
      throw new Error("Core playlist not found or not published");
    }

    // Get core sections with core medias
    const coreSections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .order("asc")
      .collect();

    const coreSectionsWithCoreMedias = await Promise.all(
      coreSections.map(async (coreSection) => {
        const coreSectionMedias = await ctx.db
          .query("coreSectionMedias")
          .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", coreSection._id))
          .order("asc")
          .collect();

        const coreMedias = await Promise.all(
          coreSectionMedias.map(async (coreSectionMedia) => {
            const coreMedia = await ctx.db.get(coreSectionMedia.coreMediaId);
            if (!coreMedia) return null;

            return {
              ...coreMedia,
              url: coreMedia.storageId ? await ctx.storage.getUrl(coreMedia.storageId) : coreMedia.embedUrl,
              thumbnailUrl: coreMedia.thumbnailStorageId
                ? await ctx.storage.getUrl(coreMedia.thumbnailStorageId)
                : coreMedia.thumbnailUrl,
              coreSectionMediaInfo: {
                order: coreSectionMedia.order,
                isOptional: coreSectionMedia.isOptional,
                defaultSelected: coreSectionMedia.defaultSelected,
              },
            };
          })
        );

        return {
          ...coreSection,
          coreMedias: coreMedias.filter(Boolean),
        };
      })
    );

    return {
      ...corePlaylist,
      coreSections: coreSectionsWithCoreMedias,
    };
  },
});

// =================================================================
// USER PLAYLIST MANAGEMENT
// =================================================================

export const getUserPlaylists = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<Doc<"userPlaylists">[]> => {
    const { profile } = await requireSubscriberAccess(ctx);

    if (args.activeOnly) {
      return await ctx.db
        .query("userPlaylists")
        .withIndex("by_user_active", (q) =>
          q.eq("userId", profile.userId).eq("isActive", true)
        )
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("userPlaylists")
        .withIndex("by_user", (q) => q.eq("userId", profile.userId))
        .order("desc")
        .collect();
    }
  },
});

export const createUserPlaylist = mutation({
  args: {
    corePlaylistId: v.id("corePlaylists"),
    title: v.string(),
    userMediaSelections: v.string(), // JSON string of selected core medias per core section
  },
  handler: async (ctx, args): Promise<Id<"userPlaylists">> => {
    const { profile } = await requireSubscriberAccess(ctx);

    // Validate core playlist exists and is published
    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist || corePlaylist.status !== "published") {
      throw new Error("Core playlist not found or not published");
    }

    // Parse and validate user media selections
    let userSelections;
    try {
      userSelections = JSON.parse(args.userMediaSelections);
    } catch {
      throw new Error("Invalid user media selections format");
    }

    // Create user playlist
    const userPlaylistId = await ctx.db.insert("userPlaylists", {
      userId: profile.userId,
      corePlaylistId: args.corePlaylistId,
      title: args.title,
      customizations: args.userMediaSelections,
      isActive: true,
      isFavorite: false,
      playCount: 0,
      completionPercentage: 0,
      totalTimeSpent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create individual user media selections
    for (const [coreSectionId, coreMediaIds] of Object.entries(userSelections)) {
      if (Array.isArray(coreMediaIds)) {
        for (let i = 0; i < coreMediaIds.length; i++) {
          await ctx.db.insert("userMediaSelections", {
            userPlaylistId,
            coreSectionId: coreSectionId as any,
            coreMediaId: coreMediaIds[i] as any,
            isSelected: true,
            playOrder: i + 1,
            timeSpent: 0,
          });
        }
      }
    }

    return userPlaylistId;
  },
});

export const updateUserPlaylist = mutation({
  args: {
    userPlaylistId: v.id("userPlaylists"),
    title: v.optional(v.string()),
    userMediaSelections: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { profile } = await requireSubscriberAccess(ctx);

    const userPlaylist = await ctx.db.get(args.userPlaylistId);
    if (!userPlaylist || userPlaylist.userId !== profile.userId) {
      throw new Error("User playlist not found or access denied");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title) updates.title = args.title;
    if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;
    if (args.userMediaSelections) {
      updates.customizations = args.userMediaSelections;

      // Update individual user media selections if provided
      try {
        const userSelections = JSON.parse(args.userMediaSelections);

        // Remove existing user media selections
        const existingUserSelections = await ctx.db
          .query("userMediaSelections")
          .withIndex("by_user_playlist", (q) => q.eq("userPlaylistId", args.userPlaylistId))
          .collect();

        for (const userSelection of existingUserSelections) {
          await ctx.db.delete(userSelection._id);
        }

        // Add new user media selections
        for (const [coreSectionId, coreMediaIds] of Object.entries(userSelections)) {
          if (Array.isArray(coreMediaIds)) {
            for (let i = 0; i < coreMediaIds.length; i++) {
              await ctx.db.insert("userMediaSelections", {
                userPlaylistId: args.userPlaylistId,
                coreSectionId: coreSectionId as any,
                coreMediaId: coreMediaIds[i] as any,
                isSelected: true,
                playOrder: i + 1,
                timeSpent: 0,
              });
            }
          }
        }
      } catch {
        throw new Error("Invalid user media selections format");
      }
    }

    await ctx.db.patch(args.userPlaylistId, updates);
    return { success: true };
  },
});

// =================================================================
// USER PLAYER SETTINGS
// =================================================================

export const getUserPlayerSettings = query({
  args: {},
  handler: async (ctx): Promise<any> => {
    const { profile } = await requireSubscriberAccess(ctx);

    const userPlayerSettings = await ctx.db
      .query("userPlayerSettings")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .unique();

    if (!userPlayerSettings) {
      // Return default user player settings without creating them in a query
      return {
        _id: "" as any,
        _creationTime: Date.now(),
        userId: profile.userId,
        maxLoop: 1,
        countDownTimer: 10,
        volume: 80,
        playbackSpeed: 1.0,
        autoPlay: true,
        shuffleMode: false,
        backgroundPlayback: true,
        currentPosition: 0,
        downloadQuality: "medium" as const,
        wifiOnlyDownload: true,
        autoSync: true,
        updatedAt: Date.now(),
      };
    }

    return userPlayerSettings;
  },
});

export const updateUserPlayerSettings = mutation({
  args: {
    maxLoop: v.optional(v.number()),
    countDownTimer: v.optional(v.number()),
    volume: v.optional(v.number()),
    playbackSpeed: v.optional(v.number()),
    autoPlay: v.optional(v.boolean()),
    shuffleMode: v.optional(v.boolean()),
    backgroundPlayback: v.optional(v.boolean()),
    downloadQuality: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    wifiOnlyDownload: v.optional(v.boolean()),
    autoSync: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { profile } = await requireSubscriberAccess(ctx);

    const userPlayerSettings = await ctx.db
      .query("userPlayerSettings")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .unique();

    const updates = {
      ...args,
      updatedAt: Date.now(),
    };

    if (userPlayerSettings) {
      await ctx.db.patch(userPlayerSettings._id, updates);
    } else {
      await ctx.db.insert("userPlayerSettings", {
        userId: profile.userId,
        maxLoop: 1,
        countDownTimer: 10,
        volume: 80,
        playbackSpeed: 1.0,
        autoPlay: true,
        shuffleMode: false,
        backgroundPlayback: true,
        currentPosition: 0,
        downloadQuality: "medium",
        wifiOnlyDownload: true,
        autoSync: true,
        ...updates,
      });
    }

    return { success: true };
  },
});

// =================================================================
// USER PLAYBACK TRACKING
// =================================================================

export const updateUserPlaybackProgress = mutation({
  args: {
    userPlaylistId: v.id("userPlaylists"),
    coreMediaId: v.id("coreMedias"),
    currentPosition: v.number(),
    timeSpent: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { profile } = await requireSubscriberAccess(ctx);

    // Verify user playlist ownership
    const userPlaylist = await ctx.db.get(args.userPlaylistId);
    if (!userPlaylist || userPlaylist.userId !== profile.userId) {
      throw new Error("User playlist not found or access denied");
    }

    // Update user media selection progress
    const userMediaSelection = await ctx.db
      .query("userMediaSelections")
      .withIndex("by_user_playlist", (q) => q.eq("userPlaylistId", args.userPlaylistId))
      .filter((q) => q.eq(q.field("coreMediaId"), args.coreMediaId))
      .unique();

    if (userMediaSelection) {
      const updates: any = {
        lastPosition: args.currentPosition,
      };

      if (args.timeSpent) {
        updates.timeSpent = (userMediaSelection.timeSpent || 0) + args.timeSpent;
      }

      if (args.completed) {
        updates.completedAt = Date.now();
      }

      await ctx.db.patch(userMediaSelection._id, updates);
    }

    // Update user playlist progress
    await ctx.db.patch(args.userPlaylistId, {
      lastPlayedAt: Date.now(),
      playCount: userPlaylist.playCount + 1,
      totalTimeSpent: (userPlaylist.totalTimeSpent || 0) + (args.timeSpent || 0),
    });

    // Update user player settings with current position
    const userPlayerSettings = await ctx.db
      .query("userPlayerSettings")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .unique();

    if (userPlayerSettings) {
      await ctx.db.patch(userPlayerSettings._id, {
        currentPlaylistId: args.userPlaylistId,
        currentMediaId: args.coreMediaId,
        currentPosition: args.currentPosition,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// =================================================================
// USER PROFILE MANAGEMENT
// =================================================================

export const ensureUserProfile = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required");
    }

    const clerkUserId = identity.subject;
    const email = identity.email || '';
    const firstName = typeof identity.given_name === 'string' ? identity.given_name : undefined;
    const lastName = typeof identity.family_name === 'string' ? identity.family_name : undefined;
    
    // First, ensure user record exists in users table
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) {
      throw new Error("CLERK_JWT_ISSUER_DOMAIN environment variable not set");
    }
    const tokenIdentifier = `${issuer}|${clerkUserId}`;

    let userRecord = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!userRecord) {
      // Create user record if it doesn't exist
      const newUserId = await ctx.db.insert("users", {
        tokenIdentifier,
      });
      userRecord = await ctx.db.get(newUserId);
      if (!userRecord) {
        throw new Error("Failed to create user record");
      }
    }
    
    // Check if user profile already exists
    const existingUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existingUserProfile) {
      // Update existing user profile
      await ctx.db.patch(existingUserProfile._id, {
        email,
        firstName,
        lastName,
        lastActiveAt: Date.now(),
      });
      
      return {
        success: true,
        profileId: existingUserProfile._id,
        action: 'updated'
      };
    } else {
      // Create new user profile
      const newUserProfileId = await ctx.db.insert("userProfiles", {
        userId: userRecord._id, // Link to users table
        clerkUserId,
        email,
        firstName,
        lastName,
        role: "subscriber", // Set role for new user profiles
        subscriptionStatus: "active", // Default for now
        subscriptionPlan: "premium", // Default for now
        isActive: true,
        lastActiveAt: Date.now(),
      });
      
      return {
        success: true,
        profileId: newUserProfileId,
        action: 'created'
      };
    }
  },
});
