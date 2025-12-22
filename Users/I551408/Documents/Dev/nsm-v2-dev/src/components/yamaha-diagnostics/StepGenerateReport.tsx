
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useReportForm } from './ReportFormProvider';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, CheckCircle, XCircle, ArrowLeft, Save, Trash2, Ship, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SourceFile, EngineDetails } from '@/lib/types';
import { extractTextFromPdfs } from '@/lib/pdf';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { analyzeDiagnosticReport } from '@/ai/flows/analyze-diagnostic-report';

const SectionDisplay = ({ title, content }: { title: string, content: string }) => {
    // Check for "Engine operating hours"
    if (title.toLowerCase().includes('engine operating hours')) {
        const hourLines = content.match(/(\d+\s*-\s*\d+\s*r\/min)\s+([\d.]+h)/g);
        if (hourLines) {
            const hourData = hourLines.map(line => {
                const parts = line.match(/(\d+\s*-\s*\d+\s*r\/min)\s+([\d.]+h)/);
                return {
                    rpmRange: parts ? parts[1].trim() : 'N/A',
                    hours: parts ? parts[2].trim() : 'N/A'
                };
            });
            return (
                <div className="p-4 border rounded-lg bg-background/50">
                    <h5 className="font-semibold">{title}</h5>
                    <Table className="mt-2">
                        <TableHeader>
                            <TableRow>
                                <TableHead>RPM Range</TableHead>
                                <TableHead>Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hourData.map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row.rpmRange}</TableCell>
                                    <TableCell>{row.hours}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )
        }
    }
    
    // Check for "Diagnosis code"
    if (title.toLowerCase().includes('diagnosis code')) {
        const diagnosisLines = content.trim().split('\n').filter(line => /^\d+\s/.test(line));
        if (diagnosisLines.length > 0) {
            const diagnosisData = diagnosisLines.map(line => {
                const parts = line.trim().split(/\s{2,}/); // Split on 2 or more spaces
                return {
                    code: parts[0] || 'N/A',
                    description: parts[1] || 'N/A',
                    occurrences: parts[2] || 'N/A',
                }
            });
             return (
                <div className="p-4 border rounded-lg bg-background/50">
                    <h5 className="font-semibold">{title}</h5>
                    <Table className="mt-2">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Occurrences</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {diagnosisData.map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row.code}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.occurrences}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )
        }
    }


    // Default display for other sections
    return (
        <div className="p-4 border rounded-lg bg-background/50">
            <h5 className="font-semibold">{title}</h5>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{content.trim()}</p>
        </div>
    )
}


const ReportDisplay = ({ engines }: { engines: EngineDetails[] }) => {
  if (!engines || engines.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">Engine data could not be parsed. Upload a valid diagnostic report.</p>
      </div>
    );
  }

  const sectionRegex = /(^\d+\.\s.*$)/gm;

  return (
    <div className="space-y-6">
        {engines.map((engine) => {
            const content = engine.rawContent || '';
            
            const firstSectionMatch = content.match(sectionRegex);
            if (!firstSectionMatch) {
                return (
                    <Card key={engine.id} className="bg-background/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Ship /> {engine.model || 'Engine Details'}</CardTitle>
                            <CardDescription>S/N: {engine.serial || 'N/A'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <SectionDisplay title="Raw Data" content={content} />
                        </CardContent>
                    </Card>
                )
            }
            
            const firstSectionStartIndex = content.indexOf(firstSectionMatch[0]);

            const headerContent = content.substring(0, firstSectionStartIndex).trim();
            const sectionsContent = content.substring(firstSectionStartIndex);
            
            const sections = sectionsContent.split(sectionRegex).filter(s => s.trim() !== '');
            
            const numberedSections: { title: string, content: string }[] = [];
            
            for (let i = 0; i < sections.length; i += 2) {
                if (sections[i] && sections[i+1]) {
                    numberedSections.push({
                        title: sections[i].trim(),
                        content: sections[i+1].trim(),
                    });
                } else if (sections[i]) {
                     numberedSections.push({
                        title: sections[i].trim(),
                        content: "",
                    });
                }
            }
            
            return (
                 <Card key={engine.id} className="bg-background/50">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Ship /> {engine.model || 'Engine Details'}</CardTitle>
                        <CardDescription>S/N: {engine.serial || 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {headerContent && <SectionDisplay title="Header Information" content={headerContent} />}
                        {numberedSections.map(section => (
                            <SectionDisplay key={section.title} title={section.title} content={section.content} />
                        ))}
                    </CardContent>
                </Card>
            );
        })}
    </div>
  );
};


// Define the FileStatus type
type Status = 'uploading' | 'success' | 'error';
interface FileStatus {
  name: string;
  status: Status;
  errorMessage?: string;
}

export default function StepGenerateReport() {
  const { reportData, setReportData, handleBack, handleSave, isSaving } = useReportForm();
  const { toast } = useToast();
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEngines, setParsedEngines] = useState<EngineDetails[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const newFiles = acceptedFiles.filter(
      (file) => !reportData.sourceFiles?.some((sf) => sf.name === file.name)
    );

    if (newFiles.length === 0) {
      toast({ title: 'Duplicate Files', description: 'These files have already been added.' });
      return;
    }

    const newFileStatuses = newFiles.map(file => ({ name: file.name, status: 'uploading' as Status }));
    setFileStatuses(prev => [...prev, ...newFileStatuses]);

    let successfulUploads: SourceFile[] = [];

    for (const file of newFiles) {
        if (!file.name.endsWith('.pdf')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: `"${file.name}" is not a PDF.` });
            setFileStatuses(prev => prev.map(fs => fs.name === file.name ? { ...fs, status: 'error', errorMessage: 'Only PDF files are accepted.' } : fs));
            continue;
        }

        try {
            const base64Content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onabort = () => reject(new Error('File reading was aborted.'));
                reader.onerror = () => reject(new Error('File reading has failed.'));
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            successfulUploads.push({ name: file.name, content: base64Content });
            setFileStatuses(prev => prev.map(fs => fs.name === file.name ? { ...fs, status: 'success' } : fs));
        } catch (error) {
            console.error("Error processing file:", error);
            setFileStatuses(prev => prev.map(fs => fs.name === file.name ? { ...fs, status: 'error', errorMessage: 'Failed to read the file.' } : fs));
        }
    }
    
    if (successfulUploads.length > 0) {
        setReportData(prev => ({
            ...prev,
            sourceFiles: [...(prev.sourceFiles || []), ...successfulUploads],
        }));
    }

  }, [setReportData, toast, reportData.sourceFiles]);
  
  useEffect(() => {
    const processFiles = async () => {
        if (reportData.sourceFiles && reportData.sourceFiles.length > 0) {
            setIsProcessing(true);
            try {
                const reportText = await extractTextFromPdfs(reportData.sourceFiles);
                const analysisResult = await analyzeDiagnosticReport({ reportText });
                
                // Use the structured data from AI to populate the parsedEngines state
                setParsedEngines(analysisResult.engines || []);
                
                // Store the structured data back into the main form state for saving
                setReportData(prev => ({ ...prev, engines: analysisResult.engines || [] }));

            } catch (error) {
                 toast({ variant: "destructive", title: "Parsing Error", description: "Could not extract or parse text from the PDFs."})
                 setParsedEngines([]); // Clear on error
            } finally {
                setIsProcessing(false);
            }
        } else {
            setParsedEngines([]);
            setReportData(prev => ({ ...prev, engines: [] }));
        }
    }
    processFiles();
  }, [reportData.sourceFiles, toast, setReportData]);

  const removeFile = (fileName: string) => {
      setFileStatuses(prev => prev.filter(fs => fs.name !== fileName));
      setReportData(prev => ({
          ...prev,
          sourceFiles: (prev.sourceFiles || []).filter(sf => sf.name !== fileName),
      }));
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { 
        'application/pdf': ['.pdf'],
    },
  });

  return (
    <>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Upload & Generate</CardTitle>
        <CardDescription>
          Upload one or more engine diagnostic PDF files. The system will extract the sections and display them.
        </CardDescription>
      </CardHeader>
      
      <div
        {...getRootProps()}
        className="mt-8 border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
             <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              {isDragActive ? 'Drop the files here...' : 'Drag & drop PDF files here, or click to select'}
            </p>
        </div>
      </div>
      
      <div className="mt-8 space-y-2">
        {fileStatuses.map(file => (
            <div key={file.name} className="flex items-center gap-4 p-2 border rounded-md">
                {file.status === 'uploading' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                {file.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {file.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
                <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    {file.status === 'error' && <p className="text-xs text-destructive">{file.errorMessage}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(file.name)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
        ))}
      </div>

       <div className="mt-8">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="mt-2 space-y-4">
                 {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-48 border rounded-md bg-muted/30">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="mt-4 text-muted-foreground">Processing PDFs...</p>
                    </div>
                 ) : (
                    <ReportDisplay engines={parsedEngines} />
                 )}
            </div>
       </div>

      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving || isProcessing || parsedEngines.length === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Report'}
        </Button>
      </div>
    </>
  );
}

    