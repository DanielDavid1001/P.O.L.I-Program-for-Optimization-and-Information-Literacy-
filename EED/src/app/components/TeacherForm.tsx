import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Teacher } from '../App.tsx';
import { createSubject, deleteSubject } from '../../lib/api';
import { Trash2 } from 'lucide-react';

interface TeacherFormProps {
  onSubmit: (teacher: Teacher) => Promise<void> | void;
  darkMode: boolean;
  editingTeacher?: Teacher | null;
  onCancel?: () => void;
  availableSubjects?: { id: any; name: string }[];
  refreshSubjects?: () => Promise<void>;
}

export function TeacherForm({ onSubmit, darkMode, editingTeacher, onCancel, availableSubjects, refreshSubjects }: TeacherFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  // format phone as user types: (DD) 91234-5678 or (DD) 1234-5678
  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    // limit to 11 digits (DD + 9 digits)
    digits = digits.slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    // more than 6 digits: insert hyphen before last 4 digits
    const first = digits.slice(0,2);
    const middle = digits.slice(2, digits.length - 4);
    const last = digits.slice(-4);
    return `(${first}) ${middle}-${last}`;
  };
  const [isIntern, setIsIntern] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [specQuery, setSpecQuery] = useState('');
  const [localSubjects, setLocalSubjects] = useState<string[]>((availableSubjects ?? []).map((s: any) => s?.name ?? String(s)));
  const specInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalSubjects((availableSubjects ?? []).map((s: any) => s?.name ?? String(s)));
  }, [availableSubjects]);

  useEffect(() => {
    if (editingTeacher) {
      setName(editingTeacher.name);
      setEmail(editingTeacher.email);
      setPhone(editingTeacher.phone || '');
      setIsIntern((editingTeacher as any)?.isIntern ?? (editingTeacher as any)?.is_intern ?? false);
      setSpecializations(
        Array.isArray((editingTeacher as any)?.subjects)
          ? (editingTeacher as any).subjects.map((s: any) => (typeof s === 'string' ? s : (s?.name ?? s?.title ?? String(s))))
          : ((editingTeacher as any)?.subjects ?? [])
      );
    }
  }, [editingTeacher]);

  useEffect(() => {
    if (dropdownOpen) {
      // focus the manual-add input when dropdown opens
      setTimeout(() => specInputRef.current?.focus(), 0);
    }
  }, [dropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validate required fields
    if (!name || !email) {
      alert('Por favor, preencha o nome e email do professor');
      return;
    }

    // require phone and validate format
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length !== 11) {
      setPhoneError('Telefone obrigatório com 11 dígitos. Ex: (21) 91234-5678');
      return;
    }

    try {
      await onSubmit({
        id: editingTeacher?.id || '',
        name,
        email,
        phone,
        is_intern: isIntern,
        subjects: specializations,
      });

      if (!editingTeacher) {
        setName('');
        setEmail('');
        setPhone('');
        setIsIntern(false);
        setSpecializations([]);
        setSpecInput('');
      }
      alert(editingTeacher ? 'Professor atualizado com sucesso!' : 'Professor cadastrado com sucesso!');
    } catch {
      return;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className={`space-y-4 p-4 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)} className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input placeholder="exemplo@dominio.com" value={email} onChange={e => setEmail(e.target.value)} className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input placeholder="(11) 91234-5678" value={phone} onChange={e => {
            const formatted = formatPhone(e.target.value);
            setPhone(formatted);
            if (phoneError) {
              const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
              if (phoneRegex.test(formatted.trim())) setPhoneError(null);
            }
          }} className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`} />
           {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Especializações</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {specializations.map((s, idx) => (
              <div key={idx} className={`flex items-center gap-2 px-2 py-1 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <span className="text-sm">{s}</span>
                <button type="button" onClick={() => setSpecializations(prev => prev.filter(x => x !== s))} className="text-red-600 hover:text-red-800">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={specQuery}
                onChange={(e) => { setSpecQuery(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                placeholder={localSubjects && localSubjects.length > 0 ? 'Pesquisar matérias...' : 'Adicionar matéria...'}
                className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <button type="button" onClick={() => setDropdownOpen(open => !open)} className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}>Opções</button>
            </div>

            {dropdownOpen && createPortal(
              <>
                <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-60 bg-black/30"></div>
                <div className={`fixed z-70 left-1/2 transform -translate-x-1/2 top-24 w-[min(90%,640px)] rounded-md shadow-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <input ref={specInputRef} type="text" value={specInput} onChange={(e) => setSpecInput(e.target.value)} placeholder="Adicionar matéria manualmente" className={`flex-1 px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                        <button type="button" onClick={async () => {
                          const val = specInput.trim();
                          if (!val) return;
                          if (!localSubjects.includes(val)) {
                            try {
                              const created = await createSubject({ name: val });
                              const n = created?.name ?? val;
                              if (!localSubjects.includes(n)) setLocalSubjects(prev => [...prev, n]);
                              if (!specializations.includes(n)) setSpecializations(prev => [...prev, n]);
                              setSpecInput(''); setSpecQuery('');
                              if (refreshSubjects) await refreshSubjects();
                              return;
                            } catch (err) {
                              if (!localSubjects.includes(val)) setLocalSubjects(prev => [...prev, val]);
                              if (!specializations.includes(val)) setSpecializations(prev => [...prev, val]);
                              setSpecInput(''); setSpecQuery('');
                              return;
                            }
                          }
                          if (!specializations.includes(val)) setSpecializations(prev => [...prev, val]);
                          setSpecInput(''); setSpecQuery('');
                        }} className="px-3 py-1 bg-green-500 text-white rounded">Adicionar</button>
                      </div>
                    </div>
                    {(availableSubjects ?? []).filter((s: any) => (s?.name ?? String(s)).toLowerCase().includes(specQuery.toLowerCase())).map((sub: any, idx: number) => {
                      const name = sub?.name ?? String(sub);
                      return (
                        <div key={idx} className={`flex items-center justify-between gap-2 w-full px-2 py-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={specializations.includes(name)} onChange={() => {
                              if (specializations.includes(name)) setSpecializations(prev => prev.filter(x => x !== name));
                              else setSpecializations(prev => [...prev, name]);
                            }} className="h-4 w-4" />
                            <span className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{name}</span>
                          </label>
                          {sub?.id && (
                            <button type="button" onClick={async () => {
                              if (!confirm(`Deseja excluir a matéria "${name}"? Esta ação é permanente. ☠️`)) return;
                              try {
                                await deleteSubject(sub.id);
                                setLocalSubjects(prev => prev.filter(x => x !== name));
                                setSpecializations(prev => prev.filter(x => x !== name));
                                if (refreshSubjects) await refreshSubjects();
                              } catch (err) {
                                console.error('Failed to delete subject', err);
                                alert('Erro ao excluir matéria');
                              }
                            }} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>, document.body
            )}
          </div>

          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Selecione matérias, adicione manualmente ou delete</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isIntern"
            type="checkbox"
            checked={isIntern}
            onChange={(e) => setIsIntern(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="isIntern" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estagiário</label>
        </div>

        <div className="flex gap-4">
          {editingTeacher && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium text-lg"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg"
          >
            {editingTeacher ? 'Salvar Alterações' : 'Cadastrar Professor'}
          </button>
        </div>
      </form>
    </div>
  );
}
