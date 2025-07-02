# Realigna Admin App Dev & Debug Plan

## Notes
- Convex dev server and Next.js frontend both started successfully; hot reloads are working.
- Console logs show normal dev warnings and fast refresh activity.
- Encountered error: `Admin access required` in `admin:listMedias` query, traced to `requireAdminAccess` in `convex/admin.ts`.
- Possible causes: user not authenticated, or authenticated user lacks admin role in `userProfiles`.
- MCP data export reveals root cause: no authenticated user and empty `users`/`userProfiles` tables; database is in a fresh state.
- Added Clerk Organization ID to `.env.local` and restarted servers to ensure proper authentication context.
- Confirmed Clerk authentication: you are signed in as organization owner/admin (`user_2yjiwfocyyUrzB1PlyHiJvCFaxW`, `adm-realigna@7thw.com`), but there is no matching admin user/profile in Convex; this is the root cause of admin access errors.
- Attempted to run admin initialization mutation via MCP, but failed due to lack of authentication context; next step is to temporarily bypass admin check to allow initialization from the app UI.
- New error: Media upload fails due to schema mismatch—`uploadedBy` is a Clerk user ID, but schema expects Convex `users` table ID. Need to map Clerk user ID to Convex `users` ID.
- Media upload to Convex and R2 now works; user ID mapping logic is confirmed fixed.
- Admin user/profile successfully initialized in Convex; ready to restore proper admin security.
- Popover runtime error in dashboard nav-user component fixed: removed orphan PopoverTrigger and converted to DropdownMenuItem; no more context error.
- AdminInitializer component removed from dashboard; admin setup is now complete.
- JSON/data structure in data.json had remnants of old format causing build errors; conversion to new DashboardItem format needed to be completed.
- Redundant authentication logic in Convex (requireAdminAccess in every function) identified as unnecessary since Clerk org-level authentication already protects the admin app.
- User confirmed data.json is dummy data and working; conversion task not needed.
- Authentication refactor complete; admin functions now rely on Clerk org-level authentication and simple user checks.
- Current Core Playlist creation UX is a catch-22: user must leave to create a category before saving a playlist, disrupting workflow.
- User proposed a unified UI: BentoGrid with filters, modal-based Core Playlist creation, and inline category creation within the playlist form for a seamless experience.
- Zod and react-hook-form are being removed from Core Playlist creation modal in favor of simple state management and Convex validators, per user preference.
- Core Playlist creation modal fully refactored: now uses simple state management and HTML forms (no Zod/react-hook-form). UI is cleaner and matches Convex-first approach.
- BUG: Creating a category from the modal fails—Convex mutation uses Clerk user ID for `createdBy`, but schema expects Convex `users` table ID. Needs same fix as media upload (user ID mapping).
- Inline category creation bug is now fixed: createCoreCategory mutation properly maps Clerk user ID to Convex users table ID.
- BUG: Creating a Core Playlist failed—Convex mutation used Clerk user ID for `createdBy`, but schema expects Convex `users` table ID. Fixed with proper user ID mapping logic (same as categories).
- User rejected modal-in-modal UI: require Sheet (slide-in panel) for Core Playlist creation, never modal-in-modal; keep dashboard color scheme and simplicity.
- Next UI focus: Use existing data-table (with drag-and-drop, batch selection, and correct spacing) for Core Playlist Builder and section management, as discussed and confirmed by user.
- Core Section repeater with drag-and-drop and data-table integration implemented in Core Playlist edit page, using ultra-strict naming convention and dashboard UI.
- Removed unwanted DataTable UI elements (tabs and buttons) from Core Playlist Builder; created new CoreMediaTable component for clean Core Media management.
- Debugged and fixed JSX structure for Core Playlist Builder section, including DnD and className attributes for easier debugging.
- Key DnD Kit architecture insight: For sortable lists with multiple containers (e.g., Core Sections and Core Media within each section), use a single DndContext provider at the top level and a separate SortableContext for each container. Use useSortable for each draggable item and handle cross-container drops via onDragOver. Reference: dnd-kit sortable docs.
- Fixed typo in mock data (`Idorder` → `order`) in Core Playlist Builder.
- Replaced non-existent DraggableContainer/DraggableItem with @dnd-kit DndContext/SortableContext in Core Playlist Builder.
- Fixed type mismatches in mock data and convertToCoreMediaTableItems to ensure compatibility with CoreMediaTable.
- Removed duplicate JSX and resolved structural errors in Core Playlist Builder drag-and-drop section.
- Ongoing: TypeScript errors due to type mismatches between mock data and actual types, and missing components in Core Playlist Builder UI. Need to unify types and refactor DnD/data-table code for type safety.

## Task List
- [x] Start Convex dev server
- [x] Start Next.js frontend server
- [x] Confirm both servers are running and hot reload is working
- [x] Verify user authentication flow in admin app
- [x] Check if current user has admin role in `userProfiles`
- [x] Resolve `Admin access required` error in `admin:listMedias`
- [x] Seed initial admin user/profile data in database
- [x] Temporarily bypass admin check to allow in-app admin initialization
- [x] Fix Convex ID mapping for uploadedBy field in medias table
- [x] Fix PopoverTrigger error in dashboard nav-user component
- [x] Clean up code (remove unused admin initializer, address TS lint error)
- [x] Test admin workflow end-to-end
- [-] Complete data.json conversion: remove all old-format remnants, ensure full DashboardItem compliance
- [x] Refactor Convex authentication: remove redundant requireAdminAccess checks, rely on Clerk org/role enforcement
- [ ] Core Playlists/admin functionality: test, review, and improve features
- [ ] Design and implement unified Core Playlists admin UI: BentoGrid layout, modal playlist creation, inline category creation
- [x] Refactor Core Playlist creation modal: remove Zod/react-hook-form
- [x] Implement simple state management and Convex validation in modal
- [x] Fix Convex user ID mapping for createCoreCategory mutation (category creation)
- [x] Fix Convex user ID mapping for createCorePlaylist mutation (playlist creation)
- [x] Refactor Core Playlist creation UI to use Sheet (slide-in) instead of modal-in-modal; keep UI simple and in dashboard color scheme
- [x] Replace DataTable with CoreMediaTable for Core Media items; clean up Core Section repeater UI
- [x] Debug and fix JSX structure for Core Playlist Builder section (DnD, classNames)
- [x] Fix typo in mock data
- [x] Replace DraggableContainer/DraggableItem with @dnd-kit DndContext/SortableContext
- [x] Fix convertToCoreMediaTableItems and type mismatches
- [x] Remove duplicate JSX and fix DnD structure
- [x] Create/fix SortableCoreSection component and finalize DnD

## Current Goal
Fix JSX structure and type errors in Core Playlist Builder