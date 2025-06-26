// convex/adminSetup.ts - Helper to create admin user for testing
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create an admin user for testing (run this once)
export const createTestAdmin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, name }) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Must be signed in to create admin user");
    }

    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (existingAdmin) {
      return { message: "Admin user already exists", adminId: existingAdmin._id };
    }

    // Create admin user
    const adminId = await ctx.db.insert("adminUsers", {
      clerkId: identity.subject,
      email: email,
      firstName: name.split(' ')[0],
      lastName: name.split(' ')[1] || '',
      imageUrl: identity.pictureUrl,
      tokenIdentifier: identity.tokenIdentifier,
      name: name,
      role: "admin" as const,
      subscriptionStatus: "active" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("Created admin user:", adminId);
    return { message: "Admin user created successfully", adminId };
  },
});

// Check current user's admin status
export const checkAdminStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return { 
        isSignedIn: false, 
        isAdmin: false, 
        message: "Not signed in" 
      };
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    return {
      isSignedIn: true,
      isAdmin: !!adminUser,
      adminRole: adminUser?.role,
      userEmail: identity.email,
      message: adminUser ? "Admin access confirmed" : "No admin privileges"
    };
  },
});
