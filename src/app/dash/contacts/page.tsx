"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { contactsService } from "@/api/services/contacts";
import { contactKeys } from "@/keys/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  TableRow,
  MobilePageLayout,
  TablePageLayout,
  TableFilterMenu,
} from "../_components";
import { ContactStatusFilter } from "../_components/TableFilterMenu";
import { SortField } from "../_components/TableHeader";
import { useTableState } from "@/hooks/use-table-state";
import { useSearchSync } from "@/hooks/use-search-sync";
import { APP_CONFIG } from "@/configs/app.config";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

const ContactsPage = () => {
  const isMobile = useIsMobile();
  const { sync: syncSearch, value: searchValue } = useSearchSync();
  const [statusFilter, setStatusFilter] = useState<ContactStatusFilter>("ALL");

  // Fetch contacts - Fetching a larger batch to support full client-side paging/filtering
  const { data, isLoading } = useQuery({
    queryKey: [...contactKeys.list({ limit: 1000 })],
    queryFn: () => contactsService.list({ limit: 1000 }),
  });

  const contacts = data?.contacts ?? [];

  const {
    search,
    sortField,
    sortOrder,
    page,
    setPage,
    toggleSort,
    paginatedItems: paginatedContacts,
    totalItems,
    filteredAndSorted,
  } = useTableState({
    data: contacts,
    defaultSortField: "date" as SortField,
    defaultSortOrder: "desc",
    filterFn: (c, s) => {
      const matchesSearch = c.username.toLowerCase().includes(s.toLowerCase());
      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "POST" && c.kind !== "Post") return false;
        if (statusFilter === "REEL" && c.kind !== "Reel") return false;
        if (statusFilter === "STORY" && c.kind !== "Story") return false;
        if (statusFilter === "FORMS" && c.kind !== "Forms") return false;
      }
      return true;
    },
    sortFn: (a, b, field, order) => {
      const fieldA =
        field === "date"
          ? new Date(a.lastInteractedAt).getTime()
          : a.username.toString().toLowerCase();
      const fieldB =
        field === "date"
          ? new Date(b.lastInteractedAt).getTime()
          : b.username.toString().toLowerCase();

      if (fieldA !== fieldB) {
        if (typeof fieldA === "number" && typeof fieldB === "number") {
          return order === "asc" ? fieldA - fieldB : fieldB - fieldA;
        }
        return order === "asc"
          ? String(fieldA).localeCompare(String(fieldB))
          : String(fieldB).localeCompare(String(fieldA));
      }
      return a.id.localeCompare(b.id);
    },
  });

  const handleSearchChange = (val: string) => {
    syncSearch(val);
    setPage(1);
  };

  const handleStatusChange = (status: ContactStatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  if (isMobile) {
    return (
      <MobilePageLayout
        title="Contacts"
        items={filteredAndSorted}
        isLoading={isLoading}
        emptyMessage={
          search
            ? "No matches found."
            : "No contacts yet. They'll appear here once they interact!"
        }
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        sortOrder={sortOrder}
        onSortChange={(sortKey) => {
          if (sortKey === "date") toggleSort("date");
        }}
        filterMenu={
          <TableFilterMenu
            variant="contacts"
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
      variant="contacts"
      isLoading={isLoading}
      totalItems={totalItems}
      currentPage={page}
      pageSize={APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE}
      onPageChange={setPage}
      items={paginatedContacts}
      renderRow={(contact) => (
        <TableRow key={contact.id} data={contact} variant="contacts" />
      )}
      emptyState={{
        message: search
          ? "No matches found."
          : "No contacts yet. They'll appear here once they interact!",
      }}
      statusFilter={statusFilter}
      handleStatusChange={handleStatusChange}
      sortField={sortField}
      sortOrder={sortOrder}
      handleSort={toggleSort}
    />
  );
};

export default ContactsPage;
