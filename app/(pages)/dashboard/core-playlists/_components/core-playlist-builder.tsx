"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DraggableContainer } from "@/components/dnd/draggable-container"
import { DraggableItem } from "@/components/dnd/draggable-item"
import { DataTable, DashboardItem } from "@/app/(pages)/dashboard/_components/data-table"
import { Plus, GripVertical, Settings, Play } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

// Core Section interface following ultra-strict naming convention
interface CoreSection {
  coreSectionId: string
  coreSectionTitle: string
  coreSectionType: string
  isRequired: boolean
  minSelectMedia: number
  maxSelectMedia: number
  coreMediaItems: CoreMediaItem[]
  order: number
}

// Core Media Item interface following ultra-strict naming convention
interface CoreMediaItem {
  coreMediaId: string
  coreMediaTitle: string
  coreMediaType: string
  duration?: number
  order: number
}

interface CorePlaylistBuilderProps {
  corePlaylistId: Id<"corePlaylists">
  corePlaylistTitle: string
  coreSections: CoreSection[]
  onAddCoreSection: () => void
  onUpdateCoreSections: (coreSections: CoreSection[]) => void
  onUpdateCoreMediaItems: (coreSectionId: string, coreMediaItems: CoreMediaItem[]) => void
}

export function CorePlaylistBuilder({
  corePlaylistId,
  corePlaylistTitle,
  coreSections,
  onAddCoreSection,
  onUpdateCoreSections,
  onUpdateCoreMediaItems,
}: CorePlaylistBuilderProps) {
  // Convert CoreMediaItem to DashboardItem for data-table compatibility
  const convertToDataTableItems = (coreMediaItems: CoreMediaItem[]): DashboardItem[] => {
    return coreMediaItems.map((item, index) => ({
      id: parseInt(item.coreMediaId) || index,
      title: item.coreMediaTitle,
      sectionType: item.coreMediaType,
      isRequired: true, // Media items are typically required
      minSelectMedia: 1,
      maxSelectMedia: 1,
      corePlaylistId: corePlaylistId,
    }))
  }

  // Handle core section reordering
  const handleCoreSectionReorder = (reorderedSections: CoreSection[]) => {
    const updatedSections = reorderedSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }))
    onUpdateCoreSections(updatedSections)
  }

  // Handle media item reordering within a section
  const handleCoreMediaReorder = (coreSectionId: string, reorderedItems: DashboardItem[]) => {
    // Convert back to CoreMediaItem format
    const coreMediaItems: CoreMediaItem[] = reorderedItems.map((item, index) => ({
      coreMediaId: item.id.toString(),
      coreMediaTitle: item.title,
      coreMediaType: item.sectionType,
      order: index + 1,
    }))
    
    onUpdateCoreMediaItems(coreSectionId, coreMediaItems)
  }

  return (
    <div className="space-y-6">
      {/* Core Playlist Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{corePlaylistTitle}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {corePlaylistId}
            </Badge>
            <span>•</span>
            <span>{coreSections.length} Core Sections</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={onAddCoreSection} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Core Section
          </Button>
        </div>
      </div>

      <Separator />

      {/* Draggable Core Sections */}
      <DraggableContainer
        items={coreSections}
        onReorder={handleCoreSectionReorder}
        className="space-y-6"
      >
        {coreSections.map((coreSection) => (
          <DraggableItem
            key={coreSection.coreSectionId}
            id={coreSection.coreSectionId}
            className="p-0 border-0 bg-transparent"
            showDragHandle={false}
          >
            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-grab text-muted-foreground hover:text-foreground"
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{coreSection.coreSectionTitle}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {coreSection.coreSectionType}
                        </Badge>
                        {coreSection.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {coreSection.minSelectMedia}-{coreSection.maxSelectMedia} media items
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Media
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Data Table for Core Media Items */}
                <div className="rounded-md border">
                  <DataTable
                    data={convertToDataTableItems(coreSection.coreMediaItems)}
                    onReorder={(reorderedItems) => 
                      handleCoreMediaReorder(coreSection.coreSectionId, reorderedItems)
                    }
                  />
                </div>
                {coreSection.coreMediaItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium">No media items yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add media items to this Core Section to get started.
                    </p>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Media Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </DraggableItem>
        ))}
      </DraggableContainer>

      {/* Empty State */}
      {coreSections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Core Sections yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Core Sections organize your media content. Each section can contain multiple media items 
              that subscribers will experience in sequence.
            </p>
            <Button onClick={onAddCoreSection}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Core Section
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
