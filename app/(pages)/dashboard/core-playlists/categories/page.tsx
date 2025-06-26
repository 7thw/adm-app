"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  MoreHorizontal,
  PlusCircle,
  Search,
  Tag,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DialogCatAdd } from "./_components/dialog-cat-add";
import { DialogCatDelete } from "./_components/dialog-cat-delete";
import { DialogCatEdit } from "./_components/dialog-cat-edit";

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Fetch categories from Convex
  const categories = useQuery(api.playlistCategories.getAll) || [];

  // Mutations
  const deleteCategory = useMutation(api.playlistCategories.remove);
  const updateCategory = useMutation(api.playlistCategories.update);

  // Loading state
  const isLoading = categories === undefined;

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort categories by order
  const sortedCategories = [...filteredCategories].sort((a, b) => a.order - b.order);

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;

    try {
      await deleteCategory({ id: deleteCategoryId as any });
      toast.success("Category deleted successfully");
      setDeleteCategoryId(null);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      await updateCategory({
        id: categoryId as any,
        isActive: !currentStatus,
      });
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading categories...</span>
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
          <h1 className="text-3xl font-bold">Playlist Categories</h1>
          <p className="text-muted-foreground">Manage categories for organizing playlists</p>
        </div>
        <Button onClick={() => setShowAddCategory(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-10 max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories List */}
      {sortedCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchQuery ? "No matching categories found" : "No categories found"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query."
              : "Get started by creating your first category."}
          </p>
          {!searchQuery && (
            <Button
              className="mt-4"
              onClick={() => setShowAddCategory(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Category
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category, index) => (
            <Card key={category._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Drag Handle & Order */}
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-muted-foreground">
                      #{category.order}
                    </span>
                  </div>

                  {/* Category Icon */}
                  <div className="flex-shrink-0">
                    <Tag className="h-8 w-8 text-primary" />
                  </div>

                  {/* Category Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-muted-foreground mt-1">{category.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Order: {category.order}</span>
                      <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditCategoryId(category._id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(category._id, category.isActive)}
                        >
                          {category.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteCategoryId(category._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <DialogCatAdd
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSuccess={() => {
          setShowAddCategory(false);
          toast.success("Category created successfully");
        }}
      />

      {/* Edit Category Dialog */}
      {editCategoryId && (
        <DialogCatEdit
          categoryId={editCategoryId}
          open={!!editCategoryId}
          onOpenChange={() => setEditCategoryId(null)}
          onSuccess={() => {
            setEditCategoryId(null);
            toast.success("Category updated successfully");
          }}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <DialogCatDelete
        deleteCategoryId={deleteCategoryId}
        setDeleteCategoryId={setDeleteCategoryId}
      />


    </div>
  );
}
