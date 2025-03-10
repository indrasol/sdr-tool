

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface ProjectsPaginationProps {
  projectsCount: number;
  totalCount: number;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
  pageSize?: number;
  isNextDisabled?: boolean;
  isPrevDisabled?: boolean;
  isLoading?: boolean;
}

const ProjectsPagination = ({ 
  projectsCount, 
  totalCount,
  onNextPage,
  onPreviousPage,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 10,
  isNextDisabled = false,
  isPrevDisabled = true,
  isLoading = false
}: ProjectsPaginationProps) => {
  if (projectsCount === 0) {
    return null;
  }

  // Determine if we should show advanced pagination controls
  const hasAdvancedPagination = !!onNextPage && !!onPreviousPage;

  return (
    <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
      {!hasAdvancedPagination ? (
        // Simple pagination (original)
        <>
          <div>Showing {projectsCount} of {totalCount} projects</div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </>
      ) : (
        // Advanced pagination with API integration
        <div className="flex items-center justify-between w-full">
          {/* Page size selector */}
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
          )}

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <span>Page {currentPage}</span>
            <div className="flex">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={onPreviousPage}
                disabled={isPrevDisabled || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={onNextPage}
                disabled={isNextDisabled || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPagination;
// import { Button } from '@/components/ui/button';

// interface ProjectsPaginationProps {
//   projectsCount: number;
//   totalCount: number;
// }

// const ProjectsPagination = ({ projectsCount, totalCount }: ProjectsPaginationProps) => {
//   if (projectsCount === 0) {
//     return null;
//   }

//   return (
//     <div className="flex justify-between items-center text-sm text-muted-foreground mt-6">
//       <div>Showing {projectsCount} of {totalCount} projects</div>
//       <div className="flex items-center space-x-2">
//         <Button variant="outline" size="sm" disabled>
//           Previous
//         </Button>
//         <Button variant="outline" size="sm" disabled>
//           Next
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default ProjectsPagination;