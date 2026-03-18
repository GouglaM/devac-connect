import React, { useState } from 'react';
import { ADMIN_PASSWORD } from '../constants';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Administration DEVAC</h1>
          <p className="text-slate-400 mt-2">Accès réservé aux administrateurs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Mot de passe administrateur
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Entrez le mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;