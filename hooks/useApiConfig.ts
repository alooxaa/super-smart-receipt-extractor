import { useState } from 'react';

export const DEFAULT_API_URL = 'https://absent-fifty-week-julia.trycloudflare.com';

// Module-level singleton so the URL persists across component re-mounts within a session
let currentUrl = DEFAULT_API_URL;

export function useApiConfig() {
  const [apiUrl, setApiUrlState] = useState<string>(currentUrl);

  const setApiUrl = (url: string) => {
    const trimmed = url.trim();
    currentUrl = trimmed;
    setApiUrlState(trimmed);
  };

  return { apiUrl, setApiUrl, loaded: true };
}
