import React, { memo } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

const ThemeToggleComponent = () => {
  const { theme, effectiveTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'auto':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getTooltipText = () => {
    switch (theme) {
      case 'light':
        return 'Přepnout na tmavý režim';
      case 'dark':
        return 'Přepnout na automatický režim';
      case 'auto':
        return 'Přepnout na světlý režim';
      default:
        return 'Přepnout režim';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`
        relative h-9 w-9 p-0 transition-all duration-200
        ${effectiveTheme === 'dark'
          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
      `}
      title={getTooltipText()}
    >
      <div className="relative flex items-center justify-center">
        {getIcon()}
      </div>
    </Button>
  );
};

export const ThemeToggle = memo(ThemeToggleComponent);