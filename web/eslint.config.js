import {
  base,
  browser,
  perfectionist,
  prettier,
  solid,
  typescript,
} from 'eslint-config-imperium';

const config = [
  { ignores: ['dist', 'vite.config.ts'] },
  ...base,
  browser,
  solid,
  typescript,
  prettier,
  perfectionist,
];

export default config;
