import api from './api';

export function getListingReviews(id) {
  return api.get(`/reviews/listings/${id}`).then((res) => res.data);
}

export function submitListingReview(id, payload) {
  return api.post(`/reviews/listings/${id}`, payload).then((res) => res.data);
}

export function deleteListingReview(id) {
  return api.delete(`/reviews/listings/${id}`).then((res) => res.data);
}
