import { memo } from 'react';
import { useTime } from '@/context/DataContext';

/**
 * Hodiny v hlavičce tabule.
 *
 * Vlastní komponenta schválně: čas se mění každou sekundu, a kdyby si ho
 * stránka četla přímo, překreslovala by se s ním celá — včetně hlavičky,
 * meteopanelu a obalů obou sloupců. Takhle se sekundový tik zastaví tady.
 */
export const LiveClock = memo(() => {
  const { currentTime } = useTime();

  return (
    <div className="text-right">
      <div className="font-bold text-7xl tabular-nums">
        {currentTime.toLocaleTimeString('cs-CZ')}
      </div>
      <div className="text-blue-100 mt-2 text-3xl">
        {currentTime.toLocaleDateString('cs-CZ', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>
  );
});

LiveClock.displayName = 'LiveClock';
