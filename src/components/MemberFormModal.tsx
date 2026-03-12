import React, { useState } from 'react';
import { X, User, Phone, Briefcase, MapPin, Mail, Save, UserPlus, Camera } from 'lucide-react';
import { Member } from '../types';
import { generateId } from '../constants';

interface MemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Member) => void;
    initialData?: Member | null;
    title?: string;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSave, initialData, title = "Ajouter un Membre" }) => {
    const [formData, setFormData] = React.useState<Partial<Member>>({
        name: '',
        phone: '',
        profession: 'OUVRIER',
        location: '',
        email: '',
        photo: ''
    });

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({ name: '', phone: '', profession: 'OUVRIER', location: '', email: '', photo: '' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert("Le nom est obligatoire.");
            return;
        }

        const memberData: Member = {
            id: initialData?.id || generateId(),
            name: formData.name,
            phone: formData.phone || '',
            profession: formData.profession || 'OUVRIER',
            location: formData.location || '',
            email: formData.email || '',
            photo: formData.photo || ''
        };

        onSave(memberData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 px-8 py-6 text-white relative flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight leading-none">{initialData ? "Modifier Membre" : title}</h3>
                            <p className="text-indigo-300 text-[9px] font-bold uppercase tracking-widest mt-1.5 opacity-60">
                                {initialData ? "Mise à jour des informations" : "Saisie des informations de l'ouvrier"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={24} />
                    </button>

                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                </div>

                {/* Form Wrapper with Scroll */}
                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                        {/* Avatar Upload */}
                        <div className="flex justify-center mb-2">
                            <div className="relative group">
                                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-400 font-black text-4xl shadow-inner overflow-hidden uppercase">
                                    {formData.photo ? (
                                        <img src={formData.photo} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        (formData.name || 'M').charAt(0)
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                                    <Camera size={14} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (file.size > 2 * 1024 * 1024) {
                                                alert("L'image est trop volumineuse (max 2MB)");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData(prev => ({ ...prev, photo: reader.result as string }));
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <User size={12} className="text-indigo-500" /> Nom Complet *
                            </label>
                            <input
                                autoFocus
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                placeholder="Ex: Jean-Baptiste Konan"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Phone size={12} className="text-indigo-500" /> Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    placeholder="07 00 00 00 00"
                                />
                            </div>

                            {/* Profession */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Briefcase size={12} className="text-indigo-500" /> Profession
                                </label>
                                <input
                                    type="text"
                                    value={formData.profession}
                                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Ex: Enseignant"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <MapPin size={12} className="text-indigo-500" /> Localité / Quartier
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                placeholder="Ex: Cocody Angré"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Mail size={12} className="text-indigo-500" /> Email (Optionnel)
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                placeholder="ouvrier@example.com"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Save size={18} /> {initialData ? "Mettre à jour" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MemberFormModal;
