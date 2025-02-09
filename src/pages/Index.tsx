
import { FileText, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AppHeader from '@/components/layout/AppHeader';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/ui/empty-state';

const Index = () => {
  const projects = []; // This would be populated with real data

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to SecureReview</h1>
          <p className="text-muted-foreground">
            Secure design reviews and SOC 2 assessments made simple
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card p-6 rounded-lg">
            <FileText className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Risk Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered security risk identification and assessment
            </p>
            <Button variant="default" size="sm">View Analysis</Button>
          </div>

          <div className="glass-card p-6 rounded-lg">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">SOC 2 Compliance</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track and manage your SOC 2 compliance journey
            </p>
            <Button variant="default" size="sm">Check Status</Button>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Recent Projects</h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCard
                title="Infrastructure Review"
                description="Cloud infrastructure security assessment"
                documentsCount={3}
                risksCount={8}
              />
              <ProjectCard
                title="API Gateway Design"
                description="Security review of API gateway architecture"
                documentsCount={2}
                risksCount={5}
              />
              <ProjectCard
                title="Database Schema"
                description="Data security and access control review"
                documentsCount={1}
                risksCount={3}
              />
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="w-full h-full" />}
              title="No projects yet"
              description="Start by creating your first project and uploading documents for review."
              action={<Button>Create Project</Button>}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
