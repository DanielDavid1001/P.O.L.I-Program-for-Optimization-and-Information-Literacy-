import { useState } from 'react';
import { Student } from '../App.tsx';
import { X, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import { DetailPager, DetailCardItem } from './DetailPager.tsx';

interface StudentDetailsProps {
  student: Student;
  onClose: () => void;
  darkMode: boolean;
}

export function StudentDetails({ student, onClose, darkMode }: StudentDetailsProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [subjectsQuery, setSubjectsQuery] = useState('');

  const detailItems: DetailCardItem[] = [
    {
      key: 'student-name',
      title: 'Nome do aluno',
      content: <p className="text-lg font-bold">{student.name}</p>,
    },
    {
      key: 'student-id',
      title: 'ID',
      icon: <GraduationCap size={20} className="text-green-600" />,
      content: <p className="text-sm break-all">{student.id}</p>,
    },
    {
      key: 'student-grade',
      title: 'Série',
      icon: <GraduationCap size={20} className="text-green-600" />,
      content: <p className="text-lg font-bold">{student.grade || '—'}</p>,
    },
    {
      key: 'student-age',
      title: 'Idade',
      icon: <Calendar size={20} className="text-blue-600" />,
      content: <p className="text-lg font-bold">{student.age ? `${student.age} anos` : '—'}</p>,
    },
    {
      key: 'student-pcd',
      title: 'Aluno PCD',
      content: <p className="text-lg font-bold">{student.isPcd ? 'Sim' : 'Não'}</p>,
    },
    // 'Matérias Cursadas' removed per request
    {
      key: 'student-notes',
      title: 'Observações / Necessidades',
      content: (
        <div>
          <button onClick={() => setShowNotes(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Ver Observações</button>
        </div>
      ),
      fullWidth: true,
    },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between p-6 border-b-2 border-green-600">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Detalhes do Aluno
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-green-600' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 text-white p-3 rounded-full">
                <GraduationCap size={32} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {student.name}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ID: {student.id}
                </p>
              </div>
            </div>
          </div>

          <DetailPager items={detailItems} darkMode={darkMode} pageSize={detailItems.length} />

          {showNotes && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
              <div className={`max-w-md w-full rounded-lg shadow-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Observações do Aluno</h3>
                  <button onClick={() => setShowNotes(false)} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fechar</button>
                </div>
                <div className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {student.pcdNotes ? student.pcdNotes : 'Sem observações cadastradas.'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-300">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
