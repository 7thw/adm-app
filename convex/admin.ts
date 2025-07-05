import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

// =================================================================
// ADMIN USER MANAGEMENT
// =================================================================

// Initialize admin user profile for authenticated Clerk user
export const initializeAdminUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Check if user already exists in users table
    let userRecord = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    // Create user record if it doesn't exist
    if (!userRecord) {
      const userRecordId = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier
      });

      userRecord = await ctx.db.get(userRecordId);
      if (!userRecord) {
        throw new Error("Failed to create user record");
      }
    }

    // Check if admin profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userRecord._id))
      .unique();

    if (existingProfile) {
      // Update existing profile to admin if not already
      if (existingProfile.role !== "admin") {
        await ctx.db.patch(existingProfile._id, {
          role: "admin",
          subscriptionStatus: "active",
          lastActiveAt: Date.now()
        });
        return { message: "Updated existing profile to admin", profileId: existingProfile._id };
      }
      return { message: "Admin profile already exists", profileId: existingProfile._id };
    }

    if (!identity.email) {
      throw new Error("User email is required but not provided by Clerk");
    }

    // Create new admin profile
    const adminProfileId = await ctx.db.insert("userProfiles", {
      userId: userRecord._id,
      clerkUserId: identity.subject, // Clerk user ID
      email: identity.email, // Clerk always provides email, no fallback needed
      firstName: identity.givenName || "Admin",
      lastName: identity.familyName || "User",
      imageUrl: identity.pictureUrl || "",
      role: "admin",
      subscriptionStatus: "active",
      lastActiveAt: Date.now(),
      isActive: true
    });

    return { message: "Admin profile created successfully", profileId: adminProfileId };
  }
});

// Helper function to check admin access
// Helper function for mutations that need userId
async function requireAdminWithUserId(ctx: MutationCtx): Promise<{ identity: any; userId: Id<"users"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  // Get or create user record for mutations
  let userRecord = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!userRecord) {
    // Create user record if it doesn't exist (only in mutations)
    const userRecordId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier
    });
    userRecord = await ctx.db.get(userRecordId);
    if (!userRecord) {
      throw new Error("Failed to create user record");
    }
  }

  console.log("✅ Clerk authenticated admin:", identity.email);
  return { identity, userId: userRecord._id };
}

// Helper function to check admin access via Clerk
async function requireAdminAccess(ctx: QueryCtx | MutationCtx): Promise<{ identity: any; userId?: Id<"users"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  // For development: Allow any Clerk-authenticated user as admin
  // In production, you'd check user role from Clerk metadata or userProfiles table
  console.log("✅ Clerk authenticated user:", identity.email);

  // Try to get existing user record (for mutations that need userId)
  const userRecord = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  return { identity, userId: userRecord?._id };
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
    const { userId } = await requireAdminWithUserId(ctx);

    // Check if slug already exists
    const existing = await ctx.db
      .query("coreCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("Core category with this slug already exists");
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
// CORE MEDIA MANAGEMENT
// =================================================================

export const listCoreMedias = query({
  args: {
    mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
    publicOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx);

    let coreMedias;

    if (args.mediaType && args.publicOnly) {
      coreMedias = await ctx.db
        .query("coreMedias")
        .withIndex("by_type_public", (q) =>
          q.eq("mediaType", args.mediaType!).eq("isPublic", true)
        )
        .order("desc")
        .collect();
    } else if (args.mediaType) {
      coreMedias = await ctx.db
        .query("coreMedias")
        .withIndex("by_type", (q) => q.eq("mediaType", args.mediaType!))
        .order("desc")
        .collect();
    } else if (args.publicOnly) {
      coreMedias = await ctx.db
        .query("coreMedias")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .order("desc")
        .collect();
    } else {
      coreMedias = await ctx.db.query("coreMedias").order("desc").collect();
    }

    // Get signed URLs for storage files
    return await Promise.all(
      coreMedias.map(async (coreMedia) => ({
        ...coreMedia,
        url: coreMedia.storageId ? (await ctx.storage.getUrl(coreMedia.storageId)) ?? undefined : coreMedia.embedUrl,
        thumbnailUrl: coreMedia.thumbnailStorageId
          ? (await ctx.storage.getUrl(coreMedia.thumbnailStorageId)) ?? undefined
          : coreMedia.thumbnailUrl,
      }))
    );
  },
});

export const createCoreMedia = mutation({
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
  handler: async (ctx, args): Promise<Id<"coreMedias">> => {
    const { userId } = await requireAdminWithUserId(ctx);

    // Validate that either storageId or embedUrl is provided
    if (!args.storageId && !args.embedUrl) {
      throw new Error("Either storageId or embedUrl must be provided");
    }

    return await ctx.db.insert("coreMedias", {
      ...args,
      processingStatus: "completed",
      isPublic: args.isPublic ?? true,
      createdBy: userId,
    });
  },
});

export const updateCoreMedia = mutation({
  args: {
    coreMediaId: v.id("coreMedias"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    thumbnailUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    quality: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    transcript: v.optional(v.string()),
    waveformData: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate core media exists
    const coreMedia = await ctx.db.get(args.coreMediaId);
    if (!coreMedia) {
      throw new Error("Core media not found");
    }

    // Extract coreMediaId from args and create update object
    const { coreMediaId, ...updateFields } = args;

    await ctx.db.patch(coreMediaId, updateFields);

    return { success: true };
  },
});

export const deleteCoreMedia = mutation({
  args: {
    coreMediaId: v.id("coreMedias"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate core media exists
    const coreMedia = await ctx.db.get(args.coreMediaId);
    if (!coreMedia) {
      throw new Error("Core media not found");
    }

    // Check if core media is used in any sections
    const coreSectionMedias = await ctx.db
      .query("coreSectionMedias")
      .withIndex("by_core_media", (q) => q.eq("coreMediaId", args.coreMediaId))
      .collect();

    if (coreSectionMedias.length > 0) {
      throw new Error("Cannot delete core media that is used in core playlists. Remove it from all core sections first.");
    }

    // Delete any associated core media tags
    const coreMediaTags = await ctx.db
      .query("coreMediaTags")
      .withIndex("by_core_media", (q) => q.eq("coreMediaId", args.coreMediaId))
      .collect();

    for (const tag of coreMediaTags) {
      await ctx.db.delete(tag._id);
    }

    // Delete the storage file if it exists
    if (coreMedia.storageId) {
      await ctx.storage.delete(coreMedia.storageId);
    }

    // Delete the thumbnail if it exists
    if (coreMedia.thumbnailStorageId) {
      await ctx.storage.delete(coreMedia.thumbnailStorageId);
    }

    // Delete the core media record
    await ctx.db.delete(args.coreMediaId);

    return { success: true };
  },
});

// Generate upload URL for file uploads
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    await requireAdminAccess(ctx);
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
    const { userId } = await requireAdminWithUserId(ctx);

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

    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist) {
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
    if (args.status === "published" && corePlaylist.status !== "published") {
      updates.publishedAt = Date.now();
    }

    await ctx.db.patch(args.corePlaylistId, updates);
    return { success: true };
  },
});

export const deleteCorePlaylist = mutation({
  args: { corePlaylistId: v.id("corePlaylists") },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist) {
      throw new Error("Core playlist not found");
    }

    // Delete all sections and their media associations first
    const coreSections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .collect();

    for (const coreSection of coreSections) {
      // Delete section media associations
      const coreSectionMedias = await ctx.db
        .query("coreSectionMedias")
        .withIndex("by_core_section", (q) => q.eq("coreSectionId", coreSection._id))
        .collect();

      for (const coreSectionMedia of coreSectionMedias) {
        await ctx.db.delete(coreSectionMedia._id);
      }

      // Delete the section
      await ctx.db.delete(coreSection._id);
    }

    // Delete the core playlist
    await ctx.db.delete(args.corePlaylistId);

    return { success: true };
  },
});

// =================================================================
// CORE SECTIONS MANAGEMENT
// =================================================================

export const listCoreSections = query({
  args: {
    corePlaylistId: v.id("corePlaylists"),
  },
  handler: async (ctx, args): Promise<Doc<"coreSections">[]> => {
    await requireAdminAccess(ctx);

    return await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .order("asc")
      .collect();
  },
});

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
    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist) {
      throw new Error("Core playlist not found");
    }
    if (corePlaylist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Get next order number
    const coreSections = await ctx.db
      .query("coreSections")
      .withIndex("by_core_playlist_order", (q) => q.eq("corePlaylistId", args.corePlaylistId))
      .order("desc")
      .take(1);

    const nextOrder = coreSections.length > 0 ? coreSections[0].order + 1 : 1;

    return await ctx.db.insert("coreSections", {
      ...args,
      order: nextOrder,
      isRequired: args.isRequired ?? true,
    });
  },
});

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

    // Validate core section exists
    const coreSection = await ctx.db.get(args.coreSectionId);
    if (!coreSection) {
      throw new Error("Core section not found");
    }

    // Validate core playlist is in draft status
    const corePlaylist = await ctx.db.get(coreSection.corePlaylistId);
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

export const deleteCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate core section exists
    const coreSection = await ctx.db.get(args.coreSectionId);
    if (!coreSection) {
      throw new Error("Core section not found");
    }

    // Validate core playlist is in draft status
    const corePlaylist = await ctx.db.get(coreSection.corePlaylistId);
    if (!corePlaylist || corePlaylist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Delete all core media associations first
    const coreSectionMedias = await ctx.db
      .query("coreSectionMedias")
      .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
      .collect();

    for (const coreSectionMedia of coreSectionMedias) {
      await ctx.db.delete(coreSectionMedia._id);
    }

    // Delete the core section
    await ctx.db.delete(args.coreSectionId);

    return { success: true };
  },
});

// =================================================================
// CORE SECTION MEDIA MANAGEMENT
// =================================================================

export const addCoreMediaToCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
    coreMediaId: v.id("coreMedias"),
    isOptional: v.optional(v.boolean()),
    defaultSelected: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; coreSectionMediaId: Id<"coreSectionMedias"> }> => {
    await requireAdminAccess(ctx);

    // Validate core section exists and core playlist is in draft
    const coreSection = await ctx.db.get(args.coreSectionId);
    if (!coreSection) {
      throw new Error("Core section not found");
    }

    const corePlaylist = await ctx.db.get(coreSection.corePlaylistId);
    if (!corePlaylist || corePlaylist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Check if core media already exists in section
    const existing = await ctx.db
      .query("coreSectionMedias")
      .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
      .filter((q) => q.eq(q.field("coreMediaId"), args.coreMediaId))
      .unique();

    if (existing) {
      throw new Error("Core media already exists in this core section");
    }

    // Get next order number
    const coreSectionMedias = await ctx.db
      .query("coreSectionMedias")
      .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", args.coreSectionId))
      .order("desc")
      .take(1);

    const nextOrder = coreSectionMedias.length > 0 ? coreSectionMedias[0].order + 1 : 1;

    const coreSectionMediaId = await ctx.db.insert("coreSectionMedias", {
      coreSectionId: args.coreSectionId,
      coreMediaId: args.coreMediaId,
      order: nextOrder,
      isOptional: args.isOptional ?? false,
      defaultSelected: args.defaultSelected ?? true,
    });

    return { success: true, coreSectionMediaId };
  },
});

export const listCoreSectionMedias = query({
  args: {
    coreSectionId: v.id("coreSections"),
  },
  handler: async (ctx, args): Promise<Array<Doc<"coreSectionMedias"> & { coreMedia: Doc<"coreMedias"> }>> => {
    await requireAdminAccess(ctx);

    const coreSectionMedias = await ctx.db
      .query("coreSectionMedias")
      .withIndex("by_core_section_order", (q) => q.eq("coreSectionId", args.coreSectionId))
      .order("asc")
      .collect();

    // Get core media details for each section media
    return await Promise.all(
      coreSectionMedias.map(async (coreSectionMedia) => {
        const coreMedia = await ctx.db.get(coreSectionMedia.coreMediaId);
        return {
          ...coreSectionMedia,
          coreMedia: coreMedia!,
        };
      })
    );
  },
});

export const removeCoreMediaFromCoreSection = mutation({
  args: {
    coreSectionId: v.id("coreSections"),
    coreMediaId: v.id("coreMedias"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate core section exists and core playlist is in draft
    const coreSection = await ctx.db.get(args.coreSectionId);
    if (!coreSection) {
      throw new Error("Core section not found");
    }

    const corePlaylist = await ctx.db.get(coreSection.corePlaylistId);
    if (!corePlaylist || corePlaylist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Find the core section media association
    const coreSectionMedia = await ctx.db
      .query("coreSectionMedias")
      .withIndex("by_core_section", (q) => q.eq("coreSectionId", args.coreSectionId))
      .filter((q) => q.eq(q.field("coreMediaId"), args.coreMediaId))
      .unique();

    if (!coreSectionMedia) {
      throw new Error("Core media not found in this core section");
    }

    // Delete the association
    await ctx.db.delete(coreSectionMedia._id);

    return { success: true };
  },
});

export const reorderCoreSections = mutation({
  args: {
    corePlaylistId: v.id("corePlaylists"),
    coreSectionIds: v.array(v.id("coreSections")),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    await requireAdminAccess(ctx);

    // Validate core playlist exists and is in draft
    const corePlaylist = await ctx.db.get(args.corePlaylistId);
    if (!corePlaylist || corePlaylist.status === "published") {
      throw new Error("Cannot modify published core playlist");
    }

    // Update order for each core section
    for (let i = 0; i < args.coreSectionIds.length; i++) {
      const coreSection = await ctx.db.get(args.coreSectionIds[i]);
      if (coreSection && coreSection.corePlaylistId === args.corePlaylistId) {
        await ctx.db.patch(args.coreSectionIds[i], {
          order: i + 1,
        });
      }
    }

    return { success: true };
  },
});
