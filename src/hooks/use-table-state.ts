"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { APP_CONFIG } from "@/configs/app.config";

interface UseTableStateOptions<T, F = string> {
  data: T[];
  filterFn?: (item: T, search: string) => boolean;
  sortFn?: (a: T, b: T, field: F, order: "asc" | "desc") => number;
  defaultSortField: F;
  defaultSortOrder: "asc" | "desc";
  pageSize?: number;
}

/**
 * Headless hook to manage table state: filtering, sorting, and pagination.
 * Synchronizes with URL search parameters for shared state.
 */
export function useTableState<T extends { id: string }, F = string>({
  data,
  filterFn,
  sortFn,
  defaultSortField,
  defaultSortOrder,
  pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
}: UseTableStateOptions<T, F>) {
  const searchParams = useSearchParams();

  // Search state is driven by the URL "q" parameter
  const search = searchParams.get("q") ?? "";

  // Local Sort and Pagination state
  const [sortField, setSortField] = useState<F>(defaultSortField);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);
  const [page, setPage] = useState(1);

  // 1. Filter and Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...data];

    // Filter
    if (filterFn) {
      result = result.filter((item) => filterFn(item, search));
    }

    // Sort
    if (sortFn) {
      result = result.sort((a, b) => sortFn(a, b, sortField, sortOrder));
    }

    return result;
  }, [data, search, filterFn, sortFn, sortField, sortOrder]);

  // 2. Paginate
  const paginatedItems = useMemo(() => {
    const total = filteredAndSorted.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const normalizedPage = page > maxPage ? maxPage : page;
    const start = (normalizedPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, page, pageSize]);

  // 3. Sync page state if it becomes invalid (e.g., after filtering)
  useEffect(() => {
    const total = filteredAndSorted.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage && maxPage > 0) {
      setPage(maxPage);
    }
  }, [filteredAndSorted.length, page, pageSize]);

  // 4. Handlers
  const toggleSort = (field: F) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return {
    search,
    sortField,
    sortOrder,
    page,
    setPage,
    toggleSort,
    filteredAndSorted,
    paginatedItems,
    totalItems: filteredAndSorted.length,
    pageSize,
  };
}
