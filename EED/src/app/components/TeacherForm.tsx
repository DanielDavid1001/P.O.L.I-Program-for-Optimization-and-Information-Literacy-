import { useState, useEffect, useRef } from 'react';
import { Teacher } from '../App.tsx';
import formatPhoneBR from '../../lib/formatPhone';
import { createSubject, deleteSubject } from '../../lib/api';
import { Trash2, User, Mail, Phone, BookOpen, ChevronDown, Award } from 'lucide-react';

interface TeacherFormProps {
  onSubmit: (teacher: Teacher) => Promise<void> | void;
  darkMode: boolean;
  editingTeacher?: Teacher | null;
  onCancel?: () => void;
  availableSubjects?: { id: any; name: string }[];
  refreshSubjects?: () => Promise<void>;
}

const FALLBACK_TEACHER_SPECIALTIES = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Inglês',
  'Artes',
  'Educação Física',
  'Tecnologia',
  'Apoio Pedagógico',
];

export function TeacherForm({ onSubmit, darkMode, editingTeacher, onCancel, availableSubjects, refreshSubjects }: TeacherFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isIntern, setIsIntern] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [specQuery, setSpecQuery] = useState('');
  const [localSubjects, setLocalSubjects] = useState<string[]>((availableSubjects ?? []).map((s: any) => s?.name ?? String(s)));
  const specInputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const subjectOptions = Array.from(new Set([
    ...localSubjects,
    ...FALLBACK_TEACHER_SPECIALTIES,
  ]));

  useEffect(() => {
    setLocalSubjects((availableSubjects ?? []).map((s: any) => s?.name ?? String(s)));
  }, [availableSubjects]);

  useEffect(() => {
    if (editingTeacher) {
      setName(editingTeacher.name);
      setEmail(editingTeacher.email);
      setPhone(formatPhoneBR(editingTeacher.phone || ''));
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

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutside = (ev: MouseEvent | KeyboardEvent) => {
      if (ev instanceof KeyboardEvent && ev.key === 'Escape') {
        setDropdownOpen(false);
        return;
      }
      const target = ev.target as Node | null;
      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleOutside as any);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleOutside as any);
    };
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
    if (!digits || (digits.length !== 10 && digits.length !== 11)) {
      setPhoneError('Telefone obrigatório com 10 dígitos. Ex: (21) 1234-5678');
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
    <div className="mx-auto w-full max-w-4xl px-4 py-2 sm:px-0">
      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className={`mb-8 text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {editingTeacher ? 'Editar Professor' : 'Cadastrar Novo Professor'}
        </h2>

        <section className={`rounded-2xl border p-6 shadow-sm ${darkMode ? 'border-orange-800 bg-slate-900' : 'border-orange-200 bg-orange-50/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-orange-700 text-white' : 'bg-orange-600 text-white'}`}>
              <User size={20} />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Informações Pessoais</h3>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Digite o nome completo do professor"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-orange-500 ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Mail size={16} /> Email <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="professor@escola.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-orange-500 ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`}
                />
              </div>

              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Phone size={16} /> Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="(11) 1234-5678"
                  value={phone}
                  onChange={e => {
                    const formatted = formatPhoneBR(e.target.value);
                    setPhone(formatted);
                    if (phoneError) {
                      const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
                      if (phoneRegex.test(formatted.trim())) setPhoneError(null);
                    }
                  }}
                  className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-orange-500 ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`}
                />
                {phoneError && <p className="mt-1 text-sm text-red-500">{phoneError}</p>}
              </div>
            </div>
          </div>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm ${darkMode ? 'border-blue-800 bg-slate-900' : 'border-blue-200 bg-blue-50/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
              <Award size={20} />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Informações Profissionais</h3>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Especialização <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={wrapperRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((open) => !open)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-3 text-left text-lg outline-none transition focus:border-blue-500 ${darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                >
                  <span>{specializations.length ? `${specializations.length} especialidade(s) selecionada(s)` : 'Selecione a especialização'}</span>
                  <ChevronDown size={18} className={`${dropdownOpen ? 'rotate-180' : ''} transition-transform`} />
                </button>

                {dropdownOpen && (
                  <div className={`absolute left-0 top-full mt-2 w-full max-w-[720px] rounded-2xl border shadow-2xl ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="max-h-72 overflow-y-auto p-4 custom-scrollbar">
                      <div className="mb-4 flex gap-2">
                        <input
                          ref={specInputRef}
                          type="text"
                          value={specInput}
                          onChange={(e) => setSpecInput(e.target.value)}
                          placeholder="Adicionar matéria manualmente"
                          className={`flex-1 rounded-xl border px-4 py-3 ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const val = specInput.trim();
                            if (!val) return;
                            if (!localSubjects.includes(val)) {
                              try {
                                const created = await createSubject({ name: val });
                                const n = created?.name ?? val;
                                if (!localSubjects.includes(n)) setLocalSubjects(prev => [...prev, n]);
                                if (!specializations.includes(n)) setSpecializations(prev => [...prev, n]);
                                setSpecInput('');
                                setSpecQuery('');
                                if (refreshSubjects) await refreshSubjects();
                                return;
                              } catch (err) {
                                if (!localSubjects.includes(val)) setLocalSubjects(prev => [...prev, val]);
                                if (!specializations.includes(val)) setSpecializations(prev => [...prev, val]);
                                setSpecInput('');
                                setSpecQuery('');
                                return;
                              }
                            }
                            if (!specializations.includes(val)) setSpecializations(prev => [...prev, val]);
                            setSpecInput('');
                            setSpecQuery('');
                          }}
                          className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                          Adicionar
                        </button>
                      </div>

                      <input
                        type="text"
                        value={specQuery}
                        onChange={(e) => { setSpecQuery(e.target.value); setDropdownOpen(true); }}
                        onFocus={() => setDropdownOpen(true)}
                        placeholder={localSubjects && localSubjects.length > 0 ? 'Pesquisar matérias...' : 'Adicionar matéria...'}
                        className={`mb-4 w-full rounded-xl border px-4 py-3 ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`}
                      />

                      <div className="space-y-2">
                        {subjectOptions.filter((subjectName) => subjectName.toLowerCase().includes(specQuery.toLowerCase())).map((subjectName, idx: number) => {
                          const sub = (availableSubjects ?? []).find((item: any) => String(item?.name ?? '').toLowerCase() === subjectName.toLowerCase()) ?? null;
                          return (
                            <div key={idx} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                              <label className="flex flex-1 items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={specializations.includes(subjectName)}
                                  onChange={() => {
                                    if (specializations.includes(subjectName)) setSpecializations(prev => prev.filter(x => x !== subjectName));
                                    else setSpecializations(prev => [...prev, subjectName]);
                                  }}
                                  className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                                />
                                <span className={`${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{subjectName}</span>
                              </label>
                              {sub?.id && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const ok = typeof (window as any).eedConfirm === 'function'
                                      ? await (window as any).eedConfirm(`Deseja excluir a matéria "${subjectName}"? Esta ação é permanente.`)
                                      : confirm(`Deseja excluir a matéria "${subjectName}"? Esta ação é permanente.`);
                                    if (!ok) return;
                                    try {
                                      await deleteSubject(sub.id);
                                      setLocalSubjects(prev => prev.filter(x => x !== subjectName));
                                      setSpecializations(prev => prev.filter(x => x !== subjectName));
                                      if (refreshSubjects) await refreshSubjects();
                                    } catch (err) {
                                      console.error('Failed to delete subject', err);
                                      alert('Erro ao excluir matéria');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Selecione matérias, adicione manualmente ou remova as que não forem necessárias.</p>
            </div>

            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-blue-50/60'}`}>
              <input
                id="isIntern"
                type="checkbox"
                checked={isIntern}
                onChange={(e) => setIsIntern(e.target.checked)}
                className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Estagiário</span>
            </label>
          </div>
        </section>

        <div className="flex gap-4">
          {editingTeacher && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-slate-500 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-slate-600"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-orange-500 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-orange-600"
          >
            {editingTeacher ? 'Salvar Alterações' : 'Cadastrar Professor'}
          </button>
        </div>
      </form>
    </div>
  );
}
