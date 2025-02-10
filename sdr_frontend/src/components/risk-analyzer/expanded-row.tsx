import { Info } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Row } from "@tanstack/react-table";
import { SecurityItem } from "./types";

interface ExpandedRowProps {
  row: Row<SecurityItem>;
}

export function ExpandedRow({ row }: ExpandedRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={row.getVisibleCells().length}>
        <div className="flex items-start py-2 text-primary/80">
          <span className="me-3 mt-0.5 flex w-7 shrink-0 justify-center" aria-hidden="true">
            <Info className="opacity-60" size={16} strokeWidth={2} />
          </span>
          <p className="text-sm">{row.original.note}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}