/**
 * Utility to resolve and load Mermaid library instances dynamically.
 */

export const DEFAULT_MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs';

const instanceCache = new Map();

/**
 * Resolves the source type and URL from the mermaid attribute.
 *
 * @param {string|number|null|undefined} mermaidAttr
 * @returns {{ type: 'default', url: string } | { type: 'url', url: string } | { type: 'version', version: string, url: string }}
 */
export function resolveMermaidSource(mermaidAttr) {
  if (mermaidAttr === null || mermaidAttr === undefined) {
    return { type: 'default', url: DEFAULT_MERMAID_URL };
  }

  const trimmed = String(mermaidAttr).trim();
  if (trimmed === '') {
    return { type: 'default', url: DEFAULT_MERMAID_URL };
  }

  // Check if string represents a URL or path
  const isUrlLike = /^(https?:|\/\/|\/|\.\/|\.\.\/|blob:|data:)/i.test(trimmed);
  if (isUrlLike) {
    return { type: 'url', url: trimmed };
  }

  if (typeof URL.canParse === 'function' && URL.canParse(trimmed)) {
    return { type: 'url', url: trimmed };
  }

  // Otherwise, treat as version string or number (e.g. "10.9.8", "11", "latest")
  const version = trimmed.replace(/^[@v]/, '');
  const url = `https://cdn.jsdelivr.net/npm/mermaid@${version}/dist/mermaid.esm.min.mjs`;

  return {
    type: 'version',
    version,
    url
  };
}

/**
 * Loads and initializes the Mermaid instance based on the provided attribute.
 *
 * @param {string|number|null|undefined} mermaidAttr
 * @param {object} [options]
 * @param {object} [options.config] - Optional Mermaid configuration passed to initialize()
 * @param {any} [options.defaultInstance] - Optional explicitly provided default Mermaid instance
 * @returns {Promise<any>} The Mermaid API instance
 */
export async function loadMermaid(mermaidAttr, options = {}) {
  // 1. Explicitly provided default instance
  if (!mermaidAttr && options.defaultInstance) {
    return options.defaultInstance;
  }

  // 2. Global window.mermaid if present and no explicit mermaid attribute is passed
  if (!mermaidAttr && typeof window !== 'undefined' && window.mermaid) {
    return window.mermaid;
  }

  const source = resolveMermaidSource(mermaidAttr);
  const cacheKey = source.url;

  if (!instanceCache.has(cacheKey)) {
    const loadPromise = (async () => {
      const mod = await import(source.url);
      return mod.default ?? mod;
    })();
    instanceCache.set(cacheKey, loadPromise);
  }

  const mermaid = await instanceCache.get(cacheKey);

  if (mermaid && typeof mermaid.initialize === 'function') {
    try {
      mermaid.initialize({
        startOnLoad: false,
        suppressErrors: false,
        ...(options.config || {})
      });
    } catch {
      // Configuration applied or already initialized
    }
  }

  return mermaid;
}

/**
 * Clears the cached Mermaid instances.
 */
export function clearMermaidCache() {
  instanceCache.clear();
}
