const API_BASE = (globalThis?.location?.origin && globalThis.location.origin.startsWith('http'))
  ? globalThis.location.origin.replace(/\/$/, '')
  : 'http://127.0.0.1:18080';

export async function request(path, options = {}) {
  const target = `${API_BASE}${path}`;
  if (globalThis.fetch) {
    try {
      const response = await fetch(target, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      return json.data;
    } catch (error) {
      throw error;
    }
  }
  throw new Error('fetch is not available');
}

export { API_BASE };
