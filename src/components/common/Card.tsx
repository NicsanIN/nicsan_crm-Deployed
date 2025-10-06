import React from 'react';
import { BadgeInfo } from 'lucide-react';

interface CardProps {
  title: string;
  desc?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({ title, desc, children, actions }: CardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="font-semibold text-zinc-900">{title}</div>
        {desc && (
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <BadgeInfo className="w-4 h-4"/>
            {desc}
          </div>
        )}
        <div className="ml-auto">{actions}</div>
      </div>
      {children}
    </div>
  );
}

export default Card;
