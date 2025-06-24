import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    user: v.id("adminUsers"),
  }),
  adminUsers: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("subscriber"))),
    email: v.optional(v.string()),
    lastLogin: v.optional(v.number()),
  }).index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  subscriberMessages: defineTable({
    body: v.string(),
    user: v.id("subscriberUsers"),
  }),
  subscriberUsers: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("subscriber"))),
    email: v.optional(v.string()),
    lastLogin: v.optional(v.number()),
  }).index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  media: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    mediaUrl: v.string(), // CloudFlare R2 URL for audio, YouTube URL for video
    thumbnailUrl: v.optional(v.string()),
    duration: v.number(), // in seconds
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
