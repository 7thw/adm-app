// convex/playlistCategoriesSetup.ts
import { internalMutation } from "./_generated/server";

// Setup default playlist categories
export const setupDefaultCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if categories already exist
    const existingCategories = await ctx.db.query("playlistCategories").collect();
    
    if (existingCategories.length > 0) {
      console.log("Categories already exist, skipping setup");
      return { message: "Categories already exist" };
    }

    const defaultCategories = [
      {
        name: "Meditation",
        description: "Mindfulness and meditation content for relaxation and focus",
        isActive: true,
        order: 1,
      },
      {
        name: "Sleep & Relaxation",
        description: "Content designed to help users unwind and fall asleep",
        isActive: true,
        order: 2,
      },
      {
        name: "Focus & Concentration",
        description: "Audio content to enhance focus and productivity",
        isActive: true,
        order: 3,
      },
      {
        name: "Nature Sounds",
        description: "Natural ambient sounds for relaxation and background",
        isActive: true,
        order: 4,
      },
      {
        name: "Breathing Exercises",
        description: "Guided breathing and mindfulness exercises",
        isActive: true,
        order: 5,
      },
    ];

    const now = Date.now();

    for (const category of defaultCategories) {
      await ctx.db.insert("playlistCategories", {
        ...category,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`✅ Created ${defaultCategories.length} default playlist categories`);
    return { 
      message: `Created ${defaultCategories.length} default categories`,
      categories: defaultCategories.map(c => c.name)
    };
  },
});
