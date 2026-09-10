/**
 * mermaid-element demo application controller
 */

import { MermaidElement } from './mermaid-element/index.js';

const PRESETS = {
  flowchart: `graph TD
    A[Client Request] --> B[API Gateway]
    B --> C{Authentication}
    C -->|Valid| D[Microservice]
    C -->|Invalid| E[401 Unauthorized]
    D --> F[(PostgreSQL)]
    D --> G[(Redis Cache)]`,

  sequence: `sequenceDiagram
    autonumber
    actor Alice
    actor Bob
    Alice->>Bob: Hello Bob, can you review my PR?
    Bob-->>Alice: Sure Alice, checking now.
    Bob->>Bob: Reviewing changes...
    Bob->>Alice: Looks great! LGTM 🚀`,

  class: `classDiagram
    class Animal {
      +String name
      +int age
      +makeSound()
    }
    class Dog {
      +String breed
      +bark()
    }
    class Cat {
      +boolean isLazy
      +purr()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,

  state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Task Received
    Processing --> Success : Done
    Processing --> Error : Failed
    Error --> Idle : Retry
    Success --> [*]`,

  gitGraph: `gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Add core features"
    branch feature-mermaid
    commit id: "Create <mermaid-element> element"
    commit id: "Add version loader"
    checkout develop
    merge feature-mermaid
    checkout main
    merge develop tag: "v1.0.0"`,

  pie: `pie title Programming Languages Used
    "JavaScript" : 55
    "HTML/CSS" : 25
    "Python" : 15
    "Other" : 5`,

  mindmap: `mindmap
  root((mermaid-element))
    Features
      Zero configuration
      Dynamic versions
      Shadow DOM
      Accessible
    Versions
      Default (Mermaid 12)
      CDN jsDelivr
      Custom URL
    Diagrams
      Flowcharts
      Sequences
      State charts
      Git graphs`
};

export class DemoApp {
  constructor() {
    this.codeTextarea = document.getElementById('playground-code');
    this.versionSelect = document.getElementById('playground-version');
    this.customUrlInput = document.getElementById('playground-custom-url');
    this.customUrlContainer = document.getElementById('custom-url-container');
    this.presetSelect = document.getElementById('playground-preset');
    this.themeSelect = document.getElementById('playground-theme');
    this.targetElement = document.getElementById('playground-target');
    this.statusBadge = document.getElementById('playground-status');
    this.timingBadge = document.getElementById('playground-timing');
    this.markupElement = document.getElementById('playground-markup');

    this.init();
  }

  init() {
    this.initPlayground();
  }

  initPlayground() {
    if (!this.targetElement) return;

    let startTime = performance.now();

    this.targetElement.addEventListener('render', (e) => {
      const elapsed = Math.round(performance.now() - startTime);
      if (this.statusBadge) {
        this.statusBadge.textContent = 'Rendered successfully';
        this.statusBadge.className = 'badge badge-primary';
      }
      if (this.timingBadge) {
        this.timingBadge.textContent = `${elapsed} ms`;
      }
    });

    this.targetElement.addEventListener('error', (e) => {
      if (this.statusBadge) {
        this.statusBadge.textContent = 'Syntax Error';
        this.statusBadge.className = 'badge';
        this.statusBadge.style.color = '#ef4444';
        this.statusBadge.style.borderColor = '#fca5a5';
      }
    });

    // Preset selection
    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        const presetKey = e.target.value;
        if (PRESETS[presetKey]) {
          this.codeTextarea.value = PRESETS[presetKey];
          startTime = performance.now();
          this.targetElement.diagram = PRESETS[presetKey];
          this.updateMarkup();
        }
      });
    }

    // Code editing
    if (this.codeTextarea) {
      let debounceTimer = null;
      this.codeTextarea.addEventListener('input', () => {
        this.updateMarkup();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          startTime = performance.now();
          this.targetElement.diagram = this.codeTextarea.value;
        }, 250);
      });
    }

    // Version selector
    if (this.versionSelect) {
      this.versionSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
          if (this.customUrlContainer) this.customUrlContainer.style.display = 'flex';
          const customUrl = this.customUrlInput ? this.customUrlInput.value.trim() : '';
          if (customUrl) {
            startTime = performance.now();
            this.targetElement.setAttribute('mermaid', customUrl);
          }
        } else {
          if (this.customUrlContainer) this.customUrlContainer.style.display = 'none';
          startTime = performance.now();
          if (!val) {
            this.targetElement.removeAttribute('mermaid');
          } else {
            this.targetElement.setAttribute('mermaid', val);
          }
        }
        this.updateMarkup();
      });
    }

    // Custom URL input
    if (this.customUrlInput) {
      let debounceTimer = null;
      this.customUrlInput.addEventListener('input', () => {
        this.updateMarkup();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const customUrl = this.customUrlInput.value.trim();
          if (customUrl && this.versionSelect.value === 'custom') {
            startTime = performance.now();
            this.targetElement.setAttribute('mermaid', customUrl);
          }
        }, 300);
      });
    }

    // Theme selector
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        const t = e.target.value;
        startTime = performance.now();
        if (t) {
          this.targetElement.setAttribute('theme', t);
        } else {
          this.targetElement.removeAttribute('theme');
        }
        this.updateMarkup();
      });
    }

    this.updateMarkup();
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  updateMarkup() {
    if (!this.markupElement || !this.targetElement) return;

    const mermaidAttr = this.targetElement.getAttribute('mermaid');
    const themeAttr = this.targetElement.getAttribute('theme');

    let openTag = '&lt;mermaid-element';
    if (mermaidAttr) {
      openTag += ` mermaid="${this.escapeHtml(mermaidAttr)}"`;
    }
    if (themeAttr) {
      openTag += ` theme="${this.escapeHtml(themeAttr)}"`;
    }
    openTag += '&gt;';

    const code = (this.codeTextarea ? this.codeTextarea.value : '').trim();
    const lines = code.split('\n');
    let shortenedCode = '';
    if (lines.length <= 3) {
      shortenedCode = lines.map(l => this.escapeHtml(l)).join('\n');
    } else {
      shortenedCode = lines.slice(0, 3).map(l => this.escapeHtml(l)).join('\n') + '\n    ...';
    }

    this.markupElement.innerHTML = `${openTag}\n${shortenedCode}\n&lt;/mermaid-element&gt;`;
  }
}

function initScrollspyFallback() {
  // If native scroll-target-group is supported, let the browser handle it with 0 JS
  if (typeof CSS !== 'undefined' && CSS.supports('scroll-target-group', 'auto')) {
    return;
  }

  const navLinks = document.querySelectorAll('.sidenav-list a');
  if (!navLinks.length) return;

  const sectionMap = new Map();
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const section = document.getElementById(href.slice(1));
      if (section) {
        sectionMap.set(section, link);
      }
    }
  });

  if (!sectionMap.size) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeLink = sectionMap.get(entry.target);
        navLinks.forEach(link => {
          if (link === activeLink) {
            link.classList.add('is-active');
          } else {
            link.classList.remove('is-active');
          }
        });
      }
    });
  }, {
    rootMargin: '-10% 0px -70% 0px',
    threshold: 0
  });

  sectionMap.forEach((_, section) => observer.observe(section));
}

if (typeof window !== 'undefined') {
  window.MermaidElement = MermaidElement;
  window.addEventListener('DOMContentLoaded', () => {
    window.demoApp = new DemoApp();
    initScrollspyFallback();
  });
}
