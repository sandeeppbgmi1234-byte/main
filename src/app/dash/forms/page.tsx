"use client";

import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formService } from "@/api/services/forms";
import { formKeys } from "@/keys/react-query";
import { type FormStatus } from "@dm-broo/common-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTableState } from "@/hooks/use-table-state";
import { useSearchSync } from "@/hooks/use-search-sync";
import { APP_CONFIG } from "@/configs/app.config";
import {
  TableRow,
  MobilePageLayout,
  TablePageLayout,
  TableFilterMenu,
} from "../_components";
import { FormStatusFilter } from "../_components/TableFilterMenu";
import { SortField } from "../_components/TableHeader";
import { useFeatureGates } from "@/hooks/use-feature-gates";
import { cn } from "@/server/utils";

export default function FormsPage() {
  const isMobile = useIsMobile();
  const { data: gates } = useFeatureGates();

  const [statusFilter, setStatusFilter] = useState<FormStatusFilter>("ALL");

  const { sync: syncSearch, value: searchValue } = useSearchSync();

  // query to fetch forms list (filtered by status)
  const { data: forms = [], isLoading } = useQuery({
    queryKey: formKeys.list(
      statusFilter !== "ALL" ? { status: statusFilter } : undefined,
    ),
    queryFn: () =>
      formService.list(
        statusFilter !== "ALL"
          ? { status: statusFilter as FormStatus }
          : undefined,
      ),
  });

  // separate query for total forms count (unfiltered) to enforce plan limits correctly
  const { data: allForms = [] } = useQuery({
    queryKey: formKeys.list(),
    queryFn: () => formService.list(),
  });

  const maxForms = gates?.state.maxForms ?? -1;
  const totalCount = allForms.length;
  const isAtFormLimit = maxForms !== -1 && totalCount >= maxForms;

  const {
    search,
    sortField,
    sortOrder,
    page,
    setPage,
    toggleSort,
    paginatedItems: paginatedForms,
    totalItems,
    filteredAndSorted,
  } = useTableState({
    data: forms,
    defaultSortField: "date" as SortField,
    defaultSortOrder: "desc",
    filterFn: (f, s) => {
      const q = s.toLowerCase();
      return (
        (f.name ?? "").toLowerCase().includes(q) ||
        (f.title ?? "").toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q)
      );
    },
    sortFn: (a, b, field, order) => {
      const fieldA =
        field === "count" ? a.submissionCount : new Date(a.updatedAt).getTime();
      const fieldB =
        field === "count" ? b.submissionCount : new Date(b.updatedAt).getTime();

      if (fieldA !== fieldB) {
        return order === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
      return a.id.localeCompare(b.id);
    },
  });

  const handleSearchChange = (val: string) => {
    syncSearch(val);
    setPage(1);
  };

  const handleStatusChange = (status: FormStatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  if (isMobile) {
    return (
      <MobilePageLayout
        title="Forms"
        items={filteredAndSorted}
        isLoading={isLoading}
        emptyMessage={
          search ? "No matches found." : "No forms yet. Create your first one!"
        }
        actionButton={
          <Button
            className={cn(
              "bg-[#6A06E4] hover:bg-[#5a05c4] w-full h-11 rounded-lg text-lg font-semibold",
              isAtFormLimit && "opacity-70 cursor-not-allowed grayscale-[0.5]",
            )}
            asChild={!isAtFormLimit}
            title={
              isAtFormLimit
                ? `Free plan allows up to ${maxForms} forms. Upgrade to create more.`
                : undefined
            }
          >
            {isAtFormLimit ? (
              <span className="flex items-center gap-2">New Form</span>
            ) : (
              <Link href="/dash/forms/new" className="flex items-center gap-2">
                New Form
              </Link>
            )}
          </Button>
        }
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        sortOrder={sortOrder}
        onSortChange={(sortKey) =>
          toggleSort(sortKey === "createdAt" ? "date" : (sortKey as SortField))
        }
        filterMenu={
          <TableFilterMenu
            variant="forms"
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
          >
            <button
              className="p-2 bg-slate-800 text-white rounded-lg active:scale-95 transition-transform"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={16} />
            </button>
          </TableFilterMenu>
        }
      />
    );
  }

  return (
    <TablePageLayout
      variant="forms"
      isLoading={isLoading}
      totalItems={totalItems}
      currentPage={page}
      pageSize={APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE}
      onPageChange={setPage}
      items={paginatedForms}
      renderRow={(form) => (
        <TableRow key={form.id} data={form} variant="forms" />
      )}
      emptyState={{
        message: search
          ? "No matches found."
          : "No forms yet. Create your first one!",
        icon: <span className="text-4xl text-slate-300">📋</span>,
      }}
      statusFilter={statusFilter}
      handleStatusChange={handleStatusChange}
      sortField={sortField}
      sortOrder={sortOrder}
      handleSort={toggleSort}
    />
  );
}
