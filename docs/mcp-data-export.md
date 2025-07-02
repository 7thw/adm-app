# MCP Data Export - Realigna Project

This document contains all available data retrieved from MCP Clerk and MCP Convex servers.

## Date: January 31, 2025

---

## Clerk Data

### User Count
- **Total Users**: 4

### Current Authentication Status
- **Current User ID**: null (no user currently authenticated in MCP session)

---

## Convex Data

### Deployment Information

#### Available Deployments:
1. **Development (ownDev)**
   - URL: `https://original-jellyfish-218.convex.cloud`
   - Status: Active

2. **Production (prod)**
   - URL: `https://trustworthy-bird-366.convex.cloud`
   - Status: Active

### Environment Variables (Development)

| Variable Name | Value |
|---------------|-------|
| CLERK_JWT_ISSUER_DOMAIN | https://vital-raven-46.clerk.accounts.dev |
| CLERK_SECRET_KEY | sk_test_XuZ9KVxziy3BFifd2DNIn9R2MVXjl15Mn9hieqpa0B |
| CLERK_WEBHOOK_SECRET | whsec_2kvG8SAppcmjT+GtStgsJNMkwFaSuL7t |
| CONVEX_DEPLOYMENT | dev:original-jellyfish-218 |
| CONVEX_RESEND_API_KEY | re_Lshcm4MV_5LwxP5sUGKTMNcupx4sCWAd4 |
| NEXT_PUBLIC_CLERK_FRONTEND_API_URL | https://vital-raven-46.clerk.accounts.dev |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | pk_test_dml0YWwtcmF2ZW4tNDYuY2xlcmsuYWNjb3VudHMuZGV2JA |
| NEXT_PUBLIC_CONVEX_URL | https://original-jellyfish-218.convex.cloud |
| R2_ACCESS_KEY_ID | 4bd4542d443440d5155636985cb746d2 |
| R2_BUCKET | realigna-adm |
| R2_BUCKET_NAME | realigna-adm |
| R2_ENDPOINT | https://ecb7468fbc99ab75e694ef8907a72d3a.r2.cloudflarestorage.com |
| R2_PUBLIC_URL | https://r2-realigna.7thw.co |
| R2_SECRET_ACCESS_KEY | e118cda3f898a378150e349edf6f2d52212bddad322d8cf0d895bab2b972cdb2 |
| R2_TOKEN | 0lBq7p7WR9DrWQGI56CjbS4B7n-iYNR_dxhOkWFi |
| SITE_URL | https://adm-realigna.7thw.co |

### Database Schema (Development)

#### Tables Overview:

1. **adminActions**
   - Fields: _id, _creationTime, action, adminId, details, metadata, targetId, targetType
   - Indexes: by_admin_id, by_target, by_creation_time
   - Current Records: 0

2. **analyticsEvents**
   - Fields: _id, _creationTime, eventType, userId, sessionId, metadata, timestamp
   - Indexes: by_user_id, by_session_id, by_event_type, by_timestamp
   - Current Records: 0

3. **coreCategories**
   - Fields: _id, _creationTime, name, description, slug, isActive, sortOrder, metadata
   - Indexes: by_slug, by_sort_order, by_active_status
   - Current Records: 0

4. **corePlaylists**
   - Fields: _id, _creationTime, title, description, categoryId, isActive, sortOrder, metadata
   - Indexes: by_category_id, by_sort_order, by_active_status
   - Current Records: 0

5. **medias**
   - Fields: _id, _creationTime, title, description, type, url, thumbnailUrl, duration, fileSize, metadata
   - Indexes: by_type, by_creation_time, by_title
   - Current Records: 0

6. **notifications**
   - Fields: _id, _creationTime, userId, type, title, message, isRead, metadata
   - Indexes: by_user_id, by_read_status, by_type, by_creation_time
   - Current Records: 0

7. **organizationRoles**
   - Fields: _id, _creationTime, organizationId, userId, role, permissions, isActive
   - Indexes: by_organization_id, by_user_id, by_role
   - Current Records: 0

8. **sessions**
   - Fields: _id, _creationTime, userId, sessionToken, expiresAt, metadata
   - Indexes: by_user_id, by_session_token, by_expires_at
   - Current Records: 0

9. **subscriptionUsage**
   - Fields: _id, _creationTime, userId, subscriptionId, usageType, amount, period, metadata
   - Indexes: by_user_id, by_subscription_id, by_usage_type, by_period
   - Current Records: 0

10. **uploadSessions**
    - Fields: _id, _creationTime, userId, sessionId, status, fileCount, totalSize, metadata
    - Indexes: by_user_id, by_session_id, by_status, by_creation_time
    - Current Records: 0

11. **users**
    - Fields: _id, _creationTime, clerkId, tokenIdentifier, email, role, plan, features
    - Indexes: by_clerk_id, by_token_identifier
    - Current Records: 0

### Available Convex Functions

#### Admin Functions (admin.js):
- **Queries**: getCategories, getCategory, getMedias, getMedia, getPlaylists, getPlaylist, getSections, getSection
- **Mutations**: createCategory, updateCategory, deleteCategory, createMedia, updateMedia, deleteMedia, createPlaylist, updatePlaylist, deletePlaylist, createSection, updateSection, deleteSection

#### Analytics Functions (analytics.js):
- **Mutations**: trackEvent, trackPageView, trackUserAction

#### Authentication Functions (auth.js):
- **Queries**: getAuthStatus, getCurrentUser
- **Mutations**: loginUser, signInUser, signOutUser, createSession, updateSession, deleteSession

---

## Summary

### Current State:
- **Clerk**: 4 total users registered, but no user currently authenticated in MCP session
- **Convex**: Complete database schema deployed with 11 tables, but all tables are currently empty (0 records)
- **Environment**: Fully configured with Clerk authentication, Convex backend, and R2 storage integration
- **Deployments**: Both development and production environments are active and accessible

### Key Observations:
1. The system is fully set up and configured but appears to be in a fresh/clean state with no data
2. All necessary integrations are in place (Clerk, Convex, R2 storage, Resend email)
3. The database schema matches the project requirements with proper indexing
4. Authentication and authorization infrastructure is properly configured

### Next Steps:
- Seed the database with initial data if needed
- Test user registration and authentication flows
- Verify all integrations are working correctly
- Begin content management and user onboarding processes