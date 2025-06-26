"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, Info } from "lucide-react";
import { toast } from "sonner";

const sectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(300, "Description must be less than 300 characters").optional(),
  sectionType: z.enum(["base", "loop"], {
    required_error: "Section type is required",
  }),
  minSelectMedia: z.number().min(0, "Must be 0 or greater"),
  maxSelectMedia: z.number().min(1, "Must be at least 1"),
}).refine((data) => data.maxSelectMedia >= data.minSelectMedia, {
  message: "Maximum must be greater than or equal to minimum",
  path: ["maxSelectMedia"],
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  onSuccess?: () => void;
}

export function AddSectionDialog({
  open,
  onOpenChange,
  playlistId,
  onSuccess,
}: AddSectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSection = useMutation(api.coreSections.create);

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      sectionType: "loop",
      minSelectMedia: 1,
      maxSelectMedia: 3,
    },
  });

  const onSubmit = async (data: SectionFormData) => {
    setIsSubmitting(true);
    
    try {
      await createSection({
        playlistId: playlistId as any,
        title: data.title,
        description: data.description,
        sectionType: data.sectionType,
        minSelectMedia: data.minSelectMedia,
        maxSelectMedia: data.maxSelectMedia,
      });
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating section:", error);
      toast.error("Failed to create section");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Section
          </DialogTitle>
          <DialogDescription>
            Create a new section for this playlist. Sections organize media into groups.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Opening, Main Content, Closing" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this section
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this section"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="base">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Base</span>
                          <span className="text-xs text-muted-foreground">Plays once, skips loops</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="loop">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Loop</span>
                          <span className="text-xs text-muted-foreground">Plays on all playlist cycles</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                    <span>
                      <strong>Base</strong> sections play only once at the beginning. 
                      <strong> Loop</strong> sections repeat with each playlist cycle.
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minSelectMedia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Media Selection</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum media subscribers must select
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSelectMedia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Media Selection</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum media subscribers can select
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Section
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
