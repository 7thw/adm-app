"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Define the type for core playlist
type CorePlaylist = Doc<"corePlaylists"> & {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: "draft" | "published";
  categoryId: string;
  playCount: number;
  totalDuration?: number;
};

interface PlaylistSettingsPageProps {
  params: {
    id: string;
  };
}

export default function PlaylistSettingsPage({ params }: PlaylistSettingsPageProps) {
  const router = useRouter();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  // Fetch data
  const playlist = useQuery(api.corePlaylists.getByStringId, { id: params.id }) as CorePlaylist | null | undefined;
  const sections = useQuery(api.coreSections.getByCorePlaylistId,
    playlist?._id ? { playlistId: playlist._id } : "skip"
  );
  const categories = useQuery(api.playlistCategories.getAllActive) || [];

  // Mutation
  const updatePlaylist = useMutation(api.corePlaylists.update);

  const isLoading = playlist === undefined;

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const handlePublish = async () => {
    try {
      await updatePlaylist({
        id: playlist!._id,
        status: "published",
      });
      toast.success("Playlist published successfully");
      setShowPublishDialog(false);
    } catch (error) {
      console.error("Error publishing playlist:", error);
      toast.error("Failed to publish playlist");
    }
  };

  const handleUnpublish = async () => {
    try {
      await updatePlaylist({
        id: playlist!._id,
        status: "draft",
      });
      toast.success("Playlist unpublished successfully");
      setShowUnpublishDialog(false);
    } catch (error) {
      console.error("Error unpublishing playlist:", error);
      toast.error("Failed to unpublish playlist");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="mt-4 text-lg font-semibold">Playlist not found</h3>
          <p className="text-muted-foreground">The playlist you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const sectionCount = sections?.length || 0;
  const totalMediaCount = 0; // TODO: Calculate from sections
  const isPublished = playlist.status === "published";

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/core-playlists/${params.id}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Playlist
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Playlist Settings</h1>
            <Badge variant={isPublished ? "default" : "outline"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{playlist.title}</p>
        </div>
      </div>

      {/* Publishing Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            Publishing Status
          </CardTitle>
          <CardDescription>
            Control when this playlist becomes available to subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Current Status</h3>
                <p className="text-sm text-muted-foreground">
                  {isPublished
                    ? "This playlist is live and available to subscribers"
                    : "This playlist is in draft mode and not visible to subscribers"}
                </p>
              </div>
              <Badge variant={isPublished ? "default" : "outline"} className="text-sm">
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>

            {isPublished ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Published playlists cannot be edited. To make changes, first unpublish the playlist.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This playlist is in draft mode. Subscribers cannot see or access it until published.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {isPublished ? (
                <Button
                  variant="outline"
                  onClick={() => setShowUnpublishDialog(true)}
                  className="gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Unpublish Playlist
                </Button>
              ) : (
                <Button
                  onClick={() => setShowPublishDialog(true)}
                  className="gap-2"
                  disabled={sectionCount === 0}
                >
                  <Eye className="h-4 w-4" />
                  Publish Playlist
                </Button>
              )}
            </div>

            {sectionCount === 0 && !isPublished && (
              <p className="text-sm text-muted-foreground">
                Add at least one section before publishing this playlist.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Playlist Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Playlist Overview</CardTitle>
          <CardDescription>
            Summary of playlist content and structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{sectionCount}</div>
              <p className="text-sm text-muted-foreground">Sections</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalMediaCount}</div>
              <p className="text-sm text-muted-foreground">Media Items</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{playlist.playCount}</div>
              <p className="text-sm text-muted-foreground">Total Plays</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {playlist.totalDuration ? `${Math.round(playlist.totalDuration / 60)}m` : "0m"}
              </div>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{getCategoryName(playlist.categoryId)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(playlist.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Modified</span>
              <span className="font-medium">
                {new Date(playlist.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish this playlist? Once published:
              <br /><br />
              • The playlist will be visible to all active subscribers
              <br />
              • You won't be able to edit the playlist content until unpublished
              <br />
              • Subscribers can start creating custom playlists based on this content
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogTrigger onClick={handlePublish}>
              Publish Playlist
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Dialog */}
      <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to unpublish this playlist? This will:
              <br /><br />
              • Hide the playlist from all subscribers immediately
              <br />
              • Existing subscriber playlists based on this content will be affected
              <br />
              • Allow you to edit the playlist content again
              <br /><br />
              <strong>Warning:</strong> This may disrupt subscribers who are currently using this content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogTrigger
              onClick={handleUnpublish}
              className="bg-destructive text-white hover:bg-destructive/80"
            >
              Unpublish Playlist
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
