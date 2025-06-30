import { v } from "convex/values";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

/**
 * Function for uploading files to R2 storage
 * This is the server-side implementation for @convex-dev/r2/react's useUploadFile hook
 */
export default R2({
  /**
   * The bucket name where files will be stored
   * This should match the bucket configured in your R2 setup
   */
  bucket: "media-uploads",

  /**
   * Maximum allowed file size (50MB)
   */
  maxSize: 50 * 1024 * 1024,

  /**
   * Function to validate uploaded files
   * You can customize this to restrict file types, etc.
   */
  validate: async (file) => {
    // Allow audio and video files only
    const validAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
    const validVideoTypes = ["video/mp4", "video/webm"];
    const validTypes = [...validAudioTypes, ...validVideoTypes];

    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only audio and video files are allowed.`);
    }

    return {
      // Return any additional metadata you want to store
      // These values will be accessible in the success callback
      metadata: {
        contentType: file.type,
        originalName: file.name,
        size: file.size,
      },
    };
  },
});
