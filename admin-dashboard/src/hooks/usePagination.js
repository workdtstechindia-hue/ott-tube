import { useMemo, useState } from "react";

const usePagination = (
  data = [],
  itemsPerPage = 8
) => {
  const [currentPage, setCurrentPage] =
    useState(1);

  const totalPages = useMemo(
    () =>
      Math.ceil(data.length / itemsPerPage),
    [data.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    resetPage,
    setCurrentPage,
  };
};

export default usePagination;
