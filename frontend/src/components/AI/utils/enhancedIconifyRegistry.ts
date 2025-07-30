// Minimal Iconify helper – trims legacy mappings now that every node
// receives an explicit `iconifyId` from the back-end.
// ---------------------------------------------------------------------------
//  resolveIcon(idLike)  → returns the original string when it already looks
//  like an Iconify identifier (contains a colon). For historic diagrams that
//  still pass plain words, we fall back to a neutral placeholder so the UI
//  never breaks.
// ---------------------------------------------------------------------------

export const resolveIcon = (
  idLike: string,
  _provider?: string,
  _technology?: string,
): string => {
  return idLike && idLike.includes(':') ? idLike : 'mdi:application';
};

// List of icons we want to pre-warm in the sprite cache for faster first paint.
export const preloadIcons: string[] = [
  'mdi:cube-outline',
  'mdi:application',
  'logos:aws',
  'logos:microsoft-azure',
  'logos:google-cloud',
];

// Recommended sizes for various contexts.  Keep for consumers that already
// import this helper.
export const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
  toolbar: 20,
  node: 28,
  header: 24,
}; 