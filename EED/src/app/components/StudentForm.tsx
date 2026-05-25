import { useState, useEffect } from 'react';
import { Student, Material } from '../App.tsx';
import formatPhoneBR from '../../lib/formatPhone';
import { User, Mail, Phone, Calendar, BookOpen, ClipboardList } from 'lucide-react';

interface StudentFormProps {
  onSubmit: (student: Student) => Promise<void> | void;
  materials: Material[];
  darkMode: boolean;
  editingStudent?: Student | null;
  onCancel?: () => void;
}

const GRADES = ['Pré-Escola','1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano','1º Médio', '2º Médio', '3º Médio'];

export function StudentForm({ onSubmit, materials, darkMode, editingStudent, onCancel }: StudentFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isPcd, setIsPcd] = useState(false);
  const [pcdNotes, setPcdNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name || '');
      setIsPcd(editingStudent.isPcd ?? false);
      setPcdNotes(editingStudent.pcdNotes || '');
      setEmail(editingStudent.email || '');
      setPhone(formatPhoneBR(editingStudent.phone || ''));
      setBirthDate(editingStudent.birth_date || '');
      setGrade(editingStudent.grade || '');
      setSelectedSubjects(editingStudent.subjects || []);
    }
  }, [editingStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Por favor, preencha o email do aluno');
      return;
    }

    // phone must be 10 or 11 digits
    const digits = phone.replace(/\D/g, '');
    if (!digits || (digits.length !== 10 && digits.length !== 11)) {
      setPhoneError('Telefone obrigatório com 10 dígitos. Ex: (11) 1234-5678');
      return;
    }

    if (isPcd && (!pcdNotes || pcdNotes.trim() === '')) {
      alert('Por favor, preencha as observações/necessidades do aluno PCD');
      return;
    }

    try {
      const computedAge = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : undefined;
      const generatedName = editingStudent?.name || name || `Aluno ${email.split('@')[0] || 'sem-nome'}`;
      await onSubmit({
        id: editingStudent?.id || '',
        name: generatedName,
        isPcd,
        pcdNotes: pcdNotes || undefined,
        email,
        phone,
        birth_date: birthDate,
        grade,
        age: computedAge,
        subjects: selectedSubjects,
      });

      if (!editingStudent) {
        setName('');
        setIsPcd(false);
        setPcdNotes('');
        setEmail('');
        setPhone('');
        setBirthDate('');
        setGrade('');
        setSelectedSubjects([]);
      }
      alert(editingStudent ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
    } catch {
      return;
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-2 sm:px-0">
      <h2 className={`mb-8 text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className={`rounded-2xl border p-6 shadow-sm ${darkMode ? 'border-emerald-800 bg-slate-900' : 'border-emerald-200 bg-emerald-50/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white'}`}>
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
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-emerald-500 ${
                  darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="Digite o nome completo do aluno"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Mail size={16} /> Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-emerald-500 ${
                    darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="aluno@escola.com"
                />
              </div>

              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Phone size={16} /> Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhoneBR(e.target.value);
                    setPhone(formatted);
                    if (phoneError) {
                      const digits = formatted.replace(/\D/g, '');
                      if (digits.length >= 10 && digits.length <= 11) setPhoneError(null);
                    }
                  }}
                  className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-emerald-500 ${
                    darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="(11) 1234-5678"
                />
                {phoneError && <p className="mt-1 text-sm text-red-500">{phoneError}</p>}
              </div>

              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Calendar size={16} /> Data de Nascimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-emerald-500 ${
                    darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <BookOpen size={16} /> Série <span className="text-red-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={`w-full rounded-2xl border px-5 py-3 text-lg outline-none transition focus:border-emerald-500 ${
                    darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="">Selecione a série</option>
                  {GRADES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-emerald-100 bg-white/80 text-slate-700'}`}>
              <strong>Idade:</strong> é calculada automaticamente pela data de nascimento.
              {birthDate ? ` Atual: ${Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} anos.` : ''}
            </div>
          </div>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm ${darkMode ? 'border-emerald-800 bg-slate-900' : 'border-emerald-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white'}`}>
              <ClipboardList size={20} />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Condições e Observações</h3>
          </div>

          <div className="mt-6 space-y-4">
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-emerald-50/60'}`}>
              <input id="pcd-checkbox" type="checkbox" checked={isPcd} onChange={(e) => setIsPcd(e.target.checked)} className="h-4 w-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500" />
              <span className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Aluno PCD</span>
            </label>

            {isPcd && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Observações / Necessidades do Aluno <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={pcdNotes}
                  onChange={(e) => setPcdNotes(e.target.value)}
                  rows={4}
                  className={`w-full rounded-2xl border px-5 py-4 outline-none transition focus:border-emerald-500 ${
                    darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="Descreva as necessidades, adaptações e observações..."
                />
              </div>
            )}
          </div>
        </section>

        <div className="flex gap-4">
          {editingStudent && onCancel && (
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
            className="flex-1 rounded-2xl bg-emerald-600 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            {editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}
          </button>
        </div>
      </form>
    </div>
  );
}
