import type { Book } from '../types/book';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  book: Book | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  book,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Eliminar libro
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-semibold">"{book.title}"</span>? Esta acción no
            se puede deshacer.
          </p>

          <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Autor:</span> {book.author}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">ISBN:</span> {book.isbn}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
