// convex/clearDatabase.ts
import { mutation } from "./_generated/server";
import { Doc, TableNames } from "./_generated/dataModel";

// This function will clear all data from a specific table
export const clearTable = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all media documents
    const mediaDocuments = await ctx.db.query("media").collect();
    
    // Delete each document
    for (const doc of mediaDocuments) {
      await ctx.db.delete(doc._id);
    }
    
    return { 
      success: true, 
      message: "Media table cleared successfully", 
      count: mediaDocuments.length 
    };
  },
});

// Clear all tables (be careful with this in production!)
export const clearAllTables = mutation({
  args: {},
  handler: async (ctx) => {
    // Define tables that we know exist in our schema
    // Using 'as const' to ensure type safety while allowing string literals
    const tables = [
      "media", 
      "adminUsers", 
      "subscriberUsers", 
      "messages",
      "playlistCategories"
      // Commented out tables that might not be defined yet
      // "playlists",
      // "playlistItems"
    ] as const;
    
    // Define the results object with proper typing
    const results: Record<string, { success: boolean; count?: number; error?: string }> = {};
    
    for (const table of tables) {
      try {
        const documents = await ctx.db.query(table).collect();
        
        for (const doc of documents) {
          await ctx.db.delete(doc._id);
        }
        
        results[table] = {
          success: true,
          count: documents.length
        };
      } catch (error: any) {
        results[table] = {
          success: false,
          error: error.message || String(error)
        };
      }
    }
    
    return { 
      success: true, 
      message: "All tables cleared", 
      results 
    };
  },
});
