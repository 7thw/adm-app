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
});
