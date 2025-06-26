"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Edit,
  Eye,
  GripVertical,
  MoreHorizontal,
  Music,
  Plus,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Section {
  _id: string;
  title: string;
  description?: string;
  sectionType: "base" | "loop";
  minSelectMedia: number;
  maxSelectMedia: number;
  order: number;
  createdAt: number;
}

interface SectionsDataTableProps {
  sections: Section[];
  playlistId: string;
  isPublished: boolean;
}

export function SectionsDataTable({
  sections,
  playlistId,
  isPublished,
}: SectionsDataTableProps) {
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Mutations
  const deleteSection = useMutation(api.coreSections.remove);
  const reorderSections = useMutation(api.coreSections.reorder);

  // Get section media counts
  const getSectionMediaCount = (sectionId: string) => {
    const sectionMedia = useQuery(api.coreSectionMedia.getBySectionId, { sectionId: sectionId as any });
    return sectionMedia?.length || 0;
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;

    try {
      await deleteSection({ id: deleteSectionId as any });
      toast.success("Section deleted successfully");
      setDeleteSectionId(null);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No sections yet</h3>
          <p className="text-muted-foreground">
            Add your first section to start organizing media in this playlist.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedSections.map((section, index) => {
        const mediaCount = getSectionMediaCount(section._id);

        return (
          <Card key={section._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={section.sectionType === "base" ? "secondary" : "default"}>
                    {section.sectionType === "base" ? "Base" : "Loop"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSelectedSection(section._id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Media
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isPublished}
                        onClick={() => {/* TODO: Edit section */ }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Section
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isPublished}
                        onClick={() => setDeleteSectionId(section._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Section
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Media Count</span>
                  <p className="font-medium">{mediaCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Selection Range</span>
                  <p className="font-medium">{section.minSelectMedia} - {section.maxSelectMedia}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">
                    {section.sectionType === "base" ? "Plays once" : "Loops with playlist"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSection(section._id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Media
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSectionId} onOpenChange={() => setDeleteSectionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This will also remove all media
              associations with this section. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogTrigger onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground">
              Delete Section
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
