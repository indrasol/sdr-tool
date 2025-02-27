import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sparkle, FolderPlus, Lightbulb, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ProjectDropdown = () => {
  const [selectedOption, setSelectedOption] = useState("Select Model");
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: (
        <div className="relative mr-1">
          <Sparkle className="h-5 w-5 text-[#7b67d5]" />
          <div className="absolute top-0 -right-0 h-[4px] w-[4px] text-[#7b67d5]">
            <span className="absolute inset-0 rotate-0">
              <span className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-current opacity-90"></span>
              <span className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-current opacity-90"></span>
            </span>
          </div>
          <div className="absolute -bottom-0 -left-0 h-[3px] w-[3px] text-[#7b67d5]">
            <span className="absolute inset-0 rotate-0">
              <span className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-current"></span>
              <span className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-current"></span>
            </span>
          </div>
        </div>
      ),
      label: "Model with AI",
      onClick: () => {
        setSelectedOption("Model with AI");
      },
      link: "/model-with-ai",
    },
    {
      icon: <FolderPlus className="mr-1 h-5 w-5 text-[#7b67d5]" />,
      label: "Add Existing Project",
      onClick: () => {
        setSelectedOption("Add Existing Project");
      },
      link: "/existing-project",
    },
    {
      icon: (
        <div className="relative mr-1">
          <div className="relative w-5 h-5">
            <Lightbulb className="h-5 w-5 text-[#7b67d5]" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-[1.5px] h-[1.5px] bg-[#7b67d5]"
                style={{
                  top: '25%',
                  left: '50%',
                  transform: `rotate(${i * 45 - 90}deg) translate(6px, -50%)`,
                  transformOrigin: '0 50%',
                }}
              />
            ))}
            {[...Array(5)].map((_, i) => (
              <div
                key={`left-${i}`}
                className="absolute w-[1.5px] h-[1.5px] bg-[#7b67d5]"
                style={{
                  top: '25%',
                  left: '50%',
                  transform: `rotate(${i * -45 - 90}deg) translate(6px, -50%)`,
                  transformOrigin: '0 50%',
                }}
              />
            ))}
          </div>
        </div>
      ),
      label: "Solutions Hub",
      onClick: () => {
        setSelectedOption("Solutions Hub");
      },
      link: "/solutions-hub",
    },
  ];

  const selectedMenuItem = menuItems.find(item => item.label === selectedOption);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-[#9b87f5]/20 hover:bg-[#9b87f5]/10 text-[#7b67d5] font-medium px-4 py-2 rounded-lg transition-all duration-200 ease-in-out"
          >
            {selectedOption}
            <ChevronDown className="ml-0.5 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white rounded-lg shadow-lg p-1">
          {menuItems.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => {
                item.onClick();
              }}
              className={cn(
                "flex items-center px-2 py-1.5 text-sm font-medium cursor-pointer rounded-md",
                "hover:bg-[#9b87f5]/20 hover:text-[#9b87f5] transition-colors duration-200",
                "focus:bg-[#9b87f5]/20 focus:text-[#9b87f5]"
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedMenuItem && (
        <div className="mt-4">
          <a
            href={selectedMenuItem.link}
            className="text-blue-500 underline"
            onClick={(e) => {
              e.preventDefault();
              navigate(selectedMenuItem.link);
            }}
          >
            {selectedMenuItem.label}
          </a>
        </div>
      )}
    </div>
  );
};

export default ProjectDropdown;