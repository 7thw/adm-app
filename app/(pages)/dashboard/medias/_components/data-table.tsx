"use client"

import { type UniqueIdentifier } from "@dnd-kit/core"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlayerPlayFilled,
  IconPlus,
  IconTrashFilled
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
import * as React from "react"
import { toast } from "sonner"
import { Doc } from "@/convex/_generated/dataModel"

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

// Use the Convex-generated Doc type instead of Zod schema
// This ensures single source of truth from the database schema
// Drag functionality has been removed

export const columns: ColumnDef<Doc<"medias">>[] = [
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
      // Access the media data for the current row
      const media = row.original
      const [openPlayer, setOpenPlayer] = React.useState(false)
      const [isClient, setIsClient] = React.useState(false)

      React.useEffect(() => {
        setIsClient(true)
      }, [])

      // Helper function to get the media URL
      const getMediaUrl = () => {
        // Use storageId to generate URL or use embedUrl if available
        if (media.storageId) {
          return `/api/media/${media.storageId}`
        } else if (media.embedUrl) {
          return media.embedUrl
        } else if (media.youtubeId) {
          return `https://www.youtube.com/watch?v=${media.youtubeId}`
        }
        return ""
      }

      // Helper function to determine if media is playable
      const isPlayable = () => {
        return media.mediaType === "audio" && (media.storageId || media.embedUrl || media.youtubeId)
      }

      // Helper function to determine media source type
      const getMediaSourceType = () => {
        if (media.storageId) return "storage"
        if (media.embedUrl) return "embed"
        if (media.youtubeId) return "youtube"
        return "unknown"
      }

      // Get the media URL using our helper function
      const mediaUrl = getMediaUrl();

      // Media URL checking
      const hasUrl = mediaUrl && mediaUrl !== "" && mediaUrl !== "undefined";
      const isAudio = media.mediaType === "audio";
      const playerType = isAudio ? "audio" : "video";
      const canPlay = hasUrl && media.mediaType;

      // Function to open the player dialog
      const openMediaPlayer = () => {
        if (canPlay) setOpenPlayer(true);
      };

      if (!canPlay) {
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
        <Dialog open={openPlayer && isClient} onOpenChange={setOpenPlayer}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={openMediaPlayer}
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
              src={mediaUrl}
              title={media.title}
              description={media.description || ""}
              onError={(error) => {
                console.error("Media playback error:", error);
                toast.error(`Playback failed: ${error}`);
              }}
            />
            <div className="flex-1">
              <MediaInfo
                media={media}
                url={mediaUrl}
                showDebugInfo={false}
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
      // TODO: Implement deleteMedia function in Convex backend
      // const deleteMediaMutation = useMutation(api.admin.deleteMedia);

      const handleDelete = async () => {
        toast.warning("Delete functionality is currently unavailable - backend endpoint needs to be implemented.");
        console.warn("deleteMedia endpoint not implemented in Convex backend");
        // Endpoint would be called like this once implemented:
        // await deleteMediaMutation({ mediaId: row.original._id });
      };

      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-muted-foreground opacity-50" // Visually indicate disabled state
            title="Delete media (currently unavailable)"
          >
            <IconTrashFilled className="h-4 w-4" />
            <span className="sr-only">Delete {row.original.title}</span>
          </Button>
        </div>
      );
    },
  },
]

function DataTableRow({ row }: { row: Row<Doc<"medias">> }) {
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
  data: Doc<"medias">[]
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<"all" | "audio" | "video">("all")
  const [data, setData] = React.useState<Doc<"medias">[]>(initialData)
  // TODO: Implement deleteMedia function in Convex backend
  // const deleteMediaMutation = useMutation(api.admin.deleteMedia);

  // Update data when initialData changes or filter changes
  React.useEffect(() => {
    if (activeFilter === "all") {
      setData(initialData)
    } else {
      setData(initialData.filter(item => item.mediaType === activeFilter))
    }
  }, [initialData, activeFilter])

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
      defaultValue="all"
      value={activeFilter}
      onValueChange={(value) => {
        setActiveFilter(value as "all" | "audio" | "video");
        // Reset to first page when filter changes
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          defaultValue="all"
          value={activeFilter}
          onValueChange={(value: "all" | "audio" | "video") => {
            setActiveFilter(value);
            // Reset to first page when filter changes
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
          }}
        >
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
        <TabsList
          className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex"
        >
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="audio">
            Audio <Badge variant="secondary">{initialData.filter(item => item.mediaType === "audio").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="video">
            Video <Badge variant="secondary">{initialData.filter(item => item.mediaType === "video").length}</Badge>
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
        value="all"
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
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
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
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="audio"
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
                    No audio media found.
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
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
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
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="video"
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
                    No video media found.
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

function TableCellViewer({ item }: { item: Doc<"medias"> }) {
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
              <Label htmlFor="mediaSource">Media Source</Label>
              {item.storageId && (
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">Storage ID</Badge>
                  <Input
                    id="storageId"
                    defaultValue={item.storageId}
                    readOnly
                  />
                </div>
              )}
              {item.embedUrl && (
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">External Embed URL</Badge>
                  <Input
                    id="embedUrl"
                    defaultValue={item.embedUrl}
                    readOnly
                  />
                </div>
              )}
              {item.youtubeId && (
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">YouTube ID</Badge>
                  <Input
                    id="youtubeId"
                    defaultValue={item.youtubeId}
                    readOnly
                  />
                </div>
              )}
            </div>
            {item.thumbnailStorageId && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="thumbnailStorageId">Thumbnail Storage ID</Label>
                <Input
                  id="thumbnailStorageId"
                  defaultValue={item.thumbnailStorageId}
                  readOnly
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
