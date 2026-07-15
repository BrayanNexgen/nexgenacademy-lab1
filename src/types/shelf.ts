export interface Shelf {
  id: string;
  codigo: string;
  nombre: string;
  capacidad_maxima: number;
  total_libros: number;
  ultima_actualizacion: Date;
}

export interface ShelfUIProps {
  shelf: Shelf;
  booksInShelf: any[];
  onAddBook: (shelfId: string) => void;
  onRemoveBook: (shelfId: string, bookId: string) => void;
}
