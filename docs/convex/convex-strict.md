---
Author: Trae  
Modified Last: 01/04/25 02:50 PM  
tags:
- project/realigna
- convex
- rules
---

# Convex Strict Naming Conventions

## Overview
```
📂 convex
<!-- └── 📂 _generated/ // **NO EDITING** in _generated/**
│     ├── 📄 api.d.ts
│     ├── 📄 api.js
│     ├── 📄 dataModel.d.ts
│     ├── 📄 server.d.ts
│     └── 📄 server.js -->
│
└── 📂 internal/ // Doe not get pulled in api.ts / pwa 
│     └── 📄 webhooks.ts // Internal webhook handlers for system events
│
├── 📄 admin.ts // Admin-only functions for content management and user administration
├── 📄 analytics.ts // Analytics tracking and metrics collection functions
├── 📄 auth.config.ts // Authentication configuration and settings
├── 📄 auth.ts // Core authentication functions and user session management
├── 📄 clerkSync.ts // Clerk user data synchronization and profile management
├── 📄 convex.config.ts // Convex deployment and environment configuration
├── 📄 http.ts // HTTP endpoints and external API integrations
├── 📄 r2Upload.ts // R2 storage upload functions and file management
├── 📄 router.ts // API route definitions and endpoint routing
├── 📄 schema.ts // Database schema definitions and table structures
├── 📄 subscribers.ts // Subscriber-facing functions and user content access
├── 📄 tsconfig.json // TypeScript configuration for Convex functions
└── 📄 webhooks.ts // External webhook handlers and third-party integrations

```

## Database Schema Tables

### Authentication & Login (ADM App Entry)
- `users` - Core user authentication with token identifiers
- `userTokens` - User authentication tokens
- `sessions` - User session management with expiration tracking

### Organization & Members (Clerk Auth in ADM & PWA apps)
- `organizations` Realigna
  - `members` = `users` that bellong to organization
  - `organizationRoles` - organization-based role assignments and permissions
  - `admins` - all access
  - `managers` options

### Users has() subscribtions
- `subscriptions` - Clerk subscription management services (Clerk Subscription Id)
  - `subscribers` = `user` has(...) (subsciption(planId)) (Clerk UserId Token)

----
CORE CONTENT MANAGEMENT
----

### Core Categories (ADM App)
- `coreCategories` - Content categorization system for playlists

### Core Tags (ADM App)
- `coreCategories` - Content categorization system for playlists

### Core Media Upload (ADM App)
- `coreMedias` - Core media files with R2 storage integration and metadata
  - `mediaTags` - Tagging system for media organization
  - `uploadSessions` - File upload tracking and processing status

### Core Playlist Creation (ADM App)
- `corePlaylists` - Admin-managed playlist templates

### Core Section Management (ADM App)
- `coreSections` - Sections within core playlists
  - `sectionMedias` - Section Medias items within playlist sections links to coreMedia metadata

### Subscriber Management (Bridge - ADM manages, PWA consumes)
- `subscriptionUsage` - Usage tracking for billing and limits
- `notifications` - User notification system with expiration

### User Experience & Customization (PWA App)
- `userPlaylists` - User's customized playlists based on core templates
- `userMediaSelections` - User media selections and playback progress
- `userPlayerSettings` - Individual player preferences and session state

### Analytics & Tracking (Both Apps)
- `analyticsEvents` - User activity and engagement tracking
- `installAnalytics` - PWA installation tracking and A/B testing
- `userAnalytics` - General user behavior analytics
## Final Compact Allowed Lexicon

### ✅ APPROVED TERMS - Use These Exclusively

**Core Content (Admin Context):**
- `corePlaylist` / `CorePlaylist` / `core-playlist` / `by_core_playlist`
- `coreSection` / `CoreSection` / `core-section` / `by_core_section`
- `coreMedia` / `CoreMedia` / `core-media` / `by_core_media`
- `coreCategory` / `CoreCategory` / `core-category` / `by_core_category`
- `coreTags` / `CoreTags` / `core-tags` / `core-tags` / `by_core_tags`

**User Content (PWA Context):**
- `userPlaylist` / `UserPlaylist` / `user-playlist` / `by_user_playlist`
- `userSection` / `UserSection` / `user-section` / `by_user_section`
- `userMedia` / `UserMedia` / `user-media` / `by_user_media`
- `userSelection` / `UserSelection` / `user-selection` / `by_user_selection`
- `userSettings` / `UserSettings` / `user-settings` / `by_user_settings`
- `userProfile` / `UserProfile` / `user-profile` / `by_user_profile`
- `userPlayback` / `UserPlayback` / `user-playback` / `by_user_playback`
- `userSession` / `UserSession` / `user-session` / `by_user_session`
- `userProgress` / `UserProgress` / `user-progress` / `by_user_progress`

**Function Prefixes:**
- Admin functions: `createCore*`, `updateCore*`, `deleteCore*`, `listCore*`, `getCore*`
- User functions: `createUser*`, `updateUser*`, `deleteUser*`, `listUser*`, `getUser*`
- Player functions: `playUser*`, `pauseUser*`, `seekUser*`, `updateUserPlayback*`
- Progress functions: `trackUser*`, `recordUser*`, `saveUser*`
- Session functions: `startUser*`, `endUser*`, `resumeUser*`
- Analytics: `track*`, `record*`, `log*`
- Auth: `require*Access`, `verify*`, `authenticate*`
- Clerk Sync: `syncClerk*`, `updateClerk*`, `validateClerk*`

**Table References:**
- Always use full table names: `corePlaylists`, `userPlaylists`, `sectionMedias`
- Never abbreviate: ~~`playlists`~~, ~~`sections`~~, ~~`medias`~~

**Status Values:**
- `draft`, `published`, `archived`
- `active`, `inactive`, `suspended`
- `pending`, `processing`, `completed`, `failed`

### ❌ FORBIDDEN TERMS - Never Use

**Generic Terms:**
- ~~`playlist`~~ (ambiguous - use `corePlaylist` or `userPlaylist`)
- ~~`media`~~ (ambiguous - use `coreMedia` or `userMedia`)
- ~~`section`~~ (ambiguous - use `coreSection`)
- ~~`category`~~ (ambiguous - use `coreCategory`)

**Incorrect Function Names:**
- ~~`getPlaylists`~~ → `getCorePlaylists` or `getUserPlaylists`
- ~~`createPlaylist`~~ → `createCorePlaylist` or `createUserPlaylist`
- ~~`addMedia`~~ → `addCoreMedia` or `addUserMedia`
- ~~`listSections`~~ → `listCoreSections`

**Wrong Table References:**
- ~~`playlists`~~ → `corePlaylists` or `userPlaylists`
- ~~`medias`~~ → Use specific context
- ~~`sections`~~ → `coreSections`

### 🎯 Essential PWA MediaPlayer & Playlist Functions

**Core Player Functions (subscribers.ts):**
```typescript
// User playlist consumption
getUserPlaylistById(userPlaylistId) // Get user's customized playlist
getUserPlaylistSections(userPlaylistId) // Get sections with user selections
getUserMediaSelections(userPlaylistId) // Get selected media for playlist
getUserPlaylistMetadata(userPlaylistId) // Duration, play count, completion

// Playback control
updateUserPlaybackProgress(userMediaId, position, duration) // Track position
getUserPlayerSettings(userId) // Volume, speed, auto-play settings
updateUserPlayerSettings(userId, settings) // Save player preferences
getUserCurrentSession(userId) // Active playlist and position

// Section management
getUserSectionSelections(coreSectionId, userPlaylistId) // Media in section
updateUserMediaSelection(userPlaylistId, coreSectionId, coreMediaId, isSelected)
getUserSectionProgress(userPlaylistId, coreSectionId) // Section completion

// Queue management
getUserPlaybackQueue(userPlaylistId) // Next/previous track order
getUserCurrentTrack(userId) // Currently playing media
updateUserCurrentTrack(userId, userMediaId) // Set active track
```

**Critical Convex/Clerk Integration Rules:**

**Authentication Patterns:**
```typescript
// ✅ CORRECT: Always verify Clerk auth first
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthenticated");

// ✅ CORRECT: Get user from Convex users table
const user = await getUserByClerkId(ctx, identity.subject);
if (!user) throw new Error("User not found");

// ❌ WRONG: Never use Clerk ID directly as Convex ID
const playlist = await ctx.db.get(args.userPlaylistId); // Must use Convex ID
```

**Subscription Validation:**
```typescript
// ✅ CORRECT: Check subscription before access
const hasSubscription = await validateUserSubscription(ctx, user.id);
if (!hasSubscription) throw new Error("Subscription required");

// ✅ CORRECT: Feature gating by subscription
const settings = await getUserPlayerSettings(ctx, user.id);
if (settings.maxLoop > 3 && !user.subscriptionPlan.includes("premium")) {
  throw new Error("Premium feature");
}
```

**Data Access Patterns:**
```typescript
// ✅ CORRECT: Always filter by authenticated user
const userPlaylists = await ctx.db
  .query("userPlaylists")
  .withIndex("by_user", q => q.eq("userId", user.id))
  .filter(q => q.eq(q.field("isActive"), true))
  .collect();

// ❌ WRONG: Never allow cross-user access
const playlist = await ctx.db.get(args.userPlaylistId); // No ownership check
```

**Admin → User Flow:**
```typescript
// ✅ CORRECT: Always specify context
corePlaylist → (user customizes) → userPlaylist
coreMedia → (user selects) → userMediaSelection

// ❌ WRONG: Never use generic terms
playlist → (user customizes) → playlist
```

**Function Naming Pattern:**
```typescript
// ✅ CORRECT
export const createCorePlaylist = mutation({ ... });
export const getUserPlaylists = query({ ... });
export const updateCoreMedia = mutation({ ... });

// ❌ WRONG
export const createPlaylist = mutation({ ... });
export const getPlaylists = query({ ... });
export const updateMedia = mutation({ ... });
```

### 📋 Compliance Checklist

**Before any commit, verify:**
- [ ] No generic `playlist` references
- [ ] All functions have `core*` or `user*` prefixes
- [ ] Table references use full names
- [ ] UI text specifies "Core Playlist" or "User Playlist"
- [ ] Variable names include context (`corePlaylistId`, `userPlaylistData`)
- [ ] Comments and documentation use approved terms

**Critical Files to Audit:**
- `admin.ts` - All functions must have `core*` prefix
- `subscribers.ts` - All functions must have `user*` prefix  
- `schema.ts` - Table names must be explicit
- React components - Props and state must specify context

### 🎯 Enforcement Priority

**P0 (Critical):** Function names in `admin.ts` and `subscribers.ts`
**P1 (High):** Table references in all Convex files
**P2 (Medium):** React component props and state
**P3 (Low):** Comments and documentation

---

**Last Updated:** 01/02/25 10:45 AM  
**Compliance Score Target:** 100%  
**Current Status:** All critical flags resolved ✅


### 🔒 Security & Access Control Rules

**User Data Isolation:**
```typescript
// ✅ ALWAYS: Verify user owns resource
const userPlaylist = await ctx.db.get(args.userPlaylistId);
if (userPlaylist.userId !== user.id) throw new Error("Access denied");

// ✅ ALWAYS: Filter by user in queries  
.withIndex("by_user", q => q.eq("userId", user.id))

// ❌ NEVER: Return data without user verification
return await ctx.db.get(args.userPlaylistId); // No ownership check
```

**Subscription Enforcement:**
```typescript
// ✅ ALWAYS: Check limits based on subscription
const playlistCount = await getUserPlaylistCount(ctx, user.id);
const maxPlaylists = getSubscriptionLimit(user.subscriptionPlan, "playlists");
if (playlistCount >= maxPlaylists) throw new Error("Playlist limit reached");

// ✅ ALWAYS: Validate premium features
if (args.advancedFeature && !isPremiumUser(user)) {
  throw new Error("Premium subscription required");
}
```

**Error Handling Patterns:**
```typescript
// ✅ CORRECT: Specific error messages for debugging
try {
  const userPlaylist = await ctx.db.get(args.userPlaylistId);
  if (!userPlaylist) throw new Error(`UserPlaylist ${args.userPlaylistId} not found`);
  if (userPlaylist.userId !== user.id) throw new Error("Access denied: Not playlist owner");
} catch (error) {
  console.error("getUserPlaylistById error:", error);
  throw error;
}

// ✅ CORRECT: Validate required fields
if (!args.userPlaylistId) throw new Error("userPlaylistId required");
if (typeof args.position !== "number") throw new Error("position must be number");
```

**Performance Best Practices:**
```typescript
// ✅ CORRECT: Use indexes for queries
.withIndex("by_user_playlist", q => q.eq("userPlaylistId", args.userPlaylistId))

// ✅ CORRECT: Limit results for large datasets
.order("desc").take(50)

// ✅ CORRECT: Batch operations when possible
const updates = userMediaSelections.map(selection => 
  ctx.db.patch(selection._id, { lastPosition: args.position })
);
await Promise.all(updates);
```

### 📱 PWA-Specific Compliance

**MediaPlayer Component Requirements:**
- Must use `getUserPlayerSettings` for all player state
- Progress tracking via `updateUserPlaybackProgress` only
- Authentication via `requireUserAccess` before any playback
- All media references must be `userMediaSelections`, never `coreMedia`

**Playlist Component Requirements:**
- Use `getUserPlaylistSections` for section data
- User selections via `getUserMediaSelections` only  
- Progress via `getUserSectionProgress` and `getUserPlaylistMetadata`
- No direct access to `corePlaylists` - always through user context

**Critical Files to Audit:**
- `MediaPlayerPwa.tsx` - All props must specify user context
- `PlaylistFeedPwa.tsx` - No generic playlist references
- `MediaProcessor.tsx` - Must validate user ownership
- `api.ts` - All exported functions must have proper prefixes

---

**Last Updated:** 01/04/25 04:20 PM  
**Compliance Score Target:** 100%  
**Current Status:** Enhanced with PWA MediaPlayer requirements ✅
