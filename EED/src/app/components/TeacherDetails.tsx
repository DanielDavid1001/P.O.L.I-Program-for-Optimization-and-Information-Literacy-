import { Teacher } from '../App.tsx';
import { X, Users, BookOpen, Mail, Award } from 'lucide-react';
import { DetailPager, DetailCardItem } from './DetailPager.tsx';
import formatPhoneBR from '../../lib/formatPhone';

interface TeacherDetailsProps {
  teacher: Teacher;
  onClose: () => void;
  darkMode: boolean;
}

export function TeacherDetails({ teacher, onClose, darkMode }: TeacherDetailsProps) {
  const detailItems: DetailCardItem[] = [
    {
      key: 'teacher-name',
      title: 'Nome do professor',
      content: <p className="text-lg font-bold">{teacher.name}</p>,
    },
    {
      key: 'teacher-id',
      title: 'ID',
      icon: <Users size={20} className="text-orange-500" />,
      content: <p className="text-sm break-all">{teacher.id}</p>,
    },
    {
      key: 'teacher-subjects',
      title: 'Áreas',
      icon: <BookOpen size={20} className="text-purple-600" />,
      content: (
        <p className="text-lg">
          {Array.isArray((teacher as any).subjects) ? (teacher as any).subjects.join(', ') : ((teacher as any).subjects || '—')}
        </p>
      ),
      fullWidth: true,
    },
    {
      key: 'teacher-type',
      title: 'Tipo',
      icon: <Award size={20} className="text-blue-600" />,
      content: <p className="text-lg font-bold">{((teacher as any).isIntern ?? (teacher as any).is_intern) ? 'Professor Estagiário' : 'Professor'}</p>,
    },
    {
      key: 'teacher-email',
      title: 'E-mail de contato',
      icon: <Mail size={20} className="text-green-600" />,
      content: (
        <a href={`mailto:${teacher.email}`} className="text-blue-600 hover:text-blue-700 underline break-all">
          {teacher.email}
        </a>
      ),
      fullWidth: true,
    },
    {
      key: 'teacher-phone',
      title: 'Telefone',
      content: <p className="text-lg">{formatPhoneBR((teacher as any).phone || '') || '—'}</p>,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between p-6 border-b-2 border-orange-500">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Detalhes do Professor
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
          <div className={`p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-orange-500' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-500 text-white p-3 rounded-full">
                <Users size={32} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {teacher.name}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ID: {teacher.id}
                </p>
              </div>
            </div>
          </div>

          <DetailPager items={detailItems} darkMode={darkMode} pageSize={5} />
        </div>

        <div className="p-6 border-t border-gray-300">
          <button
            onClick={onClose}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
