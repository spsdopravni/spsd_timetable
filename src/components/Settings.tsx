
import React from 'react';
import { X, Plus, Minus, Monitor, Maximize, LayoutGrid, Eye, EyeOff, Type, Split, Clock, Columns, Image, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    showRightPanel: boolean;
    isFullscreen: boolean;
    zoomLevel: number;
    splitView: boolean;
    textSize: number;
    logoSize: number;
    showWeatherInHeader: boolean;
    vozovnaOnlyMode: boolean;
    showTimesInMinutes: boolean;
    vozovnaUnifiedHeader: boolean;
    testAlert: boolean;
  };
  onSettingChange: (key: string, value: any) => void;
}

export const Settings = ({ isOpen, onClose, settings, onSettingChange }: SettingsProps) => {
  if (!isOpen) return null;

  const handleZoomIn = () => {
    const newZoom = Math.min(settings.zoomLevel + 0.1, 2.0);
    onSettingChange('zoomLevel', newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(settings.zoomLevel - 0.1, 0.5);
    onSettingChange('zoomLevel', newZoom);
  };

  const handleTextSizeIncrease = () => {
    const newSize = Math.min(settings.textSize + 0.21, 4.2);
    onSettingChange('textSize', newSize);
  };

  const handleTextSizeDecrease = () => {
    const newSize = Math.max(settings.textSize - 0.21, 1.05);
    onSettingChange('textSize', newSize);
  };

  const handleLogoSizeIncrease = () => {
    const newSize = Math.min(settings.logoSize + 0.1, 3.0);
    onSettingChange('logoSize', newSize);
  };

  const handleLogoSizeDecrease = () => {
    const newSize = Math.max(settings.logoSize - 0.1, 0.3);
    onSettingChange('logoSize', newSize);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      onSettingChange('isFullscreen', true);
    } else {
      document.exitFullscreen();
      onSettingChange('isFullscreen', false);
    }
  };

  const getDisplayTextSize = () => {
    return Math.round((settings.textSize / 2.1) * 100);
  };

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
          {/* Pravý panel */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Pravý panel</h3>
              <p className="text-sm text-gray-600">Zobrazit počasí a informace o linkách</p>
            </div>
            <Button
              variant={settings.showRightPanel ? "default" : "outline"}
              onClick={() => onSettingChange('showRightPanel', !settings.showRightPanel)}
              className="flex items-center gap-2"
            >
              {settings.showRightPanel ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {settings.showRightPanel ? 'Zobrazit' : 'Skrýt'}
            </Button>
          </div>

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

          {/* Časy v minutách */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Časy v minutách</h3>
              <p className="text-sm text-gray-600">Zobrazit odjezdy za kolik minut místo skutečného času</p>
            </div>
            <Button
              variant={settings.showTimesInMinutes ? "default" : "outline"}
              onClick={() => onSettingChange('showTimesInMinutes', !settings.showTimesInMinutes)}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {settings.showTimesInMinutes ? 'Minuty' : 'Čas'}
            </Button>
          </div>

          {/* Fullscreen */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Celoobrazovkový režim</h3>
              <p className="text-sm text-gray-600">Zobrazit na celou obrazovku</p>
            </div>
            <Button
              variant={settings.isFullscreen ? "default" : "outline"}
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              {settings.isFullscreen ? <Monitor className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              {settings.isFullscreen ? 'Aktivní' : 'Aktivovat'}
            </Button>
          </div>

          {/* Zoom */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Přiblížení</h3>
                <p className="text-sm text-gray-600">Upravit velikost obsahu</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {Math.round(settings.zoomLevel * 100)}%
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleZoomOut}
                disabled={settings.zoomLevel <= 0.5}
                className="flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Oddálit
              </Button>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-600">
                  Rozsah: 50% - 200%
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleZoomIn}
                disabled={settings.zoomLevel >= 2.0}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Přiblížit
              </Button>
            </div>
          </div>

          {/* Velikost textu */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Velikost textu</h3>
                <p className="text-sm text-gray-600">Upravit velikost textu v odjezdech</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {getDisplayTextSize()}%
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleTextSizeDecrease}
                disabled={settings.textSize <= 1.05}
                className="flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Zmenšit
              </Button>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-600">
                  Rozsah: 50% - 200%
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleTextSizeIncrease}
                disabled={settings.textSize >= 4.2}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Zvětšit
              </Button>
            </div>
          </div>

          {/* Velikost loga */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Velikost loga školy</h3>
                <p className="text-sm text-gray-600">Upravit velikost loga školy v headerech</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {Math.round(settings.logoSize * 100)}%
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLogoSizeDecrease}
                disabled={settings.logoSize <= 0.3}
                className="flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Zmenšit
              </Button>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-600">
                  Rozsah: 30% - 300%
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleLogoSizeIncrease}
                disabled={settings.logoSize >= 3.0}
                className="flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Zvětšit
              </Button>
            </div>
          </div>

          {/* Rozdělené zobrazení */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Rozdělené zobrazení</h3>
              <p className="text-sm text-gray-600">Zobrazit Motol a Vozovnu Motol vedle sebe</p>
            </div>
            <Button
              variant={settings.splitView ? "default" : "outline"}
              onClick={() => onSettingChange('splitView', !settings.splitView)}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              {settings.splitView ? 'Aktivní' : 'Aktivovat'}
            </Button>
          </div>

          {/* Vozovna only režim */}
          {settings.splitView && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h3 className="text-lg font-semibold">Pouze Vozovna Motol</h3>
                <p className="text-sm text-gray-600">Zobrazit pouze stanici Vozovna Motol v obou směrech</p>
              </div>
              <Button
                variant={settings.vozovnaOnlyMode ? "default" : "outline"}
                onClick={() => onSettingChange('vozovnaOnlyMode', !settings.vozovnaOnlyMode)}
                className="flex items-center gap-2"
              >
                <Split className="w-4 h-4" />
                {settings.vozovnaOnlyMode ? 'Aktivní' : 'Aktivovat'}
              </Button>
            </div>
          )}

          {/* Spojený header pro Vozovna only režim */}
          {settings.splitView && settings.vozovnaOnlyMode && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <h3 className="text-lg font-semibold">Spojený header</h3>
                <p className="text-sm text-gray-600">Použít jeden header s názvem uprostřed místo dvou</p>
              </div>
              <Button
                variant={settings.vozovnaUnifiedHeader ? "default" : "outline"}
                onClick={() => onSettingChange('vozovnaUnifiedHeader', !settings.vozovnaUnifiedHeader)}
                className="flex items-center gap-2"
              >
                <Columns className="w-4 h-4" />
                {settings.vozovnaUnifiedHeader ? 'Aktivní' : 'Aktivovat'}
              </Button>
            </div>
          )}

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

          {/* Reset */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onSettingChange('showRightPanel', true);
                onSettingChange('isFullscreen', false);
                onSettingChange('zoomLevel', 1.0);
                onSettingChange('textSize', 2.1);
                onSettingChange('splitView', false);
                onSettingChange('showWeatherInHeader', false);
                onSettingChange('vozovnaOnlyMode', false);
                onSettingChange('showTimesInMinutes', false);
                onSettingChange('vozovnaUnifiedHeader', false);
                onSettingChange('testAlert', false);
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                }
              }}
              className="w-full"
            >
              Obnovit výchozí nastavení
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
