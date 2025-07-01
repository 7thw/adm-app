import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { R2 } from "@convex-dev/r2"
import { components } from "./_generated/api"

// --- OFFICIAL CONVEX R2 COMPONENT ---
// Using the official Convex R2 component for file uploads

// Instantiate R2 component client
export const r2 = new R2(components.r2)

// Export the official R2 client API with upload validation and callbacks
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, bucket) => {
    // Validate that the user can upload to this bucket
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Authentication required for upload")
    }
    
    // Additional validation can be added here (e.g., subscription status, file limits)
    // checkUpload should not return a value, just throw if invalid
  },
  onUpload: async (ctx, key) => {
    // This runs in the syncMetadata mutation after upload
    // We can create relations between the R2 key and our database here
    console.log(`File uploaded with key: ${key}`)
    
    // The actual media record creation will be handled separately
    // in createCoreMediaRecord to maintain our ultra-strict naming
  },
})

/**
 * Create a core media record after R2 file upload is complete.
 * Uses ultra-strict naming convention.
 */
export const createCoreMediaRecord = mutation({
  args: {
    r2Key: v.string(),
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

    // Create core media record with R2 data
    // Note: We store only the r2Key, not r2Url (which would expire)
    // Signed URLs should be generated dynamically when media is accessed
    const coreMediaId = await ctx.db.insert("medias", {
      title: args.title,
      description: args.description,
      mediaType: args.mediaType,
      r2Key: args.r2Key,
      duration: args.duration,
      fileSize: args.fileSize,
      contentType: args.contentType,
      processingStatus: "completed",
      uploadedBy: identity.subject as any, // Cast to Id<"users">
      isPublic: false,
    })

    return { coreMediaId }
  },
})

// Note: syncMetadata is already exported from r2.clientApi above
// The R2 component handles all metadata operations automatically
// All legacy media functions have been removed.
// Media access should generate signed URLs dynamically using the r2Key.
// The r2Url field has been removed to prevent expiration issues.

// If additional media access functions are needed, they should be implemented
// in convex/admin.ts or a dedicated convex/media.ts file.
