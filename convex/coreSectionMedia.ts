// convex/coreSectionMedia.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminClerk, requireAuth } from "./authClerk";

// Get section media by section ID
export const getBySectionId = query({
  args: { sectionId: v.id("coreSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAuth(ctx, "coreSectionMedia:getBySectionId");
    
    return await ctx.db
      .query("sectionMedia")
      .withIndex("by_section_order")
      .filter((q) => q.eq(q.field("sectionId"), sectionId))
      .order("asc")
      .collect();
  },
});

// Get detailed section media with media info
export const getSelectedBySectionId = query({
  args: { sectionId: v.id("coreSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAuth(ctx, "coreSectionMedia:getSelectedBySectionId");
    
    const sectionMedias = await ctx.db
      .query("sectionMedia")
      .withIndex("by_section_order")
      .filter((q) => q.eq(q.field("sectionId"), sectionId))
      .order("asc")
      .collect();

    // Get media details for each section media
    const detailedSectionMedias = await Promise.all(
      sectionMedias.map(async (sectionMedia) => {
        const media = await ctx.db.get(sectionMedia.mediaId);
        return {
          ...sectionMedia,
          media,
        };
      })
    );

    return detailedSectionMedias;
  },
});

// Add media to section
export const addMedia = mutation({
  args: {
    sectionId: v.id("coreSections"),
    mediaId: v.id("media"),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, { sectionId, mediaId, isRequired = false }) => {
    await requireAdminClerk(ctx, "coreSectionMedia:addMedia");

    // Verify section exists and playlist is in draft
    const section = await ctx.db.get(sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot add media to sections in published playlists");
    }

    // Verify media exists
    const media = await ctx.db.get(mediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Check if media already exists in section
    const existingMedia = await ctx.db
      .query("sectionMedia")
      .withIndex("by_section")
      .filter((q) => q.and(
        q.eq(q.field("sectionId"), sectionId),
        q.eq(q.field("mediaId"), mediaId)
      ))
      .first();

    if (existingMedia) {
      throw new Error("Media already exists in this section");
    }

    // Get current max order for this section
    const existingSectionMedias = await ctx.db
      .query("sectionMedia")
      .withIndex("by_section")
      .filter((q) => q.eq(q.field("sectionId"), sectionId))
      .collect();
    
    const maxOrder = Math.max(...existingSectionMedias.map(sm => sm.order), 0);

    const sectionMediaId = await ctx.db.insert("sectionMedia", {
      sectionId,
      mediaId,
      order: maxOrder + 1,
      isRequired,
      createdAt: Date.now(),
    });

    return sectionMediaId;
  },
});

// Update media selection
export const updateSelection = mutation({
  args: {
    id: v.id("sectionMedia"),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, isRequired }) => {
    await requireAdminClerk(ctx, "coreSectionMedia:updateSelection");

    const sectionMedia = await ctx.db.get(id);
    if (!sectionMedia) {
      throw new Error("Section media not found");
    }

    // Verify section and playlist status
    const section = await ctx.db.get(sectionMedia.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot update media in published playlists");
    }

    await ctx.db.patch(id, { isRequired });
    return { success: true };
  },
});

// Reorder media within section
export const reorderMedia = mutation({
  args: {
    mediaOrders: v.array(v.object({
      id: v.id("sectionMedia"),
      order: v.number(),
    })),
  },
  handler: async (ctx, { mediaOrders }) => {
    await requireAdminClerk(ctx, "coreSectionMedia:reorderMedia");

    if (mediaOrders.length === 0) return { success: true };

    // Verify first section media exists and check playlist status
    const firstSectionMedia = await ctx.db.get(mediaOrders[0].id);
    if (!firstSectionMedia) throw new Error("Section media not found");
    
    const section = await ctx.db.get(firstSectionMedia.sectionId);
    if (!section) throw new Error("Section not found");
    
    const playlist = await ctx.db.get(section.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot reorder media in published playlists");
    }

    for (const { id, order } of mediaOrders) {
      await ctx.db.patch(id, { order });
    }

    return { success: true };
  },
});

// Remove media from section
export const removeMedia = mutation({
  args: { id: v.id("sectionMedia") },
  handler: async (ctx, { id }) => {
    await requireAdminClerk(ctx, "coreSectionMedia:removeMedia");

    const sectionMedia = await ctx.db.get(id);
    if (!sectionMedia) {
      throw new Error("Section media not found");
    }

    // Verify section and playlist status
    const section = await ctx.db.get(sectionMedia.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    const playlist = await ctx.db.get(section.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot remove media from published playlists");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Bulk update selections (useful for batch operations)
export const bulkUpdateSelections = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("sectionMedia"),
      isRequired: v.boolean(),
    })),
  },
  handler: async (ctx, { updates }) => {
    await requireAdminClerk(ctx, "coreSectionMedia:bulkUpdateSelections");

    if (updates.length === 0) return { success: true };

    // Verify all section media exist and playlist is in draft
    for (const update of updates) {
      const sectionMedia = await ctx.db.get(update.id);
      if (!sectionMedia) {
        throw new Error(`Section media ${update.id} not found`);
      }

      const section = await ctx.db.get(sectionMedia.sectionId);
      if (!section) {
        throw new Error("Section not found");
      }

      const playlist = await ctx.db.get(section.playlistId);
      if (playlist?.status === "published") {
        throw new Error("Cannot update media in published playlists");
      }

      await ctx.db.patch(update.id, { isRequired: update.isRequired });
    }

    return { success: true };
  },
});

// Get selection count for a section
export const getSelectionCount = query({
  args: { sectionId: v.id("coreSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAuth(ctx, "coreSectionMedia:getSelectionCount");
    
    const sectionMedias = await ctx.db
      .query("sectionMedia")
      .withIndex("by_section")
      .filter((q) => q.eq(q.field("sectionId"), sectionId))
      .collect();

    const totalCount = sectionMedias.length;
    const requiredCount = sectionMedias.filter(sm => sm.isRequired).length;

    return {
      total: totalCount,
      required: requiredCount,
      optional: totalCount - requiredCount,
    };
  },
});
