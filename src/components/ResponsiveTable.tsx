import React from 'react';

interface ResponsiveTableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  minWidth?: string;
  maxHeight?: string;
}

export const ResponsiveTable = ({ 
  headers, 
  children, 
  minWidth = 'min-w-full',
  maxHeight = 'max-h-[calc(100vh-280px)]'
}: ResponsiveTableProps) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-100 bg-white ${maxHeight}`}>
      <table className={`w-full text-left border-collapse ${minWidth}`}>
        <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
          <tr className="text-gray-500 text-sm border-b border-gray-100">
            {headers.map((header, i) => (
              <th key={i} className="p-3 sm:p-4 font-medium whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tr className={`hover:bg-gray-50 transition-colors ${className}`}>
    {children}
  </tr>
);

export const TableCell = ({ children, className = '', colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) => (
  <td colSpan={colSpan} className={`p-3 sm:p-4 text-sm whitespace-nowrap ${className}`}>
    {children}
  </td>
);
