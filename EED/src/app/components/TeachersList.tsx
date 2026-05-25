import { useState, useEffect } from 'react';
import { Teacher } from '../App.tsx';
import { Trash2, Users, Mail, BookOpen, Edit, Eye } from 'lucide-react';
import { TeacherDetails } from './TeacherDetails.tsx';
import formatPhoneBR from '../../lib/formatPhone';

interface TeachersListProps {
  teachers: Teacher[];
  onRemove: (id: string) => void;
  onEdit: (teacher: Teacher) => void;
  darkMode: boolean;
  role?: 'admin' | 'teacher' | 'student' | null;
}

export function TeachersList({ teachers, onRemove, onEdit, darkMode, role = null }: TeachersListProps) {
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [query, setQuery] = useState('');
  const [rawQuery, setRawQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const filtered = teachers.filter(t => {
    const name = (t.name || '').toString();
    const email = (t.email || '').toString();
    const subjectsStr = Array.isArray((t as any).subjects) ? (t as any).subjects.join(' ') : ((t as any).subjects || '').toString();
    const q = query.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || subjectsStr.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedTeachers = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(rawQuery);
      setCurrentPage(0);
    }, 250);
    return () => clearTimeout(id);
  }, [rawQuery]);

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Lista de Professores</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome, email ou especialização..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            className={`px-4 py-2 rounded-lg border w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
          {rawQuery && (
            <button
              onClick={() => { setRawQuery(''); setQuery(''); setCurrentPage(0); }}
              className="absolute right-2 top-2 text-sm text-gray-500 hover:text-gray-700"
              type="button"
            >
              Limpar
            </button>
          )}
        </div>
        <div className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {filtered.length} de {teachers.length} professores
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">{query ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado ainda'}</p>
        </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTeachers.map(teacher => (
                  <div
              key={teacher.id}
              className={`rounded-lg p-6 hover:shadow-lg transition-shadow border-2 ${
                darkMode
                  ? 'bg-gradient-to-br from-orange-900/30 to-gray-800 border-orange-600'
                  : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'
              }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-orange-500 text-white rounded-full p-3">
                    <Users size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{teacher.name}</h3>
                    <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{teacher.email}</p>
                    {Array.isArray((teacher as any).subjects) && (teacher as any).subjects.length > 0 && (
                      <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {((teacher as any).subjects || []).slice(0,3).join(', ')}{((teacher as any).subjects || []).length > 3 ? '...' : ''}
                      </p>
                    )}
                    {((teacher as any).isIntern ?? (teacher as any).is_intern) && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Estagiário
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start">
                  <button
                    onClick={() => setViewingTeacher(teacher)}
                    className="text-green-500 hover:text-green-700 transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => onEdit(teacher)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Editar professor"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={async () => {
                      if (role === 'admin') {
                        const confirm = typeof (window as any).eedConfirm === 'function'
                          ? await (window as any).eedConfirm(`Deseja remover ${teacher.name}?`)
                          : window.confirm(`Deseja remover ${teacher.name}?`);
                        if (confirm) onRemove(teacher.id);
                        return;
                      }

                      const msg = 'Você não tem permissão para excluir professores.';
                      if (typeof (window as any).eedPermission === 'function') {
                        (window as any).eedPermission(msg);
                      } else {
                        alert(msg);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remover professor"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

                  <div className="space-y-2">
                {teacher.email && (
                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Mail size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                    <span>{teacher.email}</span>
                  </div>
                )}

                {teacher.phone && (
                  <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-medium">Telefone:</span>
                    <span>{formatPhoneBR(teacher.phone)}</span>
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

      <div className={`mt-8 p-4 rounded-lg border ${darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <strong>Total de professores:</strong> {teachers.length}
        </p>
      </div>

      {viewingTeacher && (
        <TeacherDetails
          teacher={viewingTeacher}
          onClose={() => setViewingTeacher(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
