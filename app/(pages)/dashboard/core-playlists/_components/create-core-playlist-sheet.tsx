"use client";

import { useMutation, useQuery } from "convex/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateCorePlaylistSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (corePlaylistId: Id<"corePlaylists">) => void;
}

export function CreateCorePlaylistSheet({ isOpen, onClose, onSuccess }: CreateCorePlaylistSheetProps) {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingCorePlaylist, setIsCreatingCorePlaylist] = useState(false);

  // Core Playlist form state
  const [corePlaylistTitle, setCorePlaylistTitle] = useState("");
  const [corePlaylistDescription, setCorePlaylistDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3b82f6");

  // Convex queries and mutations
  const coreCategories = useQuery(api.admin.listCoreCategories, {}) || [];
  const createCorePlaylist = useMutation(api.admin.createCorePlaylist);
  const createCoreCategory = useMutation(api.admin.createCoreCategory);

  // Generate slug from category name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle category name change to auto-generate slug
  const handleCategoryNameChange = (name: string) => {
    setCategoryName(name);
    setCategorySlug(generateSlug(name));
  };

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    if (!categorySlug.trim()) {
      toast.error("Category slug is required");
      return;
    }

    try {
      setIsCreatingCategory(true);
      const newCategoryCoreId = await createCoreCategory({
        name: categoryName,
        description: categoryDescription || undefined,
        slug: categorySlug,
        color: categoryColor,
      });

      toast.success("Category created successfully!");
      
      // Select the new category in the Core Playlist form
      setSelectedCategoryId(newCategoryCoreId);
      
      // Reset category form and hide it
      setCategoryName("");
      setCategoryDescription("");
      setCategorySlug("");
      setCategoryColor("#3b82f6");
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Create Core Playlist
  const handleCreateCorePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corePlaylistTitle.trim()) {
      toast.error("Core Playlist title is required");
      return;
    }
    
    if (!selectedCategoryId) {
      toast.error("Category is required");
      return;
    }

    try {
      setIsCreatingCorePlaylist(true);
      const newCorePlaylistId = await createCorePlaylist({
        title: corePlaylistTitle,
        description: corePlaylistDescription || undefined,
        categoryId: selectedCategoryId as Id<"coreCategories">,
      });

      toast.success("Core Playlist created successfully!");
      
      // Reset form and close modal
      handleModalClose();
      
      // Call success callback
      onSuccess?.(newCorePlaylistId);
    } catch (error) {
      console.error("Error creating Core Playlist:", error);
      toast.error("Failed to create Core Playlist");
    } finally {
      setIsCreatingCorePlaylist(false);
    }
  };

  // Reset forms when modal closes
  const handleModalClose = () => {
    onClose();
    setShowCategoryForm(false);
    setCorePlaylistTitle("");
    setCorePlaylistDescription("");
    setSelectedCategoryId("");
    setCategoryName("");
    setCategoryDescription("");
    setCategorySlug("");
    setCategoryColor("#3b82f6");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Core Playlist</SheetTitle>
          <SheetDescription>
            Create a new Core Playlist with media content and category assignment.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Category Creation Form (conditionally shown) */}
          {showCategoryForm && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCategoryForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., Meditation, Fitness, Education"
                    value={categoryName}
                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorySlug">Slug (URL-friendly)</Label>
                  <Input
                    id="categorySlug"
                    placeholder="auto-generated"
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Description (Optional)</Label>
                  <Textarea
                    id="categoryDescription"
                    placeholder="Brief description of this category"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryColor">Color</Label>
                  <Input
                    id="categoryColor"
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                </div>

                <Button type="submit" disabled={isCreatingCategory}>
                  {isCreatingCategory ? "Creating..." : "Create Category"}
                </Button>
              </form>
            </div>
          )}

          {/* Core Playlist Creation Form */}
          <form onSubmit={handleCreateCorePlaylist} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="corePlaylistTitle">Core Playlist Title</Label>
              <Input
                id="corePlaylistTitle"
                placeholder="e.g., Morning Meditation Series"
                value={corePlaylistTitle}
                onChange={(e) => setCorePlaylistTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corePlaylistDescription">Description (Optional)</Label>
              <Textarea
                id="corePlaylistDescription"
                placeholder="Brief description of this core playlist"
                value={corePlaylistDescription}
                onChange={(e) => setCorePlaylistDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorySelect">Category</Label>
              <div className="flex gap-2">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {coreCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategoryForm(true)}
                  disabled={showCategoryForm}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingCorePlaylist}>
                {isCreatingCorePlaylist ? "Creating..." : "Create Core Playlist"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
