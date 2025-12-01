import { memo } from 'react';

const ChristmasGarlandComponent = () => {
  // Stejná logika jako vánoční robot - 20. až 26. prosince
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const isChristmasPeriod = month === 12 && day >= 1 && day <= 26;

  if (!isChristmasPeriod) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      height: '45px',
      position: 'absolute',
      bottom: '-20px',
      left: 0,
      zIndex: 100,
      backgroundImage: 'url(/pictures/grialanda.png)',
      backgroundRepeat: 'repeat-x',
      backgroundSize: 'auto 45px',
      backgroundPosition: 'center top',
      pointerEvents: 'none'
    }} />
  );
};

export const ChristmasGarland = memo(ChristmasGarlandComponent);
