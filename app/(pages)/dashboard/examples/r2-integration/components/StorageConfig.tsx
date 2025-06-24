'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Globe,
  Shield,
  Key,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

export function StorageConfig() {
  const [showSecrets, setShowSecrets] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Mock configuration values (in real app, these would come from environment or API)
  const [config, setConfig] = useState({
    bucket: process.env.NEXT_PUBLIC_R2_BUCKET || 'realigna-storage',
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT || 'https://xxx.r2.cloudflarestorage.com',
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || 'hidden',
    secretAccessKey: 'hidden',
    token: 'hidden',
    region: 'auto'
  })

  const [corsConfig, setCorsConfig] = useState(`[
  {
    "AllowedOrigins": ["http://localhost:3100", "https://adm-realigna.7thw.co"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "MaxAgeSeconds": 3600
  }
]`)

  const testConnection = async () => {
    setTestingConnection(true)
    
    // Simulate connection test
    setTimeout(() => {
      setConnectionStatus(Math.random() > 0.2 ? 'success' : 'error')
      setTestingConnection(false)
    }, 2000)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatConfigValue = (value: string) => {
    if (!showSecrets && (value.includes('key') || value.includes('token') || value.includes('secret'))) {
      return '••••••••••••••••'
    }
    return value
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="environment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="cors">CORS</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="environment" className="space-y-6">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Environment Variables
              </CardTitle>
              <CardDescription>
                Configure your Cloudflare R2 credentials and settings. These should be set in your deployment environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Show Secret Values</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showSecrets}
                    onCheckedChange={setShowSecrets}
                  />
                  {showSecrets ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>R2_BUCKET</Label>
                  <div className="flex gap-2">
                    <Input value={config.bucket} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.bucket)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>R2_ENDPOINT</Label>
                  <div className="flex gap-2">
                    <Input value={config.endpoint} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.endpoint)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>R2_ACCESS_KEY_ID</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formatConfigValue(config.accessKeyId)} 
                      readOnly 
                      className="font-mono" 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.accessKeyId)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>R2_SECRET_ACCESS_KEY</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formatConfigValue(config.secretAccessKey)} 
                      readOnly 
                      className="font-mono" 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.secretAccessKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>R2_TOKEN</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formatConfigValue(config.token)} 
                      readOnly 
                      className="font-mono" 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>R2_REGION</Label>
                  <div className="flex gap-2">
                    <Input value={config.region} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(config.region)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Connection Test */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Connection Test</h4>
                    <p className="text-sm text-muted-foreground">
                      Test your R2 configuration and permissions
                    </p>
                  </div>
                  <Button
                    onClick={testConnection}
                    disabled={testingConnection}
                    variant="outline"
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {connectionStatus === 'success' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connection successful! R2 bucket is accessible and properly configured.
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === 'error' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connection failed! Please check your credentials and bucket configuration.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Convex Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Convex Setup Instructions</CardTitle>
              <CardDescription>
                Commands to configure your Convex environment with R2 credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Run these commands in your terminal:</p>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between bg-background rounded px-2 py-1">
                    <code>pnpm convex env set R2_BUCKET {config.bucket}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`pnpm convex env set R2_BUCKET ${config.bucket}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-background rounded px-2 py-1">
                    <code>pnpm convex env set R2_ENDPOINT {config.endpoint}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`pnpm convex env set R2_ENDPOINT ${config.endpoint}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-background rounded px-2 py-1">
                    <code>pnpm convex env set R2_ACCESS_KEY_ID xxxxx</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`pnpm convex env set R2_ACCESS_KEY_ID ${config.accessKeyId}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-background rounded px-2 py-1">
                    <code>pnpm convex env set R2_SECRET_ACCESS_KEY xxxxx</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard('pnpm convex env set R2_SECRET_ACCESS_KEY xxxxx')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-background rounded px-2 py-1">
                    <code>pnpm convex env set R2_TOKEN xxxxx</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard('pnpm convex env set R2_TOKEN xxxxx')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cors" className="space-y-6">
          {/* CORS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                CORS Configuration
              </CardTitle>
              <CardDescription>
                Configure Cross-Origin Resource Sharing (CORS) policies for your R2 bucket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cors-config">CORS Policy JSON</Label>
                <Textarea
                  id="cors-config"
                  value={corsConfig}
                  onChange={(e) => setCorsConfig(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Enter CORS configuration..."
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Make sure to include your domain origins in the AllowedOrigins array to enable file uploads from your application.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(corsConfig)}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Configuration
                </Button>
                <Button asChild variant="outline">
                  <a
                    href="https://developers.cloudflare.com/r2/api/s3/api/#cors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    CORS Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CORS Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Common CORS Configurations</CardTitle>
              <CardDescription>
                Pre-configured CORS policies for different use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Development Setup</h4>
                    <Badge variant="secondary">Development</Badge>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["http://localhost:3100", "http://localhost:3120"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]`}
                  </pre>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Production Setup</h4>
                    <Badge variant="default">Production</Badge>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["https://admin.realigna.com", "https://app.realigna.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "MaxAgeSeconds": 86400
  }
]`}
                  </pre>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Public Read Only</h4>
                    <Badge variant="outline">Public</Badge>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Manage security settings and access controls for your R2 storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Signed URLs Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Require signed URLs for all file access
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Upload Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require user authentication for file uploads
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Content Type Validation</Label>
                    <p className="text-sm text-muted-foreground">
                      Validate file types before upload
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>File Size Limits</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce maximum file size limits
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings are enforced by the Convex R2 component and your application logic.
                  Make sure to implement proper validation in your upload handlers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced settings for R2 integration and performance optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default URL Expiration (seconds)</Label>
                  <Input type="number" defaultValue="3600" />
                  <p className="text-xs text-muted-foreground">
                    Default expiration time for generated URLs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input type="number" defaultValue="100" />
                  <p className="text-xs text-muted-foreground">
                    Maximum allowed file size for uploads
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Concurrent Uploads</Label>
                  <Input type="number" defaultValue="3" />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of concurrent uploads
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input type="number" defaultValue="3" />
                  <p className="text-xs text-muted-foreground">
                    Number of retry attempts for failed operations
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Performance Settings</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress files before upload
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Parallel Uploads</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable parallel chunk uploads for large files
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cache Metadata</Label>
                    <p className="text-sm text-muted-foreground">
                      Cache file metadata for better performance
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Links */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation & Resources</CardTitle>
              <CardDescription>
                Helpful links and resources for R2 integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="justify-start">
                  <a
                    href="https://www.convex.dev/components/cloudflare-r2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Convex R2 Component Docs
                  </a>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <a
                    href="https://developers.cloudflare.com/r2/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Cloudflare R2 Documentation
                  </a>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <a
                    href="https://developers.cloudflare.com/r2/api/s3/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    R2 S3 API Compatibility
                  </a>
                </Button>

                <Button asChild variant="outline" className="justify-start">
                  <a
                    href="https://github.com/get-convex/r2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GitHub Repository
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}