import { useState, useMemo } from 'react';

export const usePagination = <T,>(items: T[], itemsPerPage: number = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      currentItems,
      totalItems: items.length,
      startIndex,
      endIndex,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () =>
    goToPage(Math.ceil(items.length / itemsPerPage));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    ...paginationData,
    goToPage,
    goToFirstPage,
    goToLastPage,
    nextPage,
    prevPage,
  };
};
