'use client';

import { useEffect, useState } from 'react';

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        setCSRFToken(data.token);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCSRFToken();
  }, []);

  return { csrfToken, isLoading };
}

// Helper function to add CSRF token to fetch requests
export function fetchWithCSRF(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  
  // Get CSRF token from client-readable cookie
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token-client='))
    ?.split('=')[1];

  if (token) {
    headers.set('x-csrf-token', token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}