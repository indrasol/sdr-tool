import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Priority = "0-None" | "1-High" | "2-Medium" | "3-Low";

interface PriorityOption {
  value: Priority;
  label: string;
  bgColor: string;
  textColor: string;
}

const priorityOptions: PriorityOption[] = [
  { value: "0-None", label: "None", bgColor: "bg-gray-500", textColor: "text-gray-700" },
  { value: "1-High", label: "High", bgColor: "bg-red-500", textColor: "text-red-700" },
  { value: "2-Medium", label: "Mid", bgColor: "bg-orange-500", textColor: "text-orange-700" },
  { value: "3-Low", label: "Low", bgColor: "bg-yellow-500", textColor: "text-green-700" },
];

interface PriorityDropdownProps {
  value?: Priority;
  onValueChange?: (value: Priority) => void;
}

const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  value = "None",
  onValueChange = () => {},
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className=" hover:bg-[#9b87f5]/20 transition-colors">
        <SelectValue>
          {value && (
            <span className="flex items-center gap-3" >
              <span
                className={cn(
                  "inline-block w-3 h-3 rounded-full",
                  priorityOptions.find((opt) => opt.value === value)?.bgColor
                )}
              />
              <span className="font-medium">
                {priorityOptions.find((opt) => opt.value === value)?.label}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white">
        {priorityOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="flex items-center gap-3 hover:bg-gray-50 focus:bg-[#9b87f5]/20 focus:text-[#9b87f5]"
          >
            <span
              className={cn(
                "inline-block w-3 h-3 rounded-full shadow-sm",
                option.bgColor
              )}
            />
            <span className="font-medium">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PriorityDropdown;