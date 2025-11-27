"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";

interface ImportCampaignLeadsDialogProps {
  campaignId: string;
  onSuccess?: () => void;
}

interface ParsedLead {
  email: string;
  firstName: string;
  lastName?: string;
  company?: string;
  phone?: string;
  [key: string]: any;
}

export function ImportCampaignLeadsDialog({
  campaignId,
  onSuccess,
}: ImportCampaignLeadsDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedLead[]>([]);
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as ParsedLead[];
        setPreview(parsed.slice(0, 5));
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResults(null);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const leads = results.data as ParsedLead[];

          const res = await fetch(`/api/campaigns/${campaignId}/leads/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leads }),
          });

          const data = await res.json();

          if (res.ok) {
            setResults(data);
            toast({
              title: "Import Successful",
              description:
                data.imported || data.created
                  ? `Imported ${data.imported ?? data.created} leads`
                  : "Leads imported successfully",
            });
            onSuccess?.();

            setTimeout(() => {
              setOpen(false);
              resetState();
            }, 3000);
          } else {
            throw new Error(data.error || "Import failed");
          }
        },
        error: (error) => {
          throw new Error(error.message);
        },
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: email, firstName, lastName
            (optional), company (optional), phone (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Click to upload CSV</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop
                  </p>
                </div>
              </div>
            )}
          </div>

          {preview.length > 0 && !results && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Preview (first 5 rows):</h4>
              <div className="border rounded-md p-3 max-h-[200px] overflow-auto text-xs">
                {preview.map((lead, idx) => (
                  <div key={idx} className="py-1 border-b last:border-0">
                    <span className="font-medium">{lead.email}</span> -{" "}
                    {lead.firstName} {lead.lastName}
                    {lead.company && ` (${lead.company})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {results.imported ??
                      results.created ??
                      0}{" "}
                    leads imported successfully
                  </p>
                </div>
              </div>
              {Array.isArray(results.errors) && results.errors.length > 0 && (
                <div className="space-y-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-md max-h-[150px] overflow-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {results.errors.length} errors
                    </p>
                  </div>
                  {results.errors.map((error: string, idx: number) => (
                    <p
                      key={idx}
                      className="text-xs text-red-800 dark:text-red-200"
                    >
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!file && (
            <div className="p-3 bg-muted rounded-md text-xs">
              <p className="font-medium mb-1">Expected CSV format:</p>
              <code className="block whitespace-pre-wrap break-words text-xs overflow-x-auto">
                email,firstName,lastName,company,phone
                john@example.com,John,Doe,Acme Inc,123-456-7890
                jane@example.com,Jane,Smith,Tech Corp,
              </code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Leads"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


