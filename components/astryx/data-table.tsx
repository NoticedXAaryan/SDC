"use client";

import React, { useState, useMemo, useCallback } from "react";
import { 
  Table, 
  useTableSortable,
  useTablePagination,
  useTableSelection,
  paginateData,
  proportional,
  type TableColumn,
  type TableSortState,
} from "@astryxdesign/core/Table";
import { PowerSearch, type PowerSearchConfig, type PowerSearchFilter } from "@astryxdesign/core/PowerSearch";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/VStack";

interface DataTableColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumnDef<T>[];
  searchConfig?: PowerSearchConfig;
  defaultFilters?: PowerSearchFilter[];
  onSearchChange?: (filters: readonly PowerSearchFilter[]) => void;
  getRowId?: (item: T) => string;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  pageSize?: number;
  emptyState?: React.ReactNode;
  rowHref?: (item: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchConfig,
  defaultFilters = [],
  onSearchChange,
  getRowId = (item) => item.id as string,
  onSelectionChange,
  pageSize = 10,
  emptyState,
  rowHref,
}: DataTableProps<T>) {
  const [filters, setFilters] = useState<readonly PowerSearchFilter[]>(defaultFilters);
  
  // Sort state — consumer-owned
  const [sortState, setSortState] = useState<TableSortState>([]);
  
  // Pagination state — consumer-owned
  const [page, setPage] = useState(1);
  
  // Selection state — consumer-owned
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort the data client-side based on sort state
  const sortedData = useMemo(() => {
    if (sortState.length === 0) return data;
    const sorted = [...data];
    const entry = sortState[0];
    sorted.sort((a, b) => {
      const aVal = a[entry.sortKey] ?? "";
      const bVal = b[entry.sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return entry.direction === "ascending" ? cmp : -cmp;
    });
    return sorted;
  }, [data, sortState]);

  // Paginate the data
  const paginatedData = useMemo(() => {
    return paginateData(sortedData, page, pageSize);
  }, [sortedData, page, pageSize]);

  // Sort plugin
  const sortPlugin = useTableSortable<Record<string, unknown>>({
    sort: sortState,
    onSortChange: setSortState,
  });

  // Pagination plugin
  const paginationPlugin = useTablePagination<Record<string, unknown>>({
    page,
    onPageChange: setPage,
    totalItems: data.length,
    pageSize,
  });

  // Selection plugin (only if onSelectionChange is provided)
  const selectionPlugin = useTableSelection<Record<string, unknown>>({
    getIsItemSelected: (item) => selectedIds.has(getRowId(item as T)),
    onSelectItem: ({ item, isSelected }) => {
      const id = getRowId(item as T);
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (isSelected) next.add(id);
        else next.delete(id);
        if (onSelectionChange) onSelectionChange(next);
        return next;
      });
    },
    onSelectAll: ({ isAllSelected }) => {
      if (isAllSelected) {
        const all = new Set(paginatedData.map(item => getRowId(item as T)));
        setSelectedIds(all);
        if (onSelectionChange) onSelectionChange(all);
      } else {
        setSelectedIds(new Set());
        if (onSelectionChange) onSelectionChange(new Set());
      }
    },
    getIsAllSelected: () => {
      if (paginatedData.length === 0) return false;
      return paginatedData.every(item => selectedIds.has(getRowId(item as T)));
    },
    getIsIndeterminate: () => {
      if (paginatedData.length === 0) return false;
      const someSelected = paginatedData.some(item => selectedIds.has(getRowId(item as T)));
      const allSelected = paginatedData.every(item => selectedIds.has(getRowId(item as T)));
      return someSelected && !allSelected;
    },
  });

  // Map columns to Astryx TableColumn format
  const tableColumns: TableColumn<Record<string, unknown>>[] = useMemo(() => {
    return columns.map((col) => ({
      key: col.key,
      header: col.header,
      width: proportional(1),
      align: col.align,
      sortable: col.sortable ?? false,
      renderCell: col.render
        ? (item: Record<string, unknown>) => (col.render as any)(item as T)
        : undefined,
    }));
  }, [columns]);

  // Build plugins object
  const plugins = useMemo(() => {
    const p: Record<string, any> = {
      sort: sortPlugin,
      pagination: paginationPlugin,
    };
    if (onSelectionChange) {
      p.selection = selectionPlugin;
    }
    return p;
  }, [sortPlugin, paginationPlugin, selectionPlugin, onSelectionChange]);

  return (
    <VStack gap={4}>
      {searchConfig && (
        <PowerSearch
          config={searchConfig}
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            if (onSearchChange) onSearchChange(newFilters);
          }}
          resultCount={data.length}
        />
      )}

      {data.length === 0 && emptyState ? (
        <Card padding={0} className="overflow-hidden">
          <div className="p-8 flex justify-center">
            {emptyState}
          </div>
        </Card>
      ) : (
        <Table
          data={paginatedData as Record<string, unknown>[]}
          columns={tableColumns}
          plugins={plugins}
          hasHover
          dividers="rows"
        />
      )}
    </VStack>
  );
}
