import { supabase } from '../../supabase';
import { OrgTemplate } from '../hooks/useOrgTemplates';

const BUCKET_NAME = 'org-templates';

export class TemplateStorageService {
  
  /**
   * Save a template to Supabase storage
   */
  static async saveTemplate(template: OrgTemplate, tenantName: string): Promise<void> {
    try {
      const fileName = `${tenantName}/${template.template_id}.json`;
      const templateData = JSON.stringify(template, null, 2);
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, templateData, {
          contentType: 'application/json',
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to save template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving template to storage:', error);
      throw error;
    }
  }

  /**
   * Retrieve all templates for a tenant from Supabase storage
   */
  static async getTemplates(tenantName: string): Promise<OrgTemplate[]> {
    try {
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(tenantName, {
          limit: 100,
          offset: 0
        });

      if (error) {
        throw new Error(`Failed to list templates: ${error.message}`);
      }

      if (!files || files.length === 0) {
        return [];
      }

      const templates: OrgTemplate[] = [];
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const fileName = `${tenantName}/${file.name}`;
            const { data, error: downloadError } = await supabase.storage
              .from(BUCKET_NAME)
              .download(fileName);

            if (downloadError) {
              console.error(`Failed to download template ${fileName}:`, downloadError);
              continue;
            }

            const templateText = await data.text();
            const template: OrgTemplate = JSON.parse(templateText);
            templates.push(template);
          } catch (parseError) {
            console.error(`Failed to parse template ${file.name}:`, parseError);
            continue;
          }
        }
      }

      return templates;
    } catch (error) {
      console.error('Error retrieving templates from storage:', error);
      throw error;
    }
  }

  /**
   * Delete a template from Supabase storage
   */
  static async deleteTemplate(templateId: string, tenantName: string): Promise<void> {
    try {
      const fileName = `${tenantName}/${templateId}.json`;
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting template from storage:', error);
      throw error;
    }
  }

  /**
   * Get a single template by ID from Supabase storage
   */
  static async getTemplate(templateId: string, tenantName: string): Promise<OrgTemplate | null> {
    try {
      const fileName = `${tenantName}/${templateId}.json`;
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(fileName);

      if (error) {
        if (error.message.includes('Object not found')) {
          return null;
        }
        throw new Error(`Failed to download template: ${error.message}`);
      }

      const templateText = await data.text();
      const template: OrgTemplate = JSON.parse(templateText);
      return template;
    } catch (error) {
      console.error('Error retrieving template from storage:', error);
      throw error;
    }
  }

  /**
   * Check if the bucket exists and create it if needed
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw new Error(`Failed to list buckets: ${error.message}`);
      }

      const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
        });

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      throw error;
    }
  }
} 