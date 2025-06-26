"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Circle,
  Clock,
  FileText,
  GripVertical,
  Music,
  Play,
  Plus,
  Trash2,
  Video
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

interface SectionMediaManagerProps {
  sectionId: string;
  isPublished?: boolean;
}

export function SectionMediaManager({ sectionId, isPublished = false }: SectionMediaManagerProps) {
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

  // Fetch data
  const section = useQuery(api.coreSections.getById, { id: sectionId as any });
  const sectionMedia = useQuery(api.coreSectionMedia.getSelectedBySectionId, { sectionId: sectionId as any });
  const allMedia = useQuery(api.media.getAllMedia, { limit: 100 });

  // Mutations
  const addMediaToSection = useMutation(api.coreSectionMedia.addMedia);
  const removeMediaFromSection = useMutation(api.coreSectionMedia.removeMedia);
  const updateMediaSelection = useMutation(api.coreSectionMedia.updateSelection);

  const handleAddMedia = async (mediaId: string) => {
    try {
      await addMediaToSection({
        sectionId: sectionId as any,
        mediaId: mediaId as any,
        isRequired: false,
      });
      toast.success("Media added to section");
    } catch (error) {
      console.error("Error adding media:", error);
      toast.error("Failed to add media");
    }
  };

  const handleRemoveMedia = async () => {
    if (!deleteMediaId) return;

    try {
      await removeMediaFromSection({ id: deleteMediaId as any });
      toast.success("Media removed from section");
      setDeleteMediaId(null);
    } catch (error) {
      console.error("Error removing media:", error);
      toast.error("Failed to remove media");
    }
  };

  const handleToggleRequired = async (sectionMediaId: string, currentlyRequired: boolean) => {
    try {
      await updateMediaSelection({
        id: sectionMediaId as any,
        isRequired: !currentlyRequired,
      });
      toast.success(`Media ${!currentlyRequired ? 'marked as required' : 'marked as optional'}`);
    } catch (error) {
      console.error("Error updating media selection:", error);
      toast.error("Failed to update media selection");
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Get available media (not already in this section)
  const availableMedia = allMedia?.filter(media =>
    !sectionMedia?.some(sm => sm.mediaId === media._id)
  ) || [];

  if (!section) {
    return <div>Loading section...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription className="mt-2">
                {section.description || "No description"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={section.sectionType === "base" ? "secondary" : "default"}>
                {section.sectionType === "base" ? "Base" : "Loop"}
              </Badge>
              {!isPublished && (
                <Dialog open={showAddMedia} onOpenChange={setShowAddMedia}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Media to Section</DialogTitle>
                      <DialogDescription>
                        Choose media to add to this section. Subscribers will be able to select from these options.
                      </DialogDescription>
                    </DialogHeader>
                    <AddMediaGrid
                      availableMedia={availableMedia}
                      onAddMedia={handleAddMedia}
                      onClose={() => setShowAddMedia(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Selection Range</span>
              <p className="font-medium">{section.minSelectMedia} - {section.maxSelectMedia}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Current Media</span>
              <p className="font-medium">{sectionMedia?.length || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Required Media</span>
              <p className="font-medium">
                {sectionMedia?.filter(sm => sm.isRequired).length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media List */}
      <Card>
        <CardHeader>
          <CardTitle>Section Media</CardTitle>
          <CardDescription>
            Media items in this section. Subscribers can select from these based on the min/max limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sectionMedia || sectionMedia.length === 0 ? (
            <div className="text-center py-12">
              <Music className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No media added yet</h3>
              <p className="text-muted-foreground">
                Add some media to this section for subscribers to choose from.
              </p>
              {!isPublished && (
                <Button className="mt-4" onClick={() => setShowAddMedia(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Media
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sectionMedia.map((sectionMediaItem, index) => {
                const media = sectionMediaItem.media;
                if (!media) return null;

                return (
                  <Card key={sectionMediaItem._id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Drag Handle */}
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>

                        {/* Media Icon */}
                        <div className="flex-shrink-0">
                          {media.mediaType === "audio" ? (
                            <Music className="h-8 w-8 text-blue-500" />
                          ) : (
                            <Video className="h-8 w-8 text-red-500" />
                          )}
                        </div>

                        {/* Media Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{media.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {media.mediaType}
                            </Badge>
                            {sectionMediaItem.isRequired && (
                              <Badge variant="default" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(media.duration)}
                            </span>
                            {media.fileSize && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {formatFileSize(media.fileSize)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                          {!isPublished && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleRequired(sectionMediaItem._id, !!sectionMediaItem.isRequired)}
                              >
                                {sectionMediaItem.isRequired ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteMediaId(sectionMediaItem._id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteMediaId} onOpenChange={() => setDeleteMediaId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Media from Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this media from the section?
              This will not delete the media file, just remove it from this section.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogTrigger onClick={handleRemoveMedia} className="bg-destructive text-destructive-foreground">
              Remove Media
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// AddMediaGrid component for the dialog
interface AddMediaGridProps {
  availableMedia: any[];
  onAddMedia: (mediaId: string) => void;
  onClose: () => void;
}

function AddMediaGrid({ availableMedia, onAddMedia, onClose }: AddMediaGridProps) {
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

  const handleSelectMedia = (mediaId: string) => {
    const newSelected = new Set(selectedMediaIds);
    if (newSelected.has(mediaId)) {
      newSelected.delete(mediaId);
    } else {
      newSelected.add(mediaId);
    }
    setSelectedMediaIds(newSelected);
  };

  const handleAddSelected = async () => {
    for (const mediaId of selectedMediaIds) {
      await onAddMedia(mediaId);
    }
    onClose();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (availableMedia.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No media available</h3>
        <p className="text-muted-foreground">
          All available media has already been added to this section, or no media exists yet.
        </p>
        <Button className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {availableMedia.map((media) => (
          <Card
            key={media._id}
            className={`cursor-pointer transition-all ${selectedMediaIds.has(media._id)
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:shadow-sm'
              }`}
            onClick={() => handleSelectMedia(media._id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Selection Indicator */}
                <div className="flex-shrink-0">
                  {selectedMediaIds.has(media._id) ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Media Icon */}
                <div className="flex-shrink-0">
                  {media.mediaType === "audio" ? (
                    <Music className="h-8 w-8 text-blue-500" />
                  ) : (
                    <Video className="h-8 w-8 text-red-500" />
                  )}
                </div>

                {/* Media Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{media.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {media.mediaType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(media.duration)}
                    </span>
                    {media.description && (
                      <span className="truncate">{media.description}</span>
                    )}
                  </div>
                </div>

                {/* Preview Button */}
                <Button variant="ghost" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement media preview
                }}>
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleAddSelected}
          disabled={selectedMediaIds.size === 0}
        >
          Add {selectedMediaIds.size} Media {selectedMediaIds.size !== 1 ? 'Items' : 'Item'}
        </Button>
      </div>
    </div>
  );
}
