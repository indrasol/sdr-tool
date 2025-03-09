
export const truncateFilename = (filename?: string, maxLength = 20): string => {
    if (!filename) return '';
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.includes('.') ? filename.split('.').pop() : '';
    const nameWithoutExtension = filename.includes('.')
      ? filename.substring(0, filename.lastIndexOf('.'))
      : filename;
      
    const truncatedName = nameWithoutExtension.substring(0, maxLength - 3 - (extension?.length || 0));
    return `${truncatedName}...${extension ? `.${extension}` : ''}`;
  };