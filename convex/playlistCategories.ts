// convex/playlistCategories.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdminClerk, requireAuth } from "./authClerk";

// Get all playlist categories
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx, "playlistCategories:getAll");
    
    return await ctx.db
      .query("playlistCategories")
      .withIndex("by_order")
      .collect();
  },
});

// Get all active playlist categories
export const getAllActive = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx, "playlistCategories:getAllActive");
    
    return await ctx.db
      .query("playlistCategories")
      .withIndex("by_active")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

// Get playlist category by ID
export const getById = query({
  args: { id: v.id("playlistCategories") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx, "playlistCategories:getById");
    
    return await ctx.db.get(id);
  },
});

// Create new playlist category
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { name, description, isActive = true }) => {
    await requireAdminClerk(ctx, "playlistCategories:create");

    // Get the current max order
    const existingCategories = await ctx.db.query("playlistCategories").collect();
    const maxOrder = Math.max(...existingCategories.map(c => c.order), 0);

    const categoryId = await ctx.db.insert("playlistCategories", {
      name: name.trim(),
      description: description?.trim(),
      isActive,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return categoryId;
  },
});

// Update playlist category
export const update = mutation({
  args: {
    id: v.id("playlistCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await requireAdminClerk(ctx, "playlistCategories:update");

    const category = await ctx.db.get(id);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete playlist category
export const remove = mutation({
  args: { id: v.id("playlistCategories") },
  handler: async (ctx, { id }) => {
    await requireAdminClerk(ctx, "playlistCategories:remove");

    const category = await ctx.db.get(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if any playlists are using this category
    const playlistsUsingCategory = await ctx.db
      .query("corePlaylists")
      .withIndex("by_category")
      .filter((q) => q.eq(q.field("categoryId"), id))
      .collect();

    if (playlistsUsingCategory.length > 0) {
      throw new Error("Cannot delete category that is being used by playlists");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Reorder categories
export const reorder = mutation({
  args: {
    categoryOrders: v.array(v.object({
      id: v.id("playlistCategories"),
      order: v.number(),
    })),
  },
  handler: async (ctx, { categoryOrders }) => {
    await requireAdminClerk(ctx, "playlistCategories:reorder");

    for (const { id, order } of categoryOrders) {
      await ctx.db.patch(id, {
        order,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
