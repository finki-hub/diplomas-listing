/* @refresh reload */
import { render } from 'solid-js/web';

import './app.css';
import App from './App';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = document.querySelector('#root')!;

render(() => <App />, root);
