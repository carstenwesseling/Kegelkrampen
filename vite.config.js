// Statischer Build für Hostinger: `vite build` -> dist/
// Die Skripte in index.html sind klassische <script src> (keine ES-Module); Vite bündelt sie nicht.
// Deshalb werden js/, img/ und dokumente/ unverändert nach dist kopiert.
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const STATIC_DIRS = ['js', 'img', 'dokumente'];

export default {
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [{
    name: 'copy-static-dirs',
    apply: 'build',
    closeBundle() {
      for (const dir of STATIC_DIRS) {
        if (existsSync(dir)) cpSync(resolve(dir), resolve('dist', dir), { recursive: true });
      }
    }
  }]
};
