// FormMedia.tsx - ENHANCED WITH OFFICIAL CONVEX R2 COMPONENTS
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { useUploadFile } from "@convex-dev/r2/react" // OFFICIAL R2 HOOK
import { Loader2, Music, Video, FileAudio, X } from "lucide-react"
import { FormEvent, useRef, useState, useEffect } from "react"
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

  // Enhanced R2 upload state
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const audioFileRef = useRef<HTMLInputElement>(null)
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null)

  // OFFICIAL CONVEX R2 INTEGRATION
  // The useUploadFile hook doesn't need any arguments in the latest version
  const uploadFile = useUploadFile()
  const updateMetadata = useMutation(api.admin.updateMediaMetadata)

  // Convex mutations
  const createVideoMedia = useMutation(api.admin.createMedia)

  // Validate YouTube URL
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/
    return youtubeRegex.test(url)
  }

  // Extract YouTube ID from URL
  const extractYoutubeId = (url: string): string => {
    // Match YouTube URL patterns
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return match[2];
    }
    return ""; // Return empty string instead of undefined
  };

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

  // Clean up object URLs when component unmounts or when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleAudioFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous state
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setUploadError(null)
    setUploadProgress(0)

    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"]
      if (!validAudioTypes.includes(file.type)) {
        toast.error("Please select a valid audio file (MP3, WAV, OGG)")
        if (audioFileRef.current) audioFileRef.current.value = ""
        return
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB")
        if (audioFileRef.current) audioFileRef.current.value = ""
        return
      }

      setSelectedAudioFile(file)

      // Create preview URL
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

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
    setUploadError(null)
    setUploadProgress(0)

    try {
      if (mediaType === "audio" && selectedAudioFile) {
        setIsUploading(true)
        
        // The hook handles generateUploadUrl and syncMetadata automatically
        let uploadKey: string
        let fileSize: number = selectedAudioFile.size
        let contentType: string = selectedAudioFile.type
        
        try {
          // Upload file and get the upload key
          const result = await uploadFile(selectedAudioFile, {
            onProgress: (progress) => {
              setUploadProgress(Math.round(progress * 100))
            }
          })
          uploadKey = result.uploadKey
          console.log("Upload completed with key:", uploadKey)
          
          // Update the database record with actual file metadata and form data
          await updateMetadata({
            uploadKey,
            contentType: selectedAudioFile.type,
            fileSize: selectedAudioFile.size,
            title: title.trim(),
            description: description.trim(),
            duration,
          });
          console.log("✅ Metadata updated successfully");
        } catch (uploadError) {
          console.error("Upload failed:", uploadError)
          setUploadError(uploadError instanceof Error ? uploadError.message : "Upload failed")
          toast.error("File upload failed. Please try again.")
          setIsUploading(false)
          return
        }

        toast.success("Audio uploaded successfully!")
      } else {
        // Video media (no upload needed)
        await createVideoMedia({
          title: title.trim(),
          description: description.trim(),
          embedUrl: youtubeUrl.trim(),
          youtubeId: extractYoutubeId(youtubeUrl.trim()),
          mediaType: "video",
          duration,
        })

        toast.success("Video media created successfully!")
      }

      // Reset form
      const resetForm = () => {
        setTitle("")
        setDescription("")
        setYoutubeUrl("")
        setDuration(0)
        setSelectedAudioFile(null)
        if (audioFileRef.current) {
          audioFileRef.current.value = ""
        }
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

        {/* Audio File Upload with Enhanced R2 Integration */}
        {mediaType === "audio" && (
          <div className="space-y-2">
            <Label htmlFor="audio-file-form" className="text-sm">Audio File *</Label>
            <Input
              id="audio-file-form"
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
              ref={audioFileRef}
              onChange={handleAudioFileChange}
              required
              className="text-sm"
            />

            {/* File Preview */}
            {selectedAudioFile && (
              <div className="border rounded-md p-3 bg-muted/30 relative">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedAudioFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAudioFile.type} • {(selectedAudioFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setSelectedAudioFile(null)
                      if (audioFileRef.current) audioFileRef.current.value = ""
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Audio Preview Player */}
                {previewUrl && (
                  <audio
                    controls
                    src={previewUrl}
                    className="w-full mt-2 h-8"
                  />
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && mediaType === "audio" && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-xs text-muted-foreground">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <p className="text-xs text-destructive">
                Error: {uploadError}
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
