import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, X } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const registerSW = async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');
        const update = registerSW({
          immediate: true,
          onRegistered(r) {
            console.log('SW Registered:', r);
          },
          onRegisterError(error) {
            console.log('SW registration error', error);
          },
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            setOfflineReady(true);
          },
        });

        if (update) {
          setUpdateSW(() => update);
        }
      } catch (error) {
        console.log('PWA not available in this environment');
      }
    };

    registerSW();
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = async () => {
    if (updateSW) {
      await updateSW(true);
    }
  };

  return (
    <>
      {(needRefresh || offlineReady) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert className="bg-white dark:bg-gray-800 border-2 border-primary shadow-lg">
            <Download className="h-4 w-4 text-primary" />
            <AlertTitle className="text-gray-900 dark:text-gray-100">
              {needRefresh ? 'Update Tersedia!' : 'Siap Offline!'}
            </AlertTitle>
            <AlertDescription className="text-gray-600 dark:text-gray-300 mb-3">
              {needRefresh
                ? 'Versi baru SeaVice sudah tersedia. Reload untuk mendapatkan fitur terbaru.'
                : 'SeaVice sudah siap digunakan secara offline.'}
            </AlertDescription>
            <div className="flex gap-2">
              {needRefresh && (
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-update-pwa"
                >
                  Reload Sekarang
                </Button>
              )}
              <Button
                onClick={close}
                variant="outline"
                size="sm"
                data-testid="button-close-pwa-prompt"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
}
