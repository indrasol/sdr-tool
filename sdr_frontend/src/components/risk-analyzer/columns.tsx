import { ColumnDef } from "@tanstack/react-table";
import { SecurityItem } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<SecurityItem>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          {...{
            className: "size-7 shadow-none text-muted-foreground",
            onClick: row.getToggleExpandedHandler(),
            "aria-expanded": row.getIsExpanded(),
            "aria-label": row.getIsExpanded()
              ? `Collapse details for ${row.original.name}`
              : `Expand details for ${row.original.name}`,
            size: "icon",
            variant: "ghost",
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronUp className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <ChevronDown className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
          )}
        </Button>
      ) : undefined;
    },
  },
  {
    header: "Assessment Name",
    accessorKey: "name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    header: "Risk",
    accessorKey: "risk",
  },
  {
    header: "Recommendation",
    accessorKey: "recommendation",
  },
  {
    header: "Risk Level",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge
        className={cn(
          row.getValue("status") === "High" && "bg-red-500",
          row.getValue("status") === "Medium" && "bg-yellow-500",
          row.getValue("status") === "Low" && "bg-green-500",
        )}
      >
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    header: () => <div className="text-right">Source</div>,
    accessorKey: "source",
    cell: ({ row }) => <div className="text-right">{row.getValue("source")}</div>,
  },
];