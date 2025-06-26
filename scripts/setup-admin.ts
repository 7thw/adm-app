// Set Admin User in Clerk
// This is a one-time setup script to configure admin access

import { clerkClient } from "@clerk/nextjs/server";

/**
 * Set admin status for a user by email
 * Run this once to configure your admin user
 */
async function setAdminUser(email: string) {
  try {
    // Find user by email
    const users = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    if (users.length === 0) {
      console.error(`❌ User not found with email: ${email}`);
      return;
    }

    const user = users[0];
    console.log(`Found user: ${user.emailAddresses[0]?.emailAddress}`);

    // Update user metadata to set admin role
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: "admin",
        permissions: ["media_upload", "media_delete", "media_edit", "admin_panel"]
      }
    });

    console.log(`✅ Successfully set admin role for: ${email}`);
    console.log(`User ID: ${user.id}`);
    
  } catch (error) {
    console.error("❌ Error setting admin user:", error);
  }
}

/**
 * Check admin status for a user by email
 */
async function checkAdminStatus(email: string) {
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    if (users.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      return;
    }

    const user = users[0];
    const metadata = user.publicMetadata as any;
    const isAdmin = metadata?.role === "admin";

    console.log(`User: ${email}`);
    console.log(`Admin Status: ${isAdmin ? "✅ ADMIN" : "❌ NOT ADMIN"}`);
    console.log(`Metadata:`, metadata);
    
    return isAdmin;
  } catch (error) {
    console.error("❌ Error checking admin status:", error);
  }
}

// Uncomment and run the function you need:

// Set admin status (run once)
// setAdminUser("adm-realigna@7thw.com");

// Check admin status
// checkAdminStatus("adm-realigna@7thw.com");

export { setAdminUser, checkAdminStatus };
