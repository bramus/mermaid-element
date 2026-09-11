# mermaid-element

> A custom element that displays [Mermaid Diagrams](https://mermaid.js.org/) with dynamic version support.

[![npm version](https://img.shields.io/npm/v/mermaid-element.svg)](https://www.npmjs.com/package/mermaid-element)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo & Playground → https://mermaid-element.netlify.app/**](https://mermaid-element.netlify.app/)

## Features

- **Declarative & Zero-Config**: Place your Mermaid syntax directly inside the `<mermaid-element>` custom element.
- **Dynamic Version Switching**:
  - Defaults to **Mermaid 12** (loaded dynamically on-demand from `cdn.jsdelivr.net`).
  - Pass a version string or number (e.g. `mermaid="10.9.8"`) to dynamically load that version on-demand from `cdn.jsdelivr.net`.
  - Pass a URL (e.g. `mermaid="https://..."` or `mermaid="/js/..."`) to load Mermaid from a specific endpoint.
- **Pre-Installed / Bundled Mermaid Support**: Use your locally installed `mermaid` dependency (`npm install mermaid-element mermaid`) by setting `MermaidElement.defaultMermaid = mermaid`, fully bypassing CDN requests for offline or self-contained builds.
- **Smart In-Memory Caching**: Instances are cached by version and URL. Multiple `<mermaid-element>` elements sharing the same version will only download and initialize Mermaid once.
- **Shadow DOM Encapsulation**: Diagram SVGs are rendered cleanly in an open Shadow Root with customizable CSS `::part()` hooks.
- **Flexible Syntax Formats**: Supports direct text, `<template>` (ideal for unescaped HTML characters), `<code>`, and `<pre>` blocks.
- **Reactive API**: Updating child content, changing the `mermaid` or `theme` attributes, or modifying the `.diagram` property automatically re-renders the diagram.
- **Graceful Error Handling**: Captures syntax errors, emits an `error` event, and renders an accessible error alert with `part="error"` without breaking the host page.

---

## Demo

Check out the interactive showcase and live playground at **[https://mermaid-element.netlify.app/](https://mermaid-element.netlify.app/)**.

---

## Installation & Setup

### 1. Using npm (Standalone / Dynamic Loading)

Install the package into your project:

```bash
npm install mermaid-element
```

Then import it in your JavaScript/TypeScript bundle (Vite, Webpack, Rollup, Next.js, etc.):

```javascript
import 'mermaid-element'; // Automatically registers the <mermaid-element> custom element
```

By default, `<mermaid-element>` operates as a zero-dependency component and dynamically loads Mermaid 12 from jsDelivr on demand.

### 2. Using npm with a Pre-Installed / Bundled `mermaid` Dependency

If your project bundles `mermaid` locally (e.g. for offline builds, air-gapped environments, locked dependencies, or custom plugins), you can install both packages:

```bash
npm install mermaid-element mermaid
```

Then set `MermaidElement.defaultMermaid` (or `window.mermaid`). `<mermaid-element>` will use your pre-installed package directly without making any external CDN requests:

```javascript
import mermaid from 'mermaid';
import { MermaidElement } from 'mermaid-element';

// Tell <mermaid-element> to use your pre-installed Mermaid package
MermaidElement.defaultMermaid = mermaid;
```

Or configure it via the global `window.mermaid`:

```javascript
import mermaid from 'mermaid';
window.mermaid = mermaid;
import 'mermaid-element';
```

If you are serving `mermaid` without a bundler, you can also point the `mermaid` attribute directly to your local file:

```html
<script type="module" src="js/mermaid-element/index.js"></script>

<mermaid-element mermaid="js/mermaid/dist/mermaid.esm.min.mjs">
graph TD
    A --> B
</mermaid-element>
```

### 3. Using a CDN (No Build Tools Required)

You can also use `<mermaid-element>` directly in the browser by loading it from a CDN:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mermaid-element/index.js"></script>
```

---

## Styling Before Upgrade

Before custom elements are registered and upgraded by the browser, they behave as unstyled inline elements. Because scripts take time to download and register `<mermaid-element>`, you should choose how un-upgraded elements appear while scripts are loading.

There are two approaches depending on whether you prefer to avoid layout shifts or avoid flashes of raw code:

### 1. Fallback Styling (Show Mermaid Code) — Results in a FOUC

Show the raw Mermaid diagram syntax formatted as preformatted monospace text while waiting for the component to upgrade:

```css
mermaid-element:not(:defined) {
  display: block;
  white-space: pre-wrap;
  font-family: monospace;
}
```

- **Pros**: Raw diagram syntax is immediately readable, even if JavaScript is delayed or fails to load.
- **Trade-off**: **Results in a FOUC** (Flash of Unstyled Content). Once `<mermaid-element>` is registered and Mermaid renders, the raw code block is abruptly replaced by the rendered SVG diagram.

### 2. Hide Until Defined — Results in a CLS

Hide `<mermaid-element>` elements completely until the custom element has been registered in the browser's `CustomElementRegistry`:

```css
mermaid-element:not(:defined) {
  display: none;
}
```

- **Pros**: Completely avoids any flash of raw syntax or unstyled text—users never see unrendered Mermaid code.
- **Trade-off**: **Results in a CLS** (Cumulative Layout Shift). When the element upgrades and renders, the diagram appears in the document flow and pushes subsequent content downward.

---

## Usage

### 1. Basic Example (Default: Mermaid 12)

By default, `<mermaid-element>` defaults to **Mermaid 12**, loaded dynamically on-demand from jsDelivr:

```html
<mermaid-element>
graph TD
    Client[Client Request] --> LB[Load Balancer]
    LB --> Server1[Server 01]
    LB --> Server2[Server 02]
</mermaid-element>
```

### 2. Specifying a Mermaid Version

Pass a version number or string to load that specific Mermaid release dynamically from `cdn.jsdelivr.net`:

```html
<mermaid-element mermaid="10.9.8">
sequenceDiagram
    autonumber
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hi Alice!
</mermaid-element>
```

### 3. Loading Mermaid from a Custom URL

Pass a full URL or relative path to load Mermaid from an external CDN or self-hosted asset:

```html
<mermaid-element mermaid="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs">
stateDiagram-v2
    [*] --> Idle
    Idle --> Active : Start
    Active --> [*] : Finish
</mermaid-element>
```

### 4. Using `<template>` for Unescaped Characters

When your diagrams contain HTML characters (like `<tag>` or `<` and `>`), wrap your diagram in a `<template>` tag so the browser parser doesn't treat them as HTML tags:

```html
<mermaid-element>
  <template>
flowchart LR
    A["<b>Node A</b>"] --> B["<Node B>"]
  </template>
</mermaid-element>
```

### 5. Applying Themes

Use the `theme` attribute to set a Mermaid theme (`default`, `neutral`, `dark`, `forest`, `base`):

```html
<mermaid-element theme="dark">
graph TD
    A --> B
</mermaid-element>
```

*(You can also use Mermaid's built-in `%%{init: {'theme': 'dark'}}%%` directive or YAML frontmatter directly in the diagram syntax).*

### 6. Instance Caching & Deduplication

`<mermaid-element>` features a built-in in-memory cache (`instanceCache`) keyed by version and URL. When multiple `<mermaid-element>` elements are present on the same page using the same Mermaid version:

- **Single Download**: Mermaid is fetched over the network only once.
- **Shared In-Flight Promise**: If multiple elements mount at the exact same time, they share the same pending module import promise, avoiding duplicate concurrent requests.
- **Instant Re-Use**: Subsequent elements immediately reuse the already loaded in-memory Mermaid instance with zero network latency.

Different versions coexist side-by-side without interference:

```html
<!-- These two elements share a single download of Mermaid v10.9.8 -->
<mermaid-element mermaid="10.9.8">...</mermaid-element>
<mermaid-element mermaid="10.9.8">...</mermaid-element>

<!-- This element downloads and caches Mermaid v11.4.1 separately -->
<mermaid-element mermaid="11.4.1">...</mermaid-element>
```

---

## JavaScript API

### Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `diagram` | `string` | Gets or sets the raw Mermaid syntax. Setting this property triggers an automatic re-render. |
| `mermaid` | `string \| null` | Gets or sets the `mermaid` attribute (version string, URL, or `null` to default to Mermaid 12 via jsDelivr). |
| `theme` | `string \| null` | Gets or sets the `theme` attribute. |
| `svg` | `SVGSVGElement \| null` | Read-only reference to the rendered SVG element inside the shadow root. |

### Methods

- **`render()`**: `Promise<{ svg: string, diagram: string } | null>`
  Manually triggers a diagram re-render.

### Utilities

- **`DEFAULT_MERMAID_URL`**: `string`
  The default URL for Mermaid 12 (`https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs`) loaded dynamically by default.
- **`clearMermaidCache()`**: `void`
  Clears the in-memory cache of loaded Mermaid instances (imported from `mermaid-element`).
- **`loadMermaid(mermaidAttr, options)`**: `Promise<any>`
  Helper function used internally to resolve and retrieve a Mermaid instance.

### Static Properties

- **`MermaidElement.defaultMermaid`**: `any`
  Assign an explicit pre-configured Mermaid instance to be used as the default instead of importing.

### Events

| Event Name | `detail` | Description |
| :--- | :--- | :--- |
| `render` | `{ svg: string, diagram: string }` | Dispatched when the diagram renders successfully. |
| `error` | `{ error: Error, diagram: string }` | Dispatched when a syntax or rendering error occurs. |

Example:

```javascript
const diagram = document.querySelector('mermaid-element');

diagram.addEventListener('render', (e) => {
  console.log('Rendered SVG length:', e.detail.svg.length);
});

diagram.addEventListener('error', (e) => {
  console.error('Failed to render:', e.detail.error.message);
});

// Update programmatically
diagram.diagram = `
graph LR
    X[Input] --> Y[Output]
`;
```

---

## Styling & Shadow Parts

`<mermaid-element>` renders into an open Shadow Root. You can style the container or error states using CSS `::part()`:

```css
/* Style the diagram container */
mermaid-element::part(container) {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
}

/* Customize the error box */
mermaid-element::part(error) {
  border-color: #ef4444;
  background-color: #fef2f2;
}
```

### Development Scripts

- **`npm run dev`** or **`npm start`**: Starts a local development server for `src/`.
- **`npm run build`**: Assembles the clean, self-contained `./dist` folder ready for npm publishing.
- **`npm run pub`**: Runs the build and publishes `./dist` to npm.

---

## License

[MIT](LICENSE) © [Bramus](https://www.bram.us/)
