import { useState, useEffect } from 'react';
import { Student, Material } from '../App.tsx';

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
  // format phone while typing: (DD) 91234-5678 or (DD) 1234-5678
  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    // limit to 11 digits
    digits = digits.slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    const first = digits.slice(0,2);
    const middle = digits.slice(2, digits.length - 4);
    const last = digits.slice(-4);
    return `(${first}) ${middle}-${last}`;
  };
  const [birthDate, setBirthDate] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name || '');
      setIsPcd(editingStudent.isPcd ?? false);
      setPcdNotes(editingStudent.pcdNotes || '');
      setEmail(editingStudent.email || '');
      setPhone(editingStudent.phone || '');
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

    // phone must be exactly 11 digits
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length !== 11) {
      setPhoneError('Telefone obrigatório com 11 dígitos. Ex: (11) 91234-5678');
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
    <div className="max-w-2xl mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Nome do Aluno
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Nome completo"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input id="pcd-checkbox" type="checkbox" checked={isPcd} onChange={(e) => setIsPcd(e.target.checked)} className="h-4 w-4" />
            <label htmlFor="pcd-checkbox" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Aluno PCD</label>
          </div>


        </div>

        {isPcd && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Observações / Necessidades do Aluno (visíveis no perfil)
            </label>
            <textarea
              value={pcdNotes}
              onChange={(e) => setPcdNotes(e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Descreva as necessidades, adaptações e observações..."
            />
          </div>
        )}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Email do aluno/responsável"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setPhone(formatted);
                if (phoneError) {
                  const digits = formatted.replace(/\D/g, '');
                  if (digits.length === 11) setPhoneError(null);
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Telefone do aluno/responsável"
            />
            {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Data de Nascimento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Série
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Selecione a série</option>
              {GRADES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`rounded-lg border px-4 py-3 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          Idade calculada automaticamente pela data de nascimento.
          {birthDate ? ` Idade atual: ${Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} anos.` : ''}
        </div>

        <div className="flex gap-4">
          {editingStudent && onCancel && (
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
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
          >
            {editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}
          </button>
        </div>
      </form>
    </div>
  );
}
