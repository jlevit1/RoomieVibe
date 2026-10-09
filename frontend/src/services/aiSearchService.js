import api from './api';

export function aiSearch(message) {
  return api.post('/ai/search', { message }).then((res) => res.data);
}
