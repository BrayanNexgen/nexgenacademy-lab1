import type { Book, BookFormData } from '../types/book';

export interface ValidationError {
  [key: string]: string;
}

export const validateBook = (
  data: BookFormData,
  existingBooks: Book[],
  editingId?: string
): ValidationError => {
  const errors: ValidationError = {};

  if (!data.title.trim()) {
    errors.title = 'El título es requerido';
  }

  if (!data.author.trim()) {
    errors.author = 'El autor es requerido';
  }

  if (!data.isbn.trim()) {
    errors.isbn = 'El ISBN es requerido';
  } else {
    const isbnExists = existingBooks.some(
      (book) => book.isbn === data.isbn && book.id !== editingId
    );
    if (isbnExists) {
      errors.isbn = 'Este ISBN ya existe';
    }
  }

  if (!data.category.trim()) {
    errors.category = 'La categoría es requerida';
  }

  if (data.quantity < 0) {
    errors.quantity = 'La cantidad no puede ser negativa';
  }

  if (!Number.isInteger(data.quantity)) {
    errors.quantity = 'La cantidad debe ser un número entero';
  }

  if (data.price < 0) {
    errors.price = 'El precio no puede ser negativo';
  }

  return errors;
};
