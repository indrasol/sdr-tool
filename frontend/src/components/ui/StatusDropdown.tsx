import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Status = "Planned" | "In Progress" | "Completed" | "Not Started" | "On Hold";

interface StatusOption {
  value: Status;
  label: string;
  bgColor: string;
  textColor: string;
}

const statusOptions: StatusOption[] = [
  { value: "Not Started", label: "Not Started", bgColor: "bg-gray-500", textColor: "text-white" },
  { value: "Planned", label: "Planned", bgColor: "bg-amber-500", textColor: "text-white" },
  { value: "In Progress", label: "In Progress", bgColor: "bg-blue-600", textColor: "text-white" },
  { value: "Completed", label: "Completed", bgColor: "bg-green-800", textColor: "text-white" },
  { value: "On Hold", label: "On Hold", bgColor: "bg-orange-800", textColor: "text-white" },
];

interface StatusDropdownProps {
  value?: Status;
  onValueChange?: (value: Status) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value = "none",
  onValueChange = () => {},
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px] hover:bg-[#9b87f5]/20">
        <SelectValue>
          {value && (
            <div className={cn(
              "flex items-center gap-2 px-2 py-0.5 rounded-full text-sm w-fit",
              statusOptions.find((opt) => opt.value === value)?.bgColor,
              statusOptions.find((opt) => opt.value === value)?.textColor
            )}>
              {statusOptions.find((opt) => opt.value === value)?.label}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white">
        {statusOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="flex items-center hover:bg-gray-50 focus:bg-[#9b87f5]/20"
          >
            <div className={cn(
              "px-2 py-0.5 rounded-full text-sm w-fit",
              option.bgColor,
              option.textColor
            )}>
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusDropdown;