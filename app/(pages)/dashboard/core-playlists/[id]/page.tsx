"use client"

import React from "react"
import { notFound } from "next/navigation"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2Icon, LoaderIcon, PlusIcon, ArrowLeftIcon } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, schema } from "@/app/(pages)/dashboard/core-playlists/[id]/_components/data-table"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AddSectionForm from "./_components/add-section-form"

interface CorePlaylistPageProps {
  params: Promise<{
    id: string
  }>
}

// Define the type for playlist sections using the imported schema
type PlaylistSection = z.infer<typeof schema>

// This matches the DataTableProps interface in the data-table.tsx component
interface DataTableProps {
  data: PlaylistSection[]
  columns?: ColumnDef<PlaylistSection>[]
}

// Define column configuration for the data table
const columns: ColumnDef<PlaylistSection>[] = [
  {
    accessorKey: "header",
    header: "Section",
    cell: ({ row }) => {
      const section = row.original
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="link" className="p-0 h-auto font-medium text-left justify-start">
              {section.header}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Section</SheetTitle>
              <SheetDescription>
                Make changes to the section here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="header">Header</Label>
                <Input id="header" defaultValue={section.header} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select defaultValue={section.type}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="loop">Loop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={section.status}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="In Process">In Process</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="target">Target</Label>
                  <Input id="target" defaultValue={section.target} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit">Limit</Label>
                  <Input id="limit" defaultValue={section.limit} />
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="flex items-center gap-2">
          {status === "Done" ? (
            <CheckCircle2Icon className="h-4 w-4 text-green-500" />
          ) : (
            <LoaderIcon className="h-4 w-4 text-yellow-500" />
          )}
          <span>{status}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "target",
    header: "Target",
  },
  {
    accessorKey: "limit",
    header: "Limit",
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
  },
]

export default function CorePlaylistPage({ params }: CorePlaylistPageProps) {
  const router = useRouter()

  // Use React.use() to unwrap the params promise in Next.js 14+
  const unwrappedParams = React.use(params) as { id: string }
  const id = unwrappedParams.id

  // Check if id is valid
  if (!id || !/^[\w\d]+$/.test(id)) {
    // If ID format is invalid, return 404
    return notFound()
  }

  // Fetch the playlist from Convex using the getByStringId query
  const playlist = useQuery(api.corePlaylists.getByStringId, { id }) as Doc<"corePlaylists"> | null | undefined

  // Fetch sections for this playlist
  const sections = useQuery(api.coreSections.getByCorePlaylistId,
    playlist ? { playlistId: playlist._id as Id<"corePlaylists"> } : "skip"
  ) || []

  // Convert sections to the format expected by the DataTable
  const formattedSections = sections.map((section, index) => ({
    id: index + 1,
    header: section.title,
    type: section.sectionType || "base", // Use the correct property name with default
    status: "Not Started", // Default status
    target: section.minSelectMedia?.toString() || "-",
    limit: section.maxSelectMedia?.toString() || "-",
    reviewer: "-"
    // Note: The _id and playlistId are not part of the schema in data-table.tsx
  }))

  // Loading state
  const loading = playlist === undefined

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not found state
  if (playlist === null) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <p className="text-muted-foreground">The requested playlist could not be found.</p>
        </div>
      </div>
    )
  }

  // Get category name for display
  const categories = useQuery(api.playlistCategories.getAll, {}) || []
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat._id === categoryId)
    return category ? category.name : "Unknown Category"
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/core-playlists")}>
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold">Playlist Details</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{playlist.title}</h2>
        <p className="text-muted-foreground mb-4">{playlist.description}</p>
        <div className="flex items-center gap-4 mb-6">
          <Badge variant={playlist.status === "published" ? "default" : "outline"}>
            {playlist.status === "published" ? "Published" : "Draft"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Category: {getCategoryName(playlist.categoryId)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/core-playlists/${id}/edit`)}>
            Edit Playlist
          </Button>
          <Button variant="secondary">Preview</Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Playlist Sections</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Section</SheetTitle>
                <SheetDescription>
                  Create a new section for this playlist. Sections can contain multiple media items.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <AddSectionForm corePlaylistId={playlist._id as Id<"corePlaylists">} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {formattedSections.length > 0 ? (
          <DataTable
            data={formattedSections}
            columns={columns}
          />
        ) : (
          <div className="text-center p-8 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">No sections found. Add a section to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
