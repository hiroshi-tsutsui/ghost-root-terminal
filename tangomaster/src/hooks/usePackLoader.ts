import { useState, useEffect } from 'react';
import { ContentPack, AVAILABLE_PACKS } from '../lib/packs';

export const usePackLoader = (category?: string) => {
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async fetch
    setTimeout(() => {
      const filtered = category 
        ? AVAILABLE_PACKS.filter(p => p.category === category)
        : AVAILABLE_PACKS;
      setPacks(filtered);
      setLoading(false);
    }, 500);
  }, [category]);

  return { packs, loading };
};
