import { action, mutation, query } from "./_generated/server"
import { v } from "convex/values"

// --- UPLOAD FUNCTIONS ---
// Standard Convex file upload functions

/**
 * Generates a pre-signed URL for uploading a file to Convex storage.
 */
export const generateUploadUrl = mutation({
  args: {
    // Optional custom filename
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate upload URL using Convex's built-in storage
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Create a media record after file upload is complete.
 */
export const createMediaRecord = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    duration: v.number(),
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Authentication required")
    }

    // Create media record
    const mediaId = await ctx.db.insert("medias", {
      title: args.title,
      description: args.description,
      mediaType: args.mediaType,
      storageId: args.storageId,
      duration: args.duration,
      fileSize: args.fileSize,
      contentType: args.contentType,
      processingStatus: "completed",
      uploadedBy: identity.subject as any, // Cast to Id<"users">
      isPublic: false,
    })

    return { mediaId }
  },
})

// --- EXISTING MEDIA FUNCTIONS ---
// These were in the original file and are kept for now to avoid breaking changes.
// TODO: Consider moving these to a more appropriate file like `convex/media.ts` or `convex/admin.ts`.

/**
 * Get a media document by ID
 */
export const getMediaById = query({
  args: { mediaId: v.id("medias") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mediaId)
  },
})

/**
 * Generate a streaming URL for media content with authentication and subscription validation
 * This URL is time-limited and intended for streaming media in the browser
 */
export const getMediaStreamUrl = mutation({
  args: {
    mediaId: v.id("medias"),
  },
  handler: async (ctx, { mediaId }) => {
    // Get the media document
    const media = await ctx.db.get(mediaId)
    if (!media) {
      throw new Error("Media not found")
    }

    // Check if user has access to this media
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Authentication required")
    }

    // Get user profile to check subscription status
    const clerkId = identity.tokenIdentifier.split("|")[1]
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkId))
      .unique()

    if (!userProfile) {
      throw new Error("User profile not found")
    }

    // Check if media is public or user has active subscription
    if (
      !media.isPublic &&
      userProfile.role !== "admin" &&
      userProfile.subscriptionStatus !== "active"
    ) {
      throw new Error("Active subscription required to access this media")
    }

    // Check if media has storage ID
    if (!media.storageId) {
      throw new Error("Media has no associated storage")
    }

    // Generate a signed URL with 15 minute expiration (default)
    const url = await ctx.storage.getUrl(media.storageId)

    return { url }
  },
})

/**
 * Generate a download URL for media content with authentication and subscription validation
 * This URL has a longer expiration time and is intended for offline downloads
 */
export const getMediaDownloadUrl = mutation({
  args: {
    mediaId: v.id("medias"),
  },
  handler: async (ctx, { mediaId }) => {
    // Get the media document
    const media = await ctx.db.get(mediaId)
    if (!media) {
      throw new Error("Media not found")
    }

    // Check if user has access to this media
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Authentication required")
    }

    // Get user profile to check subscription status
    const clerkId = identity.tokenIdentifier.split("|")[1]
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkId))
      .unique()

    if (!userProfile) {
      throw new Error("User profile not found")
    }

    // Check if media is public or user has active subscription
    if (
      !media.isPublic &&
      userProfile.role !== "admin" &&
      userProfile.subscriptionStatus !== "active"
    ) {
      throw new Error("Active subscription required to access this media")
    }

    // Check if media has storage ID
    if (!media.storageId) {
      throw new Error("Media has no associated storage")
    }

    // Generate a signed URL for access.
    const url = await ctx.storage.getUrl(media.storageId)

    // The fileName can be used by the client to suggest a name for the downloaded file.
    return { url, fileName: media.title || "media-download" }
  },
})
