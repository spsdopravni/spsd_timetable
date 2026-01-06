
import React from 'react';
import { X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    showWeatherInHeader: boolean;
    showTimesInMinutes: boolean;
    testAlert: boolean;
    disableAnimations: boolean;
  };
  onSettingChange: (key: string, value: any) => void;
}

export const Settings = ({ isOpen, onClose, settings, onSettingChange }: SettingsProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Nastavení Tabule</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Počasí v headru */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Počasí v headru</h3>
              <p className="text-sm text-gray-600">Zobrazit počasí v horní části při rozděleném zobrazení</p>
            </div>
            <Button
              variant={settings.showWeatherInHeader ? "default" : "outline"}
              onClick={() => onSettingChange('showWeatherInHeader', !settings.showWeatherInHeader)}
              className="flex items-center gap-2"
            >
              {settings.showWeatherInHeader ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {settings.showWeatherInHeader ? 'Zobrazit' : 'Skrýt'}
            </Button>
          </div>

          {/* Test Alert */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h3 className="text-lg font-semibold">Test Alert Banner</h3>
              <p className="text-sm text-gray-600">Zobrazit testovací alert banner pro otestování funkcí</p>
            </div>
            <Button
              variant={settings.testAlert ? "default" : "outline"}
              onClick={() => onSettingChange('testAlert', !settings.testAlert)}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {settings.testAlert ? 'Aktivní' : 'Aktivovat'}
            </Button>
          </div>

          {/* Vypnout animace */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Vypnout animace</h3>
              <p className="text-sm text-gray-600">Vypne animace karet a směrů (robůtek zůstane animovaný)</p>
            </div>
            <Button
              variant={settings.disableAnimations ? "default" : "outline"}
              onClick={() => onSettingChange('disableAnimations', !settings.disableAnimations)}
              className="flex items-center gap-2"
            >
              {settings.disableAnimations ? 'Vypnuto' : 'Zapnuto'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
