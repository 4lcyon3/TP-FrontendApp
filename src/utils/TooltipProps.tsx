import { useState } from "react";
import { CircleQuestionMark } from 'lucide-react';
interface TooltipProps {
  text: string;
}

export default function Tooltip({ text }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
        <CircleQuestionMark size={15}/>
      </span>

      {visible && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-2 
                     w-56 p-3 text-sm text-gray-800 bg-white 
                     border border-gray-300 rounded-md shadow-lg 
                     animate-slideDown z-50"
        >
          {text}

          {/* Flecha */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 
                          w-0 h-0 border-l-8 border-l-transparent 
                          border-r-8 border-r-transparent 
                          border-b-8 border-b-gray-300"></div>
        </div>
      )}
    </div>
  );
}