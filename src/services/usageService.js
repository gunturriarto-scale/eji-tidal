const USAGE_KEY = 'eji_tidal_creative_usage';
const DATE_KEY = 'eji_tidal_creative_last_reset';
const MAX_LIMIT = 50;

export const usageService = {
  checkAndReset: () => {
    const today = new Date().toLocaleDateString();
    const lastReset = localStorage.getItem(DATE_KEY);

    if (lastReset !== today) {
      localStorage.setItem(USAGE_KEY, '0');
      localStorage.setItem(DATE_KEY, today);
      window.dispatchEvent(new Event('usage-updated'));
    }
  },

  getUsage: () => {
    usageService.checkAndReset();
    const stored = localStorage.getItem(USAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  },

  incrementUsage: () => {
    usageService.checkAndReset();
    const current = usageService.getUsage();
    const next = current + 1;
    localStorage.setItem(USAGE_KEY, next.toString());
    window.dispatchEvent(new Event('usage-updated'));
    return next;
  },

  getMaxLimit: () => {
    return 999999;
  },

  hasReachedLimit: () => {
    return false;
  }
};
