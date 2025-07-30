import { addCollection } from '@iconify/react/dist/offline';

// ---------------------------------------------------------------------------
//  Custom Iconify collection loader
// ---------------------------------------------------------------------------
// We attempt to fetch the generated collection from Supabase Storage at runtime.
// The request is fire-and-forget: if it fails (offline, dev environment) the
// promise rejection is swallowed and the app continues using CDN icons only.
//
// If you prefer bundling the JSON instead, replace the fetch() call with a
// static import (tree-shaken by Vite/webpack):
//   import customIcons from './custom-icons.json';
//   addCollection(customIcons);
// ---------------------------------------------------------------------------

// Common cloud icons to preload (used after collection is loaded)
export const COMMON_CLOUD_ICONS = [
  // AWS common icons
  "aws-lambda", "aws-s3", "aws-dynamodb", "aws-ec2", 
  "aws-rds", "aws-api-gateway", "aws-cloudfront", "aws-vpc",
  "aws-eks", "aws-sqs", "aws-sns", "aws-cloudwatch",
  
  // Azure common icons
  "azure-functions", "azure-app-service", "azure-storage", "azure-cosmos-db",
  "azure-sql", "azure-virtual-machine", "azure-kubernetes-service", "azure-active-directory",
  
  // GCP common icons
  "gcp-cloud-functions", "gcp-cloud-storage", "gcp-cloud-sql", "gcp-compute-engine",
  "gcp-kubernetes-engine", "gcp-bigquery", "gcp-cloud-run", "gcp-firestore"
];

const SUPABASE_CUSTOM_ICONS_URL =
  'https://vqeislbfevisraavgqfq.supabase.co/storage/v1/object/public/icons/custom/custom-icons.json';

// Preload function for common icons
function preloadCommonIcons() {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[iconify] preloading ${COMMON_CLOUD_ICONS.length} common cloud icons`);
  }
  
  for (const iconId of COMMON_CLOUD_ICONS) {
    try {
      const fullIconId = `custom:${iconId}`;
      const icon = document.createElement('div');
      icon.style.display = 'none';
      icon.dataset.icon = fullIconId;
      document.body.appendChild(icon);
      setTimeout(() => document.body.removeChild(icon), 0);
    } catch (err) {
      // Silently ignore preloading errors
      console.debug(`[iconify] Failed to preload icon: ${iconId}`);
    }
  }
}

(async () => {
  try {
    const res = await fetch(SUPABASE_CUSTOM_ICONS_URL, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const collection = (await res.json()) as unknown;
    addCollection(collection as any);
    
    // Preload common cloud icons after collection is loaded
    preloadCommonIcons();
    
    // eslint-disable-next-line no-console
    console.log(`[iconify] custom collection loaded (${(collection as any).icons ? Object.keys((collection as any).icons).length : '?' } icons)`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[iconify] custom icon collection failed to load – falling back to CDN only', err);
  }
})(); 