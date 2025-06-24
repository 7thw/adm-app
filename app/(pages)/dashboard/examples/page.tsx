'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Upload, 
  BarChart3, 
  Settings, 
  Eye,
  FileText,
  ArrowRight,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

export default function ExamplesIndex() {
  const examples = [
    {
      title: 'Cloudflare R2 Integration',
      description: 'Complete file storage and management solution with Convex + Cloudflare R2',
      href: '/dashboard/examples/r2-integration',
      status: 'ready',
      features: [
        'File Upload with Signed URLs',
        'File Management & Browser',
        'Preview for Multiple File Types',
        'Storage Statistics & Analytics',
        'Configuration Management',
        'Security & Access Control'
      ],
      technologies: ['Convex', 'Cloudflare R2', 'React', 'TypeScript'],
      difficulty: 'intermediate'
    },
    // Future examples can be added here
    {
      title: 'Real-time Chat',
      description: 'Real-time messaging with Convex and user presence',
      href: '#',
      status: 'planned',
      features: [
        'Real-time Messaging',
        'User Presence',
        'File Sharing',
        'Message History'
      ],
      technologies: ['Convex', 'WebSockets', 'React'],
      difficulty: 'advanced'
    },
    {
      title: 'Audio Processing',
      description: 'Audio file processing and transcription with AI',
      href: '#',
      status: 'planned',
      features: [
        'Audio Upload & Processing',
        'Transcription with AI',
        'Waveform Visualization',
        'Audio Metadata Extraction'
      ],
      technologies: ['Convex', 'OpenAI', 'Web Audio API'],
      difficulty: 'advanced'
    },
    {
      title: 'Image Processing',
      description: 'Image optimization and manipulation pipeline',
      href: '#',
      status: 'planned',
      features: [
        'Image Upload & Optimization',
        'Automatic Resizing',
        'Format Conversion',
        'CDN Integration'
      ],
      technologies: ['Convex', 'Sharp', 'Cloudflare'],
      difficulty: 'intermediate'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-yellow-500'
      case 'planned':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Integration Examples</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore comprehensive examples of integrating modern technologies with the Realigna admin application. 
            Each example includes complete implementations, documentation, and best practices.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Ready</p>
                <p className="text-xs text-muted-foreground">
                  {examples.filter(e => e.status === 'ready').length} examples
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Technologies</p>
                <p className="text-xs text-muted-foreground">
                  Convex, R2, AI
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Documentation</p>
                <p className="text-xs text-muted-foreground">
                  Complete guides
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Production Ready</p>
                <p className="text-xs text-muted-foreground">
                  Enterprise grade
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {examples.map((example, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-xl">{example.title}</CardTitle>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(example.status)}`} />
                  </div>
                  <CardDescription className="text-sm">
                    {example.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant="secondary" 
                  className={getDifficultyColor(example.difficulty)}
                >
                  {example.difficulty}
                </Badge>
              </div>

              {/* Technologies */}
              <div className="flex flex-wrap gap-2">
                {example.technologies.map((tech, techIndex) => (
                  <Badge key={techIndex} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {example.features.slice(0, 4).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {example.features.length > 4 && (
                    <li className="text-xs text-muted-foreground">
                      +{example.features.length - 4} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                {example.status === 'ready' ? (
                  <>
                    <Button asChild size="sm">
                      <Link href={example.href}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Example
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${example.href}/README.md`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Documentation
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button disabled size="sm" variant="outline">
                    Coming Soon
                  </Button>
                )}
              </div>
            </CardContent>

            {/* Status Indicator */}
            <div className="absolute top-4 right-4">
              {example.status === 'ready' && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Ready
                </Badge>
              )}
              {example.status === 'planned' && (
                <Badge variant="outline">
                  Planned
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Getting Started</span>
          </CardTitle>
          <CardDescription>
            Quick setup guide for running the examples in your development environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Prerequisites</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Node.js 18+ and pnpm installed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Convex account and project setup</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cloudflare account (for R2 examples)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Environment variables configured</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Quick Start</h4>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <code className="text-sm block">pnpm install</code>
                <code className="text-sm block">pnpm convex dev</code>
                <code className="text-sm block">pnpm dev</code>
              </div>
              <p className="text-xs text-muted-foreground">
                Each example includes detailed setup instructions in its README file.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4 border-t">
            <Button asChild variant="outline">
              <a 
                href="https://docs.convex.dev" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Convex Documentation
              </a>
            </Button>
            <Button asChild variant="outline">
              <a 
                href="https://docs.realigna.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Realigna Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}