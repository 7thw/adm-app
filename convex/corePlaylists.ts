// convex/corePlaylists.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminClerk, requireAuth } from "./authClerk";

// Get all core playlists
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx, "corePlaylists:getAll");
    
    return await ctx.db
      .query("corePlaylists")
      .order("desc")
      .collect();
  },
});

// Get core playlist by ID
export const getById = query({
  args: { id: v.id("corePlaylists") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx, "corePlaylists:getById");
    
    return await ctx.db.get(id);
  },
});

// Get core playlist by string ID
export const getByStringId = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx, "corePlaylists:getByStringId");
    
    const playlist = await ctx.db.get(id as any);
    return playlist;
  },
});

// Get playlists by category ID
export const getByCategoryId = query({
  args: { categoryId: v.id("playlistCategories") },
  handler: async (ctx, { categoryId }) => {
    await requireAuth(ctx, "corePlaylists:getByCategoryId");
    
    return await ctx.db
      .query("corePlaylists")
      .withIndex("by_category")
      .filter((q) => q.eq(q.field("categoryId"), categoryId))
      .order("desc")
      .collect();
  },
});

// Create new core playlist
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    categoryId: v.id("playlistCategories"),
  },
  handler: async (ctx, { title, description, thumbnailUrl, categoryId }) => {
    await requireAdminClerk(ctx, "corePlaylists:create");

    // Verify category exists
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const playlistId = await ctx.db.insert("corePlaylists", {
      title: title.trim(),
      description: description?.trim(),
      thumbnailUrl,
      status: "draft" as const,
      categoryId,
      totalDuration: 0,
      playCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return playlistId;
  },
});

// Update core playlist
export const update = mutation({
  args: {
    id: v.id("corePlaylists"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("playlistCategories")),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdminClerk(ctx, "corePlaylists:update");

    const playlist = await ctx.db.get(id);
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    // Check if trying to edit a published playlist
    if (playlist.status === "published" && (updates.title || updates.description || updates.categoryId)) {
      throw new Error("Cannot edit published playlists. Change status to draft first.");
    }

    // Verify category exists if being updated
    if (updates.categoryId) {
      const category = await ctx.db.get(updates.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete core playlist
export const remove = mutation({
  args: { id: v.id("corePlaylists") },
  handler: async (ctx, { id }) => {
    await requireAdminClerk(ctx, "corePlaylists:remove");

    const playlist = await ctx.db.get(id);
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    // Delete all sections and their media relationships
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_playlist")
      .filter((q) => q.eq(q.field("playlistId"), id))
      .collect();

    for (const section of sections) {
      // Delete all section media relationships
      const sectionMedias = await ctx.db
        .query("sectionMedia")
        .withIndex("by_section")
        .filter((q) => q.eq(q.field("sectionId"), section._id))
        .collect();

      for (const sectionMedia of sectionMedias) {
        await ctx.db.delete(sectionMedia._id);
      }

      // Delete the section
      await ctx.db.delete(section._id);
    }

    // Delete the playlist
    await ctx.db.delete(id);
    return { success: true };
  },
});
