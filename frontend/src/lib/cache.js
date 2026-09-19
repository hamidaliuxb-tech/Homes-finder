import { FALLBACK_PROPERTIES, FALLBACK_SETTINGS } from "@/data/seedFallback";

const PROP_CACHE_KEY = "hf_properties_cache";
const SETTINGS_CACHE_KEY = "hf_settings_cache";

/**
 * Retrieve cached properties from localStorage or fall back to pre-seeded properties.
 */
export function getCachedProperties() {
  try {
    const raw = localStorage.getItem(PROP_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return FALLBACK_PROPERTIES;
}

/**
 * Save fresh properties to localStorage.
 */
export function setCachedProperties(properties) {
  if (!Array.isArray(properties) || properties.length === 0) return;
  try {
    localStorage.setItem(PROP_CACHE_KEY, JSON.stringify(properties));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Retrieve cached settings from localStorage or fall back to default settings.
 */
export function getCachedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.id) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return FALLBACK_SETTINGS;
}

/**
 * Save fresh settings to localStorage.
 */
export function setCachedSettings(settings) {
  if (!settings || typeof settings !== "object") return;
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Helper to auto-retry an async promise (such as API call) when backend is spinning up.
 */
export async function fetchWithRetry(apiFn, retries = 2, delayMs = 2000) {
  let attempts = 0;
  while (attempts <= retries) {
    try {
      return await apiFn();
    } catch (err) {
      attempts++;
      if (attempts > retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
