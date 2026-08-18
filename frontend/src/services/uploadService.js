import api from './api';

export function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data.url);
}
