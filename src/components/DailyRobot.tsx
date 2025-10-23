import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";

interface DailyRobotProps {
  textSize?: number;
}

const DailyRobotComponent = ({ textSize = 1.0 }: DailyRobotProps) => {
  // Původní robot se všemi animacemi a funkcemi
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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
      {/* Modrá animovaná čára dole */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400"
        animate={{
          scaleX: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <CardContent className="p-4 flex items-center gap-4 overflow-hidden">
        {/* Robot jezdící zprava doleva */}
        <motion.div
          className="text-6xl flex-shrink-0"
          style={{ fontSize: `${Math.max(3, 4 * textSize)}rem` }}
          animate={{
            x: [300, -50, 300],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 1]
          }}
        >
          🤖
        </motion.div>

        {/* Text vedle robota */}
        <div className="flex-1">
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
        </div>
      </CardContent>
    </Card>
  );
};

export const DailyRobot = memo(DailyRobotComponent);
