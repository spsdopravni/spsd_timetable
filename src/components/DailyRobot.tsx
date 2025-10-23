import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface DailyRobotProps {
  textSize?: number;
}

const DailyRobotComponent = ({ textSize = 1.0 }: DailyRobotProps) => {
  // Jednoduchý robot bez animací pro RAM optimalizaci
  const getDayMessage = () => {
    const day = new Date().getDay();
    const messages = [
      { emoji: '🌙', text: 'Hezkou neděli!' },
      { emoji: '💼', text: 'Hezké pondělí!' },
      { emoji: '💪', text: 'Úterní energie!' },
      { emoji: '🌟', text: 'Středeční motivace!' },
      { emoji: '🎯', text: 'Čtvrtek - skoro víkend!' },
      { emoji: '🎉', text: 'Pátek je tady!' },
      { emoji: '🌈', text: 'Krásnou sobotu!' }
    ];
    return messages[day];
  };

  const message = getDayMessage();

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent className="p-4 text-center">
        <div
          className="text-6xl mb-2"
          style={{ fontSize: `${Math.max(3, 4 * textSize)}rem` }}
        >
          🤖
        </div>
        <div
          className="text-2xl font-bold text-gray-800 mb-1"
          style={{ fontSize: `${Math.max(1.2, 1.8 * textSize)}rem` }}
        >
          {message.emoji} {message.text}
        </div>
        <div
          className="text-sm text-gray-600"
          style={{ fontSize: `${Math.max(0.8, 1.2 * textSize)}rem` }}
        >
          Mějte bezpečnou cestu!
        </div>
      </CardContent>
    </Card>
  );
};

export const DailyRobot = memo(DailyRobotComponent);
