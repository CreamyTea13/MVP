import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{outDir:process.env.APPDEPLOY_VITE_OUT_DIR||'dist',emptyOutDir:false,sourcemap:false,lib:{entry:'src/commerce.ts',formats:['es'],fileName:()=> 'assets/commerce.js'}}});
