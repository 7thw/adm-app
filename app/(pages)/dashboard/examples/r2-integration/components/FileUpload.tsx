'use client'

import { FormEvent, useRef, useState } from 'react'
import { useUploadFile } from '@convex-dev/r2/react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, Image, Video, Music, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUploadComplete?: () => void
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  // Regular upload using the R2 client API
  const uploadFile = useUploadFile(api.r2)
  
  // Custom upload with custom key
  const generateCustomUploadUrl = useMutation(api.r2.generateUploadUrlWithCustomKey)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadedKey, setUploadedKey] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Custom upload fields
  const [customPrefix, setCustomPrefix] = useState('')
  const [useCustomKey, setUseCustomKey] = useState(false)

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0]
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      case 'audio':
        return <Music className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Regular upload handler
  const handleUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedFile) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      // Simulate progress for demo purposes
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20
          return newProgress > 90 ? 90 : newProgress
        })
      }, 200)

      const key = await uploadFile(selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      setUploadedKey(key)
      
      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setUploadStatus('idle')
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUploadComplete?.()
      }, 2000)
      
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    }
  }

  // Custom upload handler
  const handleCustomUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedFile) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      // Generate custom upload URL
      const { uploadUrl, storageId } = await generateCustomUploadUrl({
        prefix: customPrefix || undefined,
        filename: selectedFile.name,
      })

      // Upload file directly to R2
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      setUploadProgress(100)
      setUploadStatus('success')
      setUploadedKey(storageId)
      
      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setUploadStatus('idle')
        setUploadProgress(0)
        setCustomPrefix('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUploadComplete?.()
      }, 2000)
      
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Custom upload failed')
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <div className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            uploadStatus === 'uploading' && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag and drop a file here, or click to select
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={uploadStatus === 'uploading'}
              className="max-w-xs mx-auto"
            />
          </div>
        </div>

        {selectedFile && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                {getFileIcon(selectedFile)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                {uploadStatus === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {uploadStatus === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regular Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standard Upload</CardTitle>
            <CardDescription>Upload with auto-generated key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleUpload} className="space-y-4">
              <Button
                type="submit"
                disabled={!selectedFile || uploadStatus === 'uploading'}
                className="w-full"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Custom Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Upload</CardTitle>
            <CardDescription>Upload with custom prefix/path</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCustomUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Path Prefix (optional)</Label>
                <Input
                  id="prefix"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="e.g., uploads/images"
                  disabled={uploadStatus === 'uploading'}
                />
              </div>
              <Button
                type="submit"
                disabled={!selectedFile || uploadStatus === 'uploading'}
                className="w-full"
                variant="outline"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Custom Upload
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Status */}
      {uploadStatus === 'success' && uploadedKey && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            File uploaded successfully! Key: <code className="text-xs bg-muted px-1 rounded">{uploadedKey}</code>
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}