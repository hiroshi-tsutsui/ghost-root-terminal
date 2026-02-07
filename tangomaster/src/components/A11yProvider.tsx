import React, { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fontSize } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontSize === 'small') document.documentElement.classList.add('text-sm');
    if (fontSize === 'medium') document.documentElement.classList.add('text-base');
    if (fontSize === 'large') document.documentElement.classList.add('text-lg');
  }, [fontSize]);

  return (
    <div aria-live="polite" className="contents">
      {children}
    </div>
  );
};
