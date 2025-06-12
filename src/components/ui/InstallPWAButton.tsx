import { Download } from 'lucide-react';
import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<null | any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  return (
    <button
      onClick={async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setVisible(false);
        }
        setDeferredPrompt(null);
      }}
      className="flex items-center justify-center p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 transition"
      title="Install App"
      style={{ width: 40, height: 40 }}
    >
      <Download size={20} />
    </button>
  );
}
