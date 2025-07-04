---
Author: Trae  
Modified Last: 01/02/25 10:30 AM  
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
## Final Compact Allowed Lexicon

### ✅ APPROVED TERMS - Use These Exclusively

**Core Content (Admin Context):**
- `corePlaylist` / `CorePlaylist` / `core-playlist`
- `coreSection` / `CoreSection` / `core-section`
- `coreMedia` / `CoreMedia` / `core-media`
- `coreCategory` / `CoreCategory` / `core-category`
- `coreTags` / `CoreTags` / `core-tags`

**User Content (PWA Context):**
- `userPlaylist` / `UserPlaylist` / `user-playlist`
- `userMedia` / `UserMedia` / `user-media`
- `userSelection` / `UserSelection` / `user-selection`
- `userSettings` / `UserSettings` / `user-settings`
- `userProfile` / `UserProfile` / `user-profile`

**Function Prefixes:**
- Admin functions: `createCore*`, `updateCore*`, `deleteCore*`, `listCore*`, `getCore*`
- User functions: `createUser*`, `updateUser*`, `deleteUser*`, `listUser*`, `getUser*`
- Analytics: `track*`, `record*`, `log*`
- Auth: `require*Access`, `verify*`, `authenticate*`

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

### 🔄 Context Transition Rules

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

