import { useState, useEffect } from 'react';
import { usageService } from '../services/usageService';

export const useUsage = () => {
  const [usage, setUsage] = useState(usageService.getUsage());
  const max = usageService.getMaxLimit();

  useEffect(() => {
    const handleUpdate = () => {
      setUsage(usageService.getUsage());
    };

    window.addEventListener('usage-updated', handleUpdate);
    return () => window.removeEventListener('usage-updated', handleUpdate);
  }, []);

  return {
    usage,
    max,
    isLimitReached: false,
    isNearLimit: false,
  };
};
