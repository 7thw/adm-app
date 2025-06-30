---
trigger: always_on
---

# Convex Development Guidelines for Realigna

## Core Principles

1. **Schema as Single Source of Truth**
   - Always use `schema.ts` as the canonical definition for all data structures
   - Never modify schema without explicit approval and documentation

2. **Type Safety Throughout**
   - Use generated types from `@/convex/_generated/dataModel` (e.g., `Doc<"tableName">`)
   - Avoid manual type redefinition that can drift from the schema

## Function & API Best Practices

### 1. Query vs Mutation Usage

| Hook           | Purpose                              | Best Practice                                           |
|----------------|--------------------------------------|--------------------------------------------------------|
| `useQuery`     | Read-only data access with reactivity | Use for all data fetching that needs real-time updates  |
| `useMutation`  | Write operations that modify data     | Use for all operations that create, update, or delete   |

❌ **Never** use mutations in place of queries or vice versa

### 2. Function Structure

```typescript
// Good example of a query
export const listItems = query({
  args: { /* validators */ },
  handler: async (ctx, args) => {
    // Implementation
  }
});

// Good example of a mutation
export const updateItem = mutation({
  args: { /* validators */ },
  handler: async (ctx, args) => {
    // Implementation with paging and ctx.db.patch() calls
  }
});
```

### 3. API References

- **Always** use the generated `api` object for function references
- **Never** use string literals to reference functions

```typescript
// Correct
const data = useQuery(api.admin.listMedias);

// Incorrect
const data = useQuery("listMedias");
```

## Type System Guidelines

### 1. Generate, Don't Duplicate

- **Import types** instead of redefining them:

```typescript
// Correct
import { Doc } from "@/convex/_generated/dataModel";
type MediaDetails = Doc<"medias">;

// Incorrect
type MediaDetails = {
  _id: Id<"medias">,
  title: string,
  // ...and so on
};
```

### 2. Validators

- Use Convex validators for type-safe APIs:

```typescript
import { v } from "convex/values";

export const myFunction = query({
  args: {
    id: v.id("tableName"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    optionalField: v.optional(v.string())
  },
  // ...
});
```

## Multi-Repo Strategy

### 1. Type Sharing

- Generate API specification with `npx convex-helpers ts-api-spec`
- For UI types, use our shared types package or flattened JSONL strategy

### 2. API Consistency

- Keep function names consistent and semantic:
  - Queries: `get*`, `list*`, `find*`
  - Mutations: `create*`, `update*`, `delete*`, `add*`, `remove*`

- Example naming pattern:
  ```
  admin.listMedias        // List all media
  admin.getSectionMedia   // Get media for a section
  admin.createCorePlaylist // Create a new playlist
  ```

## Performance Considerations

### 1. Batching & Paging

- Always implement pagination for lists that may grow large
- Use `withIndex` for efficient filtering
- Batch writes when possible

### 2. Caching

- Leverage Convex caching for frequently accessed data
- For PWA, utilize the flattened JSONL strategy for offline capabilities

## Error Handling

```typescript
// Robust error handling
try {
  await ctx.db.insert(...);
} catch (error) {
  console.error("Specific operation failed:", error);
  throw new Error(`Failed to complete operation: ${error.message}`);
}
```

## Security Best Practices

1. **Always** validate user access before any query or mutation
2. Use `ctx.auth` to access the current user's authentication context
3. Never trust client-provided IDs without validation

```typescript
// Good security practice
const user = await ctx.auth.getUserIdentity();
if (!user) {
  throw new Error("Not authenticated");
}

// For admin endpoints
const isAdmin = await requireAdmin(ctx);
if (!isAdmin) {
  throw new Error("Not authorized");
}
```

## Testing

- Write tests for critical database operations
- Use Convex's testing utilities for mocking

Remember: When in doubt, consult the schema and use generated types!
