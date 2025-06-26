// convex/auth.ts
import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Environment detection
const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Helper function to check if a user is authenticated
 * In development, it will allow unauthenticated access with a warning
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  functionName: string
) {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    if (isDevelopment) {
      console.log(`⚠️ WARNING: Unauthenticated access to ${functionName} (allowed in development)`);
      return null;
    } else {
      throw new ConvexError("Not authenticated");
    }
  }
  
  return identity;
}

/**
 * Helper function to check if a user is an admin
 * In development, it will allow non-admin access with a warning
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  functionName: string
) {
  const identity = await requireAuth(ctx, functionName);
  
  // If we're in development and skipping auth checks
  if (!identity && isDevelopment) {
    return { isAdmin: true, identity: null };
  }
  
  // Check admin permissions using the adminUsers table
  const adminUser = identity ? await ctx.db
    .query("adminUsers")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first() : null;
  
  const isAdmin = !!adminUser && adminUser.role === "admin";
  
  if (!isAdmin) {
    if (isDevelopment) {
      console.log(`⚠️ WARNING: Non-admin user accessing ${functionName} (allowed in development)`);
    } else {
      throw new ConvexError("Admin access required");
    }
  }
  
  return { isAdmin: true, identity, adminUser };
}
