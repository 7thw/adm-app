"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUploadFile } from "@convex-dev/r2/react"
import { useMutation } from "convex/react"
import { FileAudio, Loader2, Music, Video } from "lucide-react"
import Image from "next/image"
import { FormEvent, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// =================================================================
// INTERFACES & TYPES
// =================================================================

interface FormMediaProps {
  onSuccess?: () => void
}

interface YoutubeApiResponse {
  title: string
  duration: number
  thumbnailUrl: string
  youtubeId: string
}

type MediaType = "audio" | "video"

// =================================================================
// HELPER FUNCTIONS
// =================================================================

const isValidYoutubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/
  return youtubeRegex.test(url)
}

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = document.createElement("audio")
    audio.preload = "metadata"
    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src)
      resolve(audio.duration)
    }
    audio.onerror = () => resolve(0)
    audio.src = window.URL.createObjectURL(file)
  })
}

// =================================================================
// MAIN COMPONENT
// =================================================================

export default function FormMedia({ onSuccess }: FormMediaProps) {
  // Form State
  const [mediaType, setMediaType] = useState<MediaType>("audio")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Convex Hooks
  const createMedia = useMutation(api.admin.createMedia)
  const uploadFile = useUploadFile(api.r2Upload)

  // =================================================================
  // EFFECTS
  // =================================================================

  useEffect(() => {
    // Reset form when media type changes
    setTitle("")
    setDescription("")
    setYoutubeUrl("")
    setYoutubeId(null)
    setDuration(0)
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [mediaType])

  useEffect(() => {
    // Cleanup blob URL
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // =================================================================
  // HANDLERS
  // =================================================================

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB")
      return
    }

    setSelectedFile(file)
    const audioDuration = await getAudioDuration(file)
    setDuration(audioDuration)
    setTitle(file.name.replace(/\.[^/.]+$/, "")) // Set title from filename
  }

  const handleYoutubeFetch = async () => {
    if (!isValidYoutubeUrl(youtubeUrl)) {
      return toast.error("Please enter a valid YouTube URL.")
    }
    setIsUploading(true)
    try {
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(youtubeUrl)}`)
      if (!response.ok) throw new Error("Failed to fetch metadata")

      const data: YoutubeApiResponse = await response.json()
      setTitle(data.title)
      setDuration(data.duration)
      setPreviewUrl(data.thumbnailUrl)
      setYoutubeId(data.youtubeId)
      toast.success("YouTube metadata fetched!")
    } catch (error) {
      toast.error("Failed to fetch YouTube data.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (mediaType === "audio") {
        if (!selectedFile) throw new Error("No audio file selected.")

        const { storageId } = await uploadFile(selectedFile, {
          onUploadProgress: (progress) => setUploadProgress(progress),
        })

        await createMedia({
          title,
          description,
          mediaType: "audio",
          storageId: storageId as Id<"_storage">,
          duration,
          fileSize: selectedFile.size,
          contentType: selectedFile.type,
          isPublic: false,
          processingStatus: "completed",
        })
      } else if (mediaType === "video") {
        if (!youtubeId || !previewUrl) throw new Error("YouTube metadata not fetched.")

        await createMedia({
          title,
          description,
          mediaType: "video",
          embedUrl: youtubeUrl,
          youtubeId,
          duration,
          thumbnailUrl: previewUrl,
          isPublic: false,
          processingStatus: "completed",
        })
      }

      toast.success(`Successfully uploaded "${title}"!`)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Submission failed:", error)
      toast.error((error as Error).message || "An unknown error occurred.")
    } finally {
      setIsUploading(false)
    }
  }

  // =================================================================
  // RENDER
  // =================================================================

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preview Section */}
        <div className="h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl && mediaType === "video" ? (
            <Image 
              src={previewUrl} 
              alt={title} 
              width={400} 
              height={160} 
              className="w-full h-full object-cover" 
            />
          ) : selectedFile && mediaType === "audio" ? (
            <div className="text-center text-muted-foreground p-4">
              <Music className="h-12 w-12 mx-auto" />
              <p className="mt-2 text-sm font-medium truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <FileAudio className="h-12 w-12 mx-auto" />
              <p className="mt-2 text-sm">Media Preview</p>
            </div>
          )}
        </div>

        {/* Media Type Switcher */}
        <RadioGroup
          value={mediaType}
          onValueChange={(v) => setMediaType(v as MediaType)}
          className="grid grid-cols-2 gap-2"
          disabled={isUploading}
        >
          <Label className={`flex items-center justify-center gap-2 rounded-md p-2 text-sm font-medium cursor-pointer transition-colors ${mediaType === 'audio' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <RadioGroupItem value="audio" id="audio" className="sr-only" />
            <Music className="h-4 w-4" /> Audio
          </Label>
          <Label className={`flex items-center justify-center gap-2 rounded-md p-2 text-sm font-medium cursor-pointer transition-colors ${mediaType === 'video' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <RadioGroupItem value="video" id="video" className="sr-only" />
            <Video className="h-4 w-4" /> Video
          </Label>
        </RadioGroup>

        {/* Title & Description */}
        <div className="space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isUploading} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isUploading} />
        </div>

        {/* Source Inputs */}
        {mediaType === "audio" ? (
          <div className="space-y-1">
            <Label htmlFor="audio-file">Audio File *</Label>
            <Input id="audio-file" type="file" accept="audio/*" onChange={handleFileSelect} ref={fileInputRef} required disabled={isUploading} />
            {isUploading && uploadProgress > 0 && (
              <div className="space-y-1 pt-2">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="youtube-url">YouTube URL *</Label>
            <div className="flex items-center space-x-2">
              <Input id="youtube-url" type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required disabled={isUploading || !!youtubeId} />
              <Button type="button" onClick={handleYoutubeFetch} disabled={isUploading || !youtubeUrl || !!youtubeId}>
                Fetch
              </Button>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="space-y-1">
          <Label htmlFor="duration">Duration</Label>
          <Input id="duration" value={duration > 0 ? `${Math.floor(duration / 60)}:${String(Math.round(duration % 60)).padStart(2, '0')}` : "Auto-calculated"} readOnly className="bg-muted cursor-not-allowed" />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? "Uploading..." : `Upload ${mediaType}`}
        </Button>
      </form>
    </div>
  )
}
