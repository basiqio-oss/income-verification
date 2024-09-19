import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  content: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded mb-4 overflow-hidden">
      <button
        className={`w-full px-4 py-2 text-left font-semibold transition-colors
          ${isOpen ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}
          hover:bg-gray-300 dark:hover:bg-gray-700`}
        onClick={toggle}
      >
        <span className="flex items-center">
          <span className="flex-grow">{title}</span>
          <span className="ml-2 text-lg font-bold">{isOpen ? '−' : '+'}</span>
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          {content}
        </div>
      )}
    </div>
  );
};

export default Accordion;
