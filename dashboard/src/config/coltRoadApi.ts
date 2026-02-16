/**
 * Colt Road API URLs: chat (stock Q&A), filter (natural-language stock search), macro (daily market metrics).
 * Read from localStorage first so you can configure at runtime; fall back to env.
 */

const STORAGE_CHAT = 'colt_road_chat_api_url';
const STORAGE_FILTER = 'colt_road_filter_api_url';
const STORAGE_MACRO = 'colt_road_macro_api_url';
const ENV_CHAT = import.meta.env.VITE_LLM_CHAT_API_URL as string | undefined;
const ENV_FILTER = import.meta.env.VITE_LLM_FILTER_API_URL as string | undefined;
const ENV_MACRO = import.meta.env.VITE_MACRO_API_URL as string | undefined;

export function getChatApiUrl(): string | undefined {
  const stored = localStorage.getItem(STORAGE_CHAT);
  if (stored != null && stored.trim() !== '') return stored.trim();
  return ENV_CHAT;
}

export function getFilterApiUrl(): string | undefined {
  const stored = localStorage.getItem(STORAGE_FILTER);
  if (stored != null && stored.trim() !== '') return stored.trim();
  return ENV_FILTER;
}

export function setChatApiUrl(url: string): void {
  const val = url.trim();
  if (val) localStorage.setItem(STORAGE_CHAT, val);
  else localStorage.removeItem(STORAGE_CHAT);
  window.dispatchEvent(new CustomEvent('colt-road-api-config-saved'));
}

export function setFilterApiUrl(url: string): void {
  const val = url.trim();
  if (val) localStorage.setItem(STORAGE_FILTER, val);
  else localStorage.removeItem(STORAGE_FILTER);
  window.dispatchEvent(new CustomEvent('colt-road-api-config-saved'));
}

export function getMacroApiUrl(): string | undefined {
  const stored = localStorage.getItem(STORAGE_MACRO);
  if (stored != null && stored.trim() !== '') return stored.trim();
  return ENV_MACRO;
}

export function setMacroApiUrl(url: string): void {
  const val = url.trim();
  if (val) localStorage.setItem(STORAGE_MACRO, val);
  else localStorage.removeItem(STORAGE_MACRO);
  window.dispatchEvent(new CustomEvent('colt-road-api-config-saved'));
}
