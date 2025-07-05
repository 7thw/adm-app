import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  admin: {
    initializeAdminUser: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    listCoreCategories: FunctionReference<
      "query",
      "public",
      { includeInactive?: boolean },
      any
    >;
    createCoreCategory: FunctionReference<
      "mutation",
      "public",
      {
        color?: string;
        description?: string;
        iconUrl?: string;
        name: string;
        slug: string;
      },
      any
    >;
    addCoreMediaTag: FunctionReference<
      "mutation",
      "public",
      { coreMediaId: Id<"medias">; tag: string },
      any
    >;
    removeCoreMediaTag: FunctionReference<
      "mutation",
      "public",
      { coreMediaId: Id<"medias">; tag: string },
      any
    >;
    getCoreMediaTags: FunctionReference<
      "query",
      "public",
      { coreMediaId: Id<"medias"> },
      any
    >;
    searchCoreMediaByTags: FunctionReference<
      "query",
      "public",
      {
        matchAll?: boolean;
        mediaType?: "audio" | "video";
        tags: Array<string>;
      },
      any
    >;
    listCoreMedias: FunctionReference<
      "query",
      "public",
      { mediaType?: "audio" | "video"; publicOnly?: boolean },
      any
    >;
    createCoreMedia: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        duration: number;
        embedUrl?: string;
        isPublic?: boolean;
        mediaType: "audio" | "video";
        storageId?: Id<"_storage">;
        title: string;
        youtubeId?: string;
      },
      any
    >;
    updateCoreMedia: FunctionReference<
      "mutation",
      "public",
      {
        bitrate?: number;
        coreMediaId: Id<"medias">;
        description?: string;
        isPublic?: boolean;
        quality?: string;
        thumbnailStorageId?: Id<"_storage">;
        thumbnailUrl?: string;
        title?: string;
        transcript?: string;
        waveformData?: string;
      },
      any
    >;
    deleteCoreMedia: FunctionReference<
      "mutation",
      "public",
      { coreMediaId: Id<"medias"> },
      any
    >;
    updateCoreMediaMetadata: FunctionReference<
      "mutation",
      "public",
      {
        bitrate?: number;
        contentType?: string;
        coreMediaId: Id<"medias">;
        duration?: number;
        fileSize?: number;
        processingStatus?: "pending" | "processing" | "completed" | "failed";
        quality?: string;
        storageId?: Id<"_storage">;
        thumbnailStorageId?: Id<"_storage">;
        thumbnailUrl?: string;
        transcript?: string;
        waveformData?: string;
      },
      any
    >;
    generateUploadUrl: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    listCorePlaylists: FunctionReference<
      "query",
      "public",
      { categoryId?: Id<"coreCategories">; status?: "draft" | "published" },
      any
    >;
    createCorePlaylist: FunctionReference<
      "mutation",
      "public",
      {
        categoryId: Id<"coreCategories">;
        description?: string;
        thumbnailStorageId?: Id<"_storage">;
        title: string;
      },
      any
    >;
    updateCorePlaylist: FunctionReference<
      "mutation",
      "public",
      {
        categoryId?: Id<"coreCategories">;
        corePlaylistId: Id<"corePlaylists">;
        description?: string;
        status?: "draft" | "published";
        thumbnailStorageId?: Id<"_storage">;
        title?: string;
      },
      any
    >;
    publishCorePlaylist: FunctionReference<
      "mutation",
      "public",
      { corePlaylistId: Id<"corePlaylists"> },
      any
    >;
    createCoreSection: FunctionReference<
      "mutation",
      "public",
      {
        corePlaylistId: Id<"corePlaylists">;
        description?: string;
        isRequired?: boolean;
        maxSelectMedia: number;
        minSelectMedia: number;
        sectionType: "base" | "loop";
        title: string;
      },
      any
    >;
    addMediaToCoreSection: FunctionReference<
      "mutation",
      "public",
      {
        coreMediaId: Id<"medias">;
        coreSectionId: Id<"coreSections">;
        defaultSelected?: boolean;
        isOptional?: boolean;
      },
      any
    >;
    listCoreSections: FunctionReference<
      "query",
      "public",
      { corePlaylistId?: Id<"corePlaylists"> },
      any
    >;
    updateCoreSection: FunctionReference<
      "mutation",
      "public",
      {
        coreSectionId: Id<"coreSections">;
        description?: string;
        isRequired?: boolean;
        maxSelectMedia?: number;
        minSelectMedia?: number;
        sectionType?: "base" | "loop";
        title?: string;
      },
      any
    >;
    deleteCoreSection: FunctionReference<
      "mutation",
      "public",
      { coreSectionId: Id<"coreSections"> },
      any
    >;
    reorderCoreSections: FunctionReference<
      "mutation",
      "public",
      { sectionOrders: Array<{ id: Id<"coreSections">; order: number }> },
      any
    >;
    deleteCorePlaylist: FunctionReference<
      "mutation",
      "public",
      { corePlaylistId: Id<"corePlaylists"> },
      any
    >;
    duplicateCorePlaylist: FunctionReference<
      "mutation",
      "public",
      {
        copyToCategory?: Id<"coreCategories">;
        keepSections?: boolean;
        newTitle: string;
        sourcePlaylistId: Id<"corePlaylists">;
      },
      any
    >;
    updateCorePlaylistThumbnail: FunctionReference<
      "mutation",
      "public",
      {
        corePlaylistId: Id<"corePlaylists">;
        thumbnailStorageId?: Id<"_storage">;
      },
      any
    >;
    addMediasToCoreSectionBatch: FunctionReference<
      "mutation",
      "public",
      {
        coreMediaIds: Array<Id<"medias">>;
        coreSectionId: Id<"coreSections">;
        startOrder?: number;
      },
      any
    >;
    removeMediasFromCoreSection: FunctionReference<
      "mutation",
      "public",
      { coreMediaIds: Array<Id<"medias">>; coreSectionId: Id<"coreSections"> },
      any
    >;
    getPlaylistPreview: FunctionReference<
      "query",
      "public",
      { corePlaylistId: Id<"corePlaylists"> },
      any
    >;
    getCorePlaylistStats: FunctionReference<
      "query",
      "public",
      { corePlaylistId: Id<"corePlaylists"> },
      any
    >;
    listSectionMedia: FunctionReference<
      "query",
      "public",
      { coreSectionId: Id<"coreSections"> },
      any
    >;
    updateSectionMediaSelection: FunctionReference<
      "mutation",
      "public",
      { defaultSelected: boolean; sectionMediaId: Id<"sectionMedias"> },
      any
    >;
    reorderSectionMedia: FunctionReference<
      "mutation",
      "public",
      {
        coreSectionId: Id<"coreSections">;
        reorderedItems: Array<{ id: Id<"sectionMedias">; order: number }>;
      },
      any
    >;
    removeSectionMedia: FunctionReference<
      "mutation",
      "public",
      { sectionMediaId: Id<"sectionMedias"> },
      any
    >;
    batchAddMediasToSection: FunctionReference<
      "mutation",
      "public",
      {
        coreMediaIds: Array<Id<"medias">>;
        coreSectionId: Id<"coreSections">;
        startOrder?: number;
      },
      any
    >;
    batchRemoveMediasFromSection: FunctionReference<
      "mutation",
      "public",
      { coreMediaIds: Array<Id<"medias">>; coreSectionId: Id<"coreSections"> },
      any
    >;
  };
  analytics: {
    trackInstallEvent: FunctionReference<
      "mutation",
      "public",
      {
        context?: string;
        event: string;
        platform?: string;
        sessionId?: string;
        timestamp?: number;
        userAgent?: string;
        variant?: string;
      },
      any
    >;
    getInstallAnalytics: FunctionReference<
      "query",
      "public",
      { groupBy?: string; timeframe?: string },
      any
    >;
    getInstallAnalyticsDetail: FunctionReference<
      "query",
      "public",
      {
        endDate: number;
        platform?: string;
        startDate: number;
        variant?: string;
      },
      any
    >;
    trackUserEvent: FunctionReference<
      "mutation",
      "public",
      { event: string; properties?: any; sessionId?: string },
      any
    >;
  };
  auth: {
    isAuthenticated: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    loggedInUser: FunctionReference<"query", "public", any, any>;
    signIn: FunctionReference<
      "action",
      "public",
      {
        calledBy?: string;
        params?: any;
        provider?: string;
        refreshToken?: string;
        verifier?: string;
      },
      any
    >;
    signOut: FunctionReference<"action", "public", Record<string, never>, any>;
  };
  r2Upload: {
    createCoreMediaRecord: FunctionReference<
      "mutation",
      "public",
      {
        contentType?: string;
        description?: string;
        duration: number;
        fileSize?: number;
        mediaType: "audio" | "video";
        r2Key: string;
        title: string;
      },
      any
    >;
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
  subscribers: {
    getPublishedCorePlaylists: FunctionReference<
      "query",
      "public",
      { categoryId?: Id<"coreCategories"> },
      any
    >;
    getCorePlaylistDetails: FunctionReference<
      "query",
      "public",
      { corePlaylistId: Id<"corePlaylists"> },
      any
    >;
    getUserPlaylists: FunctionReference<
      "query",
      "public",
      { activeOnly?: boolean },
      any
    >;
    createUserPlaylist: FunctionReference<
      "mutation",
      "public",
      {
        corePlaylistId: Id<"corePlaylists">;
        mediaSelections: string;
        title: string;
      },
      any
    >;
    updateUserPlaylist: FunctionReference<
      "mutation",
      "public",
      {
        isFavorite?: boolean;
        mediaSelections?: string;
        title?: string;
        userPlaylistId: Id<"userPlaylists">;
      },
      any
    >;
    getUserPlayerSettings: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    updatePlayerSettings: FunctionReference<
      "mutation",
      "public",
      {
        autoPlay?: boolean;
        autoSync?: boolean;
        backgroundPlayback?: boolean;
        countDownTimer?: number;
        downloadQuality?: "low" | "medium" | "high";
        maxLoop?: number;
        playbackSpeed?: number;
        shuffleMode?: boolean;
        volume?: number;
        wifiOnlyDownload?: boolean;
      },
      any
    >;
    updatePlaybackProgress: FunctionReference<
      "mutation",
      "public",
      {
        completed?: boolean;
        currentPosition: number;
        mediaId: Id<"medias">;
        timeSpent?: number;
        userPlaylistId: Id<"userPlaylists">;
      },
      any
    >;
    debugUserAuth: FunctionReference<"query", "public", any, any>;
    ensureUserProfile: FunctionReference<"mutation", "public", any, any>;
  };
  debug_functions: {
    debugUserAuth: FunctionReference<"query", "public", any, any>;
    ensureUserProfile: FunctionReference<"mutation", "public", any, any>;
  };
};
export type InternalApiType = {};
