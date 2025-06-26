"use client";

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
import { z } from "zod";
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  isActive: z.boolean(),
});

interface DeleteCategoryDialogProps {
  deleteCategoryId: string | null;
  setDeleteCategoryId: (id: string | null) => void;
}

export function DialogCatDelete({
  deleteCategoryId,
  setDeleteCategoryId,
}: DeleteCategoryDialogProps) {
  return (
    <Dialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? This action cannot be undone.
            Any playlists using this category will need to be reassigned to a different category.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <DialogTrigger className="bg-destructive text-destructive-foreground">
            Delete Category
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
