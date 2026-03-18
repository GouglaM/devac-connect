import React, { useState } from 'react';
import { Lock, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ADMIN_PASSWORD } from '../../constants';

interface EditAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (success: boolean) => void;
  unitName: string;
}

const EditAuthModal: React.FC<EditAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  unitName
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    if (password === ADMIN_PASSWORD) {
      onAuthenticate(true);
      setPassword('');
      setIsSubmitting(false);
    } else {
      setError('Mot de passe incorrect. Veuillez réessayer.');
      setPassword('');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-8 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full opacity-20 blur-2xl" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Authentification Requise</h3>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mt-1">Pour modifier cette unité</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all relative z-10"
          >
            <X size={22} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Pour accéder au mode édition de l'unité <span className="font-black text-slate-800">"{unitName}"</span>, veuillez entrer le mot de passe administrateur.
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(''); // Clear error when user types
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Entrez le mot de passe"
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                isSubmitting || !password
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />
                  VÉRIFICATION...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  DÉBLOQUER L'ÉDITION
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest leading-relaxed">
              Seuls les administrateurs peuvent modifier les données de cette unité. Cette action est sécurisée et tracée.
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAuthModal;
