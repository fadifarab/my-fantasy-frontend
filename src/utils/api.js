import axios from 'axios';

const API = axios.create({
  baseURL: 'https://fpl-zeddine.onrender.com/api', // أو رابط السيرفر الخاص بك
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // تأكد من اسم المفتاح
  /*if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});*/
	if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token added to request headers');
  } else {
    console.warn('⚠️ No token found for request');
  }
  return config;
});

export default API;