
"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { saveStaticLogo } from '@/lib/storage';

export const LogoUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB size limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a logo smaller than 1MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
            await saveStaticLogo(dataUrl);
            toast({
                title: "Logo Uploaded",
                description: "Your new logo will be used across the application.",
            });
            // Force a reload of the page to show the new logo on print views etc.
            window.location.reload();
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "Could not save the logo to the database.",
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/svg+xml"
      />
      <Button variant="outline" onClick={handleUploadClick}>
        <Upload />
        Upload App Logo
      </Button>
    </>
  );
};
