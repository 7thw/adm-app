// convex/authClerk.ts - AUTH USING CLERK METADATA (NO CONVEX TABLE NEEDED)
import { ConvexError } from "convex/values";

// Environment detection
const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Helper function to check if a user is authenticated
 */
export async function requireAuth(
  ctx: any, // More flexible typing to handle different context types
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
 * Helper function to check if a user is an admin using CLERK METADATA
 * This checks Clerk's publicMetadata.role instead of a separate Convex table
 */
export async function requireAdminClerk(
  ctx: any, // More flexible typing to handle different context types
  functionName: string
) {
  const identity = await requireAuth(ctx, functionName);
  
  // If we're in development and skipping auth checks
  if (!identity && isDevelopment) {
    return { isAdmin: true, identity: null };
  }
  
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  console.log("🔍 Checking admin access for user:", {
    email: identity.email,
    subject: identity.subject,
    tokenIdentifier: identity.tokenIdentifier,
    publicMetadata: identity.publicMetadata,
    emailAddresses: identity.emailAddresses
  });

  // Check if the email matches the known admin email - try multiple fields
  const userEmail = identity.email || identity.emailAddresses?.[0]?.emailAddress
  const isKnownAdmin = userEmail === "adm-realigna@7thw.com"
  
  // Also check for role in Clerk metadata (if set)
  const clerkRole = (identity.publicMetadata as any)?.role
  const isAdminByRole = clerkRole === "admin"
  
  const isAdmin = isKnownAdmin || isAdminByRole;
  
  if (!isAdmin) {
    console.log("❌ Admin access denied:", {
      userEmail,
      isKnownAdmin,
      isAdminByRole,
      clerkRole,
      functionName
    });
    
    if (isDevelopment) {
      console.log(`⚠️ WARNING: Non-admin user accessing ${functionName} (allowed in development)`);
      return { isAdmin: true, identity }; // Allow in development
    } else {
      throw new ConvexError("Admin access required");
    }
  }
  
  console.log("✅ Admin access granted for:", userEmail);
  return { isAdmin: true, identity };
}

/**
 * Check if current user is admin (query version)
 */
export async function isCurrentUserAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    return false;
  }
  
  // Check if the email matches the known admin email - try multiple fields
  const userEmail = identity.email || identity.emailAddresses?.[0]?.emailAddress
  const isKnownAdmin = userEmail === "adm-realigna@7thw.com"
  
  // Also check for role in Clerk metadata (if set)
  const clerkRole = (identity.publicMetadata as any)?.role
  const isAdminByRole = clerkRole === "admin"
  
  return isKnownAdmin || isAdminByRole;
}
