"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";

const playlistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  categoryId: z.string().min(1, "Category is required"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type PlaylistFormData = z.infer<typeof playlistSchema>;

interface PlaylistFormProps {
  initialData?: Partial<PlaylistFormData>;
  onSuccess?: (playlistId: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isEdit?: boolean;
  playlistId?: string;
}

export function PlaylistForm({
  initialData,
  onSuccess,
  onCancel,
  submitLabel = "Create Playlist",
  isEdit = false,
  playlistId,
}: PlaylistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const categories = useQuery(api.playlistCategories.getAllActive) || [];

  // Mutations
  const createPlaylist = useMutation(api.corePlaylists.create);
  const updatePlaylist = useMutation(api.corePlaylists.update);

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || "",
      thumbnailUrl: initialData?.thumbnailUrl || "",
    },
  });

  const onSubmit = async (data: PlaylistFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEdit && playlistId) {
        await updatePlaylist({
          id: playlistId as any,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId as any,
          thumbnailUrl: data.thumbnailUrl || undefined,
        });
        toast.success("Playlist updated successfully");
        onSuccess?.(playlistId);
      } else {
        const newPlaylistId = await createPlaylist({
          title: data.title,
          description: data.description,
          categoryId: data.categoryId as any,
          thumbnailUrl: data.thumbnailUrl || undefined,
        });
        toast.success("Playlist created successfully");
        onSuccess?.(newPlaylistId);
      }
    } catch (error) {
      console.error("Error saving playlist:", error);
      toast.error(isEdit ? "Failed to update playlist" : "Failed to create playlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter playlist title" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive title for your playlist that subscribers will see
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this playlist contains and its purpose"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description to help subscribers understand this playlist
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the category that best describes this playlist
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                URL to an image that represents this playlist
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
