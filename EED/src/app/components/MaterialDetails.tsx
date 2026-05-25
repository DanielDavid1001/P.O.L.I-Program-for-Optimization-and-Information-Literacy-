import { Material } from '../App.tsx';
import { X, BookMarked, Calendar, FileText, Download, BadgeCheck } from 'lucide-react';
import formatDateBR from '../../lib/formatDate';
import { DetailPager, DetailCardItem } from './DetailPager.tsx';

interface MaterialDetailsProps {
  material: Material;
  onClose: () => void;
  onDownload: (material: Material) => void;
  darkMode: boolean;
}

export function MaterialDetails({ material, onClose, onDownload, darkMode }: MaterialDetailsProps) {
  const detailItems: DetailCardItem[] = [
    {
      key: 'material-name',
      title: 'Nome do arquivo',
      content: <p className="text-lg font-bold break-all">{material.fileName}</p>,
    },
    {
      key: 'material-subject',
      title: 'Matéria',
      icon: <BookMarked size={20} className="text-purple-600" />,
      content: <p className="text-lg font-bold">{material.subjectName || '—'}</p>,
    },
    {
      key: 'material-grade',
      title: 'Série',
      icon: <BadgeCheck size={20} className="text-green-600" />,
      content: <p className="text-lg font-bold">{material.grade || '—'}</p>,
    },
    {
      key: 'material-adapted',
      title: 'É material adaptado',
      content: <p className="text-lg font-bold">{material.isAdapted ? 'Sim' : 'Não'}</p>,
    },
    {
      key: 'material-upload',
      title: 'Data de upload',
      icon: <Calendar size={20} className="text-blue-600" />,
      content: <p className="text-lg font-bold">{material.uploadDate ? formatDateBR(material.uploadDate) : '—'}</p>,
      fullWidth: true,
    },
    {
      key: 'material-download',
      title: 'Download',
      icon: <Download size={20} className="text-red-600" />,
      content: (
        <button
          type="button"
          onClick={() => onDownload(material)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Baixar PDF
        </button>
      ),
      fullWidth: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between p-6 border-b-2 border-purple-500">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Detalhes do Material
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-purple-500' : 'bg-purple-50 border-purple-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-600 text-white p-3 rounded-full">
                <BookMarked size={32} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {material.subjectName || 'Matéria'}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {material.grade || 'Sem série definida'}
                </p>
              </div>
            </div>
          </div>

          <DetailPager items={detailItems} darkMode={darkMode} pageSize={5} />
        </div>

        <div className="p-6 border-t border-gray-300">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
