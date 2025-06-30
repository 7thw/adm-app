---
title: Realigna PRD
created: 2025-06-03
client: Realigna
tags:
  - PRD
  - realigna
  - dual-apps
  - clerk
  - convex
description: "Simplified PRD for Realigna dual-app system: Admin App with Core Convex and PWA App connecting via api.ts"
project-type: dual-apps
tech-stack: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shadcn UI, Convex, Clerk, Stripe
modified-last: 2025-06-20
modified-by:
  - Assistant
---
# Realigna Product Requirements Document

Realigna is a subscription-based meditation platform consisting of two interconnected Next.js applications sharing one Convex database. The Admin App manages content and users, while the PWA App provides the subscriber experience.

## Admin App
**Initial Setup:** `pnpm dlx shadcn@latest init` [DONE]
### Dashboard

The Admin App allows administrators to login (Clerk Auth) and manage:
- AdminUsers and Subscribers
- Subscriptions & Plans (Clerk Subscription/Billing)
- Analytics (Airbyte)

### Medias Management (`mediasPage`)
Administrators can:
- **Upload** (CloudFlare R2) Medias of MediaType: `"audio"`
- **Embed** (youTubeUrl) for Medias of MediaType: `"video"`

### Core Playlists Management (`corePlaylistsPage`)
AdminUsers can manage CorePlaylists:
- Add, delete, title, publish/draft CorePlaylists
- Set CorePlaylist settings:
  - `status`: `"draft"` | `"published"`
  - `coreCategoryId`: v.id("coreCategories") // tags
  
**Important:** _CorePlaylists can only be edited while in `"draft"` status._
#### Section Management
Within each CorePlaylist, manage coreSections:
- Add, delete, title, re-order (DnD) coreSections
- Configure Section settings:
  - `sectionType`: `"base"` | `"loop"`
    - **base**: plays only once, skips all corePlaylist loopback cycles
    - **loop**: plays on all corePlaylist loopback cycles
  - `minSelectMedia`: number // minimum Medias Subscribers must toggle On
  - `maxSelectMedia`: number // maximum Medias Subscribers can toggle On

#### Medias Linking
Within each Section:
- Add, remove, re-order (DnD) any amount of Medias
- Medias are **linked** (not uploaded) to Media(id) from mediaPage/db
- When Published, CorePlaylists become available to active Subscribers

### User Stories - Admin
**As an admin, I want to:**
- Login and manage admin users and subscribers (Clerk Auth)
- Upload audio files and embed YouTube videos for medias library
- Create and organize CorePlaylists with sections and medias linking
- Set corePlaylist status (draft/published) and subscriber interaction limits
- Monitor analytics and manage subscription billing (Clerk components)

### Convex Database/Server

The Realigna platform implements a **single Convex backend architecture** where the core database and server functions reside exclusively within the **Admin App (adm-app)** repository. This approach maintains a single source of truth for data while enabling secure, type-safe access across both applications.

#### Multi-Repository Setup

Using Convex's TypeScript API specification generation capability, the Admin App serves as the primary backend repository that:

- **Hosts the complete Convex backend** with all database schemas, functions, and business logic
- **Generates a TypeScript API file** (`api.ts`) containing type definitions for all Convex functions
- **Transfers the generated API** to the PWA App for type-safe function calls

This architecture enables:
- **Single source of truth** for all data operations
- **Proper access control** between admin and subscriber functions through role-based permissions
- **Environment separation** with app-specific credentials kept in respective `.env.local` files
- **Real-time updates** that propagate across both applications seamlessly

#### Implementation Workflow

1. **API Generation**: Admin App runs `npx convex-helpers ts-api-spec` to generate the API specification
2. **File Transfer**: The generated `api.ts` file is copied to the PWA App repository
3. **Type-Safe Access**: PWA App imports and uses Convex functions with full TypeScript support
4. **Role-Based Security**: Convex functions implement proper access control to ensure subscribers only access appropriate data

*Note: When schema changes occur in the Admin App, the API file must be regenerated and transferred to maintain type safety across both applications.*



---
---
---
## PWA App

**Initial Setup:** `pnpm dlx shadcn@latest init` [DONE]
**UI Requirements:** [pwa-manifest], [pwa-workers], [mobile-first], [touch-enabled]

### Dashboard

The PWA App allows Subscribers to:
- Login (Clerk Auth)
- Manage Profile and Subscription Plans
- Access Medias content

### Playlists Management (`playlistsPage`)
Active Subscribers can:
- Browse and select available CorePlaylists
- Customize CorePlaylists by toggling Medias(s) within (min)-(max)SelectMedia limits
- Save and play customized CorePlaylists
- Listen with background audio support (PWA worker)

### Custom Playlist Storage
Customized CorePlaylists saved as flattened JSON:
- **Offline:** PWA worker browser-cache (session/offline)
- **Online:** Convex db under Subscriber(id)Settings.customPlaylists

### s Player Features
- Medias audio/video streaming
- Background playback (PWA MediaSession API)
- Customizable player settings:
  - `maxLoop`: 0, 1, 2, 3, or infinite
  - `countDownTimer`: minutes
  - `volume`: 0-100

### User Stories - Subscriber
**As a subscriber, I want to:**
- Sign up/Sign in (Clerk components)
- Browse CorePlaylists with audio and video content
- Create custom playlists by selecting medias within admin-set limits
- Stream content with background playback
- Customize player preferences (loops, timer, volume)
- Manage subscription and billing (Clerk components)

### Convex API Integration Between Apps

**How api.ts from admin-app core convex is used by pwa-app:**

1. **API Generation in Admin App**
   - Admin app contains the core Convex backend with all function definitions
   - Run `npx convex-helpers ts-api-spec` in admin-app to generate `api.ts`
   - This file contains TypeScript definitions for all Convex functions with full type safety
2. **API Transfer to PWA App**
   - Copy the generated `api.ts` file from admin-app to pwa-app
   - This provides PWA app with type-safe access to all Convex functions
   - No need to duplicate function definitions or maintain separate schemas
3. **Type-Safe Function Calls in PWA**
   ```tsx
   // In PWA app components
   import { api } from "./api"; // Generated from admin-app
   import { useQuery, useMutation } from "convex/react";
   
   // Type-safe queries with auto-completion
   const playlists = useQuery(api.playlists.getPublishedPlaylists);
   const createSubscriberPlaylist = useMutation(api.playlists.createSubscriberPlaylist);
   ```
4. **Role-Based Access Control**
   - Convex functions check user roles (admin vs subscriber) via Clerk JWT
   - PWA app can only access subscriber-appropriate functions
   - Admin-only functions automatically reject PWA requests
5. **Real-Time Synchronization**
   - Both apps share the same Convex deployment URL
   - Changes made in admin app instantly propagate to PWA app
   - Subscribers see content updates in real-time without app restarts
6. **Development Workflow**
   - Run `npx convex dev` in admin-app only (single backend)
   - After schema/function changes, regenerate `api.ts` and copy to PWA
   - Both apps maintain independent development servers while sharing backend

*Note: The `api.ts` file is generated from the admin-app's Convex backend, ensuring type safety and consistency across both apps.*

### PWA Components and Functions:
- pwa best standards: `https://whatpwacando.today`
- pwa manifest: `https://whatpwacando.today`
- [pwa installation script](https://whatpwacando.today/installation) or (`/Users/macdadyo/_MEM/_DOCS/PWA/whatpwacando.todayinstallation.md`)
- [pwa play medias in background](https://whatpwacando.today/audio) or (`DOCS//Users/macdadyo/_MEM/_DOCS/PWA/whatpwacando.todayaudio.md`)
- [pwa bluetooth](https://whatpwacando.today/bluetooth)

---
---
---
---
## Apps System

**Project Management in: Obsidian(_MEM/**) USE mcp: basic-memory**
- Basic Memory Instructions: `/Users/macdadyo/_MEM/__RULES/basic-memory_RULES.md`
- Both Apps: `/Users/macdadyo/_MEM/_PROJECTS/Realigna/`
- Admin App: `/Users/macdadyo/_MEM/_PROJECTS/Realigna/apps/adm-app`
- PWA App: `/Users/macdadyo/_MEM/_PROJECTS/Realigna/apps/pwa-app`

**Project Docs:**
- `_MEM/_DOCS/Convex/convex_devmultiple-repos.md`
- `_DOCS/Convex/convex_functions-clerk-hub.md`
- `_DOCS/Clerk/clerk-convex-integration.md`
- `_DOCS/Clerk/clerk-billing.md`
- `_DOCS/Clerk/clerk_convex-sync-data.md`

**Realigna Admin (app-adm) paths**
- **Dev Tunnel:** `https://adm-realigna.7thw.co`
- **Local Dev:** `http://localhost:3100`
- **Local Path:** `/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app`
- **GitHub:** Hub:** `URL_ADDRESS.com/macdadyo/realigna-apps/tree/main/adm-app`

**Realigna PWA (app-pwa)**
- **Dev Tunnel:** `https://pwa-realigna.7thw.co`
- **Local Dev:** `http://localhost:3120`
- **Local Path:** `/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/pwa-app`
- **GitHub:** Hub:** `URL_ADDRESS.com/macdadyo/realigna-apps/tree/main/pwa-app`
- **Production:** `https://admin.realigna.com`

**Apps Backend Services**
- **Convex** - Real-time database and backend
- **Clerk** - Authentication and user management
- **Stripe** - Payment processing and subscription management
- **Production:** `https://app.realigna.com`

**Apps Frontend**
- **pnpm** - package manager
- **Next.js 15+** - React framework with App Router
- **React 19+** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - CSS-first styling (no config file needed)
- **Shadcn UI** - Component library using global.css theme colors
- **Clerk-Components** - Clerk pre-made components `<SignIn />`, `<SignUp />`, `<UserButton />`, `<UserProfile />`, `<CreateOrganization />`, `<OrganizationProfile />`, `<Waitlist />`
**Clerk control Components**
Control components manage authentication-related behaviors in your application. They handle tasks such as controlling content visibility based on user authentication status, managing loading states during authentication processes, and redirecting users to appropriate pages. Control components render at `<Loading />` and `<Loaded />` states for assertions on the Clerk object. A common example is the `<SignedIn>` component, which allows you to conditionally render content only when a user is authenticated.
- `<AuthenticateWithRedirectCallback />`
- `<ClerkLoaded />`
- `<ClerkLoading />`
- `<Protect />`
- `<RedirectToSignIn />`
- `<RedirectToSignUp />`
- `<RedirectToUserProfile />`
- `<RedirectToOrganizationProfile />`
- `<RedirectToCreateOrganization />`
- `<SignedIn />`
- `<SignedOut />`
**Clerk unstyled Components**
- `<SignInButton />`
- `<SignUpButton />`
- `<SignOutButton />`

**Environment Configuration**
Required* 
```bash
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stripe managed in Clerk and Convex directly
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---
---
## Observations

- [project] dual SaaS application platform for audio content management #realigna #saas
- [architecture] admin interface and PWA subscriber app interconnected via Convex #dual-app
- [tech-stack] Next.js 15+ with React 19+, TypeScript, Tailwind CSS 4, Shadcn UI #frontend
- [backend] Convex real-time database, Clerk authentication, Stripe payments #backend
- [admin-features] user management, subscription management, content management, analytics #admin-app
- [pwa-features] authentication, playlist management, audio playback, subscription management #pwa-app
- [database] TypeScript interfaces for Users, CorePlaylists, CoreSections, SectionMedia, SubscriberPlaylists #convex-schema
- [authentication] JWT-based with role-based access control via Clerk #auth
- [pwa-requirements] background sync, mobile-first design, offline capabilities #progressive-web-app
- [performance] <500ms audio streaming latency, <3s admin load, <2s PWA load #performance
- [testing] Jest, Playwright, React Testing Library, Lighthouse CI #testing-stack
- [security] GDPR compliance, encrypted data, PCI compliance for payments #security
- [deployment] Vercel hosting for both applications #deployment
- [monitoring] Sentry, Vercel Analytics, PostHog, Convex dashboard #monitoring
- [development] pnpm package management, TypeScript strict mode #dev-tools
- [credentials] admin and PWA test environments with specific URLs and credentials #dev-access
- [api-architecture] single Convex backend in Admin App generates api.ts file for PWA App #multi-repo
- [file-storage] CloudFlare R2 for audio files and medias assets #storage
- [payment-processing] Stripe integration for subscription billing managed through Clerk #payments
- [user-roles] admin users and subscriber users with different access levels #rbac
- [content-structure] CorePlaylists contain CoreSections which contain SectionMedia #content-hierarchy
- [real-time] live synchronization between admin changes and subscriber views #sync
- [mobile-optimization] PWA designed for mobile-first experience with touch controls #mobile
- [offline-support] service worker implementation for offline functionality and caching #offline
- [analytics] comprehensive tracking and reporting capabilities via Airbyte #analytics
- [scalability] designed to handle multiple subscribers and content creators #scale
- [medias-types] supports audio uploads and YouTube video embeds #medias
- [playlist-customization] subscribers can toggle medias within admin-set min/max limits #customization
- [player-features] background playback, loop controls, countdown timer, volume settings #player
- [subscription-model] active subscription required for content access #business-model
- [content-workflow] draft/published status controls content availability #workflow
- [section-types] base sections play once, loop sections repeat with playlist cycles #section-behavior
- [data-sync] offline PWA cache syncs with online Convex database #data-management
- [environment-separation] separate dev tunnels and production URLs for each app #environments
- [component-library] Clerk pre-made and control components for authentication flows #ui-components
- [project-management] organized in Obsidian MEM system with Basic Memory integration #project-org

## Relations

- defines [[Realigna Project]]
- specifies [[Realigna Admin App]]
- specifies [[Realigna PWA App]]
- depends_on [[Convex Database Schema]]
- depends_on [[Clerk Authentication Setup]]
- depends_on [[Stripe Payment Integration]]
- depends_on [[CloudFlare R2 Storage]]
- extends [[Next.js Framework]]
- uses [[TypeScript Configuration]]
- uses [[Tailwind CSS Styling]]
- uses [[Shadcn UI Components]]
- deployed_on [[Vercel Platform]]
- monitored_by [[Application Monitoring Stack]]
- tested_with [[Testing Strategy Framework]]
- secured_by [[Security Requirements Framework]]
- managed_in [[MEM Project Management System]]
- implements [[Progressive Web App Standards]]
- follows [[Real-time Architecture Patterns]]
- integrates_with [[Audio Streaming Infrastructure]]
- manages [[Subscription Business Model]]
- supports [[Multi-tenant Architecture]]
- enables [[Content Management Workflow]]
- provides [[User Experience Design]]
- requires [[Performance Optimization Strategy]]
- includes [[Development Environment Setup]]
- documented_in [[Technical Specifications]]
- connects_to [[Convex Multi-Repository Documentation]]
- utilizes [[Clerk Components Library]]
- stores_medias_in [[CloudFlare R2 Buckets]]
- processes_payments_via [[Stripe Billing System]]
- tracks_analytics_with [[Airbyte Integration]]
- synchronizes_with [[PWA Service Workers]]
- manages_users_through [[Clerk User Management]]
- implements [[Role-Based Access Control]]
- supports [[Offline-First Architecture]]
- enables [[Real-Time Data Synchronization]]
- provides [[Mobile-First User Interface]]
- includes [[Background Audio Playback]]
- manages [[Playlist Customization System]]
- implements [[Content Publishing Workflow]]
- supports [[Multi-Environment Deployment]]