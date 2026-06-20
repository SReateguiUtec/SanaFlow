const API_URL = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem('sanaflow_token');
export const setToken = (token: string) => localStorage.setItem('sanaflow_token', token);
export const removeToken = () => localStorage.removeItem('sanaflow_token');

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Error');
  }

  return response.json();
};

export const api = {
  auth: {
    login: (credentials: Record<string, string>) => authFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: Record<string, string>) => authFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  },
  upload: {
    sendNotes: (notas: string[]) => authFetch('/upload', { method: 'POST', body: JSON.stringify({ notas }) }),
  },
  results: {
    get: (limit: number = 10, lastKey?: string) => {
      const query = new URLSearchParams();
      query.append('limit', limit.toString());
      if (lastKey) query.append('last_key', lastKey);
      return authFetch(`/results?${query.toString()}`, { method: 'GET' });
    },
  }
};
