import React, { useState, useEffect } from 'react';
import { shelfStorageService } from '../services/shelfStorageService';
import { Shelf } from '../types/shelf';
import './ShelvesPanel.css';

interface ShelfsPanelProps {
  allBooks: any[];
  onBookAssigned?: (bookId: string, shelfId: string) => void;
  onBookRemoved?: (bookId: string) => void;
}

export const ShelvesPanel: React.FC<ShelfsPanelProps> = ({
  allBooks,
  onBookAssigned,
  onBookRemoved,
}) => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [unassignedBooks, setUnassignedBooks] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShelfCode, setNewShelfCode] = useState('');
  const [newShelfName, setNewShelfName] = useState('');

  useEffect(() => {
    loadShelves();
  }, [allBooks]);

  const loadShelves = () => {
    const allShelves = shelfStorageService.getAllShelves();
    setShelves(allShelves);
    setUnassignedBooks(shelfStorageService.getUnassignedBooks(allBooks));
  };

  const handleCreateShelf = () => {
    if (newShelfCode && newShelfName) {
      shelfStorageService.createShelf(newShelfCode, newShelfName);
      setNewShelfCode('');
      setNewShelfName('');
      setShowCreateModal(false);
      loadShelves();
    }
  };

  const handleAssignBook = (bookId: string, shelfId: string) => {
    const success = shelfStorageService.assignBookToShelf(bookId, shelfId);
    if (success) {
      onBookAssigned?.(bookId, shelfId);
      loadShelves();
    }
  };

  const handleRemoveBook = (bookId: string) => {
    shelfStorageService.removeBookFromShelf(bookId);
    onBookRemoved?.(bookId);
    loadShelves();
  };

  return (
    <div className="shelves-panel">
      <header className="shelves-header">
        <h1>📚 Administración de Estanterías</h1>
        <p className="subtitle">Gestiona la ubicación de libros en estanterías</p>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Crear Estantería
        </button>
      </header>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{shelves.length}</div>
          <div className="stat-label">Estanterías Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {shelves.reduce((sum, s) => sum + s.total_libros, 0)}
          </div>
          <div className="stat-label">Libros Asignados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{unassignedBooks.length}</div>
          <div className="stat-label">Sin Asignar</div>
        </div>
      </div>

      {/* Estanterías Grid */}
      <div className="shelves-grid">
        {shelves.map((shelf) => {
          const booksInShelf = allBooks.filter(
            (book) => shelfStorageService.getShelfForBook(book.id) === shelf.id
          );
          const percentage = (shelf.total_libros / shelf.capacidad_maxima) * 100;

          return (
            <div
              key={shelf.id}
              className="shelf-card"
              data-verify="shelf-card"
              data-shelf-code={shelf.codigo}
              data-shelf-name={shelf.nombre}
              data-total-active={shelf.total_libros}
              data-total-books={shelf.total_libros}
              data-capacity={shelf.capacidad_maxima}
            >
              <div className="shelf-header">
                <div>
                  <div className="shelf-code">{shelf.codigo}</div>
                  <div className="shelf-name">{shelf.nombre}</div>
                </div>
                <div className="shelf-actions">
                  <button className="btn btn-small">✎</button>
                </div>
              </div>

              <div className="shelf-info">
                <div className="info-row">
                  <span className="info-label">Libros:</span>
                  <span className="info-value">
                    {shelf.total_libros} / {shelf.capacidad_maxima}
                  </span>
                </div>
                <div className="capacity-bar">
                  <div
                    className={`capacity-fill ${
                      percentage >= 90
                        ? 'danger'
                        : percentage >= 70
                        ? 'warning'
                        : ''
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="shelf-books">
                <div className="shelf-books-title">Libros</div>
                {booksInShelf.length > 0 ? (
                  <div className="books-list">
                    {booksInShelf.slice(0, 3).map((book) => (
                      <div key={book.id} className="book-item">
                        <span className="book-title">{book.titulo}</span>
                        <button
                          className="book-remove"
                          onClick={() => handleRemoveBook(book.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {booksInShelf.length > 3 && (
                      <div className="book-item" style={{ marginTop: '5px' }}>
                        <span className="book-count">
                          Ver todos ({booksInShelf.length})
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">📭 Sin libros</div>
                )}
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '15px' }}
                onClick={() => {
                  if (unassignedBooks.length > 0 && shelf.total_libros < shelf.capacidad_maxima) {
                    handleAssignBook(unassignedBooks[0].id, shelf.id);
                  }
                }}
                disabled={unassignedBooks.length === 0 || shelf.total_libros >= shelf.capacidad_maxima}
              >
                + Agregar Libro
              </button>
            </div>
          );
        })}
      </div>

      {/* Libros sin asignar */}
      {unassignedBooks.length > 0 && (
        <section className="unassigned-section">
          <h2>📬 Libros Sin Asignar ({unassignedBooks.length})</h2>
          <div className="unassigned-list">
            {unassignedBooks.map((book) => (
              <div key={book.id} className="unassigned-item">
                <div>
                  <div className="book-title">{book.titulo}</div>
                  <div className="book-author">{book.autor || 'Autor desconocido'}</div>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignBook(book.id, e.target.value);
                    }
                  }}
                  className="shelf-select"
                >
                  <option value="">Asignar a estantería...</option>
                  {shelves
                    .filter((s) => s.total_libros < s.capacidad_maxima)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.codigo} - {s.nombre} ({s.total_libros}/{s.capacidad_maxima})
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal crear estantería */}
      {showCreateModal && (
        <div className="modal active">
          <div className="modal-content">
            <h2>Crear Nueva Estantería</h2>
            <div className="form-group">
              <label>Código (ej: A-1)</label>
              <input
                type="text"
                value={newShelfCode}
                onChange={(e) => setNewShelfCode(e.target.value)}
                placeholder="A-1"
              />
            </div>
            <div className="form-group">
              <label>Nombre (ej: Ficción)</label>
              <input
                type="text"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="Ficción"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleCreateShelf}>
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
