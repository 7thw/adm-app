import { R2, type R2Callbacks } from "@convex-dev/r2";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Initialize R2 client
export const r2 = new R2(components.r2);

// Create a reference to our internal mutation for onSyncMetadata
import { internal } from "./_generated/api";

// Define the onSyncMetadata handler as an internal mutation
export const handleSyncMetadata = internalMutation({
  args: { bucket: v.string(), key: v.string(), isNew: v.boolean() },
  handler: async (ctx, args) => {
    // This will be called after metadata sync
    const metadata = await r2.getMetadata(ctx, args.key);
    console.log("Synced media metadata:", metadata);
    
    // Return the metadata
    return metadata;
  },
});

// Create callbacks reference pointing to our internal mutation
const callbacks = {
  onSyncMetadata: internal.media.handleSyncMetadata,
};

// Generate client API for file uploads
export const { generateUploadUrl, syncMetadata, onSyncMetadata } = r2.clientApi({
  // Validate that the user can upload to this bucket
  checkUpload: async (ctx, bucket) => {
    // For development purposes, allow uploads without authentication
    // In production, you would want to check authentication
    
    // Get the user's identity from the auth context (optional)
    const identity = await ctx.auth.getUserIdentity();
    
    // Log the identity for debugging
    console.log("Upload attempt with identity:", identity ? "Authenticated" : "Not authenticated");
    
    // Allow uploads regardless of authentication status for now
    // You can add additional authorization checks here later
    // For example, check if the user has the right role
    // or if they're allowed to upload to this specific bucket
    
    // Don't return anything (void return type)
    // If there's an issue, throw an error to prevent the upload
    return;
  },
  
  // Handle the upload after it's been validated but before it's performed
  onUpload: async (ctx, bucket, key) => {
    // Extract metadata from the key (if you're using a naming convention)
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    const mediaType = filename.endsWith(".mp3") || filename.endsWith(".wav") ? "audio" : "video";
    
    // Create a new media record in the database
    const mediaId = await ctx.db.insert("media", {
      title: filename, // Default to filename, can be updated later
      mediaType,
      mediaUrl: `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com/${key}`,
      duration: 0, // This will need to be updated after processing
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Store the mediaId in a global variable or context if needed
    // Don't return anything (void)
  },
});

// Query to get all media items
export const getMedia = query({
  handler: async (ctx) => {
    return await ctx.db.query("media").order("desc").collect();
  },
});

// Query to get a specific media item
export const getMediaById = query({
  args: { id: v.id("media") },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error("Media not found");
    }
    
    // Generate a signed URL for the media if needed
    // This is useful for private buckets or time-limited access
    if (media.mediaUrl) {
      // Extract the key from the mediaUrl
      const url = new URL(media.mediaUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      // Get a URL for the media
      try {
        // Extract just the key from the URL
        const signedUrl = media.mediaUrl;
        return { ...media, signedUrl };
      } catch (error) {
        console.error("Failed to generate signed URL:", error);
        // Return the media without a signed URL if there's an error
      }
    }
    
    return media;
  },
});

// Mutation to update media metadata
export const updateMedia = mutation({
  args: {
    id: v.id("media"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if the media exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Media not found");
    }
    
    // Update the media record
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    // Get the updated record
    const updated = await ctx.db.get(id);
    
    // If we've updated metadata that should be reflected in R2,
    // we could sync it back to R2 here if needed
    
    return updated;
  },
});

// Mutation to delete media
export const deleteMedia = mutation({
  args: { id: v.id("media") },
  handler: async (ctx, args) => {
    // Get the media record
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error("Media not found");
    }
    
    // Extract the key from the mediaUrl
    const url = new URL(media.mediaUrl);
    const key = url.pathname.substring(1); // Remove leading slash
    
    // Delete the file from R2 using the proper method
    try {
      await r2.deleteObject(ctx, key);
    } catch (error) {
      console.error("Failed to delete object from R2:", error);
      // Continue with database deletion even if R2 deletion fails
    }
    
    // Delete the media record
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Handle metadata sync manually
export const handleMetadataSync = mutation({
  args: { 
    key: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
    duration: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get the metadata of the synced object
    const metadata = await r2.getMetadata(ctx, args.key);
    
    // Log metadata for debugging
    console.log("Synced media metadata:", metadata);
    
    // Find the media record associated with this key
    const mediaRecords = await ctx.db
      .query("media")
      .filter(q => q.eq(q.field("mediaUrl"), `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com/${args.key}`))
      .collect();
    
    // If we found a media record, update it with the provided metadata
    if (mediaRecords.length > 0) {
      const mediaId = mediaRecords[0]._id;
      
      // Prepare the update object with only the provided fields
      const updates: Record<string, any> = { updatedAt: Date.now() };
      
      if (args.title !== undefined) updates.title = args.title;
      if (args.description !== undefined) updates.description = args.description;
      if (args.mediaType !== undefined) updates.mediaType = args.mediaType;
      if (args.duration !== undefined) updates.duration = args.duration;
      
      // Update the media record
      await ctx.db.patch(mediaId, updates);
      
      // Return the updated record
      return await ctx.db.get(mediaId);
    }
    
    // If no media record was found, return just the metadata
    return metadata;
  }
});
