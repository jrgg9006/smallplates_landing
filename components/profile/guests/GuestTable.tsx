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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Guest } from "@/lib/types/database";
import { getGuests, searchGuests, getGuestsByStatus } from "@/lib/supabase/guests";
import { columns } from "./GuestTableColumns";
import { Button } from "@/components/ui/button";
import { GuestDetailsModal } from "./GuestDetailsModal";
import { AddGuestModal } from "./AddGuestModal";
import { MobileGuestCard } from "./MobileGuestCard";

interface GuestTableProps {
  searchValue?: string; // External search value
  statusFilter?: string; // External status filter
  onDataLoaded?: () => void; // Callback when data is loaded
}

export function GuestTable({ searchValue: externalSearchValue = '', statusFilter = 'all', onDataLoaded }: GuestTableProps = {}) {
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
        
        // Call the callback to update counts in parent component
        if (onDataLoaded) {
          onDataLoaded();
        }
      } catch (err) {
        setError('Failed to load guests');
        console.error('Error loading guests:', err);
      } finally {
        setLoading(false);
      }
    }, searchValue.trim() ? 300 : 0); // Only debounce search, not filter changes

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Loading State */}
      {loading && (
        <div className="w-full p-4 text-center text-muted-foreground">
          Loading guests...
        </div>
      )}

      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50 border-b border-gray-200">
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
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
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
                    className="px-8 py-12"
                  >
                    <div className="text-center">
                      <div className="mb-6">
                        <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-3">
                          Welcome to Small Plates!
                        </h3>
                        <p className="text-lg text-gray-500 mb-6">
                          You&apos;re all set! Now let&apos;s start building your recipe collection.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                        <h4 className="font-semibold text-gray-500 mb-4">Start by:</h4>
                        <div className="space-y-3 text-left">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                            <div>
                              <p className="font-medium text-gray-500">Adding guests and their favorite recipes</p>
                              <p className="text-sm text-gray-500">Keep track of what everyone loves to cook</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                            <div>
                              <p className="font-medium text-gray-500">Sharing your Recipe Collector link</p>
                              <p className="text-sm text-gray-500">Let friends and family submit their own recipes</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards Layout */}
      <div className="md:hidden">
        {table.getRowModel().rows?.length ? (
          <div className="space-y-3">
            {table.getRowModel().rows.map((row) => (
              <MobileGuestCard
                key={row.id}
                guest={row.original}
                onModalClose={() => {
                  console.log('Modal close triggered from mobile card, setting both flags to true');
                  setIsModalClosing(true);
                  isModalClosingRef.current = true;
                  setTimeout(() => {
                    console.log('Resetting both flags to false from mobile card');
                    setIsModalClosing(false);
                    isModalClosingRef.current = false;
                  }, 500);
                }}
                onGuestDeleted={refreshData}
                onAddRecipe={handleAddRecipe}
                onRowClick={handleGuestClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-3">
                  Welcome to Small Plates!
                </h3>
                <p className="text-lg text-gray-500 mb-6">
                  You&apos;re all set! Now let&apos;s start building your recipe collection.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-500 mb-4">Start by:</h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-500">Adding guests and their favorite recipes</p>
                      <p className="text-sm text-gray-500">Keep track of what everyone loves to cook</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-500">Sharing your Recipe Collector link</p>
                      <p className="text-sm text-gray-500">Let friends and family submit their own recipes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-sm text-gray-500 order-2 sm:order-1">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} guest(s) selected.
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 px-2">
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

      {/* Modals */}
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