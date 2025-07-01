import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  admin: {
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
    listMedias: FunctionReference<
      "query",
      "public",
      { mediaType?: "audio" | "video"; publicOnly?: boolean },
      any
    >;
    createMedia: FunctionReference<
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
        difficulty?: "beginner" | "intermediate" | "advanced";
        title: string;
      },
      any
    >;
    publishCorePlaylist: FunctionReference<
      "mutation",
      "public",
      { playlistId: Id<"corePlaylists"> },
      any
    >;
    createCoreSection: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        isRequired?: boolean;
        maxSelectMedia: number;
        minSelectMedia: number;
        playlistId: Id<"corePlaylists">;
        sectionType: "base" | "loop";
        title: string;
      },
      any
    >;
    addMediaToSection: FunctionReference<
      "mutation",
      "public",
      {
        defaultSelected?: boolean;
        isOptional?: boolean;
        mediaId: Id<"medias">;
        sectionId: Id<"coreSections">;
      },
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
  subscribers: {
    getPublishedPlaylists: FunctionReference<
      "query",
      "public",
      { categoryId?: Id<"coreCategories"> },
      any
    >;
    getPlaylistDetails: FunctionReference<
      "query",
      "public",
      { playlistId: Id<"corePlaylists"> },
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
  };
};
export type InternalApiType = {};
