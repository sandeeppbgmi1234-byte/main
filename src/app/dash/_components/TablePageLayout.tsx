"use client";

import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { TableVariant } from "@/configs/table.config";
import TableHeader, { SortField, SortOrder } from "./TableHeader";
import { StatusFilterMap, TriggerFilter } from "./TableFilterMenu";
import Pagination from "./Pagination";

interface TablePageLayoutBaseProps<
  T extends { id: string },
  V extends TableVariant,
> {
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  emptyState: {
    message: string;
    icon?: React.ReactNode;
  };
  // Props for TableHeader
  statusFilter: StatusFilterMap[V] | "ALL";
  handleStatusChange: (val: StatusFilterMap[V] | "ALL") => void;
  sortField: SortField;
  sortOrder: SortOrder;
  handleSort: (field: SortField) => void;
}

interface AutomationTableLayoutProps<
  T extends { id: string },
> extends TablePageLayoutBaseProps<T, "automations"> {
  variant: "automations";
  triggerFilter: TriggerFilter;
  handleTriggerChange: (val: TriggerFilter) => void;
}

interface GenericTableLayoutProps<
  T extends { id: string },
  V extends Exclude<TableVariant, "automations">,
> extends TablePageLayoutBaseProps<T, V> {
  variant: V;
  triggerFilter?: never;
  handleTriggerChange?: never;
}

type TablePageLayoutProps<T extends { id: string }> =
  | AutomationTableLayoutProps<T>
  | GenericTableLayoutProps<T, "forms">
  | GenericTableLayoutProps<T, "contacts">;

/**
 * Premium Unified Table Skeleton
 * Combines TableHeader, Rows, Loading states, and Pagination into a single cohesive layout.
 */
export default function TablePageLayout<T extends { id: string }>(
  props: TablePageLayoutProps<T>,
) {
  return (
    <div className="flex flex-col flex-1 gap-4 overflow-hidden">
      <div className="bg-white rounded-lg overflow-hidden flex-1 border border-slate-50 flex flex-col shadow-sm">
        {/* Unified Header */}
        {props.variant === "automations" ? (
          <TableHeader
            variant="automations"
            statusFilter={props.statusFilter}
            setStatusFilter={props.handleStatusChange}
            sortField={props.sortField}
            sortOrder={props.sortOrder}
            onSort={props.handleSort}
            triggerFilter={props.triggerFilter}
            setTriggerFilter={props.handleTriggerChange}
          />
        ) : props.variant === "forms" ? (
          <TableHeader
            variant="forms"
            statusFilter={props.statusFilter}
            setStatusFilter={props.handleStatusChange}
            sortField={props.sortField}
            sortOrder={props.sortOrder}
            onSort={props.handleSort}
          />
        ) : (
          <TableHeader
            variant="contacts"
            statusFilter={props.statusFilter}
            setStatusFilter={props.handleStatusChange}
            sortField={props.sortField}
            sortOrder={props.sortOrder}
            onSort={props.handleSort}
          />
        )}

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto">
          {props.isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-sm text-slate-400">
              <Spinner className="text-[#6A06E4] size-6" strokeWidth={2.5} />
              <p className="font-medium animate-pulse">
                Loading {props.variant}...
              </p>
            </div>
          ) : props.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <div className="p-4 bg-slate-50 rounded-full scale-110">
                {props.emptyState.icon || (
                  <span className="text-4xl text-slate-300">📋</span>
                )}
              </div>
              <p className="text-sm font-medium">{props.emptyState.message}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {props.items.map((item) => (
                <React.Fragment key={item.id}>
                  {props.renderRow(item)}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Premium Pagination Footer */}
        {props.totalItems > props.pageSize && (
          <div className="border-t border-slate-50 px-6 py-4 bg-slate-50/40 mt-auto">
            <Pagination
              currentPage={props.currentPage}
              totalItems={props.totalItems}
              pageSize={props.pageSize}
              onPageChange={props.onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
