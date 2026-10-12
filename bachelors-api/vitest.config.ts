import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const config = ({ mode }: { mode: string }) => ({
  resolve: {
    alias: { '@': resolve(process.cwd(), 'src') },
  },
  test: {
    env: loadEnv(mode, resolve(process.cwd(), '..'), ''),
  },
});

export default config;
