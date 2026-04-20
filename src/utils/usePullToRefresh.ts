import { useEffect, useRef, useState } from "react";

interface Options {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // px to pull before triggering
  enabled?: boolean;
}

/**
 * Native pull-to-refresh nefunguje když má body { position: fixed }, takže
 * tohle implementuje vlastní handler. Hook vrací stav pro vizuální feedback
 * a ref, který připoj na scrollovatelný element.
 */
export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  threshold = 80,
  enabled = true,
}: Options) {
  const ref = useRef<T | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      // Začneme jen když je element úplně nahoře.
      if (el.scrollTop > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        // Resistivní křivka — vizuálně zpomaluje za thresholdem.
        const resisted = dy < threshold ? dy : threshold + Math.sqrt(dy - threshold) * 5;
        setPullDistance(resisted);
        if (dy > 5) e.preventDefault();
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullDistance >= threshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, threshold, onRefresh, pullDistance, refreshing]);

  return { ref, pullDistance, refreshing, threshold };
}
