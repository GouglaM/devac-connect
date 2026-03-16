import React, { useState, useRef, useEffect } from 'react';
import { Type, Palette, Download, Sparkles, Image as ImageIcon, Send } from 'lucide-react';

interface CreativeStudioProps {
  onPublish: (image: string) => void;
}

const CreativeStudio: React.FC<CreativeStudioProps> = ({ onPublish }) => {
  const [text, setText] = useState('VOTRE MESSAGE ICI');
  const [bgColor, setBgColor] = useState('#4f46e5');
  const [textColor, setTextColor] = useState('#ffffff');
  const [gradient, setGradient] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    draw();
  }, [text, bgColor, textColor, gradient]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (gradient) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, bgColor);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay Pattern
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px Inter, sans-serif';

    // Simple text drawing (can be improved with wrap logic if needed)
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onPublish(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full aspect-video object-contain bg-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase">Message Graphique</label>
          <div className="relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Texte à afficher..."
            />
            <Type className="absolute right-3 top-2.5 w-4 h-4 text-slate-300" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase">Couleurs</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-none"
            />
            <button
              onClick={() => setGradient(!gradient)}
              className={`flex-1 rounded-xl text-xs font-bold border transition-all ${gradient ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              Mode Dégradé {gradient ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-200 transition-all"
      >
        <Sparkles size={18} /> Utiliser cette création
      </button>
    </div>
  );
};

export default CreativeStudio;
