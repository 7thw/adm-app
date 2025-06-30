import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper function to check admin access
async function requireAdminAccess(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required");
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { userId, profile };
}

// =================================================================
// CORE CATEGORIES MANAGEMENT
// =================================================================

export const listCoreCategories = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    if (!args.includeInactive) {
      return await ctx.db
        .query("coreCategories")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("asc")
        .collect();
    }

    return await ctx.db.query("coreCategories").order("asc").collect();
  },
});

export const createCoreCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    color: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdminAccess(ctx);

    // Check if slug already exists
    const existing = await ctx.db
      .query("coreCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("Category with this slug already exists");
    }

    // Get next order number
    const categories = await ctx.db
      .query("coreCategories")
      .withIndex("by_order")
      .order("desc")
      .take(1);

    const nextOrder = categories.length > 0 ? categories[0].order + 1 : 1;

    return await ctx.db.insert("coreCategories", {
      ...args,
      isActive: true,
      order: nextOrder,
      createdBy: userId,
    });
  },
});

// =================================================================
// MEDIA MANAGEMENT
// =================================================================

export const listMedias = query({
  args: {
    mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
    publicOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    let medias;

    if (args.mediaType && args.publicOnly) {
      medias = await ctx.db
        .query("medias")
        .withIndex("by_type_public", (q) => 
          q.eq("mediaType", args.mediaType!).eq("isPublic", true)
        )
        .order("desc")
        .collect();
    } else if (args.mediaType) {
      medias = await ctx.db
        .query("medias")
        .withIndex("by_type", (q) => q.eq("mediaType", args.mediaType!))
        .order("desc")
        .collect();
    } else if (args.publicOnly) {
      medias = await ctx.db
        .query("medias")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .order("desc")
        .collect();
    } else {
      medias = await ctx.db.query("medias").order("desc").collect();
    }

    // Get signed URLs for storage files
    return await Promise.all(
      medias.map(async (media) => ({
        ...media,
        url: media.storageId ? await ctx.storage.getUrl(media.storageId) : media.embedUrl,
        thumbnailUrl: media.thumbnailStorageId 
          ? await ctx.storage.getUrl(media.thumbnailStorageId) 
          : media.thumbnailUrl,
      }))
    );
  },
});

export const createMedia = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    storageId: v.optional(v.id("_storage")),
    embedUrl: v.optional(v.string()),
    youtubeId: v.optional(v.string()),
    duration: v.number(),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdminAccess(ctx);

    // Validate that either storageId or embedUrl is provided
    if (!args.storageId && !args.embedUrl) {
      throw new Error("Either storageId or embedUrl must be provided");
    }

    return await ctx.db.insert("medias", {
      ...args,
      processingStatus: "completed",
      uploadedBy: userId,
      isPublic: args.isPublic ?? true,
    });
  },
});

// =================================================================
// CORE PLAYLISTS MANAGEMENT
// =================================================================

export const listCorePlaylists = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    categoryId: v.optional(v.id("coreCategories")),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    if (args.categoryId && args.status) {
      return await ctx.db
        .query("corePlaylists")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else if (args.categoryId) {
      return await ctx.db
        .query("corePlaylists")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      return await ctx.db
        .query("corePlaylists")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db.query("corePlaylists").order("desc").collect();
  },
});

export const createCorePlaylist = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    categoryId: v.id("coreCategories"),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdminAccess(ctx);

    return await ctx.db.insert("corePlaylists", {
      ...args,
      status: "draft",
      playCount: 0,
      createdBy: userId,
      lastModifiedAt: Date.now(),
    });
  },
});

export const publishCorePlaylist = mutation({
  args: { playlistId: v.id("corePlaylists") },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    if (playlist.status === "published") {
      throw new Error("Playlist is already published");
    }

    // Validate playlist has sections and media
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    if (sections.length === 0) {
      throw new Error("Playlist must have at least one section before publishing");
    }

    await ctx.db.patch(args.playlistId, {
      status: "published",
      publishedAt: Date.now(),
      lastModifiedAt: Date.now(),
    });

    return { success: true };
  },
});

// =================================================================
// SECTIONS MANAGEMENT
// =================================================================

export const createCoreSection = mutation({
  args: {
    playlistId: v.id("corePlaylists"),
    title: v.string(),
    description: v.optional(v.string()),
    sectionType: v.union(v.literal("base"), v.literal("loop")),
    minSelectMedia: v.number(),
    maxSelectMedia: v.number(),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    // Validate playlist exists and is in draft status
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    if (playlist.status === "published") {
      throw new Error("Cannot modify published playlist");
    }

    // Get next order number
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_playlist_order", (q) => q.eq("playlistId", args.playlistId))
      .order("desc")
      .take(1);

    const nextOrder = sections.length > 0 ? sections[0].order + 1 : 1;

    return await ctx.db.insert("coreSections", {
      ...args,
      order: nextOrder,
      isRequired: args.isRequired ?? true,
    });
  },
});

export const addMediaToSection = mutation({
  args: {
    sectionId: v.id("coreSections"),
    mediaId: v.id("medias"),
    isOptional: v.optional(v.boolean()),
    defaultSelected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    // Validate section exists and playlist is in draft
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.playlistId);
    if (!playlist || playlist.status === "published") {
      throw new Error("Cannot modify published playlist");
    }

    // Check if media already exists in section
    const existing = await ctx.db
      .query("sectionMedias")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("mediaId"), args.mediaId))
      .unique();

    if (existing) {
      throw new Error("Media already exists in this section");
    }

    // Get next order number
    const sectionMedias = await ctx.db
      .query("sectionMedias")
      .withIndex("by_section_order", (q) => q.eq("sectionId", args.sectionId))
      .order("desc")
      .take(1);

    const nextOrder = sectionMedias.length > 0 ? sectionMedias[0].order + 1 : 1;

    return await ctx.db.insert("sectionMedias", {
      sectionId: args.sectionId,
      mediaId: args.mediaId,
      order: nextOrder,
      isOptional: args.isOptional ?? false,
      defaultSelected: args.defaultSelected ?? true,
    });
  },
});
