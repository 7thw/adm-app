---
title: Realigna PRD - Enhanced with Convex Architecture
created: 2025-06-03
updated: 2025-06-29
client: Realigna
tags:
  - PRD
  - realigna
  - dual-apps
  - clerk
  - convex
  - architecture
description: "Enhanced PRD for Realigna dual-app system with comprehensive Convex architecture guidelines and best practices"
project-type: dual-apps
tech-stack: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shadcn UI, Convex, Clerk, Stripe
modified-last: 2025-06-29
modified-by:
  - Assistant
---

# Realigna Product Requirements Document
## Enhanced with Convex Architecture & Guidelines

Realigna is a subscription-based meditation platform consisting of two interconnected Next.js applications sharing one Convex database. The Admin App manages content and users, while the PWA App provides the subscriber experience.

## 🏗️ Architecture Overview

### Single Convex Backend Architecture

Realigna implements a **single Convex backend architecture** where the core database and server functions reside exclusively within the **Admin App (adm-app)** repository:

```
realigna-apps/
├── adm-app/           # Admin App with Core Convex Backend
│   ├── convex/        # Complete Convex backend
│   │   ├── schema.ts  # Single source of truth for data structures
│   │   ├── admin.ts   # Admin-only functions
│   │   ├── subscribers.ts # Subscriber functions
│   │   └── _generated/ # Auto-generated types and API
│   ├── app/           # Admin interface (Next.js App Router)
│   └── api.ts         # Generated API specification
└── pwa-app/           # PWA App
    ├── app/           # Subscriber interface (Next.js App Router)
    └── api.ts         # Copied from adm-app
```

### Detailed Directory Structure

#### Convex Backend Structure
```
└── 📂 convex/
│  └── 📂 _generated/              # Auto-generated files - DO NOT EDIT MANUALLY!
│    ├── 📄 api.d.ts              # TypeScript API definitions - auto-generated
│    ├── 📄 api.js               # JavaScript API exports - auto-generated
│    ├── 📄 dataModel.d.ts       # Database schema types - auto-generated
│    ├── 📄 server.d.ts          # Server function types - auto-generated
│    ├── 📄 server.js            # Server runtime - auto-generated
│  ├── 📄 admin.ts               # Admin-only functions (CRUD operations, content management)
│  ├── 📄 auth.config.ts         # Clerk authentication configuration
│  ├── 📄 auth.ts               # Authentication setup and user management
│  ├── 📄 convex.config.ts       # Convex deployment configuration
│  ├── 📄 http.ts               # HTTP routes router (webhooks, auth endpoints)
│  └── 📂 internal/              # Internal utility functions (not exposed to frontend)
│    ├── 📄 auth.ts             # Internal auth helpers and validation
│    ├── 📄 webhooks.ts         # Webhook handlers (Clerk, Stripe)
│  ├── 📄 r2Upload.ts           # CloudFlare R2 file upload integration
│  ├── 📄 router.ts             # HTTP router setup (auth routes, webhooks)
│  ├── 📄 schema.ts             # **SOURCE OF TRUTH** - Database schema definition
│  ├── 📄 subscribers.ts        # Subscriber-only functions (published content access)
│  ├── 📄 tsconfig.json         # TypeScript configuration for Convex
│  ├── 📄 webhooks.ts           # Webhook endpoint handlers

# Generated API specifications (from: `npx convex-helpers ts-api-spec`)
# Copy latest version to --> api.ts (PWA)
├── 📄 convexApi1750463945719.ts # Generated API spec v1
├── 📄 convexApi1751043809257.ts # Generated API spec v2
├── 📄 convexApi1751045568096.ts # Generated API spec v3 (latest)
```

#### Frontend App Structure (Convex Integration Points)
```
└── 📂 app/                      # Next.js App Router - Admin Interface
│  └── 📂 (pages)/              # Route groups
│    └── 📂 (auth)/             # Authentication routes (Clerk integration)
│      └── 📂 sign-in/          # Sign-in page
│        └── 📂 [[...sign-in]]/ # Clerk catch-all route
│          ├── 📄 page.tsx     # Uses Clerk components + Convex auth
│      └── 📂 sign-up/          # Sign-up page
│        └── 📂 [[...sign-up]]/ # Clerk catch-all route
│          ├── 📄 page.tsx     # Uses Clerk components + Convex auth
│      └── 📂 user-profile/     # User profile management
│        └── 📂 [[...user-profile]]/
│          ├── 📄 page.tsx     # Uses useQuery(api.admin.getUserProfile)
│    └── 📂 dashboard/          # Main admin dashboard
│      └── 📂 _components/      # Dashboard components with Convex integration
│        ├── 📄 app-sidebar.tsx        # Uses useQuery for navigation data
│        ├── 📄 chart-area-interactive.tsx # Uses useQuery for analytics
│        ├── 📄 data-table.tsx         # Generic table with Convex data
│        ├── 📄 nav-user.tsx           # Uses useQuery(api.admin.getCurrentUser)
│        ├── 📄 section-cards.tsx     # Uses useQuery for section data
│      └── 📂 core-playlists/   # Core playlist management
│        └── 📂 [id]/           # Dynamic playlist routes
│          └── 📂 _components/  # Playlist-specific components
│            ├── 📄 add-section-form.tsx    # Uses useMutation(api.admin.createSection)
│            ├── 📄 data-table.tsx          # Uses useQuery(api.admin.getPlaylistSections)
│            ├── 📄 section-media-table.tsx # Uses useQuery + useMutation for media
│          └── 📂 edit/         # Playlist editing
│            ├── 📄 page.tsx   # Uses useQuery + useMutation for playlist CRUD
│          ├── 📄 page.tsx     # Playlist detail view with useQuery
│        └── 📂 _components/    # Playlist list components
│          ├── 📄 data-table.tsx      # Uses useQuery(api.admin.listPlaylists)
│          ├── 📄 playlist-form.tsx   # Uses useMutation(api.admin.createPlaylist)
│        └── 📂 new/           # New playlist creation
│          ├── 📄 page.tsx     # Uses useMutation(api.admin.createPlaylist)
│        ├── 📄 page.tsx       # Playlist list page with useQuery
│      ├── 📄 layout.tsx       # Dashboard layout with auth checks
│      └── 📂 medias/          # Media management
│        └── 📂 _components/   # Media components with Convex integration
│          ├── 📄 FormMedia.tsx       # Uses useMutation(api.admin.createMedia)
│          ├── 📄 data-table.tsx      # Uses useQuery(api.admin.listMedias)
│          ├── 📄 section-cards.tsx   # Uses useQuery for media sections
│        ├── 📄 page.tsx       # Media list with useQuery + useMutation
│      ├── 📄 page.tsx         # Dashboard home with useQuery for stats
│      └── 📂 plans/           # Subscription plans management
│        ├── 📄 page.tsx       # Uses useQuery(api.admin.listPlans)
│      └── 📂 subscribers/     # Subscriber management
│        ├── 📄 page.tsx       # Uses useQuery(api.admin.listSubscribers)
│  └── 📂 [transport]/         # Dynamic transport routes
│    ├── 📄 route.ts          # API route handlers (may use Convex)
│  └── 📂 access-denied/       # Access denied page
│    ├── 📄 page.tsx          # Static page (no Convex integration)
```

### Core Design Principles

1. **Schema as Single Source of Truth**: All data structures defined in `convex/schema.ts`
2. **Two-repos, One Convex APPS System**: adm-app(convex/ db & server) / pwa-app(api.ts from adm-app)
3. **Type Safety Throughout**: Generated types from `@/convex/_generated/dataModel`
4. **Role-Based Access Control**: Separate admin and subscriber functions with proper Clerk/Convex authentication
5. **Real-time Sync**: Live updates between admin changes and subscriber views
6. **API Consistency**: Semantic function naming (get*, list*, create*, update*, delete*)

## 📊 Database Schema Architecture

### Schema Design Guidelines

Following Convex best practices, our schema implements:

- **80+ optimized indexes** for performance at scale
- **Proper validation** using Convex validators (`v.string()`, `v.id()`, etc.)
- **Type-safe relationships** between tables
- **Clerk integration** Auth & Subscriptions
- **Convex integration** Data & Server Functions

### Core Schema Modules

#### 🔐 User Management & Authentication
```typescript
// User profiles synced with Clerk
userProfiles: defineTable({
  userId: v.id("users"),           // Links to Convex Auth
  clerkUserId: v.string(),         // Clerk user ID for sync
  role: v.union(v.literal("admin"), v.literal("subscriber")),
  subscriptionStatus: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("canceled"),
    v.literal("past_due")
  ),
  // ... additional fields
})
```

#### 📚 Content Management
```typescript
// Core playlists with proper validation
corePlaylists: defineTable({
  title: v.string(),
  status: v.union(v.literal("draft"), v.literal("published")),
  coreCategoryId: v.id("coreCategories"),
  // ... additional fields
})

// Media files with storage integration
medias: defineTable({
  title: v.string(),
  mediaType: v.union(v.literal("audio"), v.literal("video")),
  storageId: v.optional(v.id("_storage")), // Convex file storage
  youTubeUrl: v.optional(v.string()),      // External embeds
  // ... additional fields
})
```

## 🎯 Admin App Specifications

### Dashboard Features
The Admin App allows administrators to login (Clerk Auth) and manage:
- **AdminUsers and Subscribers** with role-based access control
- **Subscriptions & Plans** (Clerk Subscription/Billing integration)
- **Analytics** (Airbyte integration)

### Convex Function Implementation

#### Query Functions (Read-Only)
```typescript
// Admin queries - following naming conventions
export const listMedias = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Always validate admin access
    const isAdmin = await requireAdmin(ctx);
    if (!isAdmin) throw new Error("Not authorized");

    // Use generated types
    return await ctx.db.query("medias")
      .withIndex("by_created_at")
      .order("desc")
      .take(args.limit ?? 50);
  }
});
```

#### Mutation Functions (Write Operations)
```typescript
// Admin mutations - following naming conventions
export const createCorePlaylist = mutation({
  args: {
    title: v.string(),
    coreCategoryId: v.id("coreCategories"),
    status: v.union(v.literal("draft"), v.literal("published"))
  },
  handler: async (ctx, args) => {
    const isAdmin = await requireAdmin(ctx);
    if (!isAdmin) throw new Error("Not authorized");

    return await ctx.db.insert("corePlaylists", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});
```

### Media Management (`mediasPage`)
Administrators can:
- **Upload** (CloudFlare R2) audio files using Convex `_storage` system
- **Embed** (YouTube URLs) for video content
- **Manage** with proper type safety using `Doc<"medias">` types

### Core Playlists Management (`corePlaylistsPage`)
AdminUsers can manage CorePlaylists following Convex guidelines:
- **CRUD operations** using semantic function names (`createCorePlaylist`, `updateCorePlaylist`, etc.)
- **Status management**: `"draft"` | `"published"` with proper validation
- **Category linking**: Using `v.id("coreCategories")` for type-safe relationships

**Important Business Rule**: CorePlaylists can only be edited while in `"draft"` status.

#### Section Management
Within each CorePlaylist, manage coreSections:
- **Type-safe operations** using generated types
- **Drag & Drop reordering** with optimistic updates
- **Section configuration**:
  - `sectionType`: `"base"` | `"loop"` (validated with `v.union`)
  - `minSelectMedia`/`maxSelectMedia`: `v.number()` validation

## 🎵 PWA App Specifications

### Multi-Repository Integration

The PWA App connects to the Admin App's Convex backend using:

1. **Generated API Specification**:
   ```bash
   # In Admin App
   npx convex-helpers ts-api-spec
   ```

2. **Type-Safe Function Calls**:
   ```typescript
   // In PWA App - using generated api object
   const playlists = useQuery(api.subscribers.listPublishedPlaylists);
   const createSession = useMutation(api.subscribers.createPlaybackSession);
   ```

3. **Role-Based Access**: Subscriber functions only access published content

### Subscriber Experience

#### Playlist Customization
Subscribers can:
1. **Browse** published CorePlaylists using `useQuery` hooks
2. **Customize** sections within admin-defined limits
3. **Save** personalized sessions using `useMutation` hooks
4. **Track** progress with real-time updates

#### Real-Time Features
- **Live updates** when admin publishes new content
- **Optimistic updates** for better UX during customization
- **Offline support** using PWA caching strategies

## 🔧 Technical Implementation Guidelines

### Convex Best Practices

#### 1. Type Safety
```typescript
// Always use generated types
import { Doc, Id } from "@/convex/_generated/dataModel";

// Correct approach
type PlaylistWithSections = Doc<"corePlaylists"> & {
  sections: Doc<"coreSections">[];
};

// Avoid manual type definitions that can drift
```

#### 2. Function Organization
```typescript
// Consistent naming patterns
export const listPublishedPlaylists = query({ /* ... */ });  // Subscriber access
export const listAllPlaylists = query({ /* ... */ });        // Admin access
export const createPlaylist = mutation({ /* ... */ });       // Admin only
export const updatePlaylist = mutation({ /* ... */ });       // Admin only
```

#### 3. Error Handling
```typescript
// Robust error handling with context
try {
  await ctx.db.insert("corePlaylists", playlistData);
} catch (error) {
  console.error("Failed to create playlist:", error);
  throw new Error(`Playlist creation failed: ${error.message}`);
}
```

#### 4. Performance Optimization
- **Pagination**: Always implement for large datasets
- **Indexing**: Use `withIndex` for efficient queries
- **Batching**: Group related operations when possible

### Security Implementation

#### Authentication & Authorization
```typescript
// Standard auth pattern for all functions
const user = await ctx.auth.getUserIdentity();
if (!user) {
  throw new Error("Not authenticated");
}

// Role-based access control
const userProfile = await ctx.db
  .query("userProfiles")
  .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", user.subject))
  .unique();

if (userProfile?.role !== "admin") {
  throw new Error("Admin access required");
}
```

## 🚀 Deployment & Environment Strategy

### Multi-Environment Setup
- **Development**: Local Convex dev deployment
- **Production**: Convex Cloud with proper environment separation
- **API Sharing**: Generated `api.ts` copied between repositories

### File Storage Strategy
- **Audio Files**: Convex `_storage` system with signed URLs
- **Video Content**: External YouTube embeds for efficiency
- **Thumbnails**: Convex storage with optimized delivery
- **Offline Support**: PWA caching for subscriber content

## 📈 Scalability Considerations

### Database Optimization
- **80+ indexes** for query performance
- **Proper pagination** for large datasets
- **Efficient filtering** using indexed fields
- **Real-time subscriptions** with minimal overhead

### Frontend Performance
- **Type-safe API calls** prevent runtime errors
- **Optimistic updates** for better UX
- **Proper caching** strategies for PWA
- **Code splitting** for optimal bundle sizes

## 🔍 Key Architectural Decisions

### Why Single Convex Backend?
- **Consistency**: Single source of truth for all data
- **Security**: Centralized access control and validation
- **Performance**: Optimized queries and real-time updates
- **Maintenance**: Easier schema evolution and deployment
- **Type Safety**: Generated types ensure consistency across apps

### Why Separate Frontend Apps?
- **User Experience**: Tailored interfaces for different roles
- **Security**: Admin functions isolated from subscriber app
- **Scalability**: Independent deployment and optimization
- **Development**: Parallel team development with shared backend

### Convex Integration Benefits
- **Real-time by default**: Automatic updates across all clients
- **Type-safe throughout**: Generated types prevent runtime errors
- **Optimized performance**: Built-in caching and indexing
- **Simplified deployment**: Single backend, multiple frontends
- **Developer experience**: Excellent tooling and debugging

## 📚 Development Workflow

### Schema Evolution
1. Update `convex/schema.ts` (single source of truth)
2. Run `convex dev` to apply changes
3. Update functions using new schema
4. Regenerate API specification for PWA app
5. Test both applications with new schema

### Function Development
1. Define with proper validators and types
2. Implement with error handling and auth checks
3. Test with Convex dashboard
4. Update API specification if needed
5. Deploy to both development and production

### Multi-App Coordination
1. Admin App: Develop and test new features
2. Generate API specification: `npx convex-helpers ts-api-spec`
3. Copy `api.ts` to PWA App repository
4. PWA App: Implement subscriber-facing features
5. Test integration between both apps

---

**Note**: This enhanced PRD incorporates Convex best practices and architectural guidelines to ensure scalable, maintainable, and type-safe development across both applications while maintaining the single backend architecture that provides consistency and real-time capabilities.
