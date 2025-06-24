"use client"

import { useState, useEffect } from "react"
import { AlertCircleIcon, FileIcon, UploadIcon, XIcon } from "lucide-react"
import { useUploadFile } from "@convex-dev/r2/react"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Import the CSS for the progress bar
import "./progress-bar.css"

interface MediaFileUploaderProps {
  mediaType?: "audio" | "video" | "both"
  onUploadComplete?: (mediaId: string) => void
  onFileChange?: (file: File | null) => void
  className?: string
  maxSizeMB?: number
  hideUploadButton?: boolean
}

export default function MediaFileUploader({
  mediaType = "both",
  onUploadComplete,
  onFileChange,
  className = "",
  maxSizeMB = 50, // Default to 50MB for media files
  hideUploadButton = false
}: MediaFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Use the Convex R2 useUploadFile hook
  // This hook returns a function that we can call with a file and options
  const uploadFileFn = useUploadFile(api.media)
  
  // Get the handleMetadataSync mutation
  const handleMetadataSync = useMutation(api.media.handleMetadataSync)

  // Set accept types based on mediaType
  const acceptTypes = mediaType === "audio"
    ? "audio/*"
    : mediaType === "video"
      ? "video/*"
      : "audio/*,video/*"

  const maxSize = maxSizeMB * 1024 * 1024

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    accept: acceptTypes,
    maxSize,
    multiple: false,
  })

  const selectedFile = files[0]?.file as File
  const fileName = files[0]?.file.name || null
  
  // Call onFileChange prop when files change
  useEffect(() => {
    if (onFileChange) {
      onFileChange(selectedFile || null)
    }
  }, [selectedFile, onFileChange])

  // Handle file upload to Convex/R2
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Generate a unique file path/name
      const fileExtension = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      
      // Use the uploadFile function from the hook
      // This handles URL generation and upload but we need to manually sync metadata
      const key = await uploadFileFn(selectedFile);
      
      // After upload completes, call handleMetadataSync to process the file metadata
      await handleMetadataSync({ key });
      
      // Track progress manually since we can't use the onProgress option
      setUploadProgress(100)
      
      toast.success("File uploaded successfully")
      clearFiles()
      setIsUploading(false)
      setUploadProgress(0)
      
      // Call the onUploadComplete callback if provided
      if (onUploadComplete) {
        // The key can be used as an identifier
        onUploadComplete(key)
      }
      
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Determine icon based on media type
  const getMediaIcon = () => {
    if (mediaType === "audio") return "🎵"
    if (mediaType === "video") return "🎬"
    return "📁"
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative">
        {/* Drop area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label={`Upload ${mediaType} file`}
          />

          {selectedFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center mb-2">
                <FileIcon className="size-12 opacity-60" />
              </div>
              <p className="text-sm font-medium text-center">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <span className="text-2xl">{getMediaIcon()}</span>
              </div>
              <p className="mb-1.5 text-sm font-medium">
                Drop your {mediaType === "both" ? "media" : mediaType} file here
              </p>
              <p className="text-muted-foreground text-xs">
                {mediaType === "audio" ? "MP3, WAV, etc." :
                  mediaType === "video" ? "MP4, MOV, etc." :
                    "Audio or Video files"} (max. {maxSizeMB}MB)
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={openFileDialog}
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Select {mediaType === "both" ? "media" : mediaType}
              </Button>
            </div>
          )}

          {/* Upload progress indicator */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
              <div className="w-full max-w-xs">
                <div className="mb-2 flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    data-progress={uploadProgress}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedFile && !isUploading && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove file"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {selectedFile && !isUploading && !hideUploadButton && (
        <Button
          className="mt-2"
          onClick={handleUpload}
        >
          Upload {mediaType === "both" ? "Media" : mediaType}
        </Button>
      )}
    </div>
  )
}
