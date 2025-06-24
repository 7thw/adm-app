"use client";

import { api } from "@/convex/_generated/api";
import { useUploadFile } from "@convex-dev/r2/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MediaFileUploader from "./MediaFileUploader";

// Import CSS for progress bar
import "./form-media.css";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
})

export function FormMedia({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get the handleMetadataSync mutation from Convex
  const handleMetadataSync = useMutation(api.media.handleMetadataSync)

  // Get the uploadFile function from Convex R2
  const uploadFileFn = useUploadFile(api.media)

  // 1. Define your form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  // 2. Define a submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    setUploading(true)

    // Create a progress tracker outside the try block for proper cleanup in catch
    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Get the file extension and create a unique filename
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

      // Start progress animation (since we can't get real progress from R2)
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            return 95 // Cap at 95% until complete
          }
          return prev + 5
        })
      }, 200)

      console.log("Attempting to upload file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      })

      // Upload the file to R2 using the properly initialized uploadFileFn
      try {
        console.log("Starting R2 upload...")
        
        // Add additional debugging for R2 upload
        console.log("Environment:", process.env.NODE_ENV)
        console.log("Origin:", window.location.origin)
        
        // Upload the file
        const key = await uploadFileFn(file)
        console.log("Upload successful, received key:", key)

        // Once upload is complete, sync the metadata
        console.log("Syncing metadata with key:", key)
        await handleMetadataSync({
          key,
          title: values.title,
          description: values.description || undefined,
          mediaType: file.type.startsWith("video/") ? "video" : "audio",
        })
        console.log("Metadata sync complete")

        // Clear the progress interval
        if (progressInterval) clearInterval(progressInterval)

        // Set progress to 100%
        setUploadProgress(100)

        // Show success message
        toast.success("Media uploaded successfully")

        // Reset form
        setUploading(false)
        form.reset()
        setFile(null)
        setUploadProgress(0)

        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } catch (uploadError) {
        console.error("R2 upload error:", uploadError)
        if (uploadError instanceof Error) {
          console.error("Error name:", uploadError.name)
          console.error("Error message:", uploadError.message)
          console.error("Error stack:", uploadError.stack)
        }
        throw uploadError
      }
    } catch (error) {
      // Clear any intervals
      if (progressInterval) clearInterval(progressInterval)

      console.error("Upload failed:", error)
      toast.error("Failed to upload media: " + (error instanceof Error ? error.message : String(error)))
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle file selection
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter media title" {...field} />
              </FormControl>
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
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Media File</Label>
          <MediaFileUploader
            onFileChange={handleFileChange}
            hideUploadButton={true}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        {uploading && (
          <div className="upload-progress-bar">
            <div
              className="upload-progress-bar-fill"
              data-progress={uploadProgress}
            ></div>
          </div>
        )}

        <Button type="submit" disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Upload Media"}
        </Button>
      </form>
    </Form>
  )
}
