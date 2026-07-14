import { useState, useCallback, useEffect } from 'react';
import type { Book, BookFormData } from '../types/book';
import { bookStorageService } from '../services/bookStorageService';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    bookStorageService.initializeSampleData();
    setBooks(bookStorageService.getAll());
  }, []);

  const addBook = useCallback((bookData: BookFormData) => {
    const newBook = bookStorageService.add(bookData);
    setBooks((prevBooks) => [...prevBooks, newBook]);
    return newBook;
  }, []);

  const updateBook = useCallback((id: string, bookData: BookFormData) => {
    const updatedBook = bookStorageService.update(id, bookData);
    if (updatedBook) {
      setBooks((prevBooks) =>
        prevBooks.map((book) => (book.id === id ? updatedBook : book))
      );
    }
    return updatedBook;
  }, []);

  const deleteBook = useCallback((id: string) => {
    const success = bookStorageService.delete(id);
    if (success) {
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
    }
    return success;
  }, []);

  return {
    books,
    addBook,
    updateBook,
    deleteBook,
  };
};
