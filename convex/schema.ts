// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (managed by Clerk)
  subscriberUsers: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tokenIdentifier: v.string(), // Add tokenIdentifier for Clerk auth
    name: v.optional(v.string()), // Add name field for user's display name
    role: v.union(v.literal("admin"), v.literal("subscriber")),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due")
    ),
    subscriptionPlan: v.optional(v.string()),
    subscriptionExpires: v.optional(v.number()),
    metadata: v.optional(v.any()),
    lastLogin: v.optional(v.number()), // Add lastLogin field
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_token", ["tokenIdentifier"]) // Add index for tokenIdentifier
    .index("by_subscription_status", ["subscriptionStatus"]),

  adminUsers: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tokenIdentifier: v.string(), // Add tokenIdentifier for Clerk auth
    name: v.optional(v.string()), // Add name field for user's display name
    role: v.union(v.literal("admin"), v.literal("subscriber")),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due")
    ),
    subscriptionPlan: v.optional(v.string()),
    subscriptionExpires: v.optional(v.number()),
    metadata: v.optional(v.any()),
    lastLogin: v.optional(v.number()), // Add lastLogin field
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_token", ["tokenIdentifier"]) // Add index for tokenIdentifier
    .index("by_subscription_status", ["subscriptionStatus"]),

  // Messages
  messages: defineTable({
    user: v.string(),
    message: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["user"]),

  // Playlist Categories (for tagging)
  playlistCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_active", ["isActive"]),

  // Media (uploaded/embedded content)
  media: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    mediaUrl: v.string(), // CloudFlare R2 URL for audio, YouTube URL for video
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()), // in seconds
    fileSize: v.optional(v.number()), // in bytes, for audio files
    uploadKey: v.optional(v.string()), // R2 key for audio files
    contentType: v.optional(v.string()), // MIME type of the file
    userId: v.optional(v.string()), // User who uploaded the file
    uploadStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    )),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["mediaType"])
    .index("by_upload_status", ["uploadStatus"])
    .index("by_created", ["createdAt"]),

  // CorePlaylists
  corePlaylists: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    categoryId: v.id("playlistCategories"),
    totalDuration: v.optional(v.number()), // calculated total duration
    playCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["categoryId"])
    .index("by_published", ["status", "createdAt"])
    .index("by_play_count", ["playCount"]),

  // CoreSections
  coreSections: defineTable({
    playlistId: v.id("corePlaylists"),
    title: v.string(),
    description: v.optional(v.string()),
    sectionType: v.union(v.literal("base"), v.literal("loop")),
    minSelectMedia: v.number(), // minimum medias subscribers must toggle on
    maxSelectMedia: v.number(), // maximum medias subscribers can toggle on
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_playlist_order", ["playlistId", "order"]),

  // SectionMedia (linking media to sections)
  sectionMedia: defineTable({
    sectionId: v.id("coreSections"),
    mediaId: v.id("media"),
    order: v.number(),
    isRequired: v.optional(v.boolean()), // if true, this media is always selected
    createdAt: v.number(),
  })
    .index("by_section", ["sectionId"])
    .index("by_section_order", ["sectionId", "order"])
    .index("by_media", ["mediaId"]),

  // SubscriberPlaylists (customized playlists by subscribers)
  subscriberPlaylists: defineTable({
    userId: v.string(), // Clerk user id
    corePlaylistId: v.id("corePlaylists"),
    title: v.string(), // custom title by subscriber
    customSettings: v.optional(v.string()), // JSON string of custom settings
    lastPlayed: v.optional(v.number()),
    playCount: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_core_playlist", ["corePlaylistId"])
    .index("by_last_played", ["lastPlayed"]),

  // SubscriberMediaSelection (tracks which media subscriber selected per section)
  subscriberMediaSelections: defineTable({
    subscriberPlaylistId: v.id("subscriberPlaylists"),
    sectionId: v.id("coreSections"),
    mediaId: v.id("media"),
    isSelected: v.boolean(),
    playOrder: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscriber_playlist", ["subscriberPlaylistId"])
    .index("by_section", ["sectionId"])
    .index("by_media", ["mediaId"])
    .index("by_selection", ["subscriberPlaylistId", "sectionId", "isSelected"]),

  // UserPlayerSettings
  userPlayerSettings: defineTable({
    userId: v.string(), // Clerk user id
    playerSettings: v.object({
      maxLoop: v.number(), // 0, 1, 2, 3, or -1 for infinite
      countDownTimer: v.number(), // minutes
      volume: v.number(), // 0-100
      autoplay: v.optional(v.boolean()),
      shuffle: v.optional(v.boolean()),
    }),
    currentPlaylistId: v.optional(v.id("subscriberPlaylists")),
    currentMediaId: v.optional(v.id("media")),
    currentTime: v.number(), // current playback time in seconds
    lastActivity: v.number(), // timestamp of last activity
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_activity", ["lastActivity"]),

  // SubscriberSettings (for PWA offline storage reference)
  subscriberSettings: defineTable({
    userId: v.string(), // Clerk user id
    preferences: v.object({
      autoSync: v.boolean(),
      offlineMode: v.boolean(),
      downloadQuality: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      )),
      maxStorageSize: v.optional(v.number()), // MB
    }),
    offlineData: v.optional(v.string()), // JSON string of offline cached playlists
    lastSync: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_sync", ["lastSync"]),

  // Analytics and Tracking
  playHistory: defineTable({
    userId: v.string(),
    mediaId: v.id("media"),
    playlistId: v.optional(v.id("subscriberPlaylists")),
    duration: v.number(), // how long they listened
    completionRate: v.number(), // percentage completed (0-100)
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_media", ["mediaId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  // System notifications and announcements
  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("success")
    ),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("admins"),
      v.literal("subscribers")
    ),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_target", ["targetAudience"])
    .index("by_expires", ["expiresAt"]),
});
