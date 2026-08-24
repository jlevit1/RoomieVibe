import api from './api';

export function payDeposit(id) {
  return api.patch(`/deposits/${id}/pay`).then((res) => res.data);
}

export function cancelDeposit(id) {
  return api.patch(`/deposits/${id}/cancel`).then((res) => res.data);
}

export function completeDeposit(id) {
  return api.patch(`/deposits/${id}/complete`).then((res) => res.data);
}

export function disputeDeposit(id, reason) {
  return api.post(`/deposits/${id}/dispute`, { reason }).then((res) => res.data);
}

export function getDisputedDeposits() {
  return api.get('/admin/deposits/disputes').then((res) => res.data);
}

export function resolveDispute(id, releaseToLandlord, note) {
  return api.patch(`/admin/deposits/${id}/resolve`, { releaseToLandlord, note }).then((res) => res.data);
}
