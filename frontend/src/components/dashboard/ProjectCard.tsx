
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  title: string;
  description: string;
  documentsCount: number;
  risksCount: number;
}

const ProjectCard = ({ title, description, documentsCount, risksCount }: ProjectCardProps) => {
  return (
    <Card className="glass-card hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{documentsCount} Documents</span>
          <span>{risksCount} Risks Identified</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full group">
          View Details
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
