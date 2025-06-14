import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// Custom plugin to fix lodash imports
const fixLodashImports = () => {
  return {
    name: 'fix-lodash-imports',
    resolveId(id: string) {
      // Redirect all lodash imports to lodash-es
      if (id.startsWith('lodash')) {
        return id.replace('lodash', 'lodash-es');
      }
    },
    transform(code: string, id: string) {
      // Fix incorrect default imports from lodash
      if (code.includes('lodash') && !id.includes('node_modules/lodash-es')) {
        // Replace default imports from lodash submodules
        code = code.replace(
          /import\s+(\w+)\s+from\s+['"]lodash\/(\w+)['"]/g,
          'import { $2 as $1 } from "lodash-es"'
        );
        // Replace incorrect default imports
        code = code.replace(
          /import\s+isEqual\s+from\s+['"]lodash\/isEqual['"]/g,
          'import { isEqual } from "lodash-es"'
        );
        return code;
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    fixLodashImports(),
    wasm(),
    topLevelAwait(),
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Redirect lodash to lodash-es for ESM compatibility
      "lodash": "lodash-es",
      "lodash/": "lodash-es/",
      // Specific aliases for common lodash methods
      "lodash/isEqual": "lodash-es/isEqual",
      "lodash/cloneDeep": "lodash-es/cloneDeep",
      "lodash/debounce": "lodash-es/debounce",
      "lodash/throttle": "lodash-es/throttle"
    },
  },
  optimizeDeps: {
    exclude: ['@lucid-evolution/lucid'],
    include: [
      'lodash-es',
      'lodash-es/isEqual',
      'lodash-es/cloneDeep',
      'lodash-es/debounce',
      'lodash-es/throttle',
      'bech32',
      '@scure/bip32',
      '@scure/bip39',
      '@emurgo/cardano-message-signing-nodejs',
      '@emurgo/cardano-message-signing-browser'
    ],
    esbuildOptions: {
      target: 'esnext',
      // Force ESM output for problematic packages
      mainFields: ['module', 'main']
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // Include problematic packages in transformation
      include: [/bech32/, /node_modules/]
    },
    target: 'esnext'
  }
}));
