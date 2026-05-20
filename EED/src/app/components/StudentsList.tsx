import { useState, useEffect } from 'react';
import { Student } from '../App.tsx';
import { Trash2, GraduationCap, Edit, Eye } from 'lucide-react';
import { StudentDetails } from './StudentDetails.tsx';

interface StudentsListProps {
  students: Student[];
  onRemove: (id: string) => void;
  onEdit: (student: Student) => void;
  darkMode: boolean;
}

export function StudentsList({ students, onRemove, onEdit, darkMode }: StudentsListProps) {
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [query, setQuery] = useState('');
  const [rawQuery, setRawQuery] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(rawQuery);
      setCurrentPage(0);
    }, 250);
    return () => clearTimeout(id);
  }, [rawQuery]);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const filtered = students.filter(s => {
    const name = (s.name || '').toString();
    const email = (s.email || '').toString();
    const grade = (s.grade || '').toString();
    const q = query.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || grade.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStudents = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Lista de Alunos</h2>
        <div className="mb-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por nome, email ou série..."
            value={rawQuery}
            onChange={(e) => {
              setRawQuery(e.target.value);
            }}
            className={`px-4 py-2 rounded-lg border w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
          {rawQuery && (
            <button onClick={() => { setRawQuery(''); setQuery(''); setCurrentPage(0); }} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Limpar</button>
          )}
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{filtered.length} de {students.length} alunos</div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">{query ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado ainda'}</p>
        </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedStudents.map(student => (
                  <div
              key={student.id}
              className={`border-2 rounded-lg p-6 hover:shadow-lg transition-shadow ${
                darkMode
                  ? 'bg-gradient-to-br from-green-900/30 to-gray-800 border-green-600'
                  : 'bg-gradient-to-br from-green-50 to-white border-green-200'
              }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-green-600 text-white rounded-full p-3">
                    <GraduationCap size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{student.name}</h3>
                    <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    onClick={() => setViewingStudent(student)}
                    className="text-green-500 hover:text-green-700 transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => onEdit(student)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Editar aluno"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja remover ${student.name}?`)) {
                        onRemove(student.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remover aluno"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

                  <div className="space-y-2">
                <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-medium">Email:</span>
                  <span>{student.email}</span>
                </div>

                {student.phone && (
                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-medium">Telefone:</span>
                    <span>{student.phone}</span>
                  </div>
                )}

                {student.birth_date && (
                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-medium">Nascimento:</span>
                    <span>{student.birth_date}</span>
                  </div>
                )}

                {student.age && (
                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-medium">Idade:</span>
                    <span>{student.age} anos</span>
                  </div>
                )}
                  </div>
                </div>
          ))}
            </div>
        
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Anterior
              </button>
              <div className={`gsc-cursor-current-page ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                Página {currentPage + 1} de {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages - 1
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`mt-8 p-4 rounded-lg border ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <strong>Total de alunos:</strong> {students.length}
        </p>
      </div>

      {viewingStudent && (
        <StudentDetails
          student={viewingStudent}
          onClose={() => se