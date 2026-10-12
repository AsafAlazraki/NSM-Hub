import React from 'react';
import { cn } from '@/lib/utils';

// Default company logo, served from /public so it also shows on public pages
// (e.g. the customer booking form) that cannot read the Firestore-stored logo.
// Exported as a markup string because the print pages inject it directly.
export const defaultLogoHtml = `<img src="/nsm-logo.png" alt="Northside Marine" style="width:100%;height:auto;object-fit:contain;" />`;

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: string | null;
}

export const Logo = ({ className, logo, ...props }: LogoProps) => {
  // If the logo is a data URI (starts with 'data:'), render it in an img tag for better compatibility.
  if (logo && logo.startsWith('data:')) {
    return (
      <div className={cn("w-full", className)} {...props}>
        <img src={logo} alt="Company Logo" className="w-full h-auto object-contain" />
      </div>
    );
  }

  // Raw SVG markup stored in settings.
  if (logo) {
    return (
      <div className={cn("w-full", className)} dangerouslySetInnerHTML={{ __html: logo }} {...props} />
    );
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <img src="/nsm-logo.png" alt="Northside Marine" className="w-full h-auto object-contain" />
    </div>
  );
};
