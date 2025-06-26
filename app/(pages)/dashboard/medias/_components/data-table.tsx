"use client"

import { api } from "@/convex/_generated/api"
import { type UniqueIdentifier } from "@dnd-kit/core"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlayerPlayFilled,
  IconPlus
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useMutation } from "convex/react"
import * as React from "react"
import { toast } from "sonner"
import { z } from "zod"

import MediaPlayer from "@/components/medias/MediaPlayer"
import MediaInfo from "@/components/medias/media-info"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import FormMedia from "./FormMedia"

export const schema = z.object({
  _id: z.any(), // Convex ID
  title: z.string(),
  mediaType: z.string(),
  mediaUrl: z.string(),
  duration: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().optional(),
  contentType: z.string().optional(),
  uploadKey: z.string().optional(),
  userId: z.string().optional(),
  uploadStatus: z.string().optional(),
  _creationTime: z.number().optional(),
})

// Drag functionality has been removed

export const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Media Title",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "mediaType",
    header: "Type",
    cell: ({ row }) => (
      <div className="w-24">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.getValue("mediaType")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "duration",
    header: () => <div className="w-full text-right">Duration</div>,
    cell: ({ row }) => {
      // Format duration from seconds to MM:SS
      const duration = row.getValue("duration") as number;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return (
        <div className="text-right font-medium">
          {formattedDuration}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      // Format timestamp to readable date
      const timestamp = row.getValue("createdAt") as number;
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleDateString();

      return (
        <div className="font-medium">
          {formattedDate}
        </div>
      );
    },
  },
  {
    id: "play",
    header: "",
    cell: ({ row }) => {
      const media = row.original;

      // Try to determine the actual media URL
      let actualMediaUrl = media.mediaUrl;

      // If mediaUrl is empty but we have an uploadKey, try to construct the URL
      if ((!actualMediaUrl || actualMediaUrl.trim() === "") && media.uploadKey) {
        // Check if it's a UUID (R2 generated key) or custom key
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(media.uploadKey);
        // Use R2 custom domain URL regardless of UUID or not
        actualMediaUrl = `https://r2-realigna.7thw.co/${media.uploadKey}`;
      }

      // Ensure URL is properly formed
      if (actualMediaUrl && !actualMediaUrl.startsWith('http')) {
        actualMediaUrl = `https://${actualMediaUrl}`;
      }
      
      // Debug the URL to help troubleshoot
      if (actualMediaUrl) {
        console.log(`Media URL for ${media.title}:`, actualMediaUrl);
      } else {
        console.warn(`No URL found for media ${media.title}`);
      }

      const hasValidUrl = actualMediaUrl && actualMediaUrl.trim() !== "";

      if (!hasValidUrl) {
        return (
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="text-muted-foreground/50"
            title="Media URL not available"
          >
            <IconPlayerPlayFilled className="h-4 w-4" />
            <span className="sr-only">No media available</span>
          </Button>
        );
      }

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              title={`Play ${media.title}`}
            >
              <IconPlayerPlayFilled className="h-4 w-4" />
              <span className="sr-only">Play {media.title}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl flex flex-col">
            <DialogHeader>
              <DialogTitle>Play Media</DialogTitle>
            </DialogHeader>
            <MediaPlayer
              className="flex-1 w-[100%]"
              src={actualMediaUrl}
              title={media.title}
              description={media.description}
              onError={(error) => {
                console.error("Media playback error:", error);
                toast.error(`Playback failed: ${error}`);
              }}
            />
            <div className="flex-1">
              <MediaInfo
                media={media}
                url={actualMediaUrl}
                showDebugInfo={true}
              />
            </div>

          </DialogContent>
        </Dialog>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // Get the delete media mutation from Convex
      const deleteMediaMutation = useMutation(api.media.deleteMedia);

      const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${row.original.title}?`)) {
          try {
            await deleteMediaMutation({ id: row.original._id });
            toast.success("Media deleted successfully");
            // You might want to refresh the data here
          } catch (error: any) {
            toast.error(`Failed to delete media: ${error.message}`);
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]

function DataTableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [data, setData] = React.useState<z.infer<typeof schema>[]>(initialData)
  const deleteMediaMutation = useMutation(api.media.deleteMedia);

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ _id }) => _id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row._id?.toString() || "",
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Function to refresh data after new media is added
  const refreshData = () => {
    // Force re-render with the latest data
    setData([...initialData])
    table.resetRowSelection()
  }

  // Drag functionality has been removed

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Medias</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="audio">
            Audio <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="video">
            Video <Badge variant="secondary">2</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Add Media</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[320px]">
              <DialogHeader>
                <DialogTitle>Add New Media</DialogTitle>
                <DialogDescription>
                  Upload audio or video files to your media library
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <FormMedia
                  onSuccess={() => {
                    // Close the dialog
                    setDialogOpen(false);
                    // Refresh the data
                    refreshData();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <DataTableRow key={row.id} row={row} />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
        >
          <IconLayoutColumns className="size-4" />
          <span className="sr-only">Open item</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Media Details</DrawerTitle>
          <DrawerDescription>View and edit media information</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="title">Media Title</Label>
              <Input id="title" defaultValue={item.title} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="mediaType">Type</Label>
                <Select defaultValue={item.mediaType}>
                  <SelectTrigger id="mediaType" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  defaultValue={item.duration.toString()}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                defaultValue={item.description || ""}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="mediaUrl">Media URL</Label>
              <Input
                id="mediaUrl"
                defaultValue={item.mediaUrl}
                readOnly
              />
            </div>
            {item.thumbnailUrl && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  defaultValue={item.thumbnailUrl}
                />
              </div>
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
