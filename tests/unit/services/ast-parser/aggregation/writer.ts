import { store } from './store';
export function setTwice() {
  store.value = 1;
  store.value = 2;
}
