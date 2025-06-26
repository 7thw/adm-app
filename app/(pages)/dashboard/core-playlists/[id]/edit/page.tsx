"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlaylistForm } from "../../_components/playlist-form";
import { Loader2 } from "lucide-react";

interface EditPlaylistPageProps {
  params: {
    id: string;
  };
}

// Define the type for core playlist
type CorePlaylist = Doc<"corePlaylists"> & {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: "draft" | "published";
  categoryId: string;
}

export default function EditPlaylistPage({ params }: EditPlaylistPageProps) {
  const router = useRouter();

  // Fetch playlist data
  const playlist = useQuery(api.corePlaylists.getByStringId, { id: params.id }) as CorePlaylist | null | undefined;
  const categories = useQuery(api.playlistCategories.getAllActive) || [];

  const isLoading = playlist === undefined;

  const handleSuccess = () => {
    router.push(`/dashboard/core-playlists/${params.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading playlist...</span>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="mt-4 text-lg font-semibold">Playlist not found</h3>
          <p className="text-muted-foreground">The playlist you're trying to edit doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Check if playlist is published (can't edit)
  if (playlist.status === "published") {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Playlist</h1>
            <p className="text-muted-foreground">Modify playlist details and settings</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This playlist is published and cannot be edited. Change the status to "draft" first to make changes.
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/core-playlists/${params.id}/settings`)}
              >
                Go to Settings
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Playlist</h1>
          <p className="text-muted-foreground">Modify playlist details and settings</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Playlist Details
          </CardTitle>
          <CardDescription>
            Update the information for this playlist. Changes will be saved immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaylistForm
            isEdit={true}
            playlistId={params.id}
            initialData={{
              title: playlist.title,
              description: playlist.description || "",
              categoryId: playlist.categoryId,
              thumbnailUrl: playlist.thumbnailUrl || "",
            }}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            submitLabel="Update Playlist"
          />
        </CardContent>
      </Card>
    </div>
  );
}
