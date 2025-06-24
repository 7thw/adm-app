// convex/r2.ts
import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { R2, type R2Callbacks } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

// Define callbacks for the R2 client API
const callbacks: R2Callbacks = internal.r2;

// Client API for file uploads and metadata sync
export const { generateUploadUrl, syncMetadata, onSyncMetadata } = r2.clientApi({
  // Pass the functions from this file back into the component
  callbacks,
  
  // Validate that the user can upload to this bucket
  checkUpload: async (ctx, bucket) => {
    // TODO: Add authentication check
    // const user = await userFromAuth(ctx);
    // if (!user) {
    //   throw new Error("User not authenticated");
    // }
    console.log(`Upload check for bucket: ${bucket}`);
    return true;
  },

  // Run after upload URL generation but before client upload
  onUpload: async (ctx, key) => {
    console.log(`File upload initiated for key: ${key}`);
    // You can create database relations here
    // await ctx.db.insert("uploads", { key, status: "uploading" });
  },

  // Run after metadata sync
  onSyncMetadata: async (ctx, args) => {
    const { bucket, key, isNew } = args;
    console.log(`Metadata synced for key: ${key}, isNew: ${isNew}`);
    
    // Get file metadata
    const metadata = await r2.getMetadata(ctx, key);
    console.log("File metadata:", metadata);
    
    // You can update your database with file information
    // await ctx.db.insert("files", {
    //   key,
    //   bucket,
    //   contentType: metadata?.ContentType,
    //   contentLength: metadata?.ContentLength,
    //   lastModified: metadata?.LastModified,
    //   isNew
    // });
  },
});

// Custom mutation for generating upload URL with custom key
export const generateUploadUrlWithCustomKey = mutation({
  args: {
    prefix: v.optional(v.string()),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add user authentication
    // const currentUser = await getUser(ctx);
    // if (!currentUser) {
    //   throw new Error("User not found");
    // }

    // Create custom key with optional prefix and filename
    const uuid = crypto.randomUUID();
    let key = uuid;
    
    if (args.prefix) {
      key = `${args.prefix}/${uuid}`;
    }
    
    if (args.filename) {
      const extension = args.filename.split('.').pop();
      key = extension ? `${key}.${extension}` : key;
    }

    return await r2.generateUploadUrl(key);
  },
});

// Store files directly from server (for server-side file operations)
export const storeFileFromUrl = internalAction({
  args: {
    url: v.string(),
    key: v.optional(v.string()),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Download file from URL
      const response = await fetch(args.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Store in R2 with optional custom key and content type
      const key = await r2.store(ctx, blob, {
        key: args.key,
        type: args.contentType || blob.type,
      });

      console.log(`File stored with key: ${key}`);
      return key;
    } catch (error) {
      console.error("Error storing file:", error);
      throw error;
    }
  },
});

// Get file URL with custom expiration
export const getFileUrl = query({
  args: {
    key: v.string(),
    expiresIn: v.optional(v.number()), // seconds
  },
  handler: async (ctx, args) => {
    return await r2.getUrl(args.key, {
      expiresIn: args.expiresIn || 900, // Default 15 minutes
    });
  },
});

// Get file metadata
export const getFileMetadata = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await r2.getMetadata(ctx, args.key);
  },
});

// List all file metadata with optional limit
export const listFiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await r2.listMetadata(ctx, args.limit);
  },
});

// Delete file by key
export const deleteFile = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Add permission check
    // const user = await getUser(ctx);
    // if (!user) {
    //   throw new Error("User not authenticated");
    // }

    const result = await r2.deleteByKey(args.key);
    
    // Also remove from your database if you're tracking files
    // await ctx.db
    //   .query("files")
    //   .filter((q) => q.eq(q.field("key"), args.key))
    //   .first()
    //   .then((file) => file && ctx.db.delete(file._id));

    console.log(`File deleted: ${args.key}`);
    return result;
  },
});

// Batch delete multiple files
export const deleteFiles = mutation({
  args: {
    keys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const key of args.keys) {
      try {
        const result = await r2.deleteByKey(key);
        results.push({ key, success: true, result });
      } catch (error) {
        results.push({ key, success: false, error: String(error) });
      }
    }
    
    return results;
  },
});

// Copy file from one key to another
export const copyFile = internalAction({
  args: {
    sourceKey: v.string(),
    destinationKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the source file URL
      const sourceUrl = await r2.getUrl(args.sourceKey);
      
      // Download the file
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch source file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Store with new key
      const newKey = await r2.store(ctx, blob, {
        key: args.destinationKey,
        type: blob.type,
      });

      return newKey;
    } catch (error) {
      console.error("Error copying file:", error);
      throw error;
    }
  },
});

// Move file (copy then delete original)
export const moveFile = internalAction({
  args: {
    sourceKey: v.string(),
    destinationKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Copy file to new location
      const newKey = await ctx.runAction(internal.r2.copyFile, {
        sourceKey: args.sourceKey,
        destinationKey: args.destinationKey,
      });
      
      // Delete original file
      await ctx.runMutation(internal.r2.deleteFile, {
        key: args.sourceKey,
      });
      
      return newKey;
    } catch (error) {
      console.error("Error moving file:", error);
      throw error;
    }
  },
});

// Internal mutation for file operations (used by actions)
export const internalDeleteFile = internalMutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await r2.deleteByKey(args.key);
  },
});

// Get file statistics
export const getFileStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const files = await r2.listMetadata(ctx);
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((acc, file) => acc + (file.ContentLength || 0), 0),
        fileTypes: {} as Record<string, number>,
        averageSize: 0,
      };

      // Count file types
      files.forEach(file => {
        const type = file.ContentType || 'unknown';
        stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
      });

      // Calculate average size
      if (stats.totalFiles > 0) {
        stats.averageSize = stats.totalSize / stats.totalFiles;
      }

      return stats;
    } catch (error) {
      console.error("Error getting file stats:", error);
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        averageSize: 0,
      };
    }
  },
});