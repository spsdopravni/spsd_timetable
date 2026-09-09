import { useState, useEffect } from 'react';

interface PWAPrompt {
  prompt: () => void;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
  shareApp: () => Promise<void>;
  canShare: boolean;
}

export const usePWA = (): UsePWAReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = isStandalone || (isIOS && !(window as any).MSStream);
      setIsInstalled(isPWA);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
    };

    // Listen for app install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log('PWA byla úspěšně nainstalována');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('App není připravena k instalaci');
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User přijal instalaci PWA');
    } else {
      console.log('User odmítl instalaci PWA');
    }

    setDeferredPrompt(null);
  };

  const shareApp = async (): Promise<void> => {
    if (!navigator.share) {
      throw new Error('Web Share API není podporováno');
    }

    try {
      await navigator.share({
        title: 'SPSD Timetable',
        text: 'Tramvajové odjezdy Praha - sleduj MHD v reálném čase',
        url: window.location.href,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    installApp,
    shareApp,
    canShare: !!navigator.share,
  };
};