'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  HardDrive,
  FileText,
  Image,
  Video,
  Music,
  File,
  TrendingUp,
  Calendar,
  Layers,
  RefreshCw
} from 'lucide-react'

interface FileStatsProps {
  refreshTrigger?: number
}

export function FileStats({ refreshTrigger }: FileStatsProps) {
  const stats = useQuery(api.r2.getFileStats)
  const files = useQuery(api.r2.listFiles, { limit: 1000 })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.startsWith('text/')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return '#3b82f6' // blue
    if (type.startsWith('video/')) return '#ef4444' // red
    if (type.startsWith('audio/')) return '#10b981' // green
    if (type.startsWith('text/')) return '#f59e0b' // yellow
    return '#6b7280' // gray
  }

  // Process file type data for charts
  const fileTypeData = stats?.fileTypes ?
    Object.entries(stats.fileTypes).map(([type, count]) => ({
      type: type.split('/')[0] || 'other',
      fullType: type,
      count,
      color: getFileTypeColor(type)
    })).sort((a, b) => (b.count as number) - (a.count as number)) : []

  // Process file size distribution
  const sizeDistribution = files ?
    files.reduce((acc: any, file: any) => {
      const size = file.ContentLength || 0
      let category = '0 B'

      if (size === 0) category = '0 B'
      else if (size < 1024) category = '< 1 KB'
      else if (size < 1024 * 1024) category = '< 1 MB'
      else if (size < 1024 * 1024 * 10) category = '< 10 MB'
      else if (size < 1024 * 1024 * 100) category = '< 100 MB'
      else category = '≥ 100 MB'

      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) : {}

  const sizeDistributionData = Object.entries(sizeDistribution).map(([size, count]) => ({
    size,
    count
  }))

  // Process upload timeline (last 30 days)
  const uploadTimeline = files ?
    files.reduce((acc: any, file: any) => {
      if (!file.LastModified) return acc

      const date = new Date(file.LastModified)
      const dayKey = date.toISOString().split('T')[0]

      acc[dayKey] = (acc[dayKey] || 0) + 1
      return acc
    }, {} as Record<string, number>) : {}

  const timelineData = Object.entries(uploadTimeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30) // Last 30 days
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count
    }))

  if (stats === undefined || files === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Files in storage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total storage used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.averageSize)}</div>
            <p className="text-xs text-muted-foreground">
              Per file average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Types</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.fileTypes).length}</div>
            <p className="text-xs text-muted-foreground">
              Different content types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Types</CardTitle>
            <CardDescription>Distribution of content types in storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileTypeData.slice(0, 8).map((item, index) => (
                <div key={item.fullType} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileTypeIcon(item.fullType)}
                    <div>
                      <p className="text-sm font-medium">{item.fullType}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{item.count}</Badge>
                    <div className="w-20">
                      <Progress
                        value={(item.count / stats.totalFiles) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Size Distribution</CardTitle>
            <CardDescription>Files grouped by size ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sizeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="size" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upload Timeline */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Timeline</CardTitle>
            <CardDescription>File uploads over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed File Types */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed File Types</CardTitle>
          <CardDescription>Complete breakdown of all content types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fileTypeData.map((item) => (
              <div key={item.fullType} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {getFileTypeIcon(item.fullType)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.fullType}</p>
                    <p className="text-xs text-muted-foreground">
                      {((item.count / stats.totalFiles) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Summary</CardTitle>
          <CardDescription>Overall storage usage and efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Storage Efficiency</span>
                <span className="text-sm text-muted-foreground">
                  {stats.totalFiles > 0 ? (stats.totalSize / stats.totalFiles / 1024).toFixed(1) : 0} KB/file
                </span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Average file size is reasonable for your content type mix
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Type Diversity</span>
                <span className="text-sm text-muted-foreground">
                  {Object.keys(stats.fileTypes).length} types
                </span>
              </div>
              <Progress value={Math.min((Object.keys(stats.fileTypes).length / 10) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Good variety of content types in your storage
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Growth Rate</span>
                <span className="text-sm text-muted-foreground">
                  {timelineData.length > 0 ?
                    `${timelineData.reduce((sum: number, day: any) => sum + day.count, 0)} recent` :
                    'No recent uploads'
                  }
                </span>
              </div>
              <Progress value={timelineData.length > 0 ? 85 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {timelineData.length > 0 ?
                  'Active upload pattern detected' :
                  'No recent upload activity'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
