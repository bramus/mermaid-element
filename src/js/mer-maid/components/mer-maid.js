/**
 * <mer-maid> Custom Element
 * Renders Mermaid diagrams provided as child syntax.
 */

import { loadMermaid } from '../utils/loader.js';

let diagramCounter = 0;

function createDiagramId() {
  return `mer-maid-${Date.now().toString(36)}-${(++diagramCounter).toString(36)}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      box-sizing: border-box;
    }

    :host([hidden]) {
      display: none !important;
    }

    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      overflow-x: auto;
      box-sizing: border-box;
    }

    svg {
      display: block;
      max-width: 100%;
      height: auto;
      box-sizing: border-box;
    }

    .error {
      box-sizing: border-box;
      width: 100%;
      padding: 1rem;
      border-radius: 6px;
      background-color: var(--mer-maid-error-bg, #fef2f2);
      color: var(--mer-maid-error-color, #991b1b);
      border: 1px solid var(--mer-maid-error-border, #f87171);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .error strong {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .error pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
      font-size: inherit;
    }
  </style>
  <div class="container" part="container"></div>
`;

export class MerMaid extends HTMLElement {
  static defaultMermaid = null;

  static get observedAttributes() {
    return ['mermaid', 'theme'];
  }

  #container = null;
  #observer = null;
  #diagramText = null;
  #currentRenderId = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#container = this.shadowRoot.querySelector('.container');
  }

  connectedCallback() {
    this.#setupObserver();

    // Defer initial render until end of microtask queue to allow HTML parser
    // to populate child content when declared directly in markup
    queueMicrotask(() => {
      if (this.isConnected) {
        this.render();
      }
    });
  }

  disconnectedCallback() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.render();
    }
  }

  #setupObserver() {
    if (this.#observer) return;

    this.#observer = new MutationObserver(() => {
      // If diagram is not programmatically pinned via property, re-render on child DOM changes
      if (this.#diagramText === null) {
        this.render();
      }
    });

    this.#observer.observe(this, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  /**
   * Retrieves the raw Mermaid diagram definition text.
   * Priority:
   * 1. Explicitly assigned `diagram` property
   * 2. Inner `<template>` content text
   * 3. Inner `<code>` content text
   * 4. Inner `<pre>` content text
   * 5. Raw `this.textContent`
   *
   * @returns {string}
   */
  getDiagramText() {
    if (this.#diagramText !== null && this.#diagramText !== undefined) {
      return this.#diagramText.trim();
    }

    const templateEl = this.querySelector('template');
    if (templateEl) {
      return templateEl.content.textContent.trim();
    }

    const codeEl = this.querySelector('code');
    if (codeEl) {
      return codeEl.textContent.trim();
    }

    const preEl = this.querySelector('pre');
    if (preEl) {
      return preEl.textContent.trim();
    }

    return (this.textContent || '').trim();
  }

  /**
   * Asynchronously renders the Mermaid diagram into the shadow root.
   *
   * @returns {Promise<{ svg: string, diagram: string } | null>}
   */
  async render() {
    const diagram = this.getDiagramText();

    if (!diagram) {
      this.#container.innerHTML = '';
      return null;
    }

    const renderId = ++this.#currentRenderId;
    const diagramId = createDiagramId();

    try {
      const mermaidAttr = this.getAttribute('mermaid');
      const themeAttr = this.getAttribute('theme');

      const config = {};
      if (themeAttr) {
        config.theme = themeAttr;
      }

      const mermaid = await loadMermaid(mermaidAttr, {
        config,
        defaultInstance: MerMaid.defaultMermaid
      });

      // Avoid race conditions if a newer render was triggered
      if (renderId !== this.#currentRenderId) {
        return null;
      }

      const { svg, bindFunctions } = await mermaid.render(diagramId, diagram);

      if (renderId !== this.#currentRenderId) {
        return null;
      }

      this.#container.innerHTML = svg;

      if (typeof bindFunctions === 'function') {
        try {
          bindFunctions(this.shadowRoot);
        } catch {
          // Binding interaction handlers fallback
        }
      }

      const detail = { svg, diagram };

      this.dispatchEvent(new CustomEvent('render', {
        bubbles: true,
        composed: true,
        detail
      }));

      return detail;
    } catch (error) {
      if (renderId !== this.#currentRenderId) {
        return null;
      }

      // Clean up temporary DOM artifacts Mermaid might have appended to document.body
      const tempId1 = document.getElementById('d' + diagramId);
      if (tempId1) tempId1.remove();
      const tempId2 = document.getElementById(diagramId);
      if (tempId2) tempId2.remove();

      this.#renderError(error, diagram);

      this.dispatchEvent(new CustomEvent('error', {
        bubbles: true,
        composed: true,
        detail: { error, diagram }
      }));

      return null;
    }
  }

  #renderError(error, diagram) {
    const message = error?.message || String(error);
    this.#container.innerHTML = `
      <div class="error" role="alert" part="error">
        <strong>Mermaid Error:</strong>
        <pre>${escapeHtml(message)}</pre>
      </div>
    `;
  }

  // Properties

  get mermaid() {
    return this.getAttribute('mermaid');
  }

  set mermaid(val) {
    if (val === null || val === undefined) {
      this.removeAttribute('mermaid');
    } else {
      this.setAttribute('mermaid', String(val));
    }
  }

  get theme() {
    return this.getAttribute('theme');
  }

  set theme(val) {
    if (val === null || val === undefined) {
      this.removeAttribute('theme');
    } else {
      this.setAttribute('theme', String(val));
    }
  }

  get diagram() {
    return this.getDiagramText();
  }

  set diagram(val) {
    this.#diagramText = val;
    if (this.isConnected) {
      this.render();
    }
  }

  get svg() {
    return this.#container ? this.#container.querySelector('svg') : null;
  }
}
