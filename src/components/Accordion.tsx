import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  content: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="border rounded mb-2">
      <button
        className="w-full px-4 py-2 text-left font-semibold bg-gray-200 hover:bg-gray-300"
        onClick={toggle}
      >
        {title}
      </button>
      {isOpen && (
        <div className="p-4">
          {content}
        </div>
      )}
    </div>
  );
};

export default Accordion;
