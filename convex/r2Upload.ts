// convex/r2Upload.ts - USING CLERK AUTH (NO TABLE DEPENDENCY)
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { requireAdminClerk } from "./authClerk";

// Initialize R2 component exactly like the official example
export const r2 = new R2(components.r2);

// FIXED: Use Clerk-based auth instead of adminUsers table
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, bucket) => {
    // Use Clerk metadata auth - no table dependency!
    await requireAdminClerk(ctx, "r2Upload:checkUpload");
    console.log("✅ Admin access verified via Clerk metadata");
  },
  onUpload: async (ctx, bucket, key) => {
    // This runs AFTER the file is uploaded to R2
    console.log("File uploaded successfully with key:", key);
    
    // Get the current user identity
    const identity = await ctx.auth.getUserIdentity();
    
    // Get the public URL for the uploaded file
    const mediaUrl = await r2.getUrl(key);
    console.log("Generated media URL:", mediaUrl);
    
    // Create the media record with default metadata (can be updated later)
    const mediaId = await ctx.db.insert("media", {
      title: `Uploaded Audio ${new Date().toISOString()}`, // Default title
      description: "Uploaded via R2",
      mediaType: "audio" as const,
      mediaUrl,
      uploadKey: key,
      uploadStatus: "completed" as const, // Directly completed!
      contentType: "audio/mpeg", // Default content type
      fileSize: 0, // Default file size (can be updated later)
      userId: identity?.tokenIdentifier || identity?.subject || "unknown",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log("✅ Created media record:", { 
      mediaId, 
      key, 
      mediaUrl 
    });
  },
});
