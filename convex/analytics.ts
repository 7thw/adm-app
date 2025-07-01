import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Track PWA installation analytics events
 */
export const trackInstallEvent = mutation({
  args: {
    event: v.string(), // 'install_prompt_shown' | 'install_success' | 'install_dismissed' | 'install_error'
    platform: v.optional(v.string()), // 'mobile' | 'desktop' | 'unknown'
    variant: v.optional(v.string()), // 'card' | 'button' | 'banner'
    context: v.optional(v.string()), // Additional context like A/B test variant
    userAgent: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    sessionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get user identity (can be null for anonymous tracking)
    const identity = await ctx.auth.getUserIdentity()

    // Only track for authenticated users, skip anonymous tracking for now
    if (!identity?.subject) {
      return;
    }

    await ctx.db.insert('analyticsEvents', {
      userId: identity.subject as any, // Cast to Id<"users">
      eventType: args.event,
      eventData: JSON.stringify({
        platform: args.platform || 'unknown',
        variant: args.variant || 'unknown',
        context: args.context
      }),
      sessionId: args.sessionId || undefined,
      deviceType: args.platform || undefined,
      userAgent: args.userAgent || undefined,
      timestamp: args.timestamp || Date.now()
    })
  }
})

/**
 * Get install analytics summary for admin dashboard
 */
export const getInstallAnalytics = query({
  args: {
    timeframe: v.optional(v.string()), // '24h', '7d', '30d', 'all'
    groupBy: v.optional(v.string()) // 'platform', 'variant', 'event'
  },
  handler: async (ctx, args) => {
    // Require admin access
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Authentication required')
    }

    // Check if user is admin (implement your admin check logic)
    // For now, just check if user exists

    const timeframe = args.timeframe || '7d'
    const now = Date.now()

    let timeframeCutoff = 0
    switch (timeframe) {
      case '24h':
        timeframeCutoff = now - (24 * 60 * 60 * 1000)
        break
      case '7d':
        timeframeCutoff = now - (7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        timeframeCutoff = now - (30 * 24 * 60 * 60 * 1000)
        break
      default:
        timeframeCutoff = 0
    }

    const analytics = await ctx.db
      .query('installAnalytics')
      .filter(q => q.gte(q.field('timestamp'), timeframeCutoff))
      .collect()

    // Group and aggregate the data
    const summary = {
      totalEvents: analytics.length,
      promptsShown: analytics.filter(a => a.event === 'install_prompt_shown').length,
      installs: analytics.filter(a => a.event === 'install_success').length,
      dismissals: analytics.filter(a => a.event === 'install_dismissed').length,
      errors: analytics.filter(a => a.event === 'install_error').length,
      conversionRate: 0,
      platforms: {} as Record<string, number>,
      variants: {} as Record<string, number>
    }

    // Calculate conversion rate
    if (summary.promptsShown > 0) {
      summary.conversionRate = (summary.installs / summary.promptsShown) * 100
    }

    // Group by platform
    analytics.forEach(event => {
      if (event.platform) {
        summary.platforms[event.platform] = (summary.platforms[event.platform] || 0) + 1
      }
    })

    // Group by variant
    analytics.forEach(event => {
      if (event.variant) {
        summary.variants[event.variant] = (summary.variants[event.variant] || 0) + 1
      }
    })

    return summary
  }
})

/**
 * Get detailed install analytics for specific time period
 */
export const getInstallAnalyticsDetail = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    platform: v.optional(v.string()),
    variant: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require admin access
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Authentication required')
    }

    let query = ctx.db
      .query('installAnalytics')
      .filter(q =>
        q.and(
          q.gte(q.field('timestamp'), args.startDate),
          q.lte(q.field('timestamp'), args.endDate)
        )
      )

    if (args.platform) {
      query = query.filter(q => q.eq(q.field('platform'), args.platform))
    }

    if (args.variant) {
      query = query.filter(q => q.eq(q.field('variant'), args.variant))
    }

    const analytics = await query
      .order('desc')
      .take(1000) // Limit to 1000 records for performance

    return analytics
  }
})

/**
 * Track general user analytics events
 */
export const trackUserEvent = mutation({
  args: {
    event: v.string(), // Event name
    properties: v.optional(v.any()), // Event properties as JSON
    sessionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    await ctx.db.insert('userAnalytics', {
      event: args.event,
      properties: args.properties,
      sessionId: args.sessionId,
      userId: identity?.subject,
      userEmail: identity?.email,
      timestamp: Date.now(),
      createdAt: Date.now()
    })
  }
})
