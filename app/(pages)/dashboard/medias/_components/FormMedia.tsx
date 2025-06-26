// FormMedia.tsx - REWRITTEN TO USE OFFICIAL R2 COMPONENT PATTERN
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { useUploadFile } from "@convex-dev/r2/react" // OFFICIAL R2 HOOK
import { Loader2, Music, Video } from "lucide-react"
import { FormEvent, useRef, useState } from "react"
import { toast } from "sonner"

interface FormMediaProps {
  onSuccess?: () => void;
}

export default function FormMedia({ onSuccess }: FormMediaProps) {
  const [mediaType, setMediaType] = useState<"audio" | "video">("audio")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [duration, setDuration] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const audioFileRef = useRef<HTMLInputElement>(null)
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null)

  // OFFICIAL R2 APPROACH: Use the useUploadFile hook
  const uploadFile = useUploadFile(api.r2Upload)
  const updateMetadata = useMutation(api.media.updateUploadMetadata)
  
  // Convex mutations
  const createVideoMedia = useMutation(api.media.createVideoMedia)

  // Validate YouTube URL
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/
    return youtubeRegex.test(url)
  }

  // Extract duration from audio file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'

      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src)
        resolve(audio.duration)
      }

      audio.onerror = () => {
        resolve(0) // Fallback if duration can't be determined
      }

      audio.src = window.URL.createObjectURL(file)
    })
  }

  const handleAudioFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select a valid audio file")
        return
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB")
        return
      }

      setSelectedAudioFile(file)

      // Auto-extract duration
      try {
        const audioDuration = await getAudioDuration(file)
        setDuration(Math.round(audioDuration))
      } catch (error) {
        console.error("Error getting audio duration:", error)
      }
    }
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error("Title is required")
      return false
    }

    if (mediaType === "audio") {
      if (!selectedAudioFile) {
        toast.error("Please select an audio file")
        return false
      }
    } else {
      if (!youtubeUrl.trim()) {
        toast.error("YouTube URL is required")
        return false
      }

      if (!isValidYouTubeUrl(youtubeUrl)) {
        toast.error("Please enter a valid YouTube URL")
        return false
      }
    }

    if (duration <= 0) {
      toast.error("Duration must be greater than 0")
      return false
    }

    return true
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!validateForm()) return

    setIsUploading(true)

    try {
      if (mediaType === "audio" && selectedAudioFile) {
        console.log("Starting audio upload with official R2 pattern...")
        
        // Capture file metadata before upload
        const fileMetadata = {
          contentType: selectedAudioFile.type,
          fileSize: selectedAudioFile.size,
          fileName: selectedAudioFile.name,
        };

        console.log("Uploading file with metadata:", fileMetadata);
        
        // OFFICIAL R2 PATTERN: Just use the useUploadFile hook
        // The hook will call generateUploadUrl and syncMetadata automatically
        const uploadKey = await uploadFile(selectedAudioFile)
        
        console.log("Upload completed with key:", uploadKey)
        
        // Update the database record with actual file metadata and form data
        try {
          await updateMetadata({
            uploadKey,
            contentType: fileMetadata.contentType,
            fileSize: fileMetadata.fileSize,
            title: title.trim(),
            description: description.trim(),
            duration,
          });
          console.log("✅ Metadata updated successfully");
        } catch (metadataError) {
          console.warn("Failed to update metadata, but upload succeeded:", metadataError);
        }
        
        toast.success("Audio uploaded successfully!")
      } else {
        // Video media (no upload needed)
        await createVideoMedia({
          title: title.trim(),
          description: description.trim(),
          mediaUrl: youtubeUrl.trim(),
          duration,
        })

        toast.success("Video media created successfully!")
      }

      // Reset form
      setTitle("")
      setDescription("")
      setYoutubeUrl("")
      setDuration(0)
      setSelectedAudioFile(null)
      if (audioFileRef.current) {
        audioFileRef.current.value = ""
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("Upload error:", error)
      
      if (error instanceof Error) {
        if (error.message.includes('Admin access required')) {
          toast.error("You need admin access to upload media.")
        } else if (error.message.includes('Not authenticated')) {
          toast.error("Please sign in to upload media.")
        } else {
          toast.error(`Upload failed: ${error.message}`)
        }
      } else {
        toast.error("Upload failed. Please try again.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Media Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Media Type</Label>
          <RadioGroup
            value={mediaType}
            onValueChange={(value) => setMediaType(value as "audio" | "video")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="audio" id="audio-form" />
              <Label htmlFor="audio-form" className="flex items-center gap-1 cursor-pointer text-sm">
                <Music className="h-3 w-3" />
                Audio
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video-form" />
              <Label htmlFor="video-form" className="flex items-center gap-1 cursor-pointer text-sm">
                <Video className="h-3 w-3" />
                Video
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="title-form" className="text-sm">Title *</Label>
          <Input
            id="title-form"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter media title"
            required
            className="text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label htmlFor="description-form" className="text-sm">Description</Label>
          <Textarea
            id="description-form"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Audio File Upload */}
        {mediaType === "audio" && (
          <div className="space-y-1">
            <Label htmlFor="audio-file-form" className="text-sm">Audio File *</Label>
            <Input
              id="audio-file-form"
              type="file"
              accept="audio/*"
              ref={audioFileRef}
              onChange={handleAudioFileChange}
              required
              className="text-sm"
            />
            {selectedAudioFile && (
              <p className="text-xs text-muted-foreground">
                {selectedAudioFile.name} ({(selectedAudioFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>
        )}

        {/* YouTube URL */}
        {mediaType === "video" && (
          <div className="space-y-1">
            <Label htmlFor="youtube-url-form" className="text-sm">YouTube URL *</Label>
            <Input
              id="youtube-url-form"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              className="text-sm"
            />
          </div>
        )}

        {/* Duration */}
        <div className="space-y-1">
          <Label htmlFor="duration-form" className="text-sm">Duration</Label>
          <Input
            id="duration-form"
            type="text"
            value={duration > 0 ? `${duration} seconds` : "Duration will be calculated automatically"}
            readOnly
            className="text-sm bg-muted cursor-not-allowed"
          />
          {duration > 0 && (
            <p className="text-xs text-muted-foreground">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isUploading}
          size="sm"
        >
          {isUploading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {isUploading
            ? `Uploading...`
            : `Upload ${mediaType === "audio" ? "Audio" : "Video"}`
          }
        </Button>
      </form>
    </div>
  )
}
