import React from 'react';

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onNextPage: () => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, hasNextPage, onNextPage }) => {
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="px-4 py-2"
      >
        Next
      </button>
      <span>Page {currentPage}</span>
    </div>
  );
};

export default Pagination;
