import api from './api';

export function register(data) {
  return api.post('/auth/register', data).then((res) => res.data);
}

export function login(data) {
  return api.post('/auth/login', data).then((res) => res.data);
}

export function googleLogin(idToken, role) {
  return api.post('/auth/google', { idToken, role }).then((res) => res.data);
}

export function requestPasswordReset(email) {
  return api.post('/auth/forgot-password', { email }).then((res) => res.data);
}

export function verifyResetCode(email, code) {
  return api.post('/auth/reset-password/verify', { email, code }).then((res) => res.data);
}

export function resetPassword(token, newPassword) {
  return api.post('/auth/reset-password', { token, newPassword }).then((res) => res.data);
}

export function logout() {
  return api.post('/auth/logout').then((res) => res.data);
}
