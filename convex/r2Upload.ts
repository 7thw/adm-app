import { R2 } from "@convex-dev/r2"
import { action, mutation, query } from "./_generated/server"
import { v } from "convex/values"

// Initialize the R2 client
const r2 = new R2({
  // It's best practice to store secrets like bucket names in environment variables
  bucket: process.env.R2_BUCKET_NAME ?? "realigna-media-uploads",
  // Optional: Set a max size for uploads (e.g., 50MB)
  maxSize: 50 * 1024 * 1024,
})

// --- R2 UPLOAD FUNCTIONS ---
// These two functions are required by the @convex-dev/r2/react hook

/**
 * Generates a pre-signed URL for uploading a file to R2.
 * This is the mutation the R2 hook will call to get a pre-signed URL.
 */
export const generateUploadUrl = mutation({
  args: {
    // The R2 hook can optionally pass a custom key
    customKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // The `r2.generateUploadUrl` method from the helper library does the hard work
    return await r2.generateUploadUrl(ctx, { customKey: args.customKey })
  },
})

/**
 * An action to sync metadata after a file upload is complete.
 * This is the action the R2 hook will call after the upload is complete.
 */
export const syncMetadata = action({
  args: {
    // The key is the unique identifier for the uploaded file
    key: v.string(),
  },
  handler: async (ctx, args) => {
    // The `r2.syncMetadata` method links the upload to Convex's internal state
    return await r2.syncMetadata(ctx, { key: args.key })
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
