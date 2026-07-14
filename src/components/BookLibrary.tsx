import { useState, useMemo } from 'react';
import type { Book, BookFormData } from '../types/book';
import { useBooks } from '../hooks/useBooks';
import { usePagination } from '../hooks/usePagination';
import { FilterBar } from './FilterBar';
import { BookList } from './BookList';
import { BookFormModal } from './BookFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Pagination } from './Pagination';

export const BookLibrary = () => {
  const { books, addBook, updateBook, deleteBook } = useBooks();
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const pagination = usePagination(filteredBooks, 20);

  const currentPageBooks = useMemo(
    () => pagination.currentItems,
    [pagination.currentItems]
  );

  const handleAddBook = (data: BookFormData) => {
    addBook(data);
    setIsFormModalOpen(false);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsFormModalOpen(true);
  };

  const handleUpdateBook = (data: BookFormData) => {
    if (editingBook) {
      updateBook(editingBook.id, data);
      setEditingBook(null);
    }
  };

  const handleDeleteBook = (book: Book) => {
    setBookToDelete(book);
  };

  const handleConfirmDelete = () => {
    if (bookToDelete) {
      deleteBook(bookToDelete.id);
      setBookToDelete(null);

      if (currentPageBooks.length === 1 && pagination.currentPage > 1) {
        pagination.prevPage();
      }
    }
  };

  const handleFormSubmit = (data: BookFormData) => {
    if (editingBook) {
      handleUpdateBook(data);
    } else {
      handleAddBook(data);
    }
  };

  const handleFormClose = () => {
    setIsFormModalOpen(false);
    setEditingBook(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Biblioteca de Libros
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Total de libros: {books.length}
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <FilterBar books={books} onFilterChange={setFilteredBooks} />
          </div>
          <button
            onClick={() => {
              setEditingBook(null);
              setIsFormModalOpen(true);
            }}
            className="ml-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition whitespace-nowrap h-fit"
          >
            + Agregar libro
          </button>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No se encontraron libros
            </p>
          </div>
        ) : (
          <>
            <BookList
              books={currentPageBooks}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
            />

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
              />
            )}
          </>
        )}
      </div>

      <BookFormModal
        isOpen={isFormModalOpen}
        book={editingBook || undefined}
        existingBooks={books}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
      />

      <DeleteConfirmModal
        isOpen={bookToDelete !== null}
        book={bookToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  );
};
