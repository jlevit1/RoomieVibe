import api from './api';

export function getWallet() {
  return api.get('/wallet').then((res) => res.data);
}

export function topUp(amount) {
  return api.post('/wallet/topup', { amount }).then((res) => res.data);
}
