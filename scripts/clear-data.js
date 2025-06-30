// scripts/clear-data.js
// This script clears problematic data from the Convex database
// Run with: node scripts/clear-data.js

const { ConvexClient } = require("convex/browser");
require("dotenv").config({ path: ".env.local" });

async function main() {
  // Get the Convex URL from the environment
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("Error: NEXT_PUBLIC_CONVEX_URL not found in .env.local");
    process.exit(1);
  }

  // Create a Convex client
  const client = new ConvexClient(convexUrl);
  
  try {
    console.log("Connecting to Convex...");
    
    // Clear corePlaylists table
    console.log("Clearing corePlaylists table...");
    const result = await client.mutation("admin/clearData:clearCorePlaylists")();
    console.log("Result:", result);
    
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
