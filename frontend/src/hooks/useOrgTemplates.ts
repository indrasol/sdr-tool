import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";
import { TemplateStorageService } from '../services/templateStorageService';
import { useAuth } from '../components/Auth/AuthContext';

// Organization template interface
export interface OrgTemplate {
  template_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  visibility: {
    private: boolean;
    team: boolean;
    organization: boolean;
  };
  projectData: {
    name: string;
    description: string;
    tags?: string[];
  };
  createdDate: string;
  creator: string;
  tenantId: number;
  diagramImage?: string | null; // Add diagram image field
  diagramState?: any; // Add diagram state field for backend integration
}

interface OrgTemplatesContextType {
  orgTemplates: OrgTemplate[];
  addOrgTemplate: (template: Omit<OrgTemplate, 'id' | 'createdDate'>) => Promise<OrgTemplate>;
  removeOrgTemplate: (templateId: string) => Promise<boolean>;
  isLoading: boolean;
}

// Create context
const OrgTemplatesContext = createContext<OrgTemplatesContextType | undefined>(undefined);

// Provider component
export const OrgTemplatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orgTemplates, setOrgTemplates] = useState<OrgTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Get tenant name from user context
  const tenantName = user?.tenantId?.toString() || 'default';

  // Load templates from Supabase storage on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!tenantName) return;
      
      setIsLoading(true);
      try {
        // Ensure bucket exists first
        await TemplateStorageService.ensureBucketExists();
        
        // Load templates
        const templates = await TemplateStorageService.getTemplates(tenantName);
        setOrgTemplates(templates);
      } catch (error) {
        console.error('Error loading org templates:', error);
        // Fallback to empty array if there's an error
        setOrgTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [tenantName]);

  const addOrgTemplate = async (templateData: Omit<OrgTemplate, 'id' | 'createdDate'>): Promise<OrgTemplate> => {
    setIsLoading(true);
    
    try {
      const newTemplate: OrgTemplate = {
        ...templateData,
        
        createdDate: new Date().toISOString(),
      };
      
      // Save to Supabase storage
      await TemplateStorageService.saveTemplate(newTemplate, tenantName);
      
      // Update local state
      setOrgTemplates(prev => [...prev, newTemplate]);
      
      toast({
        title: "Template Saved",
        description: `"${newTemplate.title}" has been saved to your organization templates.`,
        duration: 3000,
      });
      
      return newTemplate;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeOrgTemplate = async (templateId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Delete from Supabase storage
      await TemplateStorageService.deleteTemplate(templateId, tenantName);
      
      // Update local state
      setOrgTemplates(prev => prev.filter(template => template.template_id !== templateId));
      
      toast({
        title: "Template Deleted",
        description: "Template has been removed from your organization.",
        duration: 3000,
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement(
    OrgTemplatesContext.Provider,
    {
      value: {
        orgTemplates,
        addOrgTemplate,
        removeOrgTemplate,
        isLoading
      }
    },
    children
  );
};

// Hook to use the context
export const useOrgTemplates = () => {
  const context = useContext(OrgTemplatesContext);
  if (context === undefined) {
    throw new Error('useOrgTemplates must be used within an OrgTemplatesProvider');
  }
  return context;
}; 