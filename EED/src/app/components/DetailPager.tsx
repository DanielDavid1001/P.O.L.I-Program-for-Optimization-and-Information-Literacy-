import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DetailCardItem {
  key: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  fullWidth?: boolean;
}

interface DetailPagerProps {
  items: DetailCardItem[];
  darkMode: boolean;
  pageSize?: number;
}

export function DetailPager({ items, darkMode, pageSize = 5 }: DetailPagerProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentItems = items.slice(page * pageSize, (page + 1) * pageSize);

  const goPrev = () => setPage((current) => Math.max(0, current - 1));
  const goNext = () => setPage((current) => Math.min(totalPages - 1, current + 1));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentItems.map((item) => (
          <div
            key={item.key}
            className={`p-4 rounded-lg border ${item.fullWidth ? 'md:col-span-2' : ''} ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.title}</span>
            </div>
            <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.content}</div>
          </div>
        ))}
      </div>

      {items.length > pageSize && (
        <div className="flex items-center justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={page === 0}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={page === totalPages - 1}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Próxima
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
