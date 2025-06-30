# Realigna - Meditation Platform

> **🎉 Status: Core Backend Successfully Deployed!**
> Complete Convex schema with 80+ indexes, admin/subscriber functions, and role-based access control are now live.

A subscription-based meditation platform consisting of two interconnected Next.js applications sharing one Convex database. The Admin App manages content and users, while the PWA App provides the subscriber experience.

## 🏗️ Architecture Overview

### Multi-Repository Setup

Realigna implements a **single Convex backend architecture** where the core database and server functions reside exclusively within the **Admin App (adm-app)** repository:

```
realigna-apps/
├── adm-app/           # Admin App with Core Convex Backend
│   ├── convex/        # Complete Convex backend
│   ├── src/           # Admin interface
│   └── api.ts         # Generated API specification
└── pwa-app/           # PWA App
    ├── src/           # Subscriber interface
    └── api.ts         # Copied from adm-app
```

### Key Benefits
- **Single source of truth** for all data operations
- **Proper access control** between admin and subscriber functions
- **Environment separation** with app-specific credentials
- **Real-time updates** across both applications

## 📊 Database Schema Architecture

### Core Design Principles

1. **Role-Based Access Control**: Separate admin and subscriber functions with proper authentication
2. **Clerk Integration**: Full user management and subscription handling via webhooks
3. **File Storage**: Convex `_storage` system for audio files, external embeds for videos
4. **Real-time Sync**: Live updates between admin changes and subscriber views
5. **Scalable Structure**: Optimized indexes for performance at scale

### Schema Modules

#### 🔐 User Management & Authentication
```typescript
// User profiles synced with Clerk
userProfiles: {
  userId: Id<"users">,           // Links to Convex Auth
  clerkUserId: string,           // Clerk user ID for sync
  role: "admin" | "subscriber",  // Access control
  subscriptionStatus: "active" | "inactive" | "canceled" | "past_due",
  subscriptionExpiresAt: number,
  // ... profile data
}

// Organization-based admin access
organizationRoles: {
  userId: Id<"users">,
  organizationId: string,        // Clerk organization ID
  role: "admin" | "member",
  permissions: string[],
  isActive: boolean,
}
```

#### 🎵 Content Management (Admin Only)
```typescript
// Content categories for organization
coreCategories: {
  name: string,
  slug: string,
  isActive: boolean,
  order: number,
  createdBy: Id<"users">,
}

// Media files (audio uploads + video embeds)
medias: {
  title: string,
  mediaType: "audio" | "video",
  storageId?: Id<"_storage">,    // For uploaded audio
  embedUrl?: string,             // For YouTube videos
  duration: number,
  uploadedBy: Id<"users">,
  isPublic: boolean,
}

// Admin-managed playlist templates
corePlaylists: {
  title: string,
  status: "draft" | "published",
  categoryId: Id<"coreCategories">,
  difficulty?: "beginner" | "intermediate" | "advanced",
  createdBy: Id<"users">,
}

// Sections within playlists
coreSections: {
  playlistId: Id<"corePlaylists">,
  sectionType: "base" | "loop",  // base: plays once, loop: repeats
  minSelectMedia: number,        // Subscriber constraints
  maxSelectMedia: number,
  order: number,
}

// Media linked to sections
sectionMedias: {
  sectionId: Id<"coreSections">,
  mediaId: Id<"medias">,
  order: number,
  defaultSelected: boolean,
}
```

#### 👤 User Experience (PWA App)
```typescript
// User's customized playlists
userPlaylists: {
  userId: Id<"users">,
  corePlaylistId: Id<"corePlaylists">,
  customizations: string,        // JSON of selected media
  playCount: number,
  lastPlayedAt?: number,
  totalTimeSpent?: number,
}

// Individual media selections
userMediaSelections: {
  userPlaylistId: Id<"userPlaylists">,
  sectionId: Id<"coreSections">,
  mediaId: Id<"medias">,
  isSelected: boolean,
  playOrder: number,
  lastPosition?: number,         // Resume playback
}

// Player settings and preferences
userPlayerSettings: {
  userId: Id<"users">,
  maxLoop: number,               // 0=none, -1=infinite
  countDownTimer: number,        // minutes
  volume: number,                // 0-100
  backgroundPlayback: boolean,
  downloadQuality: "low" | "medium" | "high",
}
```

#### 📈 Analytics & Tracking
```typescript
// User behavior tracking
analyticsEvents: {
  userId: Id<"users">,
  eventType: string,             // "playlist_created", "media_played"
  eventData?: string,            // JSON details
  timestamp: number,
}

// Admin audit trail
adminActions: {
  adminUserId: Id<"users">,
  action: string,                // "playlist_published"
  targetType: string,            // "playlist", "user"
  targetId: string,
  timestamp: number,
}
```

#### 🔗 Integration & Webhooks
```typescript
// Webhook event logging
webhookEvents: {
  eventId: string,
  eventType: string,
  source: "clerk" | "stripe",
  data: string,                  // JSON payload
  processed: boolean,
  errorMessage?: string,
}

// Subscription usage tracking
subscriptionUsage: {
  userId: Id<"users">,
  period: string,                // "2024-01"
  playlistsCreated: number,
  totalPlayTime: number,
  featuresUsed: string[],
}
```

## 🔧 Convex Functions Architecture

### Admin Functions (`convex/admin.ts`)
**Access Control**: Requires admin role verification

```typescript
// Content Management
- listCoreCategories()         // Browse categories
- createCoreCategory()         // Add new category
- listMedias()                 // Browse media library
- createMedia()                // Add audio/video content
- listCorePlaylists()          // Browse playlists
- createCorePlaylist()         // Create new playlist
- publishCorePlaylist()        // Make available to subscribers

// Section Management
- createCoreSection()          // Add sections to playlists
- addMediaToSection()          // Link media to sections
```

### Subscriber Functions (`convex/subscribers.ts`)
**Access Control**: Requires active subscription

```typescript
// Content Access
- getPublishedPlaylists()      // Browse available content
- getPlaylistDetails()         // Get full playlist data

// Playlist Management
- getUserPlaylists()           // User's custom playlists
- createUserPlaylist()         // Customize core playlist
- updateUserPlaylist()         // Modify selections

// Player Features
- getUserPlayerSettings()      // Get player preferences
- updatePlayerSettings()       // Update preferences
- updatePlaybackProgress()     // Track listening progress
```

### Internal Functions (`convex/internal/`)
**Access Control**: Internal only, called by webhooks and system

```typescript
// Auth Integration (convex/internal/auth.ts)
- syncUserFromClerk()          // Sync user data from Clerk
- updateSubscriptionStatus()   // Handle subscription changes

// Webhook Processing (convex/internal/webhooks.ts)
- logWebhookEvent()           // Log incoming webhooks
- handleUserDeletion()        // Process user deletion
- handleOrganizationMembership() // Manage admin access
```

### Webhook Handlers (`convex/webhooks.ts`)
**HTTP Actions**: Process external events

```typescript
- clerkWebhook()              // Handle Clerk user events
- stripeWebhook()             // Handle Stripe subscription events
```

## 🔐 Authentication & Authorization

### Clerk Integration
- **Admin Access**: Organization-based admin roles
- **Subscriber Access**: Active subscription required
- **Webhook Sync**: Real-time user and subscription updates

### Access Control Flow
1. **Authentication**: Convex Auth with Clerk JWT validation
2. **Profile Lookup**: Check `userProfiles` table for role and subscription
3. **Permission Check**: Verify admin role or active subscription
4. **Function Execution**: Execute with proper access controls

## 🚀 Multi-App Workflow

### Development Process
1. **Admin App Development**
   ```bash
   cd adm-app
   npx convex dev              # Start Convex backend
   pnpm run dev                 # Start admin interface
   ```

2. **API Generation**
   ```bash
   npx convex-helpers ts-api-spec  # Generate api.ts
   cp api.ts ../pwa-app/           # Copy to PWA app
   ```

3. **PWA App Development**
   ```bash
   cd pwa-app
   pnpm run dev                 # Start PWA interface
   ```

### Type-Safe Integration
```typescript
// In PWA app components
import { api } from "./api";    // Generated from admin-app
import { useQuery, useMutation } from "convex/react";

// Type-safe queries with auto-completion
const playlists = useQuery(api.subscribers.getPublishedPlaylists);
const createPlaylist = useMutation(api.subscribers.createUserPlaylist);
```

## 📱 PWA Features

### Progressive Web App Standards
- **Offline Support**: Service worker for content caching
- **Background Playback**: MediaSession API integration
- **Mobile-First**: Touch-optimized interface
- **Installation**: Add to home screen capability

### Player Features
- **Audio Streaming**: Background playback support
- **Customizable Settings**: Loop controls, timer, volume
- **Progress Tracking**: Resume playback, completion tracking
- **Offline Mode**: Cached content for offline listening

## 🔄 Real-Time Synchronization

### Live Updates
- **Admin Changes**: Instantly propagate to PWA app
- **Subscription Updates**: Real-time access control
- **Content Publishing**: Immediate availability to subscribers

### Webhook Processing
```typescript
// Webhook endpoints are available but implementation is pending
// Current status: Placeholder handlers that acknowledge receipt

// Planned Clerk webhook events:
- user.created/updated        // Sync user profiles
- user.deleted               // Soft delete user data
- organizationMembership.*   // Manage admin access

// Planned Stripe webhook events:
- subscription.created/updated // Update subscription status
- subscription.deleted        // Cancel access
- invoice.payment_failed     // Handle payment issues

// TODO: Complete webhook implementation with proper internal function access
```

## 🛠️ Environment Setup

### Required Environment Variables
```bash
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Webhooks
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Deployment Architecture
- **Admin App**: `https://admin.realigna.com`
- **PWA App**: `https://app.realigna.com`
- **Convex Backend**: Single deployment shared by both apps
- **Webhooks**: `/webhooks/clerk` and `/webhooks/stripe` endpoints

## 📋 Content Workflow

### Admin Content Creation
1. **Draft Creation**: Create playlist in draft status
2. **Section Management**: Add sections with media constraints
3. **Media Linking**: Link audio/video content to sections
4. **Publishing**: Make available to active subscribers

### Subscriber Experience
1. **Browse Content**: View published playlists by category
2. **Customize Playlist**: Select media within admin-set limits
3. **Save & Play**: Create personalized meditation sessions
4. **Track Progress**: Resume playback, completion tracking

## 🔍 Key Design Decisions

### Why Single Convex Backend?
- **Consistency**: Single source of truth for all data
- **Security**: Centralized access control and validation
- **Performance**: Optimized queries and real-time updates
- **Maintenance**: Easier schema evolution and deployment

### Why Separate Apps?
- **User Experience**: Tailored interfaces for different roles
- **Security**: Admin functions isolated from subscriber app
- **Scalability**: Independent deployment and optimization
- **Development**: Parallel team development possible

### File Storage Strategy
- **Audio Files**: Convex `_storage` for uploaded content
- **Video Content**: External embeds (YouTube) for efficiency
- **Thumbnails**: Convex storage with signed URL generation
- **Offline Support**: PWA caching for subscriber content

## 🚦 Getting Started

### ✅ Current Status: Successfully Deployed!

The Realigna Convex backend is live with 80+ optimized indexes, complete schema, admin/subscriber functions, and role-based access control.

**Quick Start:**
```bash
pnpm install && pnpm run dev
```

**Access:**
- Frontend: `http://localhost:5173`
- Convex Dashboard: [Live deployment](https://dashboard.convex.dev/d/enduring-pigeon-896)

### Multi-App Setup (Future Implementation)
1. Setup Admin App with `npx convex dev`
2. Copy generated `api.ts` to PWA App
3. Configure Clerk/Stripe webhooks

## 📚 Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Clerk Integration Guide](https://docs.convex.dev/auth/clerk)
- [PWA Best Practices](https://whatpwacando.today)
- [Multi-Repository Setup](https://docs.convex.dev/production/hosting/multiple-repos)

---

**Note**: This README reflects the current implementation. For production deployment, ensure all environment variables are properly configured and webhook endpoints are secured with proper signature verification.
