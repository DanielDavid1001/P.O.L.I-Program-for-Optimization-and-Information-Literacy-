import { useState } from 'react';
import { BookOpen, Edit, Eye, Trash2 } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
}

interface SubjectsListProps {
  subjects: Subject[];
  onRemove: (id: string) => void;
  darkMode: boolean;
}

export function SubjectsList({ subjects, onRemove, darkMode }: SubjectsListProps) {
  const [query, setQuery] = useState('');

  const filtered = subjects.filter((subject) => {
    const name = (subject.name || '').toString();
    const code = (subject.code || '').toString();
    const q = query.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Lista de Matérias
      </h2>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar matéria"
          className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma matéria encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((subject) => (
            <div
              key={subject.id}
              className={`border-2 rounded-lg p-6 ${darkMode ? 'bg-gray-800 border-purple-600' : 'bg-white border-purple-200'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {subject.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Código: {subject.code}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(subject.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Remover matéria"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Edit size={16} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Professor: {subject.teacherId || 'Não definido'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
