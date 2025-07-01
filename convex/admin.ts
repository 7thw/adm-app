import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

// Helper function to check admin access
async function requireAdminAccess(ctx: QueryCtx | MutationCtx): Promise<{ userId: Id<"users">; profile: Doc<"userProfiles"> }> {
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
  handler: async (ctx, args): Promise<Doc<"coreCategories">[]> => {
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
  handler: async (ctx, args): Promise<Id<"coreCategories">> => {
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

// Media Tag Management
export const addMediaTag = mutation({
  args: {
    coreMediaId: v.id("medias"),
    tag: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; tagId: Id<"mediaTags"> }> => {
    await requireAdminAccess(ctx);

    // Validate media exists
    const media = await ctx.db.get(args.coreMediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Check if tag already exists for this media
    const existingTag = await ctx.db
      .query("mediaTags")
      .withIndex("by_core_media_tag", (q) => q.eq("coreMediaId", args.coreMediaId).eq("tag", args.tag))
      .unique();

    if (existingTag) {
      return { success: true, tagId: existingTag._id };
    }

    // Create new tag
    const tagId = await ctx.db.insert("mediaTags", {
      coreMediaId: args.coreMediaId,
      tag: args.tag,
      createdAt: Date.now(),
    });

    return { success: true, tagId };
  },
});

export const removeMediaTag = mutation({
  args: {
    coreMediaId: v.id("medias"),
    tag: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message?: string }> => {
    await requireAdminAccess(ctx);

    // Find the tag
    const tag = await ctx.db
      .query("mediaTags")
      .withIndex("by_core_media_tag", (q) => q.eq("coreMediaId", args.coreMediaId).eq("tag", args.tag))
      .unique();

    if (!tag) {
      return { success: false, message: "Tag not found" };
    }

    // Delete the tag
    await ctx.db.delete(tag._id);

    return { success: true };
  },
});

export const getMediaTags = query({
  args: {
    coreMediaId: v.id("medias"),
  },
  handler: async (ctx, args): Promise<string[]> => {
    await requireAdminAccess(ctx);

    // Validate media exists
    const media = await ctx.db.get(args.coreMediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Get all tags for this media
    const tags = await ctx.db
      .query("mediaTags")
      .withIndex("by_core_media", (q) => q.eq("coreMediaId", args.coreMediaId))
      .collect();

    return tags.map(tag => tag.tag);
  },
});

export const searchMediaByTags = query({
  args: {
    tags: v.array(v.string()),
    mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
    matchAll: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<(Doc<"medias"> & { url?: string; thumbnailUrl?: string })[]> => {
    await requireAdminAccess(ctx);

    if (args.tags.length === 0) {
      return [];
    }

    // Get all media IDs that match any of the provided tags
    // Since we can't use q.in directly, we'll query for each tag separately and combine results
    const tagQueries = await Promise.all(
      args.tags.map(async (tag) => {
        return await ctx.db
          .query("mediaTags")
          .filter((q) => q.eq(q.field("tag"), tag))
          .collect();
      })
    );

    // Flatten the results
    const taggedMedias = tagQueries.flat();

    // Group by coreMediaId and count tags
    const mediaTagCounts = new Map();
    const coreMediaIds = new Set();

    for (const taggedMedia of taggedMedias) {
      const { coreMediaId } = taggedMedia;
      coreMediaIds.add(coreMediaId);

      if (!mediaTagCounts.has(coreMediaId)) {
        mediaTagCounts.set(coreMediaId, 1);
      } else {
        mediaTagCounts.set(coreMediaId, mediaTagCounts.get(coreMediaId) + 1);
      }
    }

    // Filter by matchAll if required
    const filteredMediaIds = Array.from(coreMediaIds).filter(coreMediaId => {
      if (args.matchAll) {
        return mediaTagCounts.get(coreMediaId) === args.tags.length;
      }
      return true;
    });

    if (filteredMediaIds.length === 0) {
      return [];
    }

    // Get the actual media documents
    // Since we can't use q.in directly, we'll query for each ID separately and combine results
    const mediaQueries = await Promise.all(
      filteredMediaIds.map(async (coreMediaId) => {
        // Type assertion needed for Convex's query filter
        const typedMediaId = coreMediaId as any;
        let query = ctx.db.query("medias").filter((q) => q.eq(q.field("_id"), typedMediaId));

        // Add media type filter if provided
        if (args.mediaType) {
          query = query.filter((q) => q.eq(q.field("mediaType"), args.mediaType));
        }

        return await query.collect();
      })
    );

    // Flatten the results
    const medias = mediaQueries.flat();

    // Get signed URLs for storage files
    const mediasWithUrls = await Promise.all(
      medias.map(async (media) => {
        const storageUrl = media.storageId ? await ctx.storage.getUrl(media.storageId) : null;
        const thumbnailStorageUrl = media.thumbnailStorageId ? await ctx.storage.getUrl(media.thumbnailStorageId) : null;

        return {
          ...media,
          url: storageUrl || media.embedUrl || undefined,
          thumbnailUrl: thumbnailStorageUrl || media.thumbnailUrl || undefined,
        };
      })
    );

    return mediasWithUrls;
  },
});

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
        url: media.storageId ? (await ctx.storage.getUrl(media.storageId)) ?? undefined : media.embedUrl,
        thumbnailUrl: media.thumbnailStorageId
          ? (await ctx.storage.getUrl(media.thumbnailStorageId)) ?? undefined
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
  handler: async (ctx, args): Promise<Id<"medias">> => {
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

export const updateMedia = mutation({
  args: {
    coreMediaId: v.id("medias"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    thumbnailUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    // Allow updating metadata fields
    quality: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    transcript: v.optional(v.string()),
    waveformData: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate media exists
    const media = await ctx.db.get(args.coreMediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Extract coreMediaId from args and create update object with remaining fields
    const { coreMediaId, ...updateFields } = args;

    // Update the media
    await ctx.db.patch(coreMediaId, updateFields);

    return { success: true };
  },
});

export const deleteMedia = mutation({
  args: {
    coreMediaId: v.id("medias"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate media exists
    const media = await ctx.db.get(args.coreMediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Check if media is used in any sections
    const sectionMedias = await ctx.db
      .query("sectionMedias")
      .withIndex("by_core_media", (q) => q.eq("coreMediaId", args.coreMediaId))
      .collect();

    if (sectionMedias.length > 0) {
      throw new Error("Cannot delete media that is used in core playlists. Remove it from all core playlists first.");
    }

    // Delete any associated media tags
    const mediaTags = await ctx.db
      .query("mediaTags")
      .withIndex("by_core_media", (q) => q.eq("coreMediaId", args.coreMediaId))
      .collect();

    for (const tag of mediaTags) {
      await ctx.db.delete(tag._id);
    }

    // Delete the storage file if it exists
    if (media.storageId) {
      await ctx.storage.delete(media.storageId);
    }

    // Delete the thumbnail if it exists
    if (media.thumbnailStorageId) {
      await ctx.storage.delete(media.thumbnailStorageId);
    }

    // Delete the media record
    await ctx.db.delete(args.coreMediaId);

    return { success: true };
  },
});

export const updateMediaMetadata = mutation({
  args: {
    coreMediaId: v.id("medias"),
    // Processing metadata
    processingStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    // Media metadata
    duration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
    // Audio-specific metadata
    transcript: v.optional(v.string()),
    waveformData: v.optional(v.string()),
    quality: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    // Storage and thumbnails
    storageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate media exists
    const media = await ctx.db.get(args.coreMediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Extract coreMediaId from args and create update object with remaining fields
    const { coreMediaId, ...updateFields } = args;

    // Update the media metadata
    await ctx.db.patch(coreMediaId, updateFields);

    // If we're updating the status to completed, also update any related upload sessions
    if (args.processingStatus === "completed") {
      const uploadSessions = await ctx.db
        .query("uploadSessions")
        .withIndex("by_media", (q) => q.eq("mediaId", coreMediaId))
        .collect();

      for (const session of uploadSessions) {
        await ctx.db.patch(session._id, {
          uploadStatus: "completed",
          uploadProgress: 100,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// =================================================================
// FILE UPLOAD MANAGEMENT
// =================================================================

// Generate upload URL for file uploads (thumbnails, media, etc.)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    await requireAdminAccess(ctx);

    // Generate a secure upload URL using Convex's built-in storage
    return await ctx.storage.generateUploadUrl();
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
  handler: async (ctx, args): Promise<Doc<"corePlaylists">[]> => {
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
    thumbnailStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"corePlaylists">> => {
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

export const updateCorePlaylist = mutation({
  args: {
    corePlaylistId: v.id("corePlaylists"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("coreCategories")),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    thumbnailStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }

    // Build update object with only provided fields
    const updates: Partial<Doc<"corePlaylists">> = {
      lastModifiedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.categoryId !== undefined) updates.categoryId = args.categoryId;
    if (args.status !== undefined) updates.status = args.status;
    if (args.thumbnailStorageId !== undefined) updates.thumbnailStorageId = args.thumbnailStorageId;

    // If publishing, add publishedAt timestamp
    if (args.status === "published" && playlist.status !== "published") {
      updates.publishedAt = Date.now();
    }

    await ctx.db.patch(args.corePlaylistId, updates);
    return { success: true };
  },
});

export const publishCorePlaylist = mutation({
  args: { corePlaylistId: v.id("corePlaylists") },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }

    if (playlist.status === "published") {
      throw new Error("Core playlist is already published");
    }

    // Validate core playlist has sections and medias
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .collect();

    if (sections.length === 0) {
      throw new Error("Core playlist must have at least one section before publishing");
    }

    await ctx.db.patch(args.corePlaylistId, {
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
    corePlaylistId: v.id("corePlaylists"),
    title: v.string(),
    description: v.optional(v.string()),
    sectionType: v.union(v.literal("base"), v.literal("loop")),
    minSelectMedia: v.number(),
    maxSelectMedia: v.number(),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"coreSections">> => {
    await requireAdminAccess(ctx);

    // Validate core playlist exists and is in draft status
    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }
    if (playlist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Get next order number
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
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

export const addMediaToCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
    coreMediaId: v.id("medias"),
    isOptional: v.optional(v.boolean()),
    defaultSelected: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; sectionMediaId: Id<"sectionMedias"> }> => {
    await requireAdminAccess(ctx);

    // Validate section exists and playlist is in draft
    const section = await ctx.db.get(args.coreSectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.corePlaylistId);
    if (!playlist || playlist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Check if media already exists in section
    const existing = await ctx.db
      .query("sectionMedias")
      .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
      .filter((q) => q.eq(q.field("coreMediaId"), args.coreMediaId))
      .unique();

    if (existing) {
      throw new Error("Media already exists in this section");
    }

    // Get next order number
    const sectionMedias = await ctx.db
      .query("sectionMedias")
      .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", args.coreSectionId))
      .order("desc")
      .take(1);

    const nextOrder = sectionMedias.length > 0 ? sectionMedias[0].order + 1 : 1;

    const sectionMediaId = await ctx.db.insert("sectionMedias", {
      coreSectionId: args.coreSectionId,
      coreMediaId: args.coreMediaId,
      order: nextOrder,
      isOptional: args.isOptional ?? false,
      defaultSelected: args.defaultSelected ?? true,
    });

    return { success: true, sectionMediaId };
  },
});

export const listCoreSections = query({
  args: {
    corePlaylistId: v.optional(v.id("corePlaylists")),
  },
  handler: async (ctx, args): Promise<Doc<"coreSections">[]> => {
    await requireAdminAccess(ctx);

    if (args.corePlaylistId) {
      return await ctx.db
        .query("coreSections")
        .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId!))
        .order("asc")
        .collect();
    }

    // If no corePlaylistId provided, return all sections
    return await ctx.db.query("coreSections").collect();
  },
});

// Update a core section
export const updateCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sectionType: v.optional(v.union(v.literal("base"), v.literal("loop"))),
    minSelectMedia: v.optional(v.number()),
    maxSelectMedia: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate section exists
    const section = await ctx.db.get(args.coreSectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Validate core playlist is in draft status
    const corePlaylist = await ctx.db.get(section.corePlaylistId);
    if (!corePlaylist || corePlaylist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Update only the provided fields
    const updateFields: any = {};
    if (args.title !== undefined) updateFields.title = args.title;
    if (args.description !== undefined) updateFields.description = args.description;
    if (args.sectionType !== undefined) updateFields.sectionType = args.sectionType;
    if (args.minSelectMedia !== undefined) updateFields.minSelectMedia = args.minSelectMedia;
    if (args.maxSelectMedia !== undefined) updateFields.maxSelectMedia = args.maxSelectMedia;
    if (args.isRequired !== undefined) updateFields.isRequired = args.isRequired;

    await ctx.db.patch(args.coreSectionId, updateFields);

    return { success: true };
  },
});

// Remove a core section
export const deleteCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate section exists
    const section = await ctx.db.get(args.coreSectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Validate core playlist is in draft status
    const playlist = await ctx.db.get(section.corePlaylistId);
    if (!playlist || playlist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Delete all media associations first
    const sectionMedias = await ctx.db
      .query("sectionMedias")
      .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
      .collect();

    for (const media of sectionMedias) {
      await ctx.db.delete(media._id);
    }

    // Delete the section
    await ctx.db.delete(args.coreSectionId);

    // Reorder remaining sections
    const remainingSections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist", (q) => q.eq("corePlaylistId", section.corePlaylistId))
      .order("asc")
      .collect();

    // Update order for remaining sections
    for (let i = 0; i < remainingSections.length; i++) {
      await ctx.db.patch(remainingSections[i]._id, { order: i + 1 });
    }

    return { success: true };
  },
});

// Reorder core sections
export const reorderCoreSections = mutation({
  args: {
    sectionOrders: v.array(
      v.object({
        id: v.id("coreSections"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    if (args.sectionOrders.length === 0) {
      return { success: true };
    }

    // Get the first section to validate the playlist
    const firstSection = await ctx.db.get(args.sectionOrders[0].id);
    if (!firstSection) {
      throw new Error("Section not found");
    }

    // Validate core playlist is in draft status
    const playlist = await ctx.db.get(firstSection.corePlaylistId);
    if (!playlist || playlist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Update order for each section
    for (const item of args.sectionOrders) {
      await ctx.db.patch(item.id, { order: item.order });
    }

    return { success: true };
  },
});

// =================================================================
// CORE PLAYLIST EDITING
// =================================================================

// Delete a core playlist
export const deleteCorePlaylist = mutation({
  args: {
    corePlaylistId: v.id("corePlaylists"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate playlist exists
    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }

    // Only draft playlists can be deleted
    if (playlist.status === "published") {
      throw new Error("Cannot delete published playlist. Unpublish it first.");
    }

    // Get all sections for this playlist
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .collect();

    // Delete all section media associations first
    for (const section of sections) {
      const sectionMedias = await ctx.db
        .query("sectionMedias")
        .withIndex("by_core_section", (q) => q.eq("coreSectionId", section._id))
        .collect();

      for (const media of sectionMedias) {
        await ctx.db.delete(media._id);
      }

      // Delete the section
      await ctx.db.delete(section._id);
    }

    // Delete the playlist
    await ctx.db.delete(args.corePlaylistId);

    return { success: true };
  },
});

// =================================================================
// CLAUDE ENHANCEMENTS - Core Playlists Features
// =================================================================

// Duplicate a core playlist with optional section copying
export const duplicateCorePlaylist = mutation({
  args: {
    sourcePlaylistId: v.id("corePlaylists"),
    newTitle: v.string(),
    keepSections: v.optional(v.boolean()),
    copyToCategory: v.optional(v.id("coreCategories"))
  },
  handler: async (ctx, args): Promise<Id<"corePlaylists">> => {
    const { userId } = await requireAdminAccess(ctx);

    // Get source playlist
    const sourcePlaylist = await ctx.db.get(args.sourcePlaylistId);
    if (!sourcePlaylist) {
      throw new Error("Source playlist not found");
    }

    // Create new playlist with copied data
    const newPlaylistId = await ctx.db.insert("corePlaylists", {
      title: args.newTitle,
      description: sourcePlaylist.description,
      categoryId: args.copyToCategory || sourcePlaylist.categoryId,
      estimatedDuration: sourcePlaylist.estimatedDuration,
      status: "draft", // Always start as draft
      playCount: 0,
      averageRating: undefined,
      publishedAt: undefined,
      lastModifiedAt: Date.now(),
      createdBy: userId,
      thumbnailStorageId: sourcePlaylist.thumbnailStorageId, // Share thumbnail initially
    });

    // Copy sections if requested
    if (args.keepSections) {
      const sections = await ctx.db
        .query("coreSections")
        .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.sourcePlaylistId))
        .collect();

      for (const section of sections) {
        const newSectionId = await ctx.db.insert("coreSections", {
          corePlaylistId: newPlaylistId,
          title: section.title,
          description: section.description,
          sectionType: section.sectionType,
          minSelectMedia: section.minSelectMedia,
          maxSelectMedia: section.maxSelectMedia,
          order: section.order,
          isRequired: section.isRequired,
          estimatedDuration: section.estimatedDuration,
        });

        // Copy section medias
        const sectionMedias = await ctx.db
          .query("sectionMedias")
          .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", section._id))
          .collect();

        for (const media of sectionMedias) {
          await ctx.db.insert("sectionMedias", {
            coreSectionId: newSectionId,
            coreMediaId: media.coreMediaId,
            order: media.order,
            isOptional: media.isOptional,
            defaultSelected: media.defaultSelected,
          });
        }
      }
    }

    return newPlaylistId;
  },
});

// Update core playlist thumbnail
export const updateCorePlaylistThumbnail = mutation({
  args: {
    corePlaylistId: v.id("corePlaylists"),
    thumbnailStorageId: v.optional(v.id("_storage"))
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }

    // Delete old thumbnail if exists and different from new one
    if (playlist.thumbnailStorageId &&
      playlist.thumbnailStorageId !== args.thumbnailStorageId) {
      await ctx.storage.delete(playlist.thumbnailStorageId);
    }

    // Update with new thumbnail
    await ctx.db.patch(args.corePlaylistId, {
      thumbnailStorageId: args.thumbnailStorageId,
      lastModifiedAt: Date.now()
    });

    return { success: true };
  },
});

// Batch add medias to section
export const addMediasToCoreSectionBatch = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
    coreMediaIds: v.array(v.id("medias")),
    startOrder: v.optional(v.number())
  },
  handler: async (ctx, args): Promise<{ success: boolean; addedCount: number; skippedCount: number; }> => {
    await requireAdminAccess(ctx);

    // Validate section exists and playlist is in draft
    const section = await ctx.db.get(args.coreSectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.corePlaylistId);
    if (!playlist || playlist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Get starting order
    let order = args.startOrder || 1;
    if (!args.startOrder) {
      const lastMedia = await ctx.db
        .query("sectionMedias")
        .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", args.coreSectionId))
        .order("desc")
        .first();
      order = lastMedia ? lastMedia.order + 1 : 1;
    }

    // Add each media to the section
    const addedMediaIds = [];
    for (const coreMediaId of args.coreMediaIds) {
      // Check if media already exists in section
      const existing = await ctx.db
        .query("sectionMedias")
        .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
        .filter((q) => q.eq(q.field("coreMediaId"), coreMediaId))
        .unique();

      if (!existing) {
        await ctx.db.insert("sectionMedias", {
          coreSectionId: args.coreSectionId,
          coreMediaId: coreMediaId,
          order: order++,
          isOptional: false,
          defaultSelected: true,
        });
        addedMediaIds.push(coreMediaId);
      }
    }

    return {
      success: true,
      addedCount: addedMediaIds.length,
      skippedCount: args.coreMediaIds.length - addedMediaIds.length
    };
  },
});

// Batch remove medias from section
export const removeMediasFromCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
    coreMediaIds: v.array(v.id("medias"))
  },
  handler: async (ctx, args): Promise<{ success: boolean; removedCount: number; }> => {
    await requireAdminAccess(ctx);

    // Validate section exists and playlist is in draft
    const section = await ctx.db.get(args.coreSectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.corePlaylistId);
    if (!playlist || playlist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    let removedCount = 0;
    for (const coreMediaId of args.coreMediaIds) {
      const sectionMedia = await ctx.db
        .query("sectionMedias")
        .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
        .filter((q) => q.eq(q.field("coreMediaId"), coreMediaId))
        .unique();

      if (sectionMedia) {
        await ctx.db.delete(sectionMedia._id);
        removedCount++;
      }
    }

    return {
      success: true,
      removedCount
    };
  },
});

// Get playlist with full details for preview
export const getPlaylistPreview = query({
  args: {
    corePlaylistId: v.id("corePlaylists")
  },
  handler: async (ctx, args): Promise<any> => {
    await requireAdminAccess(ctx);

    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }

    // Get all sections with their media
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .collect();

    const sectionsWithMedia = await Promise.all(
      sections.map(async (section) => {
        const sectionMedias = await ctx.db
          .query("sectionMedias")
          .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", section._id))
          .collect();

        const mediasWithDetails = await Promise.all(
          sectionMedias.map(async (sm) => {
            const media = await ctx.db.get(sm.coreMediaId);
            return {
              ...sm,
              media
            };
          })
        );

        return {
          ...section,
          medias: mediasWithDetails
        };
      })
    );

    // Get category info
    const category = await ctx.db.get(playlist.categoryId);

    return {
      ...playlist,
      category,
      sections: sectionsWithMedia
    };
  },
});

// Get core playlist stats for analytics
export const getCorePlaylistStats = query({
  args: {
    corePlaylistId: v.id("corePlaylists")
  },
  handler: async (ctx, args): Promise<any> => {
    await requireAdminAccess(ctx);

    const playlist = await ctx.db.get(args.corePlaylistId);
    if (!playlist) {
      throw new Error("Core playlist not found");
    }

    // Count sections
    const sectionsCount = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .collect();

    // Count total medias across all sections
    let totalMedias = 0;
    for (const section of sectionsCount) {
      const medias = await ctx.db
        .query("sectionMedias")
        .withIndex("by_core_section", (q) => q.eq("coreSectionId", section._id))
        .collect();
      totalMedias += medias.length;
    }

    // Count user playlists based on this core playlist
    const userPlaylistsCount = await ctx.db
      .query("userPlaylists")
      .withIndex("by_core_playlist", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .collect();

    return {
      sectionsCount: sectionsCount.length,
      totalMedias,
      userPlaylistsCount: userPlaylistsCount.length,
      playCount: playlist.playCount,
      averageRating: playlist.averageRating,
      status: playlist.status,
      createdAt: playlist.lastModifiedAt // Using lastModifiedAt as creation timestamp
    };
  },
});
