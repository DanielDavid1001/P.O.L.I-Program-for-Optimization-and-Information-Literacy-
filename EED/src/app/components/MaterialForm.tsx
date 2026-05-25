import { useState } from 'react';
import { Material } from '../App.tsx';
import { Upload, FileText, Calendar } from 'lucide-react';

interface MaterialFormProps {
  onSubmit: (material: any) => Promise<void> | void;
  darkMode: boolean;
  availableSubjects?: { id: any; name: string }[];
  currentRole?: string | null;
}

const BASE_GRADES = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Médio', '2º Médio', '3º Médio'];

const FALLBACK_SUBJECTS = [
  'Português',
  'Matemática',
  'Física',
  'Química',
  'Biologia',
  'História',
  'Geografia',
  'Artes',
  'Educação Física',
  'Inglês',
  'Filosofia',
  'Ciências'
];

export function MaterialForm({ onSubmit, darkMode, availableSubjects, currentRole }: MaterialFormProps) {
  const [subjectName, setSubjectName] = useState('');
  const [grade, setGrade] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdapted, setIsAdapted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF');
        e.target.value = '';
        return;
      }
      setFileName(file.name);
      setFileObj(file);
    } else {
      setFileName('');
      setFileObj(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !grade || !fileName || !uploadDate || !fileObj) {
      alert('Por favor, preencha todos os campos e selecione um arquivo PDF');
      return;
    }

    try {
      const form = new FormData();
      form.append('subjectName', subjectName);
      form.append('grade', grade);
      form.append('is_adapted', isAdapted ? '1' : '0');
      form.append('uploadDate', uploadDate);
      form.append('type', 'pdf');
      form.append('description', `Arquivo ${fileName}`);
      form.append('fileName', fileName);
      if (fileObj) form.append('file', fileObj);

      await onSubmit(form);

      setSubjectName('');
      setGrade('');
      setIsAdapted(false);
      setFileName('');
      setFileObj(null);
      setUploadDate(new Date().toISOString().split('T')[0]);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert('Materia cadastrada com sucesso!');
    } catch {
      return;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Cadastrar Nova Matéria (PDF)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Série <span className="text-red-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Selecione a série</option>
              {(() => {
                const normalized = (currentRole ?? '').toString().toLowerCase();
                const includePreEscolar = normalized === 'admin' || normalized === 'administrator' || normalized === 'administrador' || normalized === 'teacher' || normalized === 'professor' || normalized === 'prof';
                const grades = includePreEscolar ? ['Pré-Escolar', ...BASE_GRADES] : BASE_GRADES;
                return grades.map((g) => <option key={g} value={g}>{g}</option>);
              })()}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Matéria <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Selecione a matéria</option>
              {(() => {
                const availNames = (availableSubjects && availableSubjects.length) ? availableSubjects.map((s:any) => String(s.name)) : [];
                const combined = [...FALLBACK_SUBJECTS, ...availNames];
                const seen = new Set<string>();
                return combined.filter(n => {
                  const key = String(n).toLowerCase();
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                }).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ));
              })()}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input id="adapted-checkbox" type="checkbox" checked={isAdapted} onChange={(e) => setIsAdapted(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="adapted-checkbox" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Material adaptado para PCD</label>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Data de Importação <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={uploadDate}
              onChange={(e) => setUploadDate(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Arquivo PDF <span className="text-red-500">*</span>
          </label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
            darkMode ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-gray-50'
          }`}>
            <Upload className={`mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={48} />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-purple-600 hover:text-purple-700 font-medium">
                Clique para selecionar
              </span>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}> ou arraste o arquivo PDF aqui</span>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName && (
              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 justify-center ${
                darkMode ? 'bg-purple-900/30' : 'bg-purple-50'
              }`}>
                <FileText className="text-purple-600" size={20} />
                <span className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                  {fileName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Dica:</strong> Organize seus materiais didáticos em PDF por série e matéria para facilitar o acesso dos alunos.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
        >
          Cadastrar Matéria
        </button>
      </form>
    </div>
  );
}
