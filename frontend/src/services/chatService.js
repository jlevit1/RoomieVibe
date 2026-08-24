import api from './api';

export function getOrCreateConversation(listingId) {
  return api.post(`/chat/conversations/${listingId}`).then((res) => res.data);
}

export function getOrCreateRoommateConversation(profileId) {
  return api.post(`/chat/roommate-conversations/${profileId}`).then((res) => res.data);
}

export function getMyConversations() {
  return api.get('/chat/conversations').then((res) => res.data);
}

export function getConversation(conversationId) {
  return api.get(`/chat/conversations/${conversationId}`).then((res) => res.data);
}

export function getUnreadCount() {
  return api.get('/chat/unread-count').then((res) => res.data);
}

export function getMessages(conversationId) {
  return api.get(`/chat/conversations/${conversationId}/messages`).then((res) => res.data);
}

export function sendMessage(conversationId, content) {
  return api.post(`/chat/conversations/${conversationId}/messages`, { content }).then((res) => res.data);
}

export function createDepositRequest(conversationId, amount) {
  return api
    .post(`/chat/conversations/${conversationId}/deposit-request`, { amount })
    .then((res) => res.data);
}
