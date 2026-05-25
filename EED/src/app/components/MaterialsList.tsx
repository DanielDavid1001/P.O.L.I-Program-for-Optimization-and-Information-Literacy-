import { useState } from 'react';
import { Material } from '../App.tsx';
import { Trash2, BookMarked, Download, Calendar, FileText, Eye } from 'lucide-react';
import { MaterialDetails } from './MaterialDetails.tsx';
import formatDateBR from '../../lib/formatDate';

interface MaterialsListProps {
  materials: Material[];
  onRemove: (id: string) => void;
  darkMode: boolean;
  // role of current user: 'admin' | 'teacher' | 'student'
  role?: 'admin' | 'teacher' | 'student' | null;
}

export function MaterialsList({ materials, onRemove, darkMode, role = null }: MaterialsListProps) {
  const [query, setQuery] = useState('');
  const [adaptedOnly, setAdaptedOnly] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [localPermissionMessage, setLocalPermissionMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const materialsByGrade: { [key: string]: Material[] } = {};

  const filtered = materials.filter(m => {
    if (adaptedOnly && !m.isAdapted) return false;
    const subjectName = (m.subjectName || '').toString();
    const fileName = (m.fileName || '').toString();
    const grade = (m.grade || '').toString();
    const q = query.toLowerCase();
    if (query && !subjectName.toLowerCase().includes(q) && !fileName.toLowerCase().includes(q) && !grade.toLowerCase().includes(q)) return false;
    return true;
  });

  filtered.forEach(material => {
    if (!materialsByGrade[material.grade]) {
      materialsByGrade[material.grade] = [];
    }
    materialsByGrade[material.grade].push(material);
  });

  const sortedGrades = Object.keys(materialsByGrade).sort();

  const totalPages = Math.ceil(sortedGrades.length / ITEMS_PER_PAGE);
  const paginatedGrades = sortedGrades.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const getGradeColor = (index: number) => {
    const colors = [
      'from-orange-500 to-orange-600',
      'from-green-600 to-green-700',
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-amber-500 to-amber-600',
    ];
    return colors[index % colors.length];
  };

  const handleDownload = async (material: Material) => {
    try {
      // Prefer inline base64/fileData, otherwise try fileUrl, otherwise fetch details from API
      if (material.fileData) {
        const link = document.createElement('a');
        link.href = material.fileData;
        link.download = material.fileName;
        link.click();
        return;
      }

      // if a direct file URL exists, open it in a new tab to let browser handle download
      const fileUrl = (material as any).fileUrl || (material as any).file_url || (material.fileData ?? '');
      if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
        window.open(fileUrl, '_blank');
        return;
      }

      // fallback: fetch material detail from API to get file_url or fileData
      const res = await fetch(`/api/materials/${material.id}`);
      if (!res.ok) throw new Error('Não foi possível obter o arquivo');
      const data = await res.json();
      const downloadSrc = data.fileData ?? data.file_data ?? data.file_url ?? null;
      if (!downloadSrc) throw new Error('Arquivo não encontrado no servidor');
      if (downloadSrc.startsWith('http')) {
        window.open(downloadSrc, '_blank');
        return;
      }

      const link = document.createElement('a');
      link.href = downloadSrc;
      link.download = material.fileName ?? 'material.pdf';
      link.click();
    } catch (err: any) {
      setLocalPermissionMessage(err?.message ?? 'Erro ao baixar o arquivo');
    }
  };

  const groupBySubject = (materials: Material[]) => {
    const grouped: { [key: string]: Material[] } = {};
    materials.forEach(material => {
      if (!grouped[material.subjectName]) {
        grouped[material.subjectName] = [];
      }
      grouped[material.subjectName].push(material);
    });
    return grouped;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por matéria, série ou nome de arquivo..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentPage(0);
          }}
          className={`px-3 py-2 rounded-lg border w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={adaptedOnly} onChange={(e) => setAdaptedOnly(e.target.checked)} className="h-4 w-4" />
          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>Apenas adaptados</span>
        </label>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Materias por Série</h2>
        <div className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
          Total: {materials.length} materiais
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookMarked size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">{query ? 'Nenhuma material encontrada' : 'Nenhuma material cadastrado ainda'}</p>
          {!query && <p className="text-gray-400 text-sm mt-2">Cadastre materiais PDF para organizar o conteúdo escolar</p>}
        </div>
      ) : (
        <div>
          <div className="space-y-8">
            {paginatedGrades.map((grade, gradeIndex) => {
            const subjectGroups = groupBySubject(materialsByGrade[grade]);
            return (
              <div key={grade} className={`border-2 rounded-lg p-6 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`flex items-center gap-3 mb-6 pb-4 border-b-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className={`bg-gradient-to-r ${getGradeColor(gradeIndex)} text-white px-6 py-2 rounded-lg font-bold text-lg`}>
                    {grade}
                  </div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {materialsByGrade[grade].length} {materialsByGrade[grade].length === 1 ? 'material' : 'materiais'}
                  </span>
                </div>

                <div className="space-y-6">
                  {Object.entries(subjectGroups).map(([subjectName, subjectMaterials]) => (
                    <div key={subjectName}>
                      <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <BookMarked size={20} className="text-purple-600" />
                        {subjectName}
                        <span className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ({subjectMaterials.length} {subjectMaterials.length === 1 ? 'arquivo' : 'arquivos'})
                        </span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectMaterials.map(material => (
                          <div
                            key={material.id}
                            className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all ${
                              darkMode
                                ? 'bg-gray-800 border-purple-500 hover:border-purple-400'
                                : 'bg-white border-purple-200 hover:border-purple-400'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="bg-red-500 text-white rounded-lg p-2">
                                  <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {material.fileName}
                                  </h4>
                                </div>
                              </div>
                              <button
                                onClick={() => setViewingMaterial(material)}
                                className="text-green-500 hover:text-green-700 transition-colors"
                                title="Ver detalhes"
                              >
                                <Eye size={18} />
                              </button>
                              {(role === 'admin' || role === 'teacher') && (
                                <button
                                  onClick={async () => {
                                    // Admins perform delete via confirmation dialog
                                    if (role === 'admin') {
                                      const confirmed = typeof (window as any).eedConfirm === 'function'
                                        ? await (window as any).eedConfirm(`Deseja remover "${material.fileName}"?`)
                                        : window.confirm(`Deseja remover "${material.fileName}"?`);
                                      if (confirmed) onRemove(material.id);
                                      return;
                                    }

                                    // For teachers, show a permission-style popup
                                    const msg = 'Você não tem permissão para excluir materiais.';
                                    if (typeof (window as any).eedPermission === 'function') {
                                      (window as any).eedPermission(msg);
                                    } else if (typeof window !== 'undefined') {
                                      setLocalPermissionMessage(msg);
                                    } else {
                                      alert(msg);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title={role === 'admin' ? 'Remover material' : 'Você não tem permissão'}
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                                {material.isAdapted && (
                                  <div className={`inline-block px-2 py-1 text-xs font-medium rounded ${darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                    Adaptado
                                  </div>
                                )}
                              <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Calendar size={14} />
                                <span>Upload: {formatDateBR(material.uploadDate)}</span>
                              </div>

                              <button
                                onClick={() => handleDownload(material)}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <Download size={16} />
                                Baixar PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Total de Séries:</strong> {sortedGrades.length}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Total de Materiais:</strong> {materials.length}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Matérias Únicas:</strong> {new Set(materials.map(m => m.subjectName)).size}
          </p>
        </div>
      </div>

      {localPermissionMessage && (
        <div className="fixed top-20 right-6 z-60 max-w-sm">
          <div className="rounded-lg border p-4 bg-yellow-50 text-yellow-900 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm">{localPermissionMessage}</div>
              <button onClick={() => setLocalPermissionMessage(null)} className="text-yellow-800 font-semibold">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {viewingMaterial && (
        <MaterialDetails
          material={viewingMaterial}
          onClose={() => setViewingMaterial(null)}
          onDownload={handleDownload}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
