import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  title: string;
  description: string;
  guidance?: string;
}

export function Tooltip({ title, description, guidance }: TooltipProps) {
  return (
    <div className="group relative flex items-center">
      <div className="font-medium text-[#2C5265]">{title}</div>
      <HelpCircle className="w-4 h-4 ml-2 text-[#7984A5]" />
      <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-72 p-3 bg-white rounded-lg shadow-lg text-sm z-10 pointer-events-none">
        <div className="font-medium text-[#2C5265] mb-2">{title}</div>
        <p className="text-[#2C5265] mb-2">{description}</p>
        {guidance && (
          <p className="text-[#7984A5] text-xs">What to look for: {guidance}</p>
        )}
      </div>
    </div>
  );
}