'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import LoadingSpinner from './LoadingSpinner';

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
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
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
      <div className="bg-white px-4 py-3 border-b border-gray-200 sm:rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-md border-0 bg-gray-50 py-1.5 pl-3 pr-8 text-gray-900 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Column filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {columns.map(column => {
                if (!column.filterable || !column.getFilterOptions) return null;
                
                const options = column.getFilterOptions(data);
                if (options.length === 0) return null;

                const currentFilter = filters.find(f => f.field === String(column.accessor))?.value;
                
                return (
                  <div key={String(column.accessor)} className="flex items-center gap-2">
                    <select
                      value={currentFilter || ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setFilters(filters.filter(f => f.field !== String(column.accessor)));
                        } else {
                          handleFilter(String(column.accessor), e.target.value);
                        }
                      }}
                      className="block w-fit rounded-md border-0 py-1.5 pl-3 pr-10 bg-white text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                      <option value="">{column.header}</option>
                      {options.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
                  {columns.map(column => (
                    <th
                      key={String(column.accessor)}
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      <div className="group inline-flex items-center">
                        {column.header}
                        {column.sortable && (
                          <button
                            className="ml-2 flex-none rounded text-gray-400 hover:text-gray-500"
                            onClick={() => handleSort(column.accessor as keyof T)}
                          >
                            <span className="sr-only">Sort by</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {showActions && (
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
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
                      {columns.map(column => (
                        <td
                          key={String(column.accessor)}
                          className="px-3 py-4 text-sm text-gray-500"
                        >
                          {typeof column.accessor === 'function'
                            ? column.accessor(item)
                            : String(item[column.accessor] || '')}
                        </td>
                      ))}
                      {showActions && (
                        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
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
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
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
                    className="rounded-md border-gray-300 py-1.5 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {pageSizeOptions.map(size => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>

                  {/* Page navigation */}
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0L9 10.414V13a1 1 0 11-2 0V7a1 1 0 011-1h6a1 1 0 110 2h-2.586l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
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
                              ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Last</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L11 9.586V7a1 1 0 112 0v6a1 1 0 01-1 1H6a1 1 0 110-2h2.586l-5.293-5.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
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
                    {columns.map(column => (
                      <div key={String(column.accessor)} className="flex justify-between">
                        <div className="text-sm font-medium text-gray-500">{column.header}</div>
                        <div className="text-sm text-gray-900">
                          {typeof column.accessor === 'function'
                            ? column.accessor(item)
                            : String(item[column.accessor] || '')}
                        </div>
                      </div>
                    ))}
                    {showActions && (
                      <div className="flex justify-end space-x-3 pt-2 border-t">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item.id)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
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
