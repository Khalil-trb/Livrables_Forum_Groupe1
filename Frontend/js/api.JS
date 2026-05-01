const API_BASE = 'http://localhost:3000/api';

const api = {
  async request(method, endpoint, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get: (endpoint, auth = false) => api.request('GET', endpoint, null, auth),
  post: (endpoint, body, auth = false) => api.request('POST', endpoint, body, auth),
  put: (endpoint, body, auth = false) => api.request('PUT', endpoint, body, auth),
  patch: (endpoint, body, auth = false) => api.request('PATCH', endpoint, body, auth),
  delete: (endpoint, auth = false) => api.request('DELETE', endpoint, null, auth),
};

const auth = {
  isLoggedIn: () => !!localStorage.getItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  },
};
