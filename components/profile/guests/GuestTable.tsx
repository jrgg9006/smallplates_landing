"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Guest } from "@/lib/types/database";
import { getGuests, searchGuests } from "@/lib/supabase/guests";
import { columns } from "./GuestTableColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuestDetailsModal } from "./GuestDetailsModal";
import { AddGuestModal } from "./AddGuestModal";

interface GuestTableProps {
  searchValue?: string; // External search value
}

export function GuestTable({ searchValue: externalSearchValue = '' }: GuestTableProps = {}) {
  // Data management
  const [data, setData] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Modal state
  const [selectedGuest, setSelectedGuest] = React.useState<Guest | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalDefaultTab, setModalDefaultTab] = React.useState<string>("guest-info");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isModalClosing, setIsModalClosing] = React.useState(false);
  const isModalClosingRef = React.useRef(false);
  
  // Use external search value instead of internal state
  const searchValue = externalSearchValue;

  // Load guests with optional loading state
  const loadGuests = React.useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const { data: guests, error } = await getGuests(false); // Don't include archived
      
      if (error) {
        setError(error);
        return;
      }
      
      setData(guests || []);
    } catch (err) {
      setError('Failed to load guests');
      console.error('Error loading guests:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Load guests when component mounts
  React.useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Handle search with debouncing
  React.useEffect(() => {
    if (!searchValue.trim()) {
      loadGuests(false); // Don't show loading when clearing search
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        // Don't show loading for search operations to avoid flickering
        const { data: searchResults, error } = await searchGuests({
          search_query: searchValue,
          include_archived: false,
        });
        
        if (error) {
          setError(error);
          return;
        }
        
        setData(searchResults || []);
        setError(null); // Clear any previous errors
      } catch (err) {
        setError('Search failed');
        console.error('Search error:', err);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleGuestClick = (guest: Guest) => {
    console.log('handleGuestClick called, isModalClosing:', isModalClosing, 'isModalClosingRef:', isModalClosingRef.current);
    // Prevent opening if a modal just closed
    if (isModalClosing || isModalClosingRef.current) {
      console.log('Preventing guest click because modal just closed');
      setIsModalClosing(false);
      isModalClosingRef.current = false;
      return;
    }
    
    console.log('Opening GuestDetailsModal');
    setSelectedGuest(guest);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGuest(null);
    setModalDefaultTab("guest-info"); // Reset to default tab
  };

  const handleAddRecipe = (guest: Guest) => {
    setSelectedGuest(guest);
    setModalDefaultTab("recipe-status");
    setIsModalOpen(true);
  };

  const handleAddGuest = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const table = useReactTable({
    data,
    columns,
    meta: {
      onGuestClick: handleGuestClick,
      onModalClose: () => {
        console.log('Modal close triggered, setting both flags to true');
        setIsModalClosing(true);
        isModalClosingRef.current = true;
        // Reset the flags after a longer delay to ensure row click is prevented
        setTimeout(() => {
          console.log('Resetting both flags to false');
          setIsModalClosing(false);
          isModalClosingRef.current = false;
        }, 500);
      },
      onGuestDeleted: loadGuests,
      onAddRecipe: handleAddRecipe,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Show error state
  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error}</p>
          <Button 
            onClick={loadGuests} 
            className="mt-2"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="w-full p-4 text-center text-muted-foreground">
          Loading guests...
        </div>
      )}
      
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full border-collapse bg-background">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.preventDefault();
                    handleGuestClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No guests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} guest(s) selected.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <GuestDetailsModal
        guest={selectedGuest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onGuestUpdated={() => loadGuests(false)}
        defaultTab={modalDefaultTab}
      />

      <AddGuestModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onGuestAdded={() => loadGuests(false)}
      />
    </div>
  );
}