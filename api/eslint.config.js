import {
  base,
  node,
  perfectionist,
  prettier,
  typescript,
} from 'eslint-config-imperium';

export default [
  base,
  node,
  typescript,
  prettier,
  perfectionist,
  {
    rules: {
      'no-console': 'off',
    },
  },
];
