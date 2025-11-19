import { useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useIntersectionObserver = ({
  onIntersect,
  enabled = true,
  threshold = 0.1,
  rootMargin = '100px'
}: UseIntersectionObserverProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [enabled, threshold, rootMargin, onIntersect]);

  return targetRef;
};
