import ELK from 'elkjs/lib/elk.bundled.js';

// A single ELK engine reused across the entire front-end.  This avoids
// repeated WASM compilation and reduces memory usage.
const elkSingleton = new ELK();
export default elkSingleton; 