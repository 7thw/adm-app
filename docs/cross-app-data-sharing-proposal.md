# Cross-App Data Sharing & Type Safety Proposal

## Background

The Realigna platform consists of two Next.js applications sharing a single Convex backend:
- **Admin App (adm-app)**: Content management for administrators
- **PWA App (pwa-app)**: User-facing application for subscribers

Currently, we face challenges with:
1. Type sharing between apps (temporary `PlaylistItem` type in data-table.tsx)
2. Efficient data access for the PWA app, especially for complex playlist structures
3. Supporting offline capabilities in the PWA

## Proposed Solutions

### Solution 1: Flattened JSON/JSONL at Publish Time

**How it works:**
- When a corePlaylist status changes to "published", a Convex mutation:
  1. Creates a flattened representation including all sections and media
  2. Stores it as .jsonl in Convex storage or a CDN
  3. PWA app can fetch this single file instead of multiple DB queries

**Benefits:**
- Extremely fast for PWA consumption
- Reduced database load
- Works well with offline capabilities
- Perfect for workers and static assets

**Enhanced for Subscribers:**
- When a subscriber customizes a corePlaylist (toggling selectMedia settings):
  1. Generate a subscriber-specific version of the flattened file
  2. Store in browser cache and/or IndexedDB via PWA workers
  3. Enables offline playback from cache when available
  4. Sync customizations back to server when online

**Implementation Example:**
```typescript
// In corePlaylists.ts
export const publishPlaylist = mutation({
  args: { playlistId: v.id("corePlaylists") },
  handler: async (ctx, args) => {
    // 1. Mark as published in DB
    await ctx.db.patch(args.playlistId, { status: "published", publishedAt: Date.now() });
    
    // 2. Generate flattened representation
    const flattenedData = await generateFlattenedPlaylist(ctx, args.playlistId);
    
    // 3. Store as JSONL in storage
    const storageId = await ctx.storage.store(
      JSON.stringify(flattenedData),
      { contentType: "application/json" }
    );
    
    // 4. Update playlist with storageId reference
    await ctx.db.patch(args.playlistId, { flattenedDataStorageId: storageId });
    
    return { success: true, storageId };
  }
});

// For subscriber customizations
export const createCustomPlaylist = mutation({
  args: { 
    corePlaylistId: v.id("corePlaylists"),
    selectedMediaIds: v.array(v.id("medias"))
  },
  handler: async (ctx, args) => {
    // Generate user-specific flattened playlist with selections
    const flattenedData = await generateCustomFlattenedPlaylist(ctx, args);
    
    // Store both in DB and return for caching
    const userPlaylistId = await ctx.db.insert("userPlaylists", {...});
    
    return { userPlaylistId, flattenedData }; // Client can cache flattenedData
  }
});
```

### Solution 2: Shared Types Package

**How it works:**
- Create a separate npm package `@realigna/types`
- Define all shared types once
- Import in both admin and PWA apps

**Benefits:**
- Single source of truth for types
- Type safety across all apps
- Easier IDE autocompletion

**Implementation:**
```
realigna-apps/
├── adm-app/
├── pwa-app/
└── packages/
    └── types/
        ├── package.json
        ├── src/
        │   ├── index.ts        # Exports all types
        │   ├── playlists.ts    # Playlist-related types
        │   ├── media.ts        # Media-related types
        │   └── users.ts        # User-related types
        └── tsconfig.json
```

### Solution 3: Combined API + Types Generator

**How it works:**
- Extend the `convex-helpers ts-api-spec` to also generate types
- Create a script that:
  1. Generates the API spec
  2. Extracts Convex types from schema.ts
  3. Creates a combined package for the PWA app

**Benefits:**
- Automated type generation
- No manual type maintenance
- Types stay in sync with schema changes

**Implementation:**
```bash
# Create a script
#!/bin/bash
cd adm-app
npx convex-helpers ts-api-spec --output ./generated/api.ts
node scripts/extract-types.js
cp ./generated/api.ts ../pwa-app/convex/
cp ./generated/types.ts ../pwa-app/convex/
```

### Solution 4: Convex Serverless API for UI Data

**How it works:**
- Create specialized Convex queries that return exactly the flattened data needed
- Frontend components use these queries directly
- Add caching for performance

**Benefits:**
- Real-time updates
- No separate build/generation step
- Leverages Convex's existing query system

**Implementation:**
```typescript
// In corePlaylists.ts
export const getUIPlaylistData = query({
  args: { playlistId: v.id("corePlaylists") },
  handler: async (ctx, args) => {
    // Get playlist data
    const playlist = await ctx.db.get(args.playlistId);
    
    // Get all sections
    const sections = await ctx.db
      .query("coreSections")
      .withIndex("by_playlist", q => q.eq("playlistId", args.playlistId))
      .collect();
    
    // Create UI-ready flattened data
    return {
      _id: playlist._id,
      title: playlist.title,
      description: playlist.description,
      // Include other needed fields
      sections: sections.map(section => ({
        _id: section._id,
        title: section.title,
        // More section fields
      }))
    };
  }
});
```

## Recommended Approach: Hybrid Solution

We recommend a hybrid approach that combines multiple solutions:

1. **For development and admin app**: 
   - Use Solution 2 (Shared Types Package) for consistent development experience
   - Provides strong type checking during development

2. **For production/PWA**: 
   - Implement Solution 1 (Flattened JSON at publish time) for core playlists
   - Generate subscriber-specific flattened JSONs when customizations happen
   - Cache these in PWA for offline playback
   - Keep MediaPlayer component simple by giving it pre-processed data

3. **For dynamic updates and sync**: 
   - Use Solution 4 (Convex serverless API) for real-time updates
   - Sync offline changes back to server when connection is restored

## Implementation Plan

1. **Short-term (manual adjustment)**:
   - Continue using temporary types in PWA
   - Manually adjust types as needed during testing
   - Document type inconsistencies for future resolution

2. **Mid-term (testing phase)**:
   - Implement prototype of flattened JSONL for playlist data
   - Test offline capabilities with cached flattened data
   - Evaluate performance improvements

3. **Long-term (production)**:
   - Choose final hybrid approach based on testing results
   - Implement shared types package if needed
   - Optimize for PWA offline capabilities and performance

## Specific PWA Worker Cache Integration

For PWA offline support, we can leverage:

1. **Cache Storage API**:
   - Cache flattened playlist JSONL files
   - Cache associated media files for offline playback
   - Set cache expiration policies

2. **IndexedDB**:
   - Store user customizations and playback state
   - Track which playlists are available offline
   - Sync changes when connection is restored

3. **Background Sync API**:
   - Queue changes made while offline
   - Automatically sync when connection is available
   - Provide feedback on sync status

This approach will provide a robust offline experience while ensuring type safety across both apps.
