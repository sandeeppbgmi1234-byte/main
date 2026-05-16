import { SlidersHorizontal } from "lucide-react";
import React from "react";
import ColHeader from "./ColHeader";
import { TABLE_CONFIGS, TableVariant } from "@/configs/table.config";

import {
  TableFilterMenu,
  StatusFilterMap,
  TriggerFilter,
} from "./TableFilterMenu";
import { Separator } from "@/components/ui/separator";

export type SortField = "count" | "date" | "newFollowers" | "type";
export type SortOrder = "asc" | "desc" | null;

interface BaseProps<V extends TableVariant> {
  statusFilter: StatusFilterMap[V] | "ALL";
  setStatusFilter: (value: StatusFilterMap[V] | "ALL") => void;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}

interface AutomationProps extends BaseProps<"automations"> {
  variant: "automations";
  triggerFilter: TriggerFilter;
  setTriggerFilter: (value: TriggerFilter) => void;
}

interface GenericProps<
  V extends Exclude<TableVariant, "automations">,
> extends BaseProps<V> {
  variant: V;
  triggerFilter?: never;
  setTriggerFilter?: never;
}

type Props = AutomationProps | GenericProps<"forms"> | GenericProps<"contacts">;

const TableHeader = (props: Props) => {
  const { variant } = props;
  const config = TABLE_CONFIGS[variant];

  type TableColumn = (typeof TABLE_CONFIGS)[TableVariant]["columns"][number];

  return (
    <div
      className={`grid ${config.gridClass} hidden md:grid items-center px-4 py-3 gap-4 border-b border-slate-100 m-4 bg-[#F9F9F9] rounded-lg relative`}
    >
      {config.columns.map((col: TableColumn) => {
        const isAutomation = variant === "automations";
        const isForm = variant === "forms";
        const isContact = variant === "contacts";
        // Show separator after these columns in respective variants
        const hasSeparator =
          (isAutomation && ["followers", "status", "count"].includes(col.id)) ||
          (isForm && ["count", "status"].includes(col.id)) ||
          (isContact && ["type", "email"].includes(col.id));

        let content = null;

        if (col.type === "main") {
          content = (
            <span
              key={col.id}
              className="text-[16px] font-medium text-[#212121]"
            >
              {col.label}
            </span>
          );
        } else if (
          col.type === "info" &&
          !(col as { sortable?: boolean }).sortable
        ) {
          content = (
            <span
              key={col.id}
              className="text-center text-[16px] font-medium text-[#212121]"
            >
              {col.label}
            </span>
          );
        } else if (col.type === "status") {
          if ((col as { sortable?: boolean }).sortable) {
            content = (
              <ColHeader
                key={col.id}
                label={col.label}
                sortable={true}
                sortOrder={
                  props.sortField === (col.id as any) ? props.sortOrder : null
                }
                onSort={() => props.onSort?.(col.id as any)}
              />
            );
          } else {
            content = (
              <span
                key={col.id}
                className="text-center text-[16px] font-medium text-[#212121]"
              >
                {col.label}
              </span>
            );
          }
        } else if (col.type === "info" || col.type === "date") {
          const field =
            (col.id as string) === "followers"
              ? "newFollowers"
              : (col.id as "count" | "date");

          content = (
            <ColHeader
              key={col.id}
              label={col.label}
              sortable={"sortable" in col ? !!col.sortable : false}
              sortOrder={props.sortField === field ? props.sortOrder : null}
              onSort={() => props.onSort?.(field)}
            />
          );
        } else if (col.type === "actions") {
          if (props.variant === "automations") {
            const activeFilterCount =
              (props.statusFilter !== "ALL" ? 1 : 0) +
              (props.triggerFilter !== "ALL" ? 1 : 0);

            content = (
              <TableFilterMenu
                key={col.id}
                variant="automations"
                statusFilter={props.statusFilter}
                onStatusChange={props.setStatusFilter}
                triggerFilter={props.triggerFilter}
                onTriggerChange={props.setTriggerFilter}
              >
                <button
                  type="button"
                  aria-label="Open filters"
                  className="p-2 bg-[#212121] text-white rounded-md w-fit justify-self-end cursor-pointer hover:bg-slate-700 transition-colors focus:outline-none relative"
                >
                  <SlidersHorizontal size={16} />
                  {activeFilterCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#6A06E4] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {activeFilterCount}
                    </div>
                  )}
                </button>
              </TableFilterMenu>
            );
          } else if (props.variant === "forms") {
            const activeFilterCount = props.statusFilter !== "ALL" ? 1 : 0;
            content = (
              <TableFilterMenu
                key={col.id}
                variant="forms"
                statusFilter={props.statusFilter}
                onStatusChange={props.setStatusFilter}
              >
                <button
                  type="button"
                  aria-label="Open filters"
                  className="p-2 bg-[#212121] text-white rounded-md w-fit justify-self-end cursor-pointer hover:bg-slate-700 transition-colors focus:outline-none relative"
                >
                  <SlidersHorizontal size={16} />
                  {activeFilterCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#6A06E4] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {activeFilterCount}
                    </div>
                  )}
                </button>
              </TableFilterMenu>
            );
          }
        }

        return (
          <div
            key={col.id}
            className="flex items-center justify-center relative h-full"
          >
            <div
              className={`flex-1 flex ${col.type === "main" ? "justify-start" : "justify-center"}`}
            >
              {content}
            </div>
            {hasSeparator && (
              <div className="absolute -right-2 h-4 flex items-center">
                <Separator
                  orientation="vertical"
                  className="bg-slate-900 w-2"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TableHeader;
