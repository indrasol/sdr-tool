// src/components/ui/loading.tsx
import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Loading = ({ message = "Loading...", size = 'medium', className = "" }: LoadingProps) => {
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeMap[size]} text-primary`} />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export const LoadingOverlay = ({ isLoading, children, message }: LoadingOverlayProps) => {
  if (!isLoading) return <>{children}</>;
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
        <Loading message={message} size="large" />
      </div>
    </div>
  );
};