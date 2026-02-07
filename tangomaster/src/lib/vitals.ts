import { onCLS, onFID, onLCP, Metric } from 'web-vitals';

const reportHandler = (metric: Metric) => {
  console.log(metric);
  // In production, send to analytics endpoint
};

export const reportWebVitals = () => {
  if (typeof window !== 'undefined') {
    onCLS(reportHandler);
    onFID(reportHandler);
    onLCP(reportHandler);
  }
};
