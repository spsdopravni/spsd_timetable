import { memo } from 'react';
import SnowfallLib from 'react-snowfall';

const SnowfallComponent = () => {
  return (
    <SnowfallLib
      snowflakeCount={40}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      speed={[0.3, 1.5]}
      wind={[-0.3, 0.5]}
      radius={[1, 4]}
    />
  );
};

export const Snowfall = memo(SnowfallComponent);
