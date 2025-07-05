"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Edit, Link, List, Loader2, PlusCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreateCorePlaylistSheet } from "./_components/create-core-playlist-sheet";

export default function CorePlaylistsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch core playlists from Convex with proper typing
  const corePlaylists = useQuery(api.admin.listCorePlaylists, {}) || [];

  // Get categories to display category names
  const categories = useQuery(api.admin.listCoreCategories, {}) || [];


  // Loading state based on Convex query
  const isLoading = corePlaylists === undefined;

  // Get category name by ID
  const getCategoryName = (categoryId: string | Id<"coreCategories">) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((cat: Doc<"coreCategories">) => cat._id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // Filter core playlists based on search query
  const filteredCorePlaylists = corePlaylists.filter((corePlaylist: Doc<"corePlaylists">) => {
    const titleMatch = corePlaylist.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descriptionMatch = corePlaylist.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const categoryMatch = getCategoryName(corePlaylist.categoryId).toLowerCase().includes(searchQuery.toLowerCase());

    return titleMatch || descriptionMatch || categoryMatch;
  });

  // Handler for opening create modal
  const handleCreateCorePlaylist = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Core Playlists</h1>
          <p className="text-muted-foreground">Manage your master playlists for subscribers</p>
        </div>
        <Button onClick={handleCreateCorePlaylist}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Core Playlist
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search core playlists..."
          className="pl-10 max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading core playlists...</span>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCorePlaylists.map((corePlaylist: Doc<"corePlaylists">) => (
            <Card key={corePlaylist._id.toString()} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <List className="mr-2 h-5 w-5 text-primary" />
                    {corePlaylist.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={corePlaylist.status === "published" ? "default" : "outline"}>
                      {corePlaylist.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Category: {getCategoryName(corePlaylist.categoryId || "")}
                    </span>
                  </div>
                </div>
                <CardDescription>{corePlaylist.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <div>Category</div>
                    <div className="font-medium">{getCategoryName(corePlaylist.categoryId)}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex">
                <div className="flex w-full justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/core-playlists/${corePlaylist._id}/preview`)}
                      className="gap-2"
                    >
                      <Link className="h-4 w-4" />
                      Mobile Preview
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/dashboard/core-playlists/${corePlaylist._id}/edit`)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Core Playlist
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredCorePlaylists.length === 0 && (
        <div className="text-center py-12">
          <List className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchQuery ? "No matching core playlists found" : "No core playlists found"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query."
              : "Get started by creating a new core playlist."}
          </p>
        </div>
      )}

      <CreateCorePlaylistSheet
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(corePlaylistId) => {
          setIsCreateModalOpen(false);
          toast.success("Core Playlist created successfully!");
        }}
      />
    </div>
  );
}
