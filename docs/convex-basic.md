# Realigna Convex Database Tables Reference

> **STRICT NAMING CONVENTION:** Never use generic "playlist" - always specify "corePlaylist" (admin context) or "userPlaylist" (PWA context)

## 🔐 Authentication Tables
```

```
### `users`
- **Purpose:** Core user authentication for ALL user types
- **Key Fields:** `tokenIdentifier` (Clerk auth token)
- **Indexes:** `by_token`
- **🔗 Relationship:** Links to `userProfiles` where `role` field distinguishes `admin` vs `subscriber`

### `sessions`
- **Purpose:** User session management
- **Key Fields:** `userId`, `sessionKey`, `expires`
- **Indexes:** `by_userId`

---

## 👥 User Management Tables

### `organizationRoles` // CLERK ORGANIZATIONS FEATURE (Optional)
- **Purpose:** Clerk's built-in organization/team management (like company departments)
- **Key Fields:** `userId`, `organizationId`, `role`, `permissions`, `isActive`
- **Roles:** `admin` (org manager), `member` (org employee)
- **Use Case:** If you want team-based admin access (e.g., "Marketing Team Admin" vs "Content Team Member")
- **Indexes:** `by_user`, `by_organization`, `by_user_organization`, `by_role`
- **⚠️ NOTE:** This is separate from your main app roles below!

### `userProfiles` // YOUR MAIN APP ROLES (Primary)
- **Purpose:** Your actual app user types and business logic
- **Key Fields:** `userId`, `clerkUserId`, `email`, `role`, `subscriptionStatus`
- **Roles:** `admin` (manages content), `subscriber` (pays for access)
- **Subscription Status:** `active`, `inactive`, `canceled`, `past_due`
- **Use Case:** This determines who can access admin-app vs PWA-app
- **Indexes:** `by_user`, `by_clerk_user_id`, `by_email`, `by_role`, `by_subscription_status`, `by_active_subscribers`
- **🎯 PRIMARY ROLE SYSTEM:** This is what your app actually uses for permissions!

---

## 🎵 Core Content Management (Admin App)

### `coreCategories`
- **Purpose:** Content categorization for Core Playlists
- **Key Fields:** `name`, `description`, `slug`, `isActive`, `order`, `color`, `iconUrl`
- **Indexes:** `by_active`, `by_order`, `by_slug`, `by_active_order`

### `medias`
- **Purpose:** Audio/video media files and embeds
- **Key Fields:** `title`, `mediaType`, `storageId`, `embedUrl`, `duration`, `processingStatus`
- **Media Types:** `audio`, `video`
- **Processing Status:** `pending`, `processing`, `completed`, `failed`
- **Indexes:** `by_type`, `by_status`, `by_uploader`, `by_public`, `by_type_public`

### `mediaTags`
- **Purpose:** Media organization and tagging
- **Key Fields:** `mediaId`, `tag`, `createdAt`
- **Indexes:** `by_media`, `by_tag`, `by_media_tag`

### `corePlaylists` ⭐
- **Purpose:** Admin-managed playlist templates (NEVER call these just "playlists")
- **Key Fields:** `title`, `description`, `status`, `categoryId`, `playCount`, `createdBy`
- **Status:** `draft`, `published`
- **Indexes:** `by_status`, `by_category`, `by_category_status`, `by_published`, `by_creator`
- **⚠️ NAMING:** Always use "corePlaylist" in code, "Core Playlist" in UI

### `coreSections`
- **Purpose:** Sections within Core Playlists
- **Key Fields:** `playlistId`, `title`, `sectionType`, `minSelectMedia`, `maxSelectMedia`, `order`
- **Section Types:** `base`, `loop`
- **Indexes:** `by_playlist`, `by_playlist_order`, `by_type`

### `sectionMedias`
- **Purpose:** Media items within Core Playlist sections
- **Key Fields:** `sectionId`, `mediaId`, `order`, `isOptional`, `defaultSelected`
- **Indexes:** `by_section`, `by_section_order`, `by_media`

---

## 👤 User Experience (PWA App)

### `userPlaylists` ⭐
- **Purpose:** User's customized playlists (derived from Core Playlists)
- **Key Fields:** `userId`, `corePlaylistId`, `title`, `customizations`, `playCount`
- **Indexes:** `by_user`, `by_user_active`, `by_user_favorites`, `by_core_playlist`, `by_last_played`
- **⚠️ NAMING:** Always use "userPlaylist" in code, "User Playlist" in UI
- **🔄 TRANSITION:** corePlaylist → (user customizes) → userPlaylist

### `userMediaSelections`
- **Purpose:** User's media selections and progress within User Playlists
- **Key Fields:** `userPlaylistId`, `sectionId`, `mediaId`, `isSelected`, `playOrder`
- **Indexes:** `by_user_playlist`, `by_section`, `by_media`, `by_selected`, `by_user_playlist_selected`

### `userPlayerSettings`
- **Purpose:** User's player preferences and current session state
- **Key Fields:** `userId`, `maxLoop`, `volume`, `playbackSpeed`, `currentPlaylistId`
- **Download Quality:** `low`, `medium`, `high`
- **Indexes:** `by_user`

---

## 💳 Subscription & Billing

### `subscriptionUsage`
- **Purpose:** Track user subscription usage metrics
- **Key Fields:** `userId`, `period`, `playlistsCreated`, `mediaPlayed`, `totalPlayTime`
- **Indexes:** `by_user`, `by_period`, `by_user_period`

### `webhookEvents`
- **Purpose:** Clerk/Stripe webhook event processing
- **Key Fields:** `eventId`, `eventType`, `source`, `processed`
- **Sources:** `clerk`, `stripe`
- **Indexes:** `by_event_id`, `by_type`, `by_source`, `by_processed`, `by_source_processed`

---

## 📊 Analytics & Tracking

### `analyticsEvents`
- **Purpose:** User activity tracking for analytics
- **Key Fields:** `userId`, `eventType`, `playlistId`, `mediaId`, `timestamp`
- **Indexes:** `by_user`, `by_type`, `by_timestamp`, `by_user_timestamp`, `by_session`

### `adminActions`
- **Purpose:** Admin audit trail
- **Key Fields:** `adminUserId`, `action`, `targetType`, `targetId`, `timestamp`
- **Indexes:** `by_admin`, `by_target_type`, `by_action`, `by_timestamp`

---

## 🔔 Notifications

### `notifications`
- **Purpose:** User notifications system
- **Key Fields:** `userId`, `type`, `title`, `message`, `isRead`
- **Types:** `system`, `playlist_update`, `subscription`, `content_available`
- **Indexes:** `by_user`, `by_user_unread`, `by_type`, `by_expiry`

---

## 📁 File Management

### `uploadSessions`
- **Purpose:** Track file upload sessions
- **Key Fields:** `uploadKey`, `fileName`, `fileSize`, `contentType`

---

## 🚨 Critical Naming Rules

### ✅ CORRECT Usage:
- **Admin Context:** `corePlaylist`, `CorePlaylist`, `createCorePlaylist`, `getPublishedCorePlaylists`
- **PWA Context:** `userPlaylist`, `UserPlaylist`, `createUserPlaylist`, `getUserPlaylists`
- **UI Text:** "Core Playlist", "User Playlist" (never generic "Playlist")

### ❌ VIOLATIONS to Fix:
- ~~`getPublishedPlaylists`~~ → `getPublishedCorePlaylists`
- ~~`PlaylistForm`~~ → `CorePlaylistForm` or `UserPlaylistForm`
- ~~`playlist.title`~~ → `corePlaylist.title` or `userPlaylist.title`

### 🔄 The Only Exception:
**Transition Process:** `corePlaylist` → (user customizes) → `userPlaylist`
- Even during this transition, never use generic "playlist"
- Always specify the context at each step
