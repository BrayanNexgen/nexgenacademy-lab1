import { Shelf } from '../types/shelf';

const SHELVES_KEY = 'library_shelves';
const SHELF_BOOK_MAPPING_KEY = 'shelf_book_mapping';

export const shelfStorageService = {
  // Obtener todas las estanterías
  getAllShelves: (): Shelf[] => {
    const stored = localStorage.getItem(SHELVES_KEY);
    return stored ? JSON.parse(stored) : getDefaultShelves();
  },

  // Crear estantería
  createShelf: (codigo: string, nombre: string): Shelf => {
    const shelves = shelfStorageService.getAllShelves();
    const newShelf: Shelf = {
      id: `shelf-${Date.now()}`,
      codigo,
      nombre,
      capacidad_maxima: 50,
      total_libros: 0,
      ultima_actualizacion: new Date(),
    };
    shelves.push(newShelf);
    localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves));
    return newShelf;
  },

  // Asignar libro a estantería
  assignBookToShelf: (bookId: string, shelfId: string): boolean => {
    const shelves = shelfStorageService.getAllShelves();
    const shelf = shelves.find(s => s.id === shelfId);

    if (!shelf) return false;
    if (shelf.total_libros >= shelf.capacidad_maxima) return false; // Violaría INV-002

    const mapping = JSON.parse(localStorage.getItem(SHELF_BOOK_MAPPING_KEY) || '{}');
    mapping[bookId] = shelfId;
    localStorage.setItem(SHELF_BOOK_MAPPING_KEY, JSON.stringify(mapping));

    shelf.total_libros++;
    shelf.ultima_actualizacion = new Date();
    localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves));

    return true;
  },

  // Retirar libro de estantería
  removeBookFromShelf: (bookId: string): boolean => {
    const mapping = JSON.parse(localStorage.getItem(SHELF_BOOK_MAPPING_KEY) || '{}');
    const shelfId = mapping[bookId];

    if (!shelfId) return false;

    const shelves = shelfStorageService.getAllShelves();
    const shelf = shelves.find(s => s.id === shelfId);

    if (shelf && shelf.total_libros > 0) {
      shelf.total_libros--;
      shelf.ultima_actualizacion = new Date();
    }

    delete mapping[bookId];
    localStorage.setItem(SHELF_BOOK_MAPPING_KEY, JSON.stringify(mapping));
    localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves));

    return true;
  },

  // Obtener estantería de un libro
  getShelfForBook: (bookId: string): string | null => {
    const mapping = JSON.parse(localStorage.getItem(SHELF_BOOK_MAPPING_KEY) || '{}');
    return mapping[bookId] || null;
  },

  // Obtener libros sin asignar
  getUnassignedBooks: (allBooks: any[]): any[] => {
    const mapping = JSON.parse(localStorage.getItem(SHELF_BOOK_MAPPING_KEY) || '{}');
    return allBooks.filter(book => !mapping[book.id]);
  },
};

function getDefaultShelves(): Shelf[] {
  return [
    {
      id: 'shelf-1',
      codigo: 'A-1',
      nombre: 'Ficción',
      capacidad_maxima: 50,
      total_libros: 0,
      ultima_actualizacion: new Date(),
    },
    {
      id: 'shelf-2',
      codigo: 'A-2',
      nombre: 'Referencia',
      capacidad_maxima: 50,
      total_libros: 0,
      ultima_actualizacion: new Date(),
    },
    {
      id: 'shelf-3',
      codigo: 'B-1',
      nombre: 'Infantil',
      capacidad_maxima: 50,
      total_libros: 0,
      ultima_actualizacion: new Date(),
    },
  ];
}
