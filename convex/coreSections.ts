// convex/coreSections.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminClerk, requireAuth } from "./authClerk";

// Get sections by core playlist ID
export const getByCorePlaylistId = query({
  args: { playlistId: v.id("corePlaylists") },
  handler: async (ctx, { playlistId }) => {
    await requireAuth(ctx, "coreSections:getByCorePlaylistId");
    
    return await ctx.db
      .query("coreSections")
      .withIndex("by_playlist_order")
      .filter((q) => q.eq(q.field("playlistId"), playlistId))
      .order("asc")
      .collect();
  },
});

// Get section by ID
export const getById = query({
  args: { id: v.id("coreSections") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx, "coreSections:getById");
    
    return await ctx.db.get(id);
  },
});

// Create new section
export const create = mutation({
  args: {
    playlistId: v.id("corePlaylists"),
    title: v.string(),
    description: v.optional(v.string()),
    sectionType: v.union(v.literal("base"), v.literal("loop")),
    minSelectMedia: v.number(),
    maxSelectMedia: v.number(),
  },
  handler: async (ctx, { playlistId, title, description, sectionType, minSelectMedia, maxSelectMedia }) => {
    await requireAdminClerk(ctx, "coreSections:create");

    // Verify playlist exists and is in draft status
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    if (playlist.status === "published") {
      throw new Error("Cannot add sections to published playlists");
    }

    // Validate min/max select media
    if (minSelectMedia < 0 || maxSelectMedia < minSelectMedia) {
      throw new Error("Invalid media selection limits");
    }

    // Get current max order for this playlist
    const existingSections = await ctx.db
      .query("coreSections")
      .withIndex("by_playlist")
      .filter((q) => q.eq(q.field("playlistId"), playlistId))
      .collect();
    
    const maxOrder = Math.max(...existingSections.map(s => s.order), 0);

    const sectionId = await ctx.db.insert("coreSections", {
      playlistId,
      title: title.trim(),
      description: description?.trim(),
      sectionType,
      minSelectMedia,
      maxSelectMedia,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sectionId;
  },
});

// Update section
export const update = mutation({
  args: {
    id: v.id("coreSections"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sectionType: v.optional(v.union(v.literal("base"), v.literal("loop"))),
    minSelectMedia: v.optional(v.number()),
    maxSelectMedia: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdminClerk(ctx, "coreSections:update");

    const section = await ctx.db.get(id);
    if (!section) {
      throw new Error("Section not found");
    }

    // Check if playlist is published
    const playlist = await ctx.db.get(section.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot edit sections in published playlists");
    }

    // Validate min/max select media if being updated
    const newMinSelectMedia = updates.minSelectMedia ?? section.minSelectMedia;
    const newMaxSelectMedia = updates.maxSelectMedia ?? section.maxSelectMedia;
    
    if (newMinSelectMedia < 0 || newMaxSelectMedia < newMinSelectMedia) {
      throw new Error("Invalid media selection limits");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete section
export const remove = mutation({
  args: { id: v.id("coreSections") },
  handler: async (ctx, { id }) => {
    await requireAdminClerk(ctx, "coreSections:remove");

    const section = await ctx.db.get(id);
    if (!section) {
      throw new Error("Section not found");
    }

    // Check if playlist is published
    const playlist = await ctx.db.get(section.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot delete sections from published playlists");
    }

    // Delete all section media relationships
    const sectionMedias = await ctx.db
      .query("sectionMedia")
      .withIndex("by_section")
      .filter((q) => q.eq(q.field("sectionId"), id))
      .collect();

    for (const sectionMedia of sectionMedias) {
      await ctx.db.delete(sectionMedia._id);
    }

    // Delete the section
    await ctx.db.delete(id);
    return { success: true };
  },
});

// Reorder sections
export const reorder = mutation({
  args: {
    sectionOrders: v.array(v.object({
      id: v.id("coreSections"),
      order: v.number(),
    })),
  },
  handler: async (ctx, { sectionOrders }) => {
    await requireAdminClerk(ctx, "coreSections:reorder");

    // Verify all sections exist and belong to same playlist
    if (sectionOrders.length === 0) return { success: true };
    
    const firstSection = await ctx.db.get(sectionOrders[0].id);
    if (!firstSection) throw new Error("Section not found");
    
    const playlist = await ctx.db.get(firstSection.playlistId);
    if (playlist?.status === "published") {
      throw new Error("Cannot reorder sections in published playlists");
    }

    for (const { id, order } of sectionOrders) {
      await ctx.db.patch(id, {
        order,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
