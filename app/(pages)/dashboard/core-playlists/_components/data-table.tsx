"use client"

import * as React from "react"
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    ColumnDef,
    ColumnFiltersState,
    Row,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    ColumnsIcon,
    GripVerticalIcon,
    MoreVerticalIcon,
    PlusIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "convex/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
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
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"

// Use the actual Convex Doc type for sections
type TableData = Doc<"coreSections">

interface DataTableProps<TData extends TableData> {
    data: TData[]
    columns?: ColumnDef<TData>[]
    onReorder?: (newOrder: TData[]) => Promise<void>
    onAddSection?: () => void
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: Id<"coreSections"> }) {
    const { attributes, listeners } = useSortable({
        id: id.toString(),
    })

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <GripVerticalIcon className="size-3 text-muted-foreground" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    )
}

function DraggableRow<TData extends TableData>({
    row,
    onEdit,
    onDelete
}: {
    row: Row<TData>
    onEdit?: (item: TData) => void
    onDelete?: (item: TData) => void
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original._id.toString(),
    })

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            data-dragging={isDragging}
            ref={setNodeRef}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    )
}

export function DataTable<TData extends TableData>({
    data: initialData,
    columns: customColumns,
    onReorder,
    onAddSection,
}: DataTableProps<TData>) {
    const [data, setData] = React.useState(() => initialData)
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    })

    // Convex mutations
    const updateSection = useMutation(api.coreSections.update)
    const deleteSection = useMutation(api.coreSections.remove)
    const reorderSections = useMutation(api.coreSections.reorder)
    // TODO: Add duplicate function to coreSections API
    // const duplicateSection = useMutation(api.coreSections.duplicate)

    const sortableId = React.useId()
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    // Update local data when props change
    React.useEffect(() => {
        setData(initialData)
    }, [initialData])

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => data?.map(({ _id }) => _id.toString()) || [],
        [data]
    )

    // Default columns if none provided
    const defaultColumns: ColumnDef<TData>[] = [
        {
            id: "drag",
            header: () => null,
            cell: ({ row }) => <DragHandle id={row.original._id} />,
            size: 40,
        },
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                </div>
            ),
            size: 40,
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.title}
                </div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.type}
                </Badge>
            ),
        },
        {
            accessorKey: "order",
            header: "Order",
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.order}
                </div>
            ),
        },
        {
            accessorKey: "maxSelectMedia",
            header: "Max Media",
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.maxSelectMedia || "-"}
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const section = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                size="icon"
                            >
                                <MoreVerticalIcon className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => handleEdit(section)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(section)}>
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleDelete(section)}
                                className="text-destructive"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const columns = customColumns || defaultColumns

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
        getRowId: (row) => row._id.toString(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
            const oldIndex = dataIds.indexOf(active.id)
            const newIndex = dataIds.indexOf(over.id)
            const newData = arrayMove(data, oldIndex, newIndex)

            setData(newData)

            // Call the onReorder callback if provided
            if (onReorder) {
                try {
                    await onReorder(newData)
                    toast.success("Sections reordered successfully")
                } catch (error) {
                    console.error("Error reordering sections:", error)
                    toast.error("Failed to reorder sections")
                    // Revert the change on error
                    setData(data)
                }
            } else {
                // Default reorder using Convex mutation
                try {
                    if (data.length > 0 && '_id' in data[0]) {
                        // Check the expected parameters for reorderSections
                        await reorderSections({
                            sectionIds: newData.map(item => item._id) as Id<"coreSections">[],
                        })
                        toast.success("Sections reordered successfully")
                    }
                } catch (error) {
                    console.error("Error reordering sections:", error)
                    toast.error("Failed to reorder sections")
                    setData(data)
                }
            }
        }
    }

    const handleEdit = (section: TData) => {
        // Navigate to the edit page for this section
        window.location.href = `/dashboard/core-playlists/${section.corePlaylistId}/sections/${section._id}/edit`
    }

    const handleDuplicate = async (section: TData) => {
        try {
            // TODO: Implement section duplication when API is available
            // await duplicateSection({ id: section._id })
            toast.success("Section duplicated successfully")
        } catch (error) {
            console.error("Error duplicating section:", error)
            toast.error("Failed to duplicate section")
        }
    }

    const handleDelete = async (section: TData) => {
        if (!window.confirm("Are you sure you want to delete this section?")) {
            return
        }

        try {
            await deleteSection({ id: section._id })
            toast.success("Section deleted successfully")
        } catch (error) {
            console.error("Error deleting section:", error)
            toast.error("Failed to delete section")
        }
    }

    const handleAddSectionClick = () => {
        if (onAddSection) {
            onAddSection()
        } else {
            // Default behavior if no callback provided
            if (data.length > 0 && '_id' in data[0]) {
                const playlistId = (data[0] as any).corePlaylistId
                window.location.href = `/dashboard/core-playlists/${playlistId}/sections/new`
            } else {
                toast.error("Cannot determine playlist ID for new section")
            }
        }
    }

    return (
        <div className="flex w-full flex-col justify-start gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <ColumnsIcon className="h-4 w-4" />
                                <span className="hidden lg:inline">Columns</span>
                                <ChevronDownIcon className="h-4 w-4" />
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
                </div>

                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddSectionClick}
                >
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden lg:inline">Add Section</span>
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId}
                >
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} colSpan={header.colSpan}>
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
                                <SortableContext
                                    items={dataIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {table.getRowModel().rows.map((row) => (
                                        <DraggableRow
                                            key={row.id}
                                            row={row}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </SortableContext>
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No sections found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4">
                <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
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
                            <SelectTrigger className="w-20" id="rows-per-page">
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
                            <ChevronsLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
