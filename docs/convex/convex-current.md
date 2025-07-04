# Convex Strict Nomenclature Rules Analysis

## admin.ts (/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app/convex/admin.ts)

### admin
- `const` initializeAdminUser - mutation to create admin user, import { mutation } from "./_generated/server"
- `function` requireAdminAccess - helper function for admin authentication, import { getAuthUserId } from "@convex-dev/auth/server"

### coreCategories
- `const` listCoreCategories - query to fetch core categories, import { query } from "./_generated/server"
- `const` createCoreCategory - mutation to create core category, import { mutation } from "./_generated/server"

### medias
- `const` addMediaTag - mutation to add tag to media, import { mutation } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be addCoreMediaTag to follow strict naming conventions**
  **logic: because it represents a media being used in a corePlaylist/coreSection context**
  **action: rename function from addMediaTag → addCoreMediaTag**

- `const` removeMediaTag - mutation to remove tag from media, import { mutation } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be removeCoreMediaTag to follow strict naming conventions**
  **logic: because it represents a media being used in a corePlaylist/coreSection context**
  **action: rename function from removeMediaTag → removeCoreMediaTag**

- `const` getMediaTags - query to fetch media tags, import { query } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be getCoreMediaTags to follow strict naming conventions**
  **logic: because it represents tags for media in core context**
  **action: rename function from getMediaTags → getCoreMediaTags**

- `const` searchMediaByTags - query to search media by tags, import { query } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be searchCoreMediaByTags to follow strict naming conventions**
  **logic: because it searches core media content**
  **action: rename function from searchMediaByTags → searchCoreMediaByTags**

- `const` listMedias - query to list all media, import { query } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be listCoreMedias to follow strict naming conventions**
  **logic: because it lists core media content**
  **action: rename function from listMedias → listCoreMedias**

- `const` createMedia - mutation to create media, import { mutation } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be createCoreMedia to follow strict naming conventions**
  **logic: because it creates core media content**
  **action: rename function from createMedia → createCoreMedia**

- `const` updateMedia - mutation to update media, import { mutation } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be updateCoreMedia to follow strict naming conventions**
  **logic: because it updates core media content**
  **action: rename function from updateMedia → updateCoreMedia**

- `const` deleteMedia - mutation to delete media, import { mutation } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be deleteCoreMedia to follow strict naming conventions**
  **logic: because it deletes core media content**
  **action: rename function from deleteMedia → deleteCoreMedia**

- `const` updateMediaMetadata - mutation to update media metadata, import { mutation } from "./_generated/server"
  **🚨 CRITICAL FLAG: should be updateCoreMediaMetadata to follow strict naming conventions**
  **logic: because it updates core media metadata**
  **action: rename function from updateMediaMetadata → updateCoreMediaMetadata**

### fileUpload
- `const` generateUploadUrl - mutation to generate upload URL, import { mutation } from "./_generated/server"

### corePlaylists
- `const` listCorePlaylists - query to list core playlists, import { query } from "./_generated/server"
- `const` getCorePlaylist - query to get core playlist details, import { query } from "./_generated/server"
- `const` getCorePlaylistStats - query to get core playlist statistics, import { query } from "./_generated/server"

## analytics.ts (/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app/convex/analytics.ts)

### installAnalytics
- `const` trackInstallEvent - mutation to track PWA installation events, import { mutation } from './_generated/server'
  **🚨 CRITICAL FLAG: uses 'analyticsEvents' table instead of 'installAnalytics' table**
  **logic: should use 'installAnalytics' table as defined in schema for install-specific events**
  **action: change table reference from 'analyticsEvents' → 'installAnalytics'**

- `const` getInstallAnalytics - query to get install analytics summary, import { query } from './_generated/server'
- `const` getInstallAnalyticsDetail - query to get detailed install analytics, import { query } from './_generated/server'

### userAnalytics
- `const` trackUserEvent - mutation to track general user events, import { mutation } from './_generated/server'

## auth.ts (/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app/convex/auth.ts)

### authentication
- `const` auth, signIn, signOut, store, isAuthenticated - convex auth configuration, import from "@convex-dev/auth/server"
- `const` loggedInUser - query to get current logged in user, import { query } from "./_generated/server"

## schema.ts (/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app/convex/schema.ts)

### schemaDefinition
- `const` authTables - authentication table definitions, import { defineSchema, defineTable } from "convex/server"
- `const` applicationTables - application table definitions, import { defineSchema, defineTable } from "convex/server"
- `default export` schema - complete schema definition, import { defineSchema } from "convex/server"

### tableNaming
**✅ COMPLIANT: mediaTags table uses 'coreMediaId' field name which follows strict naming**
**logic: correctly implements core prefix for media references**
**status: no action required - follows naming conventions**

**✅ COMPLIANT: sectionMedias table uses 'coreSectionId' and 'coreMediaId' field names**
**logic: correctly implements core prefix for section and media references**
**status: no action required - follows naming conventions**

**🚨 CRITICAL FLAG: userMediaSelections table uses 'sectionId' and 'mediaId' instead of 'coreSectionId' and 'coreMediaId'**
**logic: should use core prefixes to maintain consistency with strict naming conventions**
**action: update schema field names from 'sectionId' → 'coreSectionId' and 'mediaId' → 'coreMediaId'**

## internal/webhooks.ts (/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app/convex/internal/webhooks.ts)

### webhookHandling
- `const` logWebhookEvent - internal mutation to log webhook events, import { internalMutation } from "../_generated/server"
- `const` markEventProcessed - internal mutation to mark events as processed, import { internalMutation } from "../_generated/server"
- `const` logWebhookError - internal mutation to log webhook errors, import { internalMutation } from "../_generated/server"
- `const` handleUserDeletion - internal mutation to handle user deletion, import { internalMutation } from "../_generated/server"
- `const` handleOrganizationMembership - internal mutation to handle organization membership, import { internalMutation } from "../_generated/server"

## Summary of Violations

### 🚨 CRITICAL PRIORITY VIOLATIONS (Must Fix Immediately):
1. **admin.ts**: 9 media-related functions missing "core" prefix
   - Functions: addMediaTag, removeMediaTag, getMediaTags, searchMediaByTags, listMedias, createMedia, updateMedia, deleteMedia, updateMediaMetadata
   - Impact: Breaks strict naming conventions for core content management

2. **analytics.ts**: trackInstallEvent using incorrect table reference
   - Current: uses 'analyticsEvents' table
   - Required: should use 'installAnalytics' table
   - Impact: Data inconsistency and schema violations

3. **schema.ts**: userMediaSelections table field naming inconsistency
   - Current: uses 'sectionId' and 'mediaId'
   - Required: should use 'coreSectionId' and 'coreMediaId'
   - Impact: Breaks referential integrity with core naming conventions

### ✅ COMPLIANT AREAS:
- mediaTags table correctly uses 'coreMediaId'
- sectionMedias table correctly uses 'coreSectionId' and 'coreMediaId'
- All other functions follow proper Convex patterns

### 📋 ACTION PLAN:
1. **Priority 1**: Rename all 9 media functions in admin.ts with "core" prefix
2. **Priority 2**: Fix trackInstallEvent table reference in analytics.ts
3. **Priority 3**: Update userMediaSelections schema field names
4. **Priority 4**: Update frontend calls to match new function names
5. **Priority 5**: Ensure all future functions follow strict naming conventions

### 📊 CONVEX BEST PRACTICES COMPLIANCE:
- ✅ **COMPLIANT**: Proper use of mutation/query/internalMutation types
- ✅ **COMPLIANT**: Correct import statements from Convex
- ✅ **COMPLIANT**: Proper argument validation with v.* validators
- ✅ **COMPLIANT**: Authentication checks in admin functions
- ✅ **COMPLIANT**: Proper database indexing in schema
- 🚨 **VIOLATION**: Inconsistent naming conventions across functions (9 violations in admin.ts)
- 🚨 **VIOLATION**: Table usage inconsistency in analytics functions (1 violation)

### 📈 COMPLIANCE SCORE: 71% (5/7 areas compliant)
**Target**: 100% compliance with all Convex best practices and strict naming conventions
