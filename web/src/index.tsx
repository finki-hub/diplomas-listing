/* eslint-disable jsdoc/check-tag-names -- Solid Refresh uses the @refresh marker consumed by vite-plugin-solid. */
/** @refresh reload */
/* eslint-enable jsdoc/check-tag-names -- Re-enable after the Solid Refresh marker. */
import { render } from 'solid-js/web';

import './app.css';
import { initAnalytics } from '@/lib/analytics.ts';

import App from './App';

initAnalytics();

const root = document.querySelector('#root');

if (root === null) {
  throw new Error('Root element not found');
}

render(() => <App />, root);
