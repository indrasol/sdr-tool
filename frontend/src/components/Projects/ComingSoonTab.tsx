
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ComingSoonTabProps {
  title: string;
  description: string;
}

const ComingSoonTab = ({ title, description }: ComingSoonTabProps) => {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Coming Soon</AlertTitle>
      <AlertDescription>
        {description}
      </AlertDescription>
    </Alert>
  );
};

export default ComingSoonTab;