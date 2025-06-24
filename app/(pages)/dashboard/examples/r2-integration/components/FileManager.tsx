'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import {
  Copy,
  Eye,
  File,
  FileText,
  Image,
  Music,
  RefreshCw,
  Search,
  Trash2,
  Video
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface FileManagerProps {
  refreshTrigger?: number
}

interface FileMetadata {
  key: string
  ContentType?: string
  ContentLength?: number
  LastModified?: string
}

export function FileManager({ refreshTrigger }: FileManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Queries
  const files = useQuery(api.r2.listFiles, { limit: 100 })

  // Mutations
  const deleteFile = useMutation(api.r2.deleteFile)
  const getFileUrl = useQuery(api.r2.getFileUrl,
    selectedFile ? { key: selectedFile.key, expiresIn: 3600 } : 'skip'
  )

  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      handleRefresh()
    }
  }, [refreshTrigger])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return <File className="h-4 w-4" />

    const type = contentType.split('/')[0]
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString()
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) return

    setDeleteLoading(key)
    try {
      await deleteFile({ key })
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete file')
    } finally {
      setDeleteLoading(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const filteredFiles = files?.filter((file: FileMetadata) =>
    file.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.ContentType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (files === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">File Manager</h3>
          <p className="text-sm text-muted-foreground">
            {files.length} file{files.length !== 1 ? 's' : ''} in storage
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Files Table */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <File className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No files found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No files match your search criteria' : 'Upload some files to get started'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file: FileMetadata) => (
                  <TableRow key={file.key}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.ContentType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={file.key}>
                            {file.key}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.ContentType ? (
                        <Badge variant="secondary" className="text-xs">
                          {file.ContentType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(file.ContentLength)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(file.LastModified)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedFile(file)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>File Details</DialogTitle>
                              <DialogDescription>
                                View file information and generate access URLs
                              </DialogDescription>
                            </DialogHeader>
                            <FileDetails file={file} fileUrl={getFileUrl} />
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(file.key)}
                          title="Copy key"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(file.key)}
                          disabled={deleteLoading === file.key}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deleteLoading === file.key ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// File Details Component
function FileDetails({ file, fileUrl }: { file: FileMetadata, fileUrl?: string }) {
  const [expirationTime, setExpirationTime] = useState(3600) // 1 hour default
  const getCustomUrl = useQuery(api.r2.getFileUrl, {
    key: file.key,
    expiresIn: expirationTime
  })

  const copyUrl = async () => {
    if (getCustomUrl) {
      try {
        await navigator.clipboard.writeText(getCustomUrl)
        // Add toast notification here
      } catch (error) {
        console.error('Failed to copy URL:', error)
      }
    }
  }

  const isImage = file.ContentType?.startsWith('image/')

  return (
    <div className="space-y-6">
      {/* File Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">FILE KEY</Label>
          <p className="text-sm font-mono break-all bg-muted p-2 rounded">{file.key}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">CONTENT TYPE</Label>
          <p className="text-sm">{file.ContentType || 'Unknown'}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">FILE SIZE</Label>
          <p className="text-sm">{formatFileSize(file.ContentLength)}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">LAST MODIFIED</Label>
          <p className="text-sm">{formatDate(file.LastModified)}</p>
        </div>
      </div>

      <Separator />

      {/* URL Generation */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="expiration">URL Expiration (seconds)</Label>
          <Input
            id="expiration"
            type="number"
            value={expirationTime}
            onChange={(e) => setExpirationTime(Number(e.target.value))}
            min="60"
            max="604800" // 7 days
          />
          <p className="text-xs text-muted-foreground">
            URL will expire in {Math.floor(expirationTime / 3600)} hours and {Math.floor((expirationTime % 3600) / 60)} minutes
          </p>
        </div>

        {getCustomUrl && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">GENERATED URL</Label>
            <div className="flex gap-2">
              <Input
                value={getCustomUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={copyUrl} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview for images */}
      {isImage && getCustomUrl && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">PREVIEW</Label>
            <div className="border rounded-lg p-4 bg-muted/20">
              <img
                src={getCustomUrl}
                alt={file.key}
                className="max-w-full max-h-64 mx-auto rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatFileSize(bytes?: number) {
  if (!bytes) return 'Unknown'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}
