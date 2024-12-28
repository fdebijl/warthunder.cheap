import { API_URL } from '../env.js';

const isJwtExpired = (token) => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));

    if (!payload.exp) {
      throw new Error('No exp field in token');
    }

    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expiryTime;
  } catch (error) {
    console.error('Fatal error while checking JWT expiry:', error);
    return true;
  }
}

export const authenticate = async () => {
  const paramToken = new URLSearchParams(window.location.search).get('token');
  const storedToken = localStorage.getItem('wtcheap-token');
  const token = paramToken || storedToken;

  if (token) {
    if (isJwtExpired(token)) {
      console.error('Token is expired, wiping session');
      localStorage.removeItem('wtcheap-token');
      return;
    }

    if (!storedToken) {
      localStorage.setItem('wtcheap-token', token);
    }

    if (paramToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url);
    }

    const response = await fetch(`${API_URL}/tokens/whoami`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then((res) => res.json());

    const { email } = response;
    localStorage.setItem('wtcheap-email', email);
  }
}

export const isAuthenticated = () => {
  const token = localStorage.getItem('wtcheap-token');
  return token && !isJwtExpired(token);
}
