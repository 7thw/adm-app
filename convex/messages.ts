import { v } from "convex/values";
import { query } from './_generated/server'

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
      throw new Error('Not authenticated')
    }
    return await ctx.db
      .query('messages')
      .filter((q) => q.eq(q.field('user'), identity.email))
      .collect()
  },
})