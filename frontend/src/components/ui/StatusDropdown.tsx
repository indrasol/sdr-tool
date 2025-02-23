import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Status = "Started" | "In Progress" | "Completed";

interface StatusOption {
  value: Status;
  label: string;
  bgColor: string;
  textColor: string;
}

const statusOptions: StatusOption[] = [
  { value: "Started", label: "Started", bgColor: "bg-amber-500", textColor: "text-white" },
  { value: "In Progress", label: "In Progress", bgColor: "bg-green-600", textColor: "text-white" },
  { value: "Completed", label: "Completed", bgColor: "bg-gray-600", textColor: "text-white" },
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
      <SelectTrigger className="w-[160px] bg-white border-2 hover:border-gray-400 transition-colors">
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
      <SelectContent className="border-2">
        {statusOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="flex items-center hover:bg-gray-50"
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