// convex/media.ts - UPDATED TO USE CLERK AUTH
import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireAdminClerk, requireAuth } from "./authClerk";

// Initialize R2 component exactly like the official examples
export const r2 = new R2(components.r2);

// FOLLOW OFFICIAL EXAMPLE 1: Use r2.clientApi() for upload handling
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, bucket) => {
    // Use Clerk-based auth - no table dependency!
    await requireAdminClerk(ctx, "media:checkUpload");
  },
  onUpload: async (ctx, bucket, key) => {
    // This runs after the file is uploaded to R2
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    // Get the public URL for the uploaded file
    const mediaUrl = await r2.getUrl(key);

    // Create media record with default values (metadata can be updated later)
    await ctx.db.insert("media", {
      title: `Audio ${Date.now()}`, // Default title, can be updated later
      description: "", // Default description
      mediaType: "audio" as const,
      mediaUrl,
      uploadKey: key, // Use the actual R2 key
      uploadStatus: "completed" as const,
      userId: identity.tokenIdentifier || identity.subject || "unknown",
      contentType: "audio/mpeg", // Default, will be updated when we have file info
      fileSize: 0, // Default, will be updated when we have file info
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update media metadata after upload (called from frontend with file info)
export const updateUploadMetadata = mutation({
  args: {
    uploadKey: v.string(),
    contentType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, { uploadKey, contentType, fileSize, title, description, duration }) => {
    await requireAdminClerk(ctx, "media:updateUploadMetadata");

    // Find the media record by uploadKey
    const media = await ctx.db
      .query("media")
      .filter((q) => q.eq(q.field("uploadKey"), uploadKey))
      .first();

    if (!media) {
      throw new Error("Media not found");
    }

    // Update with the provided metadata
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (contentType) updates.contentType = contentType;
    if (fileSize) updates.fileSize = fileSize;
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (duration) updates.duration = duration;

    await ctx.db.patch(media._id, updates);

    console.log("✅ Updated media metadata:", { uploadKey, updates });
    return media._id;
  },
});

// Video media creation (no upload needed, just YouTube URL)
export const createVideoMedia = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    mediaUrl: v.string(), // YouTube URL
    duration: v.number(),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminClerk(ctx, "media:createVideoMedia");

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/;
    if (!youtubeRegex.test(args.mediaUrl)) {
      throw new Error("Invalid YouTube URL format");
    }

    // Extract video ID and generate thumbnail URL if not provided
    let thumbnailUrl = args.thumbnailUrl;
    if (!thumbnailUrl) {
      const videoId = extractYouTubeVideoId(args.mediaUrl);
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    const mediaId = await ctx.db.insert("media", {
      title: args.title.trim(),
      description: args.description?.trim(),
      mediaType: "video" as const,
      mediaUrl: args.mediaUrl,
      thumbnailUrl,
      duration: args.duration,
      uploadStatus: "completed" as const, // Videos are immediately "complete"
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return mediaId;
  },
});

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Get all media with optional limit
export const getAllMedia = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    await requireAdminClerk(ctx, "media:getAllMedia");

    return await ctx.db.query("media").order("desc").take(limit);
  },
});

// Get media by ID
export const getMediaById = query({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx, "media:getMediaById");
    return await ctx.db.get(id);
  },
});

// Get media by type
export const getMediaByType = query({
  args: {
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { mediaType, limit = 50 }) => {
    await requireAuth(ctx, "media:getMediaByType");

    return await ctx.db
      .query("media")
      .filter((q) => q.eq(q.field("mediaType"), mediaType))
      .order("desc")
      .take(limit);
  },
});

// Update media
export const updateMedia = mutation({
  args: {
    id: v.id("media"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdminClerk(ctx, "media:updateMedia");

    const media = await ctx.db.get(id);
    if (!media) {
      throw new Error("Media not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete media
export const deleteMedia = mutation({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    await requireAdminClerk(ctx, "media:deleteMedia");

    const media = await ctx.db.get(id);
    if (!media) {
      throw new Error("Media not found");
    }

    // Delete the file from R2 if it has an uploadKey (works for both audio and video)
    if (media.uploadKey) {
      try {
        // Use R2 deleteObject method to properly delete from Cloudflare R2
        await r2.deleteObject(ctx, media.uploadKey);
        console.log(`Successfully deleted file ${media.uploadKey} from R2`);
      } catch (error) {
        console.error("Failed to delete file from R2:", error);
        // Continue with database deletion even if R2 deletion fails
      }
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Search media
export const searchMedia = query({
  args: {
    searchTerm: v.string(),
    mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchTerm, mediaType, limit = 20 }) => {
    await requireAuth(ctx, "media:searchMedia");

    let query = ctx.db.query("media");

    if (mediaType) {
      query = query.filter((q) => q.eq(q.field("mediaType"), mediaType));
    }

    const results = await query.collect();

    // Simple text search
    const filteredResults = results.filter((media) =>
      media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (media.description && media.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filteredResults.slice(0, limit);
  },
});

// Cleanup failed uploads (helper function)
export const cleanupFailedUploads = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdminClerk(ctx, "media:cleanupFailedUploads");

    // Find all pending uploads older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    const staleUploads = await ctx.db
      .query("media")
      .filter((q) => q.eq(q.field("uploadStatus"), "pending"))
      .filter((q) => q.lt(q.field("createdAt"), oneHourAgo))
      .collect();

    for (const upload of staleUploads) {
      await ctx.db.patch(upload._id, {
        uploadStatus: "failed" as const,
        updatedAt: Date.now(),
      });
    }

    return { cleaned: staleUploads.length };
  },
});

// Fix broken records by updating mediaUrl for UUID upload keys
export const fixBrokenMediaUrls = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdminClerk(ctx, "media:fixBrokenMediaUrls");

    // Find records with empty mediaUrl but valid uploadKey
    const brokenRecords = await ctx.db
      .query("media")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("mediaUrl"), ""),
            q.eq(q.field("mediaUrl"), undefined)
          ),
          q.neq(q.field("uploadKey"), undefined)
        )
      )
      .collect();

    let fixedCount = 0;

    for (const record of brokenRecords) {
      if (!record.uploadKey) continue;

      // Check if uploadKey is a UUID (R2 generated key)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.uploadKey);

      if (isUUID) {
        // Construct the R2 URL using the custom domain
        const mediaUrl = `https://r2-realigna.7thw.co/${record.uploadKey}`;

        await ctx.db.patch(record._id, {
          mediaUrl,
          uploadStatus: "completed" as const,
          updatedAt: Date.now(),
        });

        fixedCount++;
        console.log(`✅ Fixed record ${record._id}: ${record.uploadKey} -> ${mediaUrl}`);
      }
    }

    return {
      totalBroken: brokenRecords.length,
      fixed: fixedCount,
      message: `Fixed ${fixedCount} out of ${brokenRecords.length} broken records`
    };
  },
});
