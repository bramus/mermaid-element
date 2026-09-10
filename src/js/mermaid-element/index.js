/**
 * mermaid-element entry point
 * Defines <mermaid-element> custom element and exports MermaidElement class & loader utilities.
 */

import { MermaidElement } from './components/mermaid-element.js';
import { loadMermaid, resolveMermaidSource, clearMermaidCache, DEFAULT_MERMAID_URL } from './utils/loader.js';

if (typeof customElements !== 'undefined' && !customElements.get('mermaid-element')) {
  customElements.define('mermaid-element', MermaidElement);
}

export { MermaidElement, loadMermaid, resolveMermaidSource, clearMermaidCache, DEFAULT_MERMAID_URL };
export default MermaidElement;
