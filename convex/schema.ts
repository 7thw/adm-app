import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
const authTables = {
  users: defineTable({
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
  sessions: defineTable({
    userId: v.id("users"),
    sessionKey: v.string(),
    expires: v.number(),
  }).index("by_userId", ["userId"]),
};

const applicationTables = {
  // =================================================================
  // USER ROLES & ORGANIZATION MANAGEMENT
  // =================================================================
  
  // Organization roles for admin access control
  organizationRoles: defineTable({
    userId: v.id("users"),
    organizationId: v.string(), // Clerk organization ID
    role: v.union(v.literal("admin"), v.literal("member")),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_organization", ["userId", "organizationId"])
    .index("by_role", ["role"]),

  // User profiles with Clerk sync data
  userProfiles: defineTable({
    userId: v.id("users"), // References auth users table
    clerkUserId: v.string(), // Clerk user ID for sync
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("subscriber")),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("canceled"),
      v.literal("past_due")
    ),
    subscriptionId: v.optional(v.string()), // Clerk/Stripe subscription ID
    subscriptionPlan: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
    lastActiveAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_subscription_status", ["subscriptionStatus"])
    .index("by_active_subscribers", ["role", "subscriptionStatus", "isActive"]),

  // =================================================================
  // CORE CONTENT MANAGEMENT (Admin App Only)
  // =================================================================

  // Content categories
  coreCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    isActive: v.boolean(),
    order: v.number(),
    color: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_active", ["isActive"])
    .index("by_order", ["order"])
    .index("by_slug", ["slug"])
    .index("by_active_order", ["isActive", "order"]),

  // Media files with proper file storage integration
  medias: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    // For audio files uploaded to Convex storage
    storageId: v.optional(v.id("_storage")),
    // For video embeds (YouTube, etc.)
    embedUrl: v.optional(v.string()),
    youtubeId: v.optional(v.string()),
    // Media metadata
    duration: v.number(), // in seconds
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    // Processing status
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    // Audio-specific metadata
    transcript: v.optional(v.string()),
    waveformData: v.optional(v.string()),
    quality: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    // Ownership and access
    uploadedBy: v.id("users"),
    isPublic: v.boolean(),
  })
    .index("by_type", ["mediaType"])
    .index("by_status", ["processingStatus"])
    .index("by_uploader", ["uploadedBy"])
    .index("by_public", ["isPublic"])
    .index("by_type_public", ["mediaType", "isPublic"]),

  // Media tags for better organization
  mediaTags: defineTable({
    mediaId: v.id("medias"),
    tag: v.string(),
    createdAt: v.number(),
  })
    .index("by_media", ["mediaId"])
    .index("by_tag", ["tag"])
    .index("by_media_tag", ["mediaId", "tag"]),

  // Core playlists (admin-managed templates)
  corePlaylists: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    status: v.union(v.literal("draft"), v.literal("published")),
    categoryId: v.id("coreCategories"),
    estimatedDuration: v.optional(v.number()), // in minutes
    playCount: v.number(),
    averageRating: v.optional(v.number()),
    createdBy: v.id("users"),
    publishedAt: v.optional(v.number()),
    lastModifiedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["categoryId"])
    .index("by_category_status", ["categoryId", "status"])
    .index("by_published", ["status", "publishedAt"])
    .index("by_creator", ["createdBy"]),

  // Sections within core playlists
  coreSections: defineTable({
    playlistId: v.id("corePlaylists"),
    title: v.string(),
    description: v.optional(v.string()),
    sectionType: v.union(v.literal("base"), v.literal("loop")),
    minSelectMedia: v.number(),
    maxSelectMedia: v.number(),
    order: v.number(),
    isRequired: v.boolean(),
    estimatedDuration: v.optional(v.number()),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_playlist_order", ["playlistId", "order"])
    .index("by_type", ["sectionType"]),

  // Media items within sections
  sectionMedias: defineTable({
    sectionId: v.id("coreSections"),
    mediaId: v.id("medias"),
    order: v.number(),
    isOptional: v.boolean(),
    defaultSelected: v.boolean(),
  })
    .index("by_section", ["sectionId"])
    .index("by_section_order", ["sectionId", "order"])
    .index("by_media", ["mediaId"]),

  // =================================================================
  // USER CUSTOMIZATION & EXPERIENCE (PWA App)
  // =================================================================

  // User's customized playlists
  userPlaylists: defineTable({
    userId: v.id("users"),
    corePlaylistId: v.id("corePlaylists"),
    title: v.string(),
    customizations: v.string(), // JSON string of user selections
    isActive: v.boolean(),
    isFavorite: v.boolean(),
    playCount: v.number(),
    lastPlayedAt: v.optional(v.number()),
    completionPercentage: v.optional(v.number()),
    totalTimeSpent: v.optional(v.number()), // in seconds
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_user_favorites", ["userId", "isFavorite"])
    .index("by_core_playlist", ["corePlaylistId"])
    .index("by_last_played", ["userId", "lastPlayedAt"]),

  // User media selections and progress
  userMediaSelections: defineTable({
    userPlaylistId: v.id("userPlaylists"),
    sectionId: v.id("coreSections"),
    mediaId: v.id("medias"),
    isSelected: v.boolean(),
    playOrder: v.number(),
    completedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()), // in seconds
    lastPosition: v.optional(v.number()), // playback position in seconds
  })
    .index("by_user_playlist", ["userPlaylistId"])
    .index("by_section", ["sectionId"])
    .index("by_media", ["mediaId"])
    .index("by_selected", ["isSelected"])
    .index("by_user_playlist_selected", ["userPlaylistId", "isSelected"]),

  // User player settings
  userPlayerSettings: defineTable({
    userId: v.id("users"),
    // Player preferences
    maxLoop: v.number(), // 0 = no loop, -1 = infinite
    countDownTimer: v.number(), // in minutes
    volume: v.number(), // 0-100
    playbackSpeed: v.number(), // 0.5-2.0
    autoPlay: v.boolean(),
    shuffleMode: v.boolean(),
    backgroundPlayback: v.boolean(),
    // Current session state
    currentPlaylistId: v.optional(v.id("userPlaylists")),
    currentMediaId: v.optional(v.id("medias")),
    currentPosition: v.number(), // in seconds
    // Offline settings
    downloadQuality: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    wifiOnlyDownload: v.boolean(),
    autoSync: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // =================================================================
  // SUBSCRIPTION & BILLING INTEGRATION
  // =================================================================

  // Subscription usage tracking
  subscriptionUsage: defineTable({
    userId: v.id("users"),
    period: v.string(), // "2024-01" format
    playlistsCreated: v.number(),
    mediaPlayed: v.number(),
    totalPlayTime: v.number(), // in seconds
    downloadsUsed: v.number(),
    featuresUsed: v.array(v.string()),
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_period", ["period"])
    .index("by_user_period", ["userId", "period"]),

  // Webhook events from Clerk/Stripe
  webhookEvents: defineTable({
    eventId: v.string(), // Unique event ID from webhook
    eventType: v.string(), // e.g., "user.created", "subscription.updated"
    source: v.union(v.literal("clerk"), v.literal("stripe")),
    data: v.string(), // JSON string of event data
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
  })
    .index("by_event_id", ["eventId"])
    .index("by_type", ["eventType"])
    .index("by_source", ["source"])
    .index("by_processed", ["processed"])
    .index("by_source_processed", ["source", "processed"]),

  // =================================================================
  // ANALYTICS & TRACKING
  // =================================================================

  // User activity events
  analyticsEvents: defineTable({
    userId: v.id("users"),
    eventType: v.string(), // "playlist_created", "media_played", etc.
    eventData: v.optional(v.string()), // JSON string of event details
    playlistId: v.optional(v.id("userPlaylists")),
    mediaId: v.optional(v.id("medias")),
    sessionId: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_session", ["sessionId"]),

  // Admin audit trail
  adminActions: defineTable({
    adminUserId: v.id("users"),
    action: v.string(), // "playlist_published", "user_suspended", etc.
    targetType: v.string(), // "playlist", "user", "media", etc.
    targetId: v.string(),
    details: v.optional(v.string()), // JSON string of action details
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_admin", ["adminUserId"])
    .index("by_target_type", ["targetType"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // =================================================================
  // NOTIFICATIONS
  // =================================================================

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("system"),
      v.literal("playlist_update"),
      v.literal("subscription"),
      v.literal("content_available")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.string()), // JSON string
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_type", ["type"])
    .index("by_expiry", ["expiresAt"]),

  // =================================================================
  // FILE UPLOAD TRACKING
  // =================================================================

  uploadSessions: defineTable({
    uploadKey: v.string(),
    fileName: v.string(),
    originalName: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    uploadStatus: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    storageId: v.optional(v.id("_storage")),
    mediaId: v.optional(v.id("medias")),
    uploadedBy: v.id("users"),
    uploadProgress: v.optional(v.number()), // 0-100
    errorMessage: v.optional(v.string()),
    processingMetadata: v.optional(v.string()), // JSON string
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_upload_key", ["uploadKey"])
    .index("by_status", ["uploadStatus"])
    .index("by_user", ["uploadedBy"])
    .index("by_media", ["mediaId"])
    .index("by_storage_id", ["storageId"]),

  // =================================================================
  // ANALYTICS TRACKING
  // =================================================================

  installAnalytics: defineTable({
    event: v.string(), // 'install_prompt_shown' | 'install_success' | 'install_dismissed' | 'install_error'
    platform: v.string(), // 'mobile' | 'desktop' | 'unknown'
    variant: v.string(), // 'card' | 'button' | 'banner'
    context: v.optional(v.string()), // A/B test variant or additional context
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
    userId: v.optional(v.string()), // Can be null for anonymous tracking
    userEmail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_platform", ["platform"])
    .index("by_variant", ["variant"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_event_platform", ["event", "platform"])
    .index("by_timestamp_event", ["timestamp", "event"]),

  userAnalytics: defineTable({
    event: v.string(), // Event name
    properties: v.optional(v.any()), // Event properties as JSON
    sessionId: v.optional(v.string()),
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_event", ["userId", "event"])
    .index("by_timestamp_event", ["timestamp", "event"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
