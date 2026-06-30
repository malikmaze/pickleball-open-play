"use client";

import { Button } from "@/components/ui/button";
import { adminBtnOutline } from "@/components/admin/admin-ui";

export function BulkSelectBar({
  selectedCount,
  totalSelectable,
  onSelectAll,
  onClear,
  onRemove,
  removeLoading,
}: {
  selectedCount: number;
  totalSelectable: number;
  onSelectAll: (selected: boolean) => void;
  onClear: () => void;
  onRemove: () => void;
  removeLoading?: boolean;
}) {
  if (totalSelectable === 0) return null;

  const allSelected =
    selectedCount > 0 && selectedCount === totalSelectable;
  const someSelected =
    selectedCount > 0 && selectedCount < totalSelectable;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-muted/20 px-3 py-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4 accent-sisclub-green"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={(e) => onSelectAll(e.target.checked)}
        />
        Select all ({totalSelectable})
      </label>
      {selectedCount > 0 && (
        <>
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="rounded-full"
            disabled={removeLoading}
            onClick={onRemove}
          >
            Remove selected ({selectedCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={adminBtnOutline}
            onClick={onClear}
          >
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
