/**
 * mer-maid entry point
 * Defines <mer-maid> custom element and exports MerMaid class & loader utilities.
 */

import { MerMaid } from './components/mer-maid.js';
import { loadMermaid, resolveMermaidSource, clearMermaidCache, DEFAULT_MERMAID_URL } from './utils/loader.js';

if (typeof customElements !== 'undefined' && !customElements.get('mer-maid')) {
  customElements.define('mer-maid', MerMaid);
}

export { MerMaid, loadMermaid, resolveMermaidSource, clearMermaidCache, DEFAULT_MERMAID_URL };
export default MerMaid;
