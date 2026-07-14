import type { Book } from '../types/book';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export const BookCard = ({ book, onEdit, onDelete }: BookCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between h-full border border-gray-200 dark:border-gray-700">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Por <span className="font-medium">{book.author}</span>
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
              ISBN
            </p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {book.isbn}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                Stock
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {book.quantity}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                Precio
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                ${book.price.toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <span className="inline-block px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-full">
              {book.category}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onEdit(book)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(book)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};
