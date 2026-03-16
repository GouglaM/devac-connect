import React, { useState, useEffect } from 'react';
import { Download, Monitor } from 'lucide-react';

const InstallPWA: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Empêche Chrome 67 et les versions antérieures d'afficher automatiquement l'invite
            e.preventDefault();
            // Garde l'événement pour qu'il puisse être déclenché plus tard.
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Vérifie si l'app est déjà installée (mode standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Affiche l'invite d'installation
        deferredPrompt.prompt();

        // Attend que l'utilisateur réponde à l'invite
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // On ne peut plus utiliser l'événement, on le nettoie
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-5 duration-500 border border-indigo-400">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                    <Monitor className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Installer l'application ?</h4>
                    <p className="text-[10px] text-indigo-100 italic">Accédez à DEVAC Connect depuis votre bureau.</p>
                </div>
            </div>
            <button
                onClick={handleInstallClick}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm"
            >
                <Download className="w-3 h-3" />
                Installer
            </button>
        </div>
    );
};

export default InstallPWA;
