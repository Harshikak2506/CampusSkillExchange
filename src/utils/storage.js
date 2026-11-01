/**
 * Safe LocalStorage wrapper to prevent application crashes from corrupted data
 * or restricted browser environments (private mode, quota exceeded, disabled storage).
 */

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined || item === "undefined") {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (err) {
      console.warn(`[storage] Failed to parse key "${key}" from localStorage, falling back to default.`, err);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storage] Failed to save key "${key}" to localStorage:`, err);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.warn(`[storage] Failed to remove key "${key}" from localStorage:`, err);
      return false;
    }
  },
};

export default storage;

