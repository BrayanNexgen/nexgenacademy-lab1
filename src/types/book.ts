export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  price: number;
  category: string;
}

export type BookFormData = Omit<Book, 'id'>;
