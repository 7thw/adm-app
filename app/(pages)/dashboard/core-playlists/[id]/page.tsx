"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Settings, 
  Eye, 
  Loader2,
  Badge as BadgeIcon,
  Clock,
  Play
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionsDataTable } from "../_components/sections-data-table";
import { AddSectionDialog } from "../_components/add-section-dialog";

interface PlaylistDetailPageProps {
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
  playCount: number;
  totalDuration?: number;
};

export default function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const router = useRouter();
  const [showAddSection, setShowAddSection] = useState(false);

  // Fetch playlist data
  const playlist = useQuery(api.corePlaylists.getByStringId, { id: params.id }) as CorePlaylist | null | undefined;
  const sections = useQuery(api.coreSections.getByCorePlaylistId, 
    playlist?._id ? { playlistId: playlist._id as Id<"corePlaylists"> } : "skip"
  );
  const categories = useQuery(api.playlistCategories.getAllActive) || [];

  // Loading states
  const isLoading = playlist === undefined;

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Unknown Category";
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
          <p className="text-muted-foreground">The playlist you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/core-playlists")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Playlists
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{playlist.title}</h1>
            <Badge variant={playlist.status === "published" ? "default" : "outline"}>
              {playlist.status === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{playlist.description || "No description"}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/core-playlists/${params.id}/edit`)}
            disabled={playlist.status === "published"}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/core-playlists/${params.id}/settings`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Playlist Info Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BadgeIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{getCategoryName(playlist.categoryId)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Play Count</p>
                <p className="text-sm text-muted-foreground">{playlist.playCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {playlist.totalDuration ? `${Math.round(playlist.totalDuration / 60)} min` : "Not calculated"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-primary rounded" />
              <div>
                <p className="text-sm font-medium">Sections</p>
                <p className="text-sm text-muted-foreground">{sections?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Sections Management */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sections</h2>
            <p className="text-muted-foreground">
              Manage the sections and media in this playlist
            </p>
          </div>
          <Button
            onClick={() => setShowAddSection(true)}
            disabled={playlist.status === "published"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {sections && (
          <SectionsDataTable
            sections={sections}
            playlistId={playlist._id}
            isPublished={playlist.status === "published"}
          />
        )}
      </div>

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={showAddSection}
        onOpenChange={setShowAddSection}
        playlistId={playlist._id}
        onSuccess={() => {
          setShowAddSection(false);
          toast.success("Section added successfully");
        }}
      />
    </div>
  );
}
