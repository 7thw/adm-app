# Convex + Cloudflare R2 Integration Example

This example demonstrates a complete integration between Convex and Cloudflare R2 for file storage and management in the Realigna admin application.

## Features

- ✅ **File Upload**: Upload files to R2 using signed URLs
- ✅ **File Management**: Browse, view, and delete files
- ✅ **File Viewer**: Preview images, videos, audio, and text files
- ✅ **Storage Statistics**: Monitor usage and file type distribution
- ✅ **Configuration**: Manage R2 settings and CORS policies
- ✅ **Security**: Authentication and permission controls
- ✅ **TypeScript**: Full type safety throughout

## Prerequisites

1. **Cloudflare R2 Account**: You need a Cloudflare account with R2 enabled
2. **R2 Bucket**: Create an R2 bucket for your files
3. **API Credentials**: Generate R2 API tokens and keys
4. **Convex Project**: Set up with the R2 component

## Quick Setup

### 1. Install Dependencies

The required dependencies are already included in your `package.json`:

```bash
pnpm install
```

### 2. Configure Cloudflare R2

1. **Create an R2 bucket** in your Cloudflare dashboard
2. **Generate API credentials**:
   - Go to Cloudflare Dashboard → R2 Object Storage → Manage R2 API tokens
   - Create a new API token with R2 permissions
   - Note down your Access Key ID, Secret Access Key, and Token

3. **Configure CORS** for your bucket:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3100", "https://adm-realigna.7thw.co"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["Content-Type", "Authorization"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

### 3. Set Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_TOKEN=your-r2-token
```

### 4. Configure Convex

Set the environment variables in your Convex deployment:

```bash
pnpm convex env set R2_BUCKET your-bucket-name
pnpm convex env set R2_ENDPOINT https://your-account-id.r2.cloudflarestorage.com
pnpm convex env set R2_ACCESS_KEY_ID your-access-key-id
pnpm convex env set R2_SECRET_ACCESS_KEY your-secret-access-key
pnpm convex env set R2_TOKEN your-r2-token
```

### 5. Deploy Convex Functions

```bash
pnpm convex dev
```

### 6. Test the Integration

1. Navigate to `/dashboard/examples/r2-integration`
2. Try uploading a file
3. View files in the File Manager
4. Check storage statistics

## File Structure

```
app/(pages)/dashboard/examples/r2-integration/
├── page.tsx                    # Main integration page
├── components/
│   ├── FileUpload.tsx         # File upload component
│   ├── FileManager.tsx        # File management interface
│   ├── FileViewer.tsx         # File preview and viewing
│   ├── FileStats.tsx          # Storage statistics dashboard
│   ├── StorageConfig.tsx      # Configuration management
│   └── index.ts               # Component exports
└── README.md                  # This file

convex/
└── r2.ts                      # R2 integration functions
```

## Available Functions

### Upload Functions
- `generateUploadUrl()` - Generate signed upload URL
- `generateUploadUrlWithCustomKey()` - Upload with custom key
- `storeFileFromUrl()` - Server-side file storage

### File Management
- `getFileUrl()` - Generate temporary download URL
- `getFileMetadata()` - Get file information
- `listFiles()` - List all files with metadata
- `deleteFile()` - Delete single file
- `deleteFiles()` - Batch delete multiple files

### Advanced Operations
- `copyFile()` - Copy file to new location
- `moveFile()` - Move file (copy + delete)
- `getFileStats()` - Storage usage statistics

## Component Usage

### FileUpload Component

```tsx
import { FileUpload } from './components/FileUpload'

<FileUpload 
  onUploadComplete={() => {
    // Refresh file list
    console.log('Upload completed')
  }} 
/>
```

### FileManager Component

```tsx
import { FileManager } from './components/FileManager'

<FileManager 
  refreshTrigger={refreshCounter}
/>
```

### FileViewer Component

```tsx
import { FileViewer } from './components/FileViewer'

<FileViewer 
  refreshTrigger={refreshCounter}
/>
```

## Security Considerations

1. **Authentication**: Implement proper user authentication in upload handlers
2. **File Validation**: Validate file types and sizes before upload
3. **Access Control**: Restrict file access based on user permissions
4. **CORS Configuration**: Limit allowed origins to your domains
5. **URL Expiration**: Set appropriate expiration times for signed URLs

## Performance Tips

1. **Parallel Uploads**: Enable concurrent uploads for better performance
2. **Image Optimization**: Compress images before upload
3. **CDN Integration**: Use Cloudflare's CDN for global file delivery
4. **Metadata Caching**: Cache file metadata to reduce API calls
5. **Pagination**: Implement pagination for large file lists

## Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Check your bucket CORS configuration
   - Ensure your domain is in AllowedOrigins

2. **Authentication Errors**:
   - Verify API credentials are correct
   - Check token permissions

3. **Upload Failures**:
   - Check file size limits
   - Verify content type restrictions

4. **Connection Issues**:
   - Test your R2 endpoint URL
   - Check network connectivity

### Debug Tools

1. **Connection Test**: Use the test button in Storage Config
2. **Browser DevTools**: Check network requests for errors
3. **Convex Logs**: Monitor function execution logs
4. **File Metadata**: Verify files are stored correctly

## Advanced Configuration

### Custom File Naming

```typescript
// In your upload handler
const key = await r2.generateUploadUrl(`users/${userId}/${Date.now()}-${filename}`)
```

### File Type Restrictions

```typescript
// In checkUpload callback
if (!file.type.startsWith('image/')) {
  throw new Error('Only image files allowed')
}
```

### Storage Limits

```typescript
// In checkUpload callback
if (file.size > 10 * 1024 * 1024) { // 10MB
  throw new Error('File too large')
}
```

## Integration with Realigna

This R2 integration is designed for the Realigna admin application and includes:

- **Media Management**: Store and serve playlist cover art, audio files
- **User Content**: Handle user-uploaded profile images and content
- **Admin Tools**: Bulk file operations and storage monitoring
- **Analytics**: Track storage usage and file access patterns

## Next Steps

1. **Authentication Integration**: Connect with Clerk user management
2. **Database Relations**: Link files to playlists, users, and other entities
3. **Content Processing**: Add image resizing and audio transcoding
4. **Backup Strategy**: Implement automated backups and versioning
5. **Monitoring**: Set up alerts for storage usage and errors

## Resources

- [Convex R2 Component Documentation](https://www.convex.dev/components/cloudflare-r2)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [GitHub Repository](https://github.com/get-convex/r2)