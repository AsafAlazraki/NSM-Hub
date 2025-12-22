
import React from 'react';

export default function PrintBmtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout should only return the children, as the root layout handles the <html> and <body> tags.
  // The fonts are already loaded in the root layout.
  return (
    <div className="bg-gray-100 antialiased h-full">
        {children}
    </div>
  );
}
