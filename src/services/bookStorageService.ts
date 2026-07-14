import type { Book, BookFormData } from '../types/book';

const STORAGE_KEY = 'books_library';

export const bookStorageService = {
  getAll(): Book[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  add(bookData: BookFormData): Book {
    const books = this.getAll();
    const newBook: Book = {
      ...bookData,
      id: Date.now().toString(),
    };
    books.push(newBook);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return newBook;
  },

  update(id: string, bookData: BookFormData): Book | null {
    const books = this.getAll();
    const index = books.findIndex((book) => book.id === id);

    if (index === -1) return null;

    const updatedBook: Book = { ...bookData, id };
    books[index] = updatedBook;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return updatedBook;
  },

  delete(id: string): boolean {
    const books = this.getAll();
    const filteredBooks = books.filter((book) => book.id !== id);

    if (filteredBooks.length === books.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredBooks));
    return true;
  },

  initializeSampleData(): void {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const sampleBooks: Book[] = [
      {
        id: '1',
        title: 'El Quijote',
        author: 'Miguel de Cervantes',
        isbn: '978-0-06-093546-7',
        quantity: 5,
        price: 29.99,
        category: 'Ficción',
      },
      {
        id: '2',
        title: 'Cien años de soledad',
        author: 'Gabriel García Márquez',
        isbn: '978-0-06-088328-7',
        quantity: 3,
        price: 24.99,
        category: 'Ficción',
      },
      {
        id: '3',
        title: 'El Código Da Vinci',
        author: 'Dan Brown',
        isbn: '978-0-385-33312-0',
        quantity: 8,
        price: 19.99,
        category: 'Misterio',
      },
      {
        id: '4',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        isbn: '978-0-06-231609-7',
        quantity: 12,
        price: 34.99,
        category: 'No Ficción',
      },
      {
        id: '5',
        title: 'El Principito',
        author: 'Antoine de Saint-Exupéry',
        isbn: '978-0-06-085254-8',
        quantity: 15,
        price: 14.99,
        category: 'Infantil',
      },
      {
        id: '6',
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-452-26059-5',
        quantity: 7,
        price: 18.99,
        category: 'Ficción Distópica',
      },
      {
        id: '7',
        title: 'El Alquimista',
        author: 'Paulo Coelho',
        isbn: '978-0-06-085494-8',
        quantity: 10,
        price: 16.99,
        category: 'Ficción',
      },
      {
        id: '8',
        title: 'Harry Potter y la Piedra Filosofal',
        author: 'J.K. Rowling',
        isbn: '978-0-439-13959-0',
        quantity: 20,
        price: 22.99,
        category: 'Fantasía',
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBooks));
  },
};
