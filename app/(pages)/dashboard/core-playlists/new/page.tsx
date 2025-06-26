"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaylistForm } from "../_components/playlist-form";

export default function NewPlaylistPage() {
  const router = useRouter();

  const handleSuccess = (playlistId: string) => {
    router.push(`/dashboard/core-playlists/${playlistId}`);
  };

  const handleCancel = () => {
    router.back();
  };

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
          <h1 className="text-3xl font-bold">Create New Playlist</h1>
          <p className="text-muted-foreground">
            Create a new core playlist that subscribers can customize
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Playlist Details
          </CardTitle>
          <CardDescription>
            Enter the basic information for your new playlist. You can add sections and media after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaylistForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            submitLabel="Create Playlist"
          />
        </CardContent>
      </Card>
    </div>
  );
}
