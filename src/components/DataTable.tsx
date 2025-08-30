"use client";

import { useState, useEffect, ReactNode } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import LoadingSpinner from "./LoadingSpinner";
import {
  MdSearch,
  MdFirstPage,
  MdLastPage,
  MdChevronLeft,
  MdChevronRight,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  getFilterOptions?: (data: T[]) => string[];
}

interface Filter {
  field: string;
  value: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  searchFields?: (keyof T)[];
  showActions?: boolean;
  isLoading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  onDelete,
  onEdit,
  searchFields = [],
  showActions = true,
  isLoading = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
}: DataTableProps<T>) {
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const [displayData, setDisplayData] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Calculate pagination values
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Update filtered data when props or search/filters change
  useEffect(() => {
    let result = [...data];

    // Apply search across all searchable fields
    if (debouncedSearchTerm) {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (!value) return false;
          const stringValue = String(value).toLowerCase();
          return stringValue.includes(searchTermLower);
        })
      );
    }

    // Apply column filters
    filters.forEach(filter => {
      result = result.filter(item => {
        const column = columns.find(col => String(col.accessor) === filter.field);
        if (!column) return true;

        let itemValue;
        if (typeof column.accessor === 'function') {
          itemValue = column.accessor(item);
        } else {
          itemValue = item[column.accessor as keyof T];
        }

        return String(itemValue).toLowerCase() === filter.value.toLowerCase();
      });
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        const column = columns.find(col => String(col.accessor) === String(sortConfig.field));
        if (column && typeof column.accessor === 'function') {
          aValue = column.accessor(a);
          bValue = column.accessor(b);
        } else {
          aValue = a[sortConfig.field];
          bValue = b[sortConfig.field];
        }
        
        const safeA = aValue ?? '';
        const safeB = bValue ?? '';
        if (safeA < safeB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (safeA > safeB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [data, debouncedSearchTerm, filters, sortConfig, searchFields, columns]);

  // Update display data based on pagination
  useEffect(() => {
    setDisplayData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, startIndex, endIndex]);

  const handleSort = (field: keyof T) => {
    setSortConfig(current => ({
      field,
      direction: current?.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilter = (field: string, value: string) => {
    setFilters(current => {
      const exists = current.find(f => f.field === field);
      if (exists) {
        return current.map(f => f.field === field ? { ...f, value } : f);
      }
      return [...current, { field, value }];
    });
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete this item?')) {
      // Optimistically remove from filtered data
      setFilteredData(current => current.filter(item => item.id !== id));
      try {
        await onDelete(id);
      } catch (error) {
        // Revert on error
        setFilteredData(current => [...current, data.find(item => item.id === id)!]);
        console.error('Error deleting item:', error);
      }
    }
  };

  return (
    <div>
      {/* Table header with search and filters */}
      <div className="bg-white pt-2 pb-4 border-b border-gray-200 sm:rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-2">
            {/* Search input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg border-0 bg-slate-50 py-2 pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white transition-all duration-200 sm:text-sm sm:leading-6"
              />
            </div>

            {/* Column filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {columns.map((column) => {
                if (!column.filterable || !column.getFilterOptions) return null;

                const options = column.getFilterOptions(data);
                if (options.length === 0) return null;

                const currentFilter = filters.find(
                  (f) => f.field === String(column.accessor)
                )?.value;

                return (
                  <div key={String(column.accessor)}>
                    <div className="relative">
                      <select
                        value={currentFilter || ""}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setFilters(
                              filters.filter(
                                (f) => f.field !== String(column.accessor)
                              )
                            );
                          } else {
                            handleFilter(
                              String(column.accessor),
                              e.target.value
                            );
                          }
                        }}
                        className="appearance-none block w-fit rounded-lg py-2 pl-3 pr-10 bg-slate-50 text-slate-700 border transition-all duration-200 sm:text-sm sm:leading-6 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{column.header}</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <MdKeyboardArrowDown className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clear all filters */}
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Table/Card View Container */}
      <div className="bg-white shadow-sm sm:rounded-b-lg">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.accessor)}
                      scope="col"
                      className="px-3 py-3 text-left text-sm font-semibold text-gray-900"
                    >
                      <div className="group inline-flex items-center">
                        {column.header}
                        {column.sortable && (
                          <button
                            className="ml-2 flex-none rounded text-gray-400 hover:text-gray-500"
                            onClick={() =>
                              handleSort(column.accessor as keyof T)
                            }
                          >
                            <span className="sr-only">Sort by</span>
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {showActions && (
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (showActions ? 1 : 0)}
                      className="px-3 py-4 text-sm text-gray-500 text-center"
                    >
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (showActions ? 1 : 0)}
                      className="px-3 py-4 text-sm text-gray-500 text-center"
                    >
                      No results found
                    </td>
                  </tr>
                ) : (
                  displayData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={String(column.accessor)}
                          className="px-3 py-1.5 text-sm text-gray-500"
                        >
                          {typeof column.accessor === "function"
                            ? column.accessor(item)
                            : String(item[column.accessor] || "")}
                        </td>
                      ))}
                      {showActions && (
                        <td className="relative py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item.id)}
                                className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 hover:border-slate-300"
                                title="Edit"
                              >
                                <FiEdit3 className="w-3 h-3 mr-1.5" />
                                Edit
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 hover:border-slate-300"
                                title="Delete"
                              >
                                <FiTrash2 className="w-3 h-3 mr-1.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, totalItems)}
                    </span>{" "}
                    of <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Items per page selector */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border-slate-300 py-1.5 text-sm font-medium text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>

                  {/* Page navigation */}
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      <MdFirstPage className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <MdChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNum
                              ? "z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <MdChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Last</span>
                      <MdLastPage className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-4 text-center">
                <LoadingSpinner />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No results found
              </div>
            ) : (
              displayData.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col space-y-2">
                    {columns.map((column) => (
                      <div
                        key={String(column.accessor)}
                        className="flex justify-between"
                      >
                        <div className="text-sm font-medium text-gray-500">
                          {column.header}
                        </div>
                        <div className="text-sm text-gray-900">
                          {typeof column.accessor === "function"
                            ? column.accessor(item)
                            : String(item[column.accessor] || "")}
                        </div>
                      </div>
                    ))}
                    {showActions && (
                      <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item.id)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 hover:border-slate-300"
                            title="Edit"
                          >
                            <FiEdit3 className="w-4 h-4 mr-1.5" />
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 hover:border-slate-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
