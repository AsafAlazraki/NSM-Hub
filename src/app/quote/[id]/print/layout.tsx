
import React from 'react';

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-100 antialiased">
        {children}
    </div>
  );
}
