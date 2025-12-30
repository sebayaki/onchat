/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID: string;
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow ?inline CSS imports
declare module "*.css?inline" {
  const content: string;
  export default content;
}

// Allow ?url SVG imports
declare module "*.svg?url" {
  const src: string;
  export default src;
}
