'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from './components/FileUpload'
import { FileManager } from './components/FileManager' 
import { FileViewer } from './components/FileViewer'
import { FileStats } from './components/FileStats'
import { StorageConfig } from './components/StorageConfig'

export default function R2IntegrationExample() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cloudflare R2 Integration</h1>
        <p className="text-muted-foreground">
          Complete example of Convex + Cloudflare R2 integration with file upload, management, and serving.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manager">Manager</TabsTrigger>
          <TabsTrigger value="viewer">Viewer</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Upload files to Cloudflare R2 using signed URLs. Files are automatically synced with Convex metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onUploadComplete={handleRefresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manager" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Manager</CardTitle>
              <CardDescription>
                Browse, delete, and manage files stored in R2. View metadata and generate download URLs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileManager refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Viewer</CardTitle>
              <CardDescription>
                View and serve files with customizable expiration times and access controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileViewer refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Statistics</CardTitle>
              <CardDescription>
                Monitor storage usage, file types, and performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileStats refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>
                Configure R2 settings, manage buckets, and set up CORS policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StorageConfig />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}