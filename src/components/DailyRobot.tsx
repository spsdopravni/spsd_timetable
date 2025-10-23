import React, { memo } from 'react';

interface DailyRobotProps {
  textSize?: number;
}

const DailyRobotComponent = ({ textSize = 1.0 }: DailyRobotProps) => {
  // Robot kompletně vypnut pro úsporu RAM (1 GB)
  // Odstraněn Framer Motion a všechny animace
  return null;
};

export const DailyRobot = memo(DailyRobotComponent);
