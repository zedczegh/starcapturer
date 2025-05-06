
import { useState, useEffect, useCallback } from 'react';
import { ASTRONOMY_STORIES } from '@/utils/astronomyTips';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const MINIMUM_TIP_INTERVAL = 90000; // 1.5 minutes
const usedTipsKey = 'recently-shown-tips';

export const useAstronomyTips = () => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [lastTipTime, setLastTipTime] = useState<number>(0);
  
  const getRecentlyUsedTips = useCallback((): number[] => {
    try {
      const stored = localStorage.getItem(usedTipsKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const addToRecentlyUsed = useCallback((index: number) => {
    try {
      const recent = getRecentlyUsedTips();
      const updated = [index, ...recent].slice(0, Math.floor(ASTRONOMY_STORIES.length * 0.5));
      localStorage.setItem(usedTipsKey, JSON.stringify(updated));
    } catch {
      // Fail silently if localStorage is unavailable
    }
  }, [getRecentlyUsedTips]);

  const getRandomTip = useCallback(() => {
    const recentlyUsed = getRecentlyUsedTips();
    const available = ASTRONOMY_STORIES.map((_, index) => index)
      .filter(index => !recentlyUsed.includes(index));
    
    // If we've used all tips, reset the recently used list
    if (available.length === 0) {
      localStorage.removeItem(usedTipsKey);
      return Math.floor(Math.random() * ASTRONOMY_STORIES.length);
    }
    
    return available[Math.floor(Math.random() * available.length)];
  }, [getRecentlyUsedTips]);

  const showTip = useCallback(() => {
    const now = Date.now();
    if (now - lastTipTime < MINIMUM_TIP_INTERVAL) {
      return;
    }

    const tipIndex = getRandomTip();
    const tip = ASTRONOMY_STORIES[tipIndex];
    if (!tip) return;

    const tipText = language === "zh" ? tip[1] : tip[0];
    addToRecentlyUsed(tipIndex);
    setLastTipTime(now);

    toast(tipText, {
      duration: 8000,
      position: isMobile ? "top-center" : "bottom-right",
      className: "astronomy-tip-toast",
      style: {
        background: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        color: "#fff",
        fontWeight: "400",
        maxWidth: "400px",
        width: "95%",
        padding: "14px 18px",
        fontSize: "0.95rem",
        lineHeight: "1.5",
        borderRadius: "12px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)",
      },
      closeButton: true,
    });
  }, [language, lastTipTime, getRandomTip, addToRecentlyUsed, isMobile]);

  return { showTip };
};
