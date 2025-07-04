---
description: Comprehensive debugging instructions for Claude to efficiently troubleshoot the Realigna codebase
---

# Claude Debugging Instructions for Realigna Codebase

## Project Overview
**Realigna** is a dual-app system for meditation/wellness content management:
- **Admin App**: Content management for creating Core Playlists (Next.js + Convex + Clerk)
- **PWA App**: User-facing app for consuming content as User Playlists (React + Convex + Clerk)

<!-- test -->

## Critical Architecture Rules

### 1. ULTRA-STRICT NAMING CONVENTION
**NEVER use generic "playlist" - ALWAYS specify context:**

**Admin Context (everything is "corePlaylist"):**
- ✅ `CorePlaylist`, `corePlaylist`, `createCorePlaylist`, `getPublishedCorePlaylists`
- ❌ `Playlist`, `playlist`, `createPlaylist`, `getPublishedPlaylists`

**PWA Context (everything is "userPlaylist"):**
- ✅ `UserPlaylist`, `userPlaylist`, `createUserPlaylist`, `getUserPlaylists`
- ❌ `Playlist`, `playlist`, `createPlaylist`, `getPlaylists`

### 2. Convex Schema Authority
- **Schema is source of truth**: `/adm-app/convex/schema.ts`
- **Never modify schema without asking first**
- **Always use generated types**: `Doc<"tableName">` from `@/convex/_generated/dataModel`
- **Use proper API references**: `api.admin.functionName` not string literals

### 3. Function Patterns
```typescript
// Correct Convex function structure
export const functionName = query({
  args: { /* validators */ },
  returns: v.returnType(),
  handler: async (ctx, args) => {
    // Implementation
  }
});
```

## Debugging Workflow

### Step 1: Identify Issue Type
**Common Issue Categories:**
1. **Missing Convex Functions** - Frontend calls non-existent backend functions
2. **Type Mismatches** - Schema vs frontend type conflicts
3. **Import/Export Errors** - Module resolution issues
4. **Naming Convention Violations** - Generic "playlist" usage
5. **Authentication Issues** - Clerk integration problems

### Step 2: Quick Diagnostic Commands

**Check Convex Functions:**
```bash
# List all available functions
find convex -name "*.ts" -exec grep -l "export const" {} \;

# Check specific function exists
grep -r "functionName" convex/
```

**Check Schema Alignment:**
```bash
# View current schema
cat convex/schema.ts | grep -A 10 "tableName"

# Check generated types
cat convex/_generated/dataModel.d.ts | grep "tableName"
```

**Check Import Paths:**
```bash
# Find import issues
grep -r "from.*api" app/ | grep -v "_generated"
```

### Step 3: Common Fix Patterns

#### Missing Convex Function
**Problem:** `Cannot read properties of undefined (reading 'functionName')`
**Solution:**
1. Check if function exists in convex files
2. If missing, ask: "Should I add the missing `functionName` function to handle [specific operation]?"
3. Add function following naming conventions

#### Type Mismatch
**Problem:** TypeScript errors about incompatible types
**Solution:**
1. Check schema definition vs usage
2. Use generated types: `Doc<"tableName">` instead of manual types
3. Ensure validators match schema

#### Naming Convention Violation
**Problem:** Generic "playlist" usage
**Solution:**
1. Identify context (Admin = core, PWA = user)
2. Replace with proper naming
3. Update all related references

### Step 4: Efficient Problem-Solving Approach

**Instead of endless diagnosis:**
1. **Identify** the specific issue (missing function, type mismatch, etc.)
2. **Ask Permission**: "I see [specific issue]. Should I add/fix [specific solution]?"
3. **Implement** the fix promptly once approved
4. **Test** the fix works

**Example:**
```
❌ Slow: "There seems to be an issue with the playlist functionality..."
✅ Fast: "The frontend is calling `api.admin.getCorePlaylists` but this function doesn't exist in convex/admin.ts. Should I add this query function to fetch published core playlists?"
```

## Key Files to Check

### Convex Backend
- `convex/schema.ts` - Database schema (source of truth)
- `convex/admin.ts` - Admin functions for core playlists
- `convex/subscribers.ts` - User functions for user playlists
- `convex/auth.ts` - Authentication functions

### Frontend
- `app/(pages)/dashboard/core-playlists/` - Admin playlist management
- `components/` - Reusable components
- `lib/` - Utilities and types

### Configuration
- `convex.json` - Convex configuration
- `next.config.js` - Next.js configuration
- `.env.local` - Environment variables

## Memory System Integration

**Always check user memories for:**
- Project-specific rules and conventions
- Previous debugging patterns
- User preferences and requirements
- Task management guidelines (Task Genius rules)

**Use Basic Memory MCP tools to:**
- Record debugging solutions for future reference
- Track recurring issues and their fixes
- Maintain context across debugging sessions

## Error Pattern Recognition

### Common Error Signatures
1. **`Cannot read properties of undefined`** → Missing Convex function
2. **`Type 'X' is not assignable to type 'Y'`** → Schema/type mismatch
3. **`Module not found`** → Import path issue
4. **`Invalid hook call`** → React hooks usage error
5. **`Clerk: User not found`** → Authentication issue

### Quick Fixes
- Missing function → Add to appropriate convex file
- Type mismatch → Use generated types from schema
- Import error → Check relative paths and exports
- Hook error → Ensure hooks are in React components
- Auth error → Check Clerk configuration and user state

## Best Practices for Efficient Debugging

1. **Be Specific**: Identify exact error and proposed solution
2. **Ask Permission**: Get approval before modifying convex files
3. **Use Schema**: Always reference schema.ts for data structure
4. **Follow Conventions**: Maintain strict naming patterns
5. **Test Incrementally**: Fix one issue at a time
6. **Document Solutions**: Use Basic Memory to record fixes

## Emergency Debugging Checklist

When debugging is taking too long:

- [ ] Have I identified the specific error type?
- [ ] Have I checked if the required Convex function exists?
- [ ] Have I verified the schema matches the frontend usage?
- [ ] Have I followed the naming conventions correctly?
- [ ] Have I asked for permission to make necessary changes?
- [ ] Am I using generated types instead of manual definitions?

Remember: **Identify → Ask → Fix → Test** is faster than **Diagnose → Analyze → Theorize → Repeat**
