import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

// Helper function to check subscriber access
async function requireSubscriberAccess(ctx: QueryCtx | MutationCtx): Promise<{ userId: Id<"users">; profile: Doc<"userProfiles"> }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required");
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
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

  return { userId, profile };
}

// =================================================================
// PUBLISHED CONTENT ACCESS
// =================================================================

export const getPublishedCorePlaylists = query({
  args: { categoryId: v.optional(v.id("coreCategories")) },
  handler: async (ctx, args): Promise<any[]> => {
    await requireSubscriberAccess(ctx);

    let playlists;

    if (args.categoryId) {
      playlists = await ctx.db
        .query("corePlaylists")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "published")
        )
        .order("desc")
        .collect();
    } else {
      playlists = await ctx.db
        .query("corePlaylists")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .order("desc")
        .collect();
    }

    // Get sections and media for each playlist
    return await Promise.all(
      playlists.map(async (playlist) => {
        const sections = await ctx.db
          .query("coreSections")
          .withIndex("by_playlist_order", (q) => q.eq("playlistId", playlist._id))
          .order("asc")
          .collect();

        const sectionsWithMedia = await Promise.all(
          sections.map(async (section) => {
            const sectionMedias = await ctx.db
              .query("sectionMedias")
              .withIndex("by_section_order", (q) => q.eq("sectionId", section._id))
              .order("asc")
              .collect();

            const medias = await Promise.all(
              sectionMedias.map(async (sm) => {
                const media = await ctx.db.get(sm.mediaId);
                if (!media) return null;

                return {
                  ...media,
                  url: media.storageId ? await ctx.storage.getUrl(media.storageId) : media.embedUrl,
                  thumbnailUrl: media.thumbnailStorageId
                    ? await ctx.storage.getUrl(media.thumbnailStorageId)
                    : media.thumbnailUrl,
                  sectionMediaInfo: {
                    order: sm.order,
                    isOptional: sm.isOptional,
                    defaultSelected: sm.defaultSelected,
                  },
                };
              })
            );

            return {
              ...section,
              medias: medias.filter(Boolean),
            };
          })
        );

        return {
          ...playlist,
          sections: sectionsWithMedia,
        };
      })
    );
  },
});

export const getCorePlaylistDetails = query({
  args: { playlistId: v.id("corePlaylists") },
  handler: async (ctx, args): Promise<any> => {
    await requireSubscriberAccess(ctx);

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist || playlist.status !== "published") {
      throw new Error("Core playlist not found or not published");
    }

    // Get sections with media
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.playlistId))
      .order("asc")
      .collect();

    const sectionsWithMedia = await Promise.all(
      sections.map(async (section) => {
        const sectionMedias = await ctx.db
          .query("sectionMedias")
          .withIndex("by_section_order", (q) => q.eq("sectionId", section._id))
          .order("asc")
          .collect();

        const medias = await Promise.all(
          sectionMedias.map(async (sm) => {
            const media = await ctx.db.get(sm.mediaId);
            if (!media) return null;

            return {
              ...media,
              url: media.storageId ? await ctx.storage.getUrl(media.storageId) : media.embedUrl,
              thumbnailUrl: media.thumbnailStorageId
                ? await ctx.storage.getUrl(media.thumbnailStorageId)
                : media.thumbnailUrl,
              sectionMediaInfo: {
                order: sm.order,
                isOptional: sm.isOptional,
                defaultSelected: sm.defaultSelected,
              },
            };
          })
        );

        return {
          ...section,
          medias: medias.filter(Boolean),
        };
      })
    );

    return {
      ...playlist,
      sections: sectionsWithMedia,
    };
  },
});

// =================================================================
// DEBUGGING/DIAGNOSTIC FUNCTIONS
// =================================================================

export const debugUserAuth = query({
  handler: async (ctx): Promise<any> => {
    try {
      const userId = await getAuthUserId(ctx);
      console.log("Debug: userId from getAuthUserId:", userId);

      if (!userId) {
        return {
          status: "no_auth",
          message: "No authentication found"
        };
      }

      const user = await ctx.db.get(userId);
      console.log("Debug: user from db:", user);

      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      console.log("Debug: profile from db:", profile);

      return {
        status: "authenticated",
        userId,
        hasUser: !!user,
        hasProfile: !!profile,
        user: user ? {
          id: user._id,
          tokenIdentifier: user.tokenIdentifier,
          name: "User", // User object doesn't have name property
          email: "unknown@example.com", // User object doesn't have email property
        } : null,
        profile: profile ? {
          id: profile._id,
          email: profile.email,
          role: profile.role,
          subscriptionStatus: profile.subscriptionStatus,
        } : null,
      };
    } catch (error) {
      console.error("Debug auth error:", error);
      return {
        status: "error",
        message: error as string
      };
    }
  },
});

// =================================================================
// USER PROFILE MANAGEMENT (PWA App Fallback)
// =================================================================

export const ensureUserProfile = mutation({
  handler: async (ctx): Promise<Doc<"userProfiles"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check if profile exists
    let profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      // Get user details from Clerk/auth
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("User not found in users table");
      }

      // Create new profile with default subscriber status
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        clerkUserId: user.tokenIdentifier?.split("|")[1] || "unknown",
        email: "unknown@example.com", // User object doesn't have email property
        firstName: "User", // User object doesn't have name property
        lastName: "", // User object doesn't have name property
        imageUrl: undefined, // User object doesn't have image property
        role: "subscriber",
        subscriptionStatus: "inactive", // Default to inactive
        lastActiveAt: Date.now(),
        isActive: true,
      });

      profile = await ctx.db.get(profileId);
      console.log(`Created new user profile for user: ${userId}`);
    }

    return profile;
  },
});

// =================================================================
// USER PLAYLIST MANAGEMENT
// =================================================================

export const getUserPlaylists = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<Doc<"userPlaylists">[]> => {
    const { userId } = await requireSubscriberAccess(ctx);

    if (args.activeOnly) {
      return await ctx.db
        .query("userPlaylists")
        .withIndex("by_user_active", (q) =>
          q.eq("userId", userId).eq("isActive", true)
        )
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("userPlaylists")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }
  },
});

export const createUserPlaylist = mutation({
  args: {
    corePlaylistId: v.id("corePlaylists"),
    title: v.string(),
    mediaSelections: v.string(), // JSON string of selected media per section
  },
  handler: async (ctx, args): Promise<Id<"userPlaylists">> => {
    const { userId } = await requireSubscriberAccess(ctx);

    // Validate core playlist exists and is published
    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist || corePlaylist.status !== "published") {
      throw new Error("Core playlist not found or not published");
    }

    // Parse and validate media selections
    let selections;
    try {
      selections = JSON.parse(args.mediaSelections);
    } catch {
      throw new Error("Invalid media selections format");
    }

    // Create user playlist
    const userPlaylistId = await ctx.db.insert("userPlaylists", {
      userId,
      corePlaylistId: args.corePlaylistId,
      title: args.title,
      customizations: args.mediaSelections,
      isActive: true,
      isFavorite: false,
      playCount: 0,
      completionPercentage: 0,
      totalTimeSpent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create individual media selections
    for (const [sectionId, mediaIds] of Object.entries(selections)) {
      if (Array.isArray(mediaIds)) {
        for (let i = 0; i < mediaIds.length; i++) {
          await ctx.db.insert("userMediaSelections", {
            userPlaylistId,
            sectionId: sectionId as any,
            mediaId: mediaIds[i] as any,
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
    mediaSelections: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { userId } = await requireSubscriberAccess(ctx);

    const userPlaylist = await ctx.db.get(args.userPlaylistId);
    if (!userPlaylist || userPlaylist.userId !== userId) {
      throw new Error("User playlist not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title) updates.title = args.title;
    if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;
    if (args.mediaSelections) {
      updates.customizations = args.mediaSelections;

      // Update individual media selections if provided
      try {
        const selections = JSON.parse(args.mediaSelections);

        // Remove existing selections
        const existingSelections = await ctx.db
          .query("userMediaSelections")
          .withIndex("by_user_playlist", (q) => q.eq("userPlaylistId", args.userPlaylistId))
          .collect();

        for (const selection of existingSelections) {
          await ctx.db.delete(selection._id);
        }

        // Add new selections
        for (const [sectionId, mediaIds] of Object.entries(selections)) {
          if (Array.isArray(mediaIds)) {
            for (let i = 0; i < mediaIds.length; i++) {
              await ctx.db.insert("userMediaSelections", {
                userPlaylistId: args.userPlaylistId,
                sectionId: sectionId as any,
                mediaId: mediaIds[i] as any,
                isSelected: true,
                playOrder: i + 1,
                timeSpent: 0,
              });
            }
          }
        }
      } catch {
        throw new Error("Invalid media selections format");
      }
    }

    await ctx.db.patch(args.userPlaylistId, updates);
    return { success: true };
  },
});

// =================================================================
// PLAYER SETTINGS
// =================================================================

export const getUserPlayerSettings = query({
  args: {},
  handler: async (ctx): Promise<any> => {
    const { userId } = await requireSubscriberAccess(ctx);

    const settings = await ctx.db
      .query("userPlayerSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!settings) {
      // Return default settings without creating them in a query
      return {
        _id: "" as any,
        _creationTime: Date.now(),
        userId,
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

    return settings;
  },
});

export const updatePlayerSettings = mutation({
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
    const { userId } = await requireSubscriberAccess(ctx);

    const settings = await ctx.db
      .query("userPlayerSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const updates = {
      ...args,
      updatedAt: Date.now(),
    };

    if (settings) {
      await ctx.db.patch(settings._id, updates);
    } else {
      await ctx.db.insert("userPlayerSettings", {
        userId,
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
// PLAYBACK TRACKING
// =================================================================

export const updatePlaybackProgress = mutation({
  args: {
    userPlaylistId: v.id("userPlaylists"),
    mediaId: v.id("medias"),
    currentPosition: v.number(),
    timeSpent: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { userId } = await requireSubscriberAccess(ctx);

    // Verify playlist ownership
    const userPlaylist = await ctx.db.get(args.userPlaylistId);
    if (!userPlaylist || userPlaylist.userId !== userId) {
      throw new Error("User playlist not found");
    }

    // Update media selection progress
    const selection = await ctx.db
      .query("userMediaSelections")
      .withIndex("by_user_playlist", (q) => q.eq("userPlaylistId", args.userPlaylistId))
      .filter((q) => q.eq(q.field("mediaId"), args.mediaId))
      .unique();

    if (selection) {
      const updates: any = {
        lastPosition: args.currentPosition,
      };

      if (args.timeSpent) {
        updates.timeSpent = (selection.timeSpent || 0) + args.timeSpent;
      }

      if (args.completed) {
        updates.completedAt = Date.now();
      }

      await ctx.db.patch(selection._id, updates);
    }

    // Update playlist progress
    await ctx.db.patch(args.userPlaylistId, {
      lastPlayedAt: Date.now(),
      playCount: userPlaylist.playCount + 1,
      totalTimeSpent: (userPlaylist.totalTimeSpent || 0) + (args.timeSpent || 0),
    });

    // Update player settings with current position
    const settings = await ctx.db
      .query("userPlayerSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (settings) {
      await ctx.db.patch(settings._id, {
        currentPlaylistId: args.userPlaylistId,
        currentMediaId: args.mediaId,
        currentPosition: args.currentPosition,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
