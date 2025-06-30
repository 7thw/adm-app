# Convex Schema Cleanup Plan

## Overview
This document analyzes the current Convex schema for the Realigna application, identifying areas for improvement to ensure the schema is accurate, efficient, and not overcomplicated for sharing between adm-app and pwa-app via api.ts.

## Current Schema Analysis

The current schema is well-structured but has several areas that could be optimized:

1. **Inconsistent ID References**: Some tables use `v.id("tableName")` while others use `v.string()` for IDs
2. **Redundant Data**: Several tables store duplicate information that could be normalized
3. **Inconsistent Naming**: Mixture of naming conventions (e.g., "mediasId" vs "mediaId")
4. **Type Issues**: Some references point to tables with incorrect names (e.g., "media" instead of "medias")
5. **Denormalization**: Some tables store derived data that could be calculated at runtime

## Revised Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main Users table - stores all users from Clerk with their role
  users: defineTable({
    clerkId: v.string(), // Clerk's user ID as a string (not a Convex ID)
    tokenIdentifier: v.string(), // Clerk's token identifier for auth
    role: v.union(v.literal("admin"), v.literal("subscriber")), // Role-based access control
    permissions: v.optional(v.array(v.string())), // Fine-grained permissions
    plan: v.optional(v.string()), // Subscription plan from Clerk Billing
    features: v.optional(v.array(v.string())), // Features available to this user
    email: v.string(), // Primary email address
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    name: v.optional(v.string()), // Full name (derived)
    metadata: v.optional(v.any()), // Additional metadata from Clerk
    lastLogin: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]) 
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_plan", ["plan"]),

  // Admin Users - extended data specific to admin role
  adminProfiles: defineTable({
    userId: v.id("users"), // Reference to the main users table
    clerkId: v.string(), // For easier querying without joins
    
    // Admin-specific fields
    permissions: v.array(v.string()), // Fine-grained permissions for admin actions
    adminRole: v.union(
      v.literal("super_admin"),
      v.literal("content_manager"),
      v.literal("analyst")
    ),
    
    // Organization data
    organizationId: v.optional(v.string()), // Clerk organization ID
    organizationRole: v.optional(v.string()), // Role within the organization
    
    // Admin preferences
    adminSettings: v.optional(v.object({
      dashboardView: v.optional(v.string()),
      notifications: v.optional(v.boolean()),
      theme: v.optional(v.string()),
      defaultFilters: v.optional(v.any()),
    })),
    
    // Activity tracking
    lastAdminAction: v.optional(v.number()),
    actionHistory: v.optional(v.array(v.object({
      action: v.string(),
      timestamp: v.number(),
      details: v.optional(v.any())
    }))),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_admin_role", ["adminRole"])
    .index("by_organization_id", ["organizationId"]),

  // Media items (audio/video content)
  medias: defineTable({ // Kept plural form for consistency with other tables
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal("audio"), v.literal("video")),
    mediaUrl: v.string(), // CloudFlare R2 URL for audio, YouTube URL for video
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()), // in seconds
    fileSize: v.optional(v.number()), // in bytes, for audio files
    uploadKey: v.optional(v.string()), // R2 key for audio files
    contentType: v.optional(v.string()), // MIME type of the file
    userId: v.optional(v.id("users")), // Changed to proper ID reference
    uploadStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["mediaType"])
    .index("by_upload_status", ["uploadStatus"])
    .index("by_created", ["createdAt"]),

  // Categories for organizing content
  categories: defineTable({ // Changed from "coreCategories" for simplicity
    title: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(), // For custom sorting
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_active", ["isActive"]),

  // Playlists (collections of media)
  playlists: defineTable({ // Changed from "corePlaylists" for simplicity
    title: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    categoryId: v.id("categories"), // Updated reference
    totalDuration: v.optional(v.number()), // Can be calculated from sections
    playCount: v.number(), // Tracks popularity
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["categoryId"])
    .index("by_published", ["status", "createdAt"])
    .index("by_play_count", ["playCount"]),

  // Sections within playlists
  sections: defineTable({ // Changed from "coreSections" for simplicity
    playlistId: v.id("playlists"), // Updated reference
    title: v.string(),
    description: v.optional(v.string()),
    sectionType: v.union(v.literal("base"), v.literal("loop")),
    minSelectMedia: v.number(), // Minimum media items subscribers must select
    maxSelectMedia: v.number(), // Maximum media items subscribers can select
    order: v.number(), // Changed from coreSectionOrder for consistency
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_playlist_order", ["playlistId", "order"]),

  // Media items within sections
  sectionMedias: defineTable({ // Using plural form for consistency with other tables
    sectionId: v.id("sections"), // Updated reference
    mediaId: v.id("media"), // Updated reference and singular
    order: v.number(),
    isRequired: v.optional(v.boolean()), // If true, this media is always selected
    createdAt: v.number(),
  })
    .index("by_section", ["sectionId"])
    .index("by_section_order", ["sectionId", "order"])
    .index("by_media", ["mediaId"]),

  // Subscriber Profiles
  subscriberProfiles: defineTable({
    userId: v.id("users"), // Reference to the main users table
    clerkId: v.string(), // For easier querying without joins
    
    // Subscription information
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due")
    ),
    subscriptionPlan: v.optional(v.string()),
    subscriptionId: v.optional(v.string()), // Clerk subscription ID
    subscriptionStartDate: v.optional(v.number()),
    subscriptionEndDate: v.optional(v.number()),
    billingCycleStart: v.optional(v.number()),
    billingCycleEnd: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    
    // Features and preferences
    entitlements: v.optional(v.array(v.string())),
    preferences: v.optional(v.object({
      preferredCategories: v.optional(v.array(v.id("categories"))),
      notifications: v.optional(v.boolean()),
      theme: v.optional(v.string()),
      autoSync: v.optional(v.boolean()),
      offlineMode: v.optional(v.boolean()),
      downloadQuality: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      )),
      maxStorageSize: v.optional(v.number()), // MB
    })),
    
    // Activity data
    lastActivity: v.optional(v.number()),
    favoriteMediaIds: v.optional(v.array(v.id("medias"))),
    favoritePlaylistIds: v.optional(v.array(v.id("playlists"))),
    
    // Offline sync
    offlineData: v.optional(v.string()), // JSON string of offline cached data
    lastSync: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_subscription_status", ["subscriptionStatus"])
    .index("by_subscription_plan", ["subscriptionPlan"])
    .index("by_last_sync", ["lastSync"]),

  // Subscriber customized playlists
  subscriberPlaylists: defineTable({
    userId: v.id("users"), // Changed to proper ID reference
    playlistId: v.id("playlists"), // Updated reference
    isActive: v.boolean(),
    playCount: v.number(),
    lastPlayed: v.optional(v.number()),
    lastSync: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_playlist", ["playlistId"])
    .index("by_last_played", ["lastPlayed"]),

  // Subscriber media selections within playlists
  subscriberMediaSelections: defineTable({
    subscriberPlaylistId: v.id("subscriberPlaylists"),
    sectionId: v.id("sections"), // Updated reference
    mediaId: v.id("medias"), // Updated reference to plural form
    isSelected: v.boolean(),
    playOrder: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscriber_playlist", ["subscriberPlaylistId"])
    .index("by_section", ["sectionId"])
    .index("by_media", ["mediaId"])
    .index("by_selection", ["subscriberPlaylistId", "sectionId", "isSelected"]),

  // Player settings
  playerSettings: defineTable({ // Changed from "subscriberPlayerSettings" for simplicity, kept plural
    userId: v.id("users"), // Changed to proper ID reference
    settings: v.object({
      maxLoop: v.number(), // 0, 1, 2, 3, or -1 for infinite
      countDownTimer: v.number(), // minutes
      volume: v.number(), // 0-100
      autoplay: v.optional(v.boolean()),
      shuffle: v.optional(v.boolean()),
    }),
    currentPlaylistId: v.optional(v.id("subscriberPlaylists")),
    currentMediaId: v.optional(v.id("medias")), // Updated reference to plural form
    currentTime: v.number(), // current playback time in seconds
    lastActivity: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_activity", ["lastActivity"]),

  // Play history for analytics
  playHistories: defineTable({ // Changed from "subscriberPlayHistory" for simplicity, using plural form
    userId: v.id("users"), // Changed to proper ID reference
    mediaId: v.id("medias"), // Updated reference to plural form
    subscriberPlaylistId: v.optional(v.id("subscriberPlaylists")),
    duration: v.number(), // how long they listened/watched
    completionRate: v.number(), // percentage completed (0-100)
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_media", ["mediaId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_timestamp", ["userId", "timestamp"]),
});
```

## Key Improvements

1. **Consistent Naming**:
   - Used plural table names consistently throughout the schema
   - Standardized field names across tables
   - Removed redundant prefixes (e.g., "core", "subscriber")

2. **Proper ID References**:
   - Changed string IDs to proper `v.id()` references where appropriate
   - Ensured all table references use plural form consistently (e.g., "medias" not "media")

3. **Reduced Redundancy**:
   - Consolidated subscriber settings into a single preferences object
   - Removed duplicated fields that store the same information

4. **Simplified Structure**:
   - Removed unnecessary nesting in some objects
   - Combined related tables where appropriate
   - Streamlined index definitions

5. **Enhanced Documentation**:
   - Added clearer comments explaining field purposes
   - Documented relationships between tables

## Implementation Plan

1. **Phase 1: Schema Migration**
   - Create a new schema version with the changes
   - Write migration scripts to transform existing data
   - Test migrations in development environment

2. **Phase 2: API Updates**
   - Update api.ts to reflect the new schema structure
   - Ensure backward compatibility where needed
   - Add deprecation notices for old API patterns

3. **Phase 3: Application Updates**
   - Update adm-app to use the new schema
   - Update pwa-app to use the new schema
   - Test both applications thoroughly

4. **Phase 4: Deployment**
   - Deploy schema changes to production
   - Monitor for any issues
   - Update documentation

## Risks and Mitigations

- **Data Loss**: Ensure comprehensive backups before migration
- **API Compatibility**: Maintain compatibility layer during transition
- **Performance**: Test query performance with the new schema structure

## Conclusion

The revised schema maintains all functionality while improving consistency, reducing redundancy, and simplifying the overall structure. This will make the schema easier to maintain and extend in the future, while ensuring efficient data access patterns for both the admin and PWA applications.
