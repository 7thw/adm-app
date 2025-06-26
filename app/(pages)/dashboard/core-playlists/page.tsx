"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit, Eye, List, Loader2, PlusCircle, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CorePlaylistsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null);

  // Fetch core playlists from Convex
  const playlists = useQuery(api.corePlaylists.getAll) || [];

  // Get playlist categories to display category names
  const categories = useQuery(api.playlistCategories.getAllActive) || [];

  // Delete mutation
  const deletePlaylist = useMutation(api.corePlaylists.remove);

  // Loading state based on Convex query
  const isLoading = playlists === undefined;

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (getCategoryName(playlist.categoryId).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle playlist deletion
  const handleDeletePlaylist = async () => {
    if (!deletePlaylistId) return;

    try {
      await deletePlaylist({ id: deletePlaylistId as any });
      toast.success("Playlist deleted successfully");
      setDeletePlaylistId(null);
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Core Playlists</h1>
          <p className="text-muted-foreground">Manage your master playlists for subscribers</p>
        </div>
        <Button onClick={() => router.push("/dashboard/core-playlists/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Playlist
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search playlists..."
          className="pl-10 max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading playlists...</span>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaylists.map((playlist) => (
            <Card key={playlist._id.toString()} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <List className="mr-2 h-5 w-5 text-primary" />
                    {playlist.title}
                  </CardTitle>
                  <Badge variant={playlist.status === "published" ? "default" : "outline"}>
                    {playlist.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardDescription>{playlist.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{getCategoryName(playlist.categoryId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Play Count</span>
                    <span className="font-medium">{playlist.playCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex">
                <div className="flex w-full justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/core-playlists/${playlist._id}`)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/dashboard/core-playlists/${playlist._id}/edit`)}
                      className="gap-2"
                      disabled={playlist.status === "published"}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletePlaylistId(playlist._id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredPlaylists.length === 0 && (
        <div className="text-center py-12">
          <List className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchQuery ? "No matching playlists found" : "No playlists found"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query."
              : "Get started by creating a new playlist."}
          </p>
          {!searchQuery && (
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/core-playlists/new")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Playlist
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePlaylistId} onOpenChange={() => setDeletePlaylistId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the playlist
              and all its sections and media associations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogClose onClick={handleDeletePlaylist} className="bg-destructive text-destructive-foreground">
              Delete Playlist
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
