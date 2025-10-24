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
import { getGuests, searchGuests, getGuestsByStatus } from "@/lib/supabase/guests";
import { columns } from "./GuestTableColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuestDetailsModal } from "./GuestDetailsModal";
import { AddGuestModal } from "./AddGuestModal";

interface GuestTableProps {
  searchValue?: string; // External search value
  statusFilter?: string; // External status filter
}

export function GuestTable({ searchValue: externalSearchValue = '', statusFilter = 'all' }: GuestTableProps = {}) {
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
  
  // Refresh trigger for forcing data reload
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Use external search value instead of internal state
  const searchValue = externalSearchValue;


  // Combined effect to handle both search and status filtering
  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        // If there's a search query, use search function
        if (searchValue.trim()) {
          const { data: searchResults, error } = await searchGuests({
            search_query: searchValue,
            include_archived: false,
          });
          
          if (error) {
            setError(error);
            return;
          }
          
          // Apply status filter to search results
          let filteredResults = searchResults || [];
          if (statusFilter !== 'all') {
            filteredResults = filteredResults.filter((guest: Guest) => guest.status === statusFilter);
          }
          
          setData(filteredResults);
        } else {
          // No search query - load by status or all guests
          if (statusFilter !== 'all') {
            const { data: statusResults, error } = await getGuestsByStatus(statusFilter as Guest['status'], false);
            
            if (error) {
              setError(error);
              return;
            }
            
            setData(statusResults || []);
          } else {
            // Load all guests
            const { data: guests, error } = await getGuests(false);
            
            if (error) {
              setError(error);
              return;
            }
            
            setData(guests || []);
          }
        }
      } catch (err) {
        setError('Failed to load guests');
        console.error('Error loading guests:', err);
      } finally {
        setLoading(false);
      }
    }, searchValue.trim() ? 300 : 0); // Only debounce search, not filter changes

    return () => clearTimeout(timeoutId);
  }, [searchValue, statusFilter, refreshTrigger]);

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

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
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
      onGuestDeleted: refreshData,
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
            onClick={refreshData} 
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
      {/* THIS HAS THE COLOR OF THE TABLE HEADER */}
      <div className="overflow-hidden rounded-xl shadow-sm border border-gray-100">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-8 py-5 text-left tracking-wide"
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
          <tbody className="divide-y divide-gray-60">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-25 hover:bg-[#FCFCFC] cursor-pointer transition-colors duration-200"
                  onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.preventDefault();
                    handleGuestClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-8 py-6 whitespace-nowrap">
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
                  className="h-24 text-center text-gray-500 px-8 py-6"
                >
                  No guests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-normal text-gray-500">
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
          <span className="text-sm text-gray-500">
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
        onGuestUpdated={refreshData}
        defaultTab={modalDefaultTab}
      />

      <AddGuestModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onGuestAdded={refreshData}
      />
    </div>
  );
}