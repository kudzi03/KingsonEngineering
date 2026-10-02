/* Lint configuration for the public site and its build tools.
   Run through the quality gate: node tools/quality-gate.mjs run
   No plugins, no shared presets: every rule here is a defect class, not a
   style preference, so a finding is always worth reading. */
const browser = Object.fromEntries(['window', 'document', 'navigator', 'location', 'matchMedia',
  'IntersectionObserver', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'addEventListener',
  'removeEventListener', 'innerHeight', 'innerWidth', 'scrollY', 'scrollTo', 'fetch',
  'AbortController', 'URL', 'URLSearchParams', 'console', 'performance', 'HTMLElement',
  'HTMLVideoElement', 'Event', 'CustomEvent', 'localStorage', 'sessionStorage', 'crypto',
  'Intl', 'devicePixelRatio', 'getComputedStyle', 'structuredClone', 'queueMicrotask', 'Blob', 'FormData', 'Headers', 'Response', 'Request', 'atob', 'btoa', 'encodeURIComponent', 'decodeURIComponent', 'open', 'history', 'screen', 'visualViewport', 'Image', 'Node', 'Element', 'DOMParser', 'MutationObserver', 'PerformanceObserver', 'TextEncoder', 'TextDecoder']
  .map((g) => [g, 'readonly']));
const node = Object.fromEntries(['process', 'console', 'URL', 'Buffer', 'setTimeout', 'clearTimeout',
  'fetch', 'structuredClone', 'TextEncoder', 'TextDecoder'].map((g) => [g, 'readonly']));

const rules = {
  'no-undef': 'error', 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
  'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-duplicate-case': 'error',
  'no-redeclare': 'error', 'no-const-assign': 'error', 'no-self-assign': 'error',
  'no-self-compare': 'error', 'no-cond-assign': ['error', 'except-parens'],
  'no-constant-condition': ['error', { checkLoops: false }], 'no-dupe-else-if': 'error',
  'no-import-assign': 'error', 'no-loss-of-precision': 'error', 'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error', 'use-isnan': 'error', 'valid-typeof': 'error',
  'no-empty-pattern': 'error', 'no-func-assign': 'error', 'no-sparse-arrays': 'error',
  'eqeqeq': ['error', 'smart']
};

export default [
  { ignores: ['crm/**', 'crm-src/**', '.claude/**', 'node_modules/**', '.quality/**'] },
  { files: ['main.js', 'scenes/**/*.js', 'interface/**/*.js', 'content/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browser }, rules },
  { files: ['tools/**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...node, ...browser } }, rules }
];
