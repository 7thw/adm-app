# CorePlaylists System Documentation

## 📋 Overview

The CorePlaylists system is a comprehensive playlist management solution for the Realigna Admin App. It provides administrators with powerful tools to create, manage, and organize multimedia playlists that subscribers can access through the PWA application.

## 🏗 Architecture

### System Components

```
CorePlaylists/
├── page.tsx                     # Main listing page
├── new/
│   └── page.tsx                 # Create new playlist
├── [id]/
│   ├── page.tsx                 # Playlist details
│   ├── edit/
│   │   └── page.tsx             # Edit playlist
│   ├── preview/
│   │   ├── page.tsx             # Mobile preview
│   │   ├── types.ts             # TypeScript definitions
│   │   ├── tracks.ts            # Sample track data
│   │   ├── use-playlist.ts      # Playlist state management
│   │   └── _components/         # Preview-specific components
│   └── _components/
│       └── add-section-form.tsx # Section creation form
└── _components/                 # Shared components
    ├── data-table.tsx           # Main sections table
    ├── playlist-form.tsx        # Playlist creation/edit form
    ├── media-data-table.tsx     # Media management table
    └── section-media-table.tsx  # Section media management
```

### Data Model

The system operates on four main entities:

1. **CorePlaylists** - Master playlists created by admins
2. **CoreSections** - Ordered sections within playlists (base/loop types)
3. **CoreSectionMedia** - Media items within sections with selection state
4. **Media** - Individual audio/video files stored in R2

### Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and development experience
- **Convex** - Real-time database with automatic sync
- **TanStack Table** - Advanced table management
- **@dnd-kit** - Accessibility-first drag and drop
- **Shadcn/UI** - Design system components
- **Tailwind CSS 4** - Utility-first styling
- **Clerk** - Authentication and user management

## 🚀 Features

### 📝 Playlist Management
- Create and edit playlists with rich metadata
- Category-based organization
- Draft/Published status system
- Real-time search and filtering
- Responsive card-based interface

### 🎵 Section Management
- Drag-and-drop section reordering
- Two section types: **Base** (play once) and **Loop** (continuous)
- Configurable media selection limits
- Visual feedback for selection status

### 🎼 Media Management
- Upload and organize media files
- Drag-and-drop media reordering within sections
- Selection state management with limits
- Integrated media player preview
- File size and duration display

### 🎨 User Interface
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Accessibility First** - Screen reader support, keyboard navigation
- **Real-time Updates** - Changes sync instantly across users
- **Optimistic UI** - Immediate feedback with error recovery
- **Loading States** - Skeleton loaders and progress indicators

## 🛠 Component API Reference

### DataTable Component

Main table component for managing CoreSections with drag-and-drop functionality.

```tsx
interface DataTableProps<TData extends TableData> {
  data: TData[]                                    // Array of CoreSection data
  columns?: ColumnDef<TData>[]                    // Optional custom columns
  onReorder?: (newOrder: TData[]) => Promise<void> // Reorder callback
  onAddSection?: () => void                       // Add section callback
}
```

**Features:**
- Drag-and-drop reordering with visual feedback
- Column visibility controls
- Pagination with configurable page sizes
- Row selection for batch operations
- Real-time data synchronization

### PlaylistForm Component

Comprehensive form for creating and editing playlists.

```tsx
interface PlaylistFormProps {
  initialData?: PlaylistInitialData  // Pre-populated data for editing
  onSuccess?: (id: Id) => void       // Success callback
  submitLabel?: string               // Custom submit button text
  isEdit?: boolean                   // Edit mode flag
  onCancel?: () => void             // Cancel callback
}
```

**Features:**
- Form validation with real-time feedback
- Category selection with dynamic loading
- User management integration with Clerk
- Loading states and error handling
- Accessibility support

### SectionMediaTable Component

Advanced table for managing media within sections.

```tsx
interface SectionMediaTableProps {
  sectionId: Id<"coreSections">      // Section to display media for
  maxSelectMedia?: number            // Selection limit
  onPlayMedia?: (media: MediaDetails) => void // Media playback callback
  className?: string                 // Optional styling
  readOnly?: boolean                // Read-only mode
}
```

**Features:**
- Drag-and-drop media reordering
- Selection limits with visual indicators
- Media playback integration
- File information display
- Optimistic updates with error recovery

## 🎯 Performance Optimizations

### Code Splitting
- Route-based code splitting with Next.js App Router
- Component-level lazy loading for heavy features
- Dynamic imports for optional functionality

### Data Management
- **Memoization** - `useMemo` for expensive calculations
- **Callback Optimization** - `useCallback` for stable references
- **Real-time Sync** - Convex provides efficient data updates
- **Optimistic Updates** - Immediate UI feedback with rollback on errors

### Bundle Optimization
- Tree shaking to eliminate unused code
- Dynamic imports for large dependencies
- Optimized asset loading with Next.js

### Accessibility Features
- **ARIA Labels** - Comprehensive screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Focus Management** - Proper focus handling in modals and dropdowns
- **Color Contrast** - WCAG AA compliant color schemes
- **Motion Reduction** - Respects user motion preferences

## 🔧 Development Guidelines

### Code Style
- **TypeScript First** - Comprehensive type definitions
- **Component Documentation** - JSDoc comments for all public interfaces
- **Error Boundaries** - Graceful error handling and recovery
- **Loading States** - Comprehensive loading and skeleton states

### Testing Strategy
- **Unit Tests** - Individual component functionality
- **Integration Tests** - Component interaction testing
- **E2E Tests** - Full user workflow validation
- **Performance Tests** - Bundle size and runtime performance

### Security Considerations
- **Authentication** - Clerk integration for secure user management
- **Authorization** - Role-based access control
- **Data Validation** - Server-side validation with Convex
- **XSS Prevention** - Sanitized user input and safe rendering

## 📚 Usage Examples

### Creating a New Playlist

```tsx
import { PlaylistForm } from './_components/playlist-form'

function CreatePlaylistPage() {
  const handleSuccess = (playlistId: Id<"corePlaylists">) => {
    router.push(`/dashboard/core-playlists/${playlistId}/edit`)
  }

  return (
    <PlaylistForm
      submitLabel="Create Playlist"
      onSuccess={handleSuccess}
    />
  )
}
```

### Managing Section Media

```tsx
import { SectionMediaTable } from './_components/section-media-table'

function SectionManager({ sectionId }: { sectionId: Id<"coreSections"> }) {
  const handlePlayMedia = (media: MediaDetails) => {
    // Integrate with media player
    player.loadAndPlay(media.fileUrl)
  }

  return (
    <SectionMediaTable
      sectionId={sectionId}
      maxSelectMedia={5}
      onPlayMedia={handlePlayMedia}
    />
  )
}
```

### Custom Data Table

```tsx
import { DataTable } from './_components/data-table'

const customColumns = [
  // Custom column definitions
  {
    accessorKey: "customField",
    header: "Custom Header",
    cell: ({ row }) => <CustomCell data={row.original} />
  }
]

function CustomTable({ data }: { data: CoreSection[] }) {
  return (
    <DataTable
      data={data}
      columns={customColumns}
      onReorder={handleCustomReorder}
    />
  )
}
```

## 🚀 Production Deployment

### Environment Variables
```env
CONVEX_DEPLOYMENT=production
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### Build Optimization
```bash
# Production build with optimizations
npm run build

# Analyze bundle size
npm run analyze

# Type checking
npm run type-check
```

### Monitoring
- **Error Tracking** - Sentry integration for error monitoring
- **Performance Monitoring** - Web Vitals tracking
- **User Analytics** - Usage patterns and feature adoption
- **Database Monitoring** - Convex dashboard for query performance

## 🔄 Migration and Updates

### Database Migrations
- Convex handles schema migrations automatically
- Backup strategies for production data
- Rollback procedures for failed deployments

### Component Updates
- Backward compatibility guidelines
- Breaking change documentation
- Migration guides for API changes

## 📞 Support and Maintenance

### Troubleshooting
- Common issues and solutions
- Debug mode for development
- Logging configuration for production

### Performance Monitoring
- Bundle size tracking
- Runtime performance metrics
- User experience monitoring

---

**Last Updated:** June 4, 2025  
**Version:** 1.0.0  
**Maintainer:** Realigna Development Team
