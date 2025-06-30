import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  messages: {
    getForCurrentUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
  };
  adminUsers: {
    getAdminUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getAllUsers: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    storeAdminUser: FunctionReference<
      "mutation",
      "public",
      { email?: string },
      any
    >;
  };
  subscriberUsers: {
    getSubscriberUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    storeSubscriberUser: FunctionReference<
      "mutation",
      "public",
      { email?: string },
      any
    >;
  };
  media: {
    generateUploadUrl: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      { key: string; url: string }
    >;
    syncMetadata: FunctionReference<
      "mutation",
      "public",
      { key: string },
      null
    >;
    updateUploadMetadata: FunctionReference<
      "mutation",
      "public",
      {
        contentType?: string;
        description?: string;
        duration?: number;
        fileSize?: number;
        title?: string;
        uploadKey: string;
      },
      any
    >;
    createVideoMedia: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        duration: number;
        mediaUrl: string;
        thumbnailUrl?: string;
        title: string;
      },
      any
    >;
    getAllMedia: FunctionReference<"query", "public", { limit?: number }, any>;
    getMediaById: FunctionReference<
      "query",
      "public",
      { id: Id<"media"> },
      any
    >;
    getMediaByType: FunctionReference<
      "query",
      "public",
      { limit?: number; mediaType: "audio" | "video" },
      any
    >;
    updateMedia: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        duration?: number;
        id: Id<"media">;
        thumbnailUrl?: string;
        title?: string;
      },
      any
    >;
    deleteMedia: FunctionReference<
      "mutation",
      "public",
      { id: Id<"media"> },
      any
    >;
    searchMedia: FunctionReference<
      "query",
      "public",
      { limit?: number; mediaType?: "audio" | "video"; searchTerm: string },
      any
    >;
    cleanupFailedUploads: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    fixBrokenMediaUrls: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
  };
  clearDatabase: {
    clearTable: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    clearAllTables: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
  };
  r2Upload: {
    generateUploadUrl: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      { key: string; url: string }
    >;
    syncMetadata: FunctionReference<
      "mutation",
      "public",
      { key: string },
      null
    >;
  };
  adminSetup: {
    createTestAdmin: FunctionReference<
      "mutation",
      "public",
      { email: string; name: string },
      any
    >;
    checkAdminStatus: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
  };
  playlistCategories: {
    getAll: FunctionReference<"query", "public", Record<string, never>, any>;
    getAllActive: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getById: FunctionReference<
      "query",
      "public",
      { id: Id<"playlistCategories"> },
      any
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { description?: string; isActive?: boolean; name: string },
      any
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        id: Id<"playlistCategories">;
        isActive?: boolean;
        name?: string;
      },
      any
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"playlistCategories"> },
      any
    >;
    reorder: FunctionReference<
      "mutation",
      "public",
      {
        categoryOrders: Array<{ id: Id<"playlistCategories">; order: number }>;
      },
      any
    >;
  };
  corePlaylists: {
    getAll: FunctionReference<"query", "public", Record<string, never>, any>;
    getById: FunctionReference<
      "query",
      "public",
      { id: Id<"corePlaylists"> },
      any
    >;
    getByStringId: FunctionReference<"query", "public", { id: string }, any>;
    getByCategoryId: FunctionReference<
      "query",
      "public",
      { categoryId: Id<"playlistCategories"> },
      any
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        categoryId: Id<"playlistCategories">;
        description?: string;
        thumbnailUrl?: string;
        title: string;
      },
      any
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        categoryId?: Id<"playlistCategories">;
        description?: string;
        id: Id<"corePlaylists">;
        status?: "draft" | "published";
        thumbnailUrl?: string;
        title?: string;
      },
      any
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"corePlaylists"> },
      any
    >;
  };
  coreSections: {
    getByCorePlaylistId: FunctionReference<
      "query",
      "public",
      { playlistId: Id<"corePlaylists"> },
      any
    >;
    getById: FunctionReference<
      "query",
      "public",
      { id: Id<"coreSections"> },
      any
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        maxSelectMedia: number;
        minSelectMedia: number;
        playlistId: Id<"corePlaylists">;
        sectionType: "base" | "loop";
        title: string;
      },
      any
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        id: Id<"coreSections">;
        maxSelectMedia?: number;
        minSelectMedia?: number;
        sectionType?: "base" | "loop";
        title?: string;
      },
      any
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"coreSections"> },
      any
    >;
    reorder: FunctionReference<
      "mutation",
      "public",
      { sectionOrders: Array<{ id: Id<"coreSections">; order: number }> },
      any
    >;
  };
  coreSectionMedia: {
    getBySectionId: FunctionReference<
      "query",
      "public",
      { sectionId: Id<"coreSections"> },
      any
    >;
    getSelectedBySectionId: FunctionReference<
      "query",
      "public",
      { sectionId: Id<"coreSections"> },
      any
    >;
    addMedia: FunctionReference<
      "mutation",
      "public",
      {
        isRequired?: boolean;
        mediaId: Id<"media">;
        sectionId: Id<"coreSections">;
      },
      any
    >;
    updateSelection: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sectionMedia">; isRequired?: boolean },
      any
    >;
    reorderMedia: FunctionReference<
      "mutation",
      "public",
      { mediaOrders: Array<{ id: Id<"sectionMedia">; order: number }> },
      any
    >;
    removeMedia: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sectionMedia"> },
      any
    >;
    bulkUpdateSelections: FunctionReference<
      "mutation",
      "public",
      { updates: Array<{ id: Id<"sectionMedia">; isRequired: boolean }> },
      any
    >;
    getSelectionCount: FunctionReference<
      "query",
      "public",
      { sectionId: Id<"coreSections"> },
      any
    >;
  };
  mediaUrls: {
    getSignedUrl: FunctionReference<
      "query",
      "public",
      {
        mediaId: Id<"medias">;
        expirationSeconds?: number;
      },
      { url: string; isSignedUrl: boolean; expiresAt?: number }
    >;
    getBatchSignedUrls: FunctionReference<
      "query",
      "public",
      {
        mediaIds: Array<Id<"medias">>;
        expirationSeconds?: number;
      },
      Array<{
        mediaId: string;
        url: string | null;
        isSignedUrl: boolean;
        error?: string;
        expiresAt?: number;
        title?: string;
        mediaType?: string;
      }>
    >;
  };
};

export type InternalApiType = {};
