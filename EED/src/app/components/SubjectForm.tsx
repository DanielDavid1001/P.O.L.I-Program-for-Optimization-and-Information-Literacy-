import { useState } from 'react';

interface SubjectFormProps {
  onSubmit: (subject: { id: string; name: string; code: string; teacherId: string }) => void;
  darkMode: boolean;
}

export function SubjectForm({ onSubmit, darkMode }: SubjectFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Por favor, preencha nome e código da matéria');
      return;
    }

    onSubmit({ id: '', name, code, teacherId });
    setName('');
    setCode('');
    setTeacherId('');
    alert('Matéria cadastrada com sucesso!');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Cadastrar Nova Matéria
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Nome da Matéria
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="Ex: Matemática, Português..."
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Código
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="Ex: MAT-5A, POR-5B..."
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            ID do Professor (opcional)
          </label>
          <input
            type="text"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="ID do professor responsável"
          />
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
