
interface MediaInfoProps {
  media: {
    title: string
    description?: string
    mediaType?: string
    contentType?: string
    fileSize?: number
    duration?: number
    uploadStatus?: string
    uploadKey?: string
  }
  url?: string
  error?: string
  showDebugInfo?: boolean
}

export function MediaInfo({
  media,
  url,
  error,
  showDebugInfo = false,
}: MediaInfoProps) {
  const urlPreview = url || 'No URL available'

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Media details */}
      <div className="text-sm text-muted-foreground space-y-1.5">
        <p><strong>Media Title:</strong> {media.title}</p>
        <p><strong>Media Description:</strong></p>
        {media.description && (
          <p className="text-xs text-muted-foreground">{media.description}</p>
        )}
        <p><strong>Type:</strong> {media.mediaType} ({media.contentType || "unknown"})</p>
        {media.fileSize && (
          <p><strong>Size:</strong> {(media.fileSize / 1024).toFixed(1)} KB</p>
        )}
        {media.duration && (
          <p><strong>Duration:</strong> {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}</p>
        )}
        <p><strong>Status:</strong> {media.uploadStatus || "unknown"}</p>
        {media.uploadKey && (
          <p><strong>Key:</strong> {media.uploadKey}</p>
        )}
        {url && (
          <p><strong>URL:</strong> <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {url.length > 60 ? `${url.substring(0, 60)}...` : url}
          </a></p>
        )}
        <p><strong>Debug Info:</strong></p>
        <div className="w-full break-words">
          {showDebugInfo && url && (
            <div className="p-2 bg-primary/10 border border-primary/20 rounded text-xs text-primary">
              <p className="break-all"><strong>Source:</strong> {urlPreview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaInfo
