'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  Copy, 
  Download, 
  Play, 
  Pause,
  Volume2,
  FileText,
  Image,
  Video,
  Music,
  File,
  Clock,
  Link,
  Eye,
  Share2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileViewerProps {
  refreshTrigger?: number
}

export function FileViewer({ refreshTrigger }: FileViewerProps) {
  const [selectedKey, setSelectedKey] = useState('')
  const [expirationTime, setExpirationTime] = useState(3600) // 1 hour
  const [customKey, setCustomKey] = useState('')
  
  // Queries
  const files = useQuery(api.r2.listFiles, { limit: 100 })
  const fileUrl = useQuery(api.r2.getFileUrl, 
    selectedKey ? { key: selectedKey, expiresIn: expirationTime } : 'skip'
  )
  const fileMetadata = useQuery(api.r2.getFileMetadata,
    selectedKey ? { key: selectedKey } : 'skip'
  )

  const handleKeySelect = (key: string) => {
    setSelectedKey(key)
    setCustomKey(key)
  }

  const handleCustomKeySubmit = () => {
    if (customKey.trim()) {
      setSelectedKey(customKey.trim())
    }
  }

  const copyUrl = async () => {
    if (fileUrl) {
      try {
        await navigator.clipboard.writeText(fileUrl)
        // Add toast notification here
      } catch (error) {
        console.error('Failed to copy URL:', error)
      }
    }
  }

  const downloadFile = async () => {
    if (fileUrl && selectedKey) {
      try {
        const response = await fetch(fileUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = selectedKey.split('/').pop() || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Download failed:', error)
      }
    }
  }

  const shareFile = async () => {
    if (fileUrl && navigator.share) {
      try {
        await navigator.share({
          title: `File: ${selectedKey}`,
          url: fileUrl,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return <File className="h-5 w-5" />
    
    const type = contentType.split('/')[0]
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderPreview = () => {
    if (!fileUrl || !fileMetadata) return null

    const contentType = fileMetadata.ContentType
    
    if (contentType?.startsWith('image/')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={fileUrl}
              alt={selectedKey}
              className="max-w-full max-h-96 mx-auto rounded-lg border"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </CardContent>
        </Card>
      )
    }

    if (contentType?.startsWith('video/')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-96 mx-auto rounded-lg border"
              onError={() => console.error('Video failed to load')}
            >
              Your browser does not support video playback.
            </video>
          </CardContent>
        </Card>
      )
    }

    if (contentType?.startsWith('audio/')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="h-4 w-4" />
              Audio Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio
              src={fileUrl}
              controls
              className="w-full"
              onError={() => console.error('Audio failed to load')}
            >
              Your browser does not support audio playback.
            </audio>
          </CardContent>
        </Card>
      )
    }

    if (contentType?.startsWith('text/') || contentType?.includes('json')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TextFilePreview url={fileUrl} />
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <File className="h-4 w-4" />
            File Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-4" />
            <p>Preview not available for this file type</p>
            <p className="text-sm">Content-Type: {contentType}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select from Existing Files</CardTitle>
            <CardDescription>Choose a file from your R2 bucket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Available Files</Label>
              <Select onValueChange={handleKeySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a file..." />
                </SelectTrigger>
                <SelectContent>
                  {files?.map((file) => (
                    <SelectItem key={file.key} value={file.key}>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.ContentType)}
                        <span className="truncate">{file.key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Or Enter File Key</CardTitle>
            <CardDescription>Manually enter a file key to view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customKey">File Key</Label>
              <Input
                id="customKey"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="e.g., images/photo.jpg"
              />
            </div>
            <Button onClick={handleCustomKeySubmit} className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View File
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* URL Configuration */}
      {selectedKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">URL Configuration</CardTitle>
            <CardDescription>Configure how the file URL should be generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration Time</Label>
                <Select value={expirationTime.toString()} onValueChange={(value) => setExpirationTime(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="21600">6 hours</SelectItem>
                    <SelectItem value="86400">24 hours</SelectItem>
                    <SelectItem value="604800">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Current Key</Label>
                <Input value={selectedKey} readOnly className="font-mono text-sm" />
              </div>
              
              <div className="space-y-2">
                <Label>File Type</Label>
                {fileMetadata?.ContentType ? (
                  <Badge variant="secondary" className="w-full justify-center">
                    {fileMetadata.ContentType}
                  </Badge>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Information */}
      {fileMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {getFileIcon(fileMetadata.ContentType)}
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">SIZE</Label>
                <p className="text-sm">{formatFileSize(fileMetadata.ContentLength)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">LAST MODIFIED</Label>
                <p className="text-sm">
                  {fileMetadata.LastModified 
                    ? new Date(fileMetadata.LastModified).toLocaleString()
                    : 'Unknown'
                  }
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">CONTENT TYPE</Label>
                <p className="text-sm">{fileMetadata.ContentType || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated URL */}
      {fileUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="h-4 w-4" />
              Generated URL
            </CardTitle>
            <CardDescription>
              This URL will expire in {Math.floor(expirationTime / 3600)} hours and {Math.floor((expirationTime % 3600) / 60)} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={fileUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={copyUrl} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={downloadFile} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button asChild variant="outline">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
              {navigator.share && (
                <Button onClick={shareFile} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Preview */}
      {fileUrl && fileMetadata && (
        <div className="space-y-4">
          <Separator />
          {renderPreview()}
        </div>
      )}
    </div>
  )
}

// Text File Preview Component
function TextFilePreview({ url }: { url: string }) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        const text = await response.text()
        // Limit content length for preview
        const maxLength = 5000
        setContent(text.length > maxLength ? text.substring(0, maxLength) + '\n\n... (truncated)' : text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [url])

  if (loading) {
    return <div className="text-center py-4">Loading content...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load file content: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono">{content}</pre>
      </div>
    </div>
  )
}