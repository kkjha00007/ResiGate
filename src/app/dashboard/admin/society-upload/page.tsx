"use client";

import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UPLOAD_TYPES = [
  { key: "residents", label: "Residents Upload" },
  { key: "staff", label: "Staff Upload" },
  { key: "vehicles", label: "Vehicles Upload" },
];

export default function SocietyBulkUploadPage() {
  const [tab, setTab] = useState("residents");
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState<any>({});
  const [file, setFile] = useState<File | null>(null);
  const [pushing, setPushing] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [audit, setAudit] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { toast } = useToast();

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Society Bulk Upload</h1>
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-3 py-1 text-xs font-semibold text-white shadow">Admin Tool</span>
      </div>
      <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <CardContent className="py-6">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={async () => {
              setShowAudit((v) => !v);
              if (!showAudit) {
                const res = await fetch('/api/society-upload/audit');
                const data = await res.json();
                setAudit(data.audit || []);
              }
            }}>
              {showAudit ? 'Hide Audit Log' : 'Show Audit Log'}
            </Button>
          </div>
          {showAudit && (
            <div className="mb-8 bg-slate-50 dark:bg-slate-800 rounded p-4 max-h-64 overflow-auto border border-orange-100 dark:border-slate-700">
              <h3 className="font-bold mb-2 text-orange-500">Audit Log</h3>
              {audit.length === 0 ? (
                <div className="text-muted-foreground text-sm">No audit entries yet.</div>
              ) : (
                <ul className="text-xs space-y-1">
                  {audit.map((entry, i) => (
                    <li key={i} className="border-b border-dashed border-orange-200 dark:border-slate-700 pb-1 mb-1">
                      <span className="font-semibold">{entry.action}</span> [{entry.type || ''}] at {new Date(entry.at).toLocaleString()} by {entry.user}
                      {entry.summary && (
                        <span> | Valid: {entry.summary.valid}, Errors: {entry.summary.errors}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-6 flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {UPLOAD_TYPES.map((t) => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="capitalize flex-1 px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {UPLOAD_TYPES.map((t) => {
              const val = validation[t.key];
              return (
                <TabsContent key={t.key} value={t.key} className="space-y-8">
                  <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80">
                    <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                      <CardTitle className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 animate-pulse"></span>
                        {t.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Upload section */}
                      <form
                        className="mb-6 flex flex-col md:flex-row md:items-end gap-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!file) return toast({ title: 'No file selected', variant: 'destructive' });
                          setUploading(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('type', t.key);
                            const res = await fetch('/api/society-upload', {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.success) {
                              setValidation((prev: any) => ({ ...prev, [t.key]: data.summary }));
                              toast({ title: 'Validation complete', description: `${data.summary.valid} valid, ${data.summary.errors} errors.` });
                            } else {
                              toast({ title: 'Validation failed', description: data.error || 'Unknown error', variant: 'destructive' });
                            }
                          } catch (err) {
                            toast({ title: 'Upload error', description: String(err), variant: 'destructive' });
                          } finally {
                            setUploading(false);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <label className="block font-semibold mb-2 text-slate-700 dark:text-slate-200">Upload .xlsx File</label>
                          <input
                            ref={el => {
                              fileInputRefs.current[t.key] = el;
                            }}
                            type="file"
                            accept=".xlsx"
                            className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="h-10 px-6 text-base font-semibold bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow"
                          disabled={uploading || !file}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </form>
                      {/* Status/validation summary */}
                      <div className="mb-6">
                        <h3 className="font-semibold mb-1 text-slate-800 dark:text-slate-100">Validation Summary</h3>
                        {val ? (
                          <div className="text-sm">
                            <div className="mb-1">Total: <b>{val.total}</b> | Valid: <b className="text-green-600">{val.valid}</b> | Errors: <b className="text-red-500">{val.errors}</b></div>
                            {val.errorsList?.length > 0 && (
                              <ul className="list-disc ml-6 text-red-500">
                                {val.errorsList.map((err: any, i: number) => (
                                  <li key={i}>Row {err.row}: {err.message}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">No file uploaded yet.</div>
                        )}
                      </div>
                      {/* Push to Production, Rollback/Delete */}
                      <div className="flex gap-4">
                        <Button
                          variant="destructive"
                          className="flex-1 h-10 text-base font-semibold shadow"
                          disabled={!val || val.errors > 0 || pushing}
                          onClick={async () => {
                            setPushing(true);
                            try {
                              const res = await fetch('/api/society-upload/push', { method: 'POST' });
                              const data = await res.json();
                              if (data.success) {
                                toast({ title: 'Data pushed to production', description: data.message });
                              } else {
                                toast({ title: 'Push failed', description: data.error || 'Unknown error', variant: 'destructive' });
                              }
                            } catch (err) {
                              toast({ title: 'Push error', description: String(err), variant: 'destructive' });
                            } finally {
                              setPushing(false);
                            }
                          }}
                        >
                          {pushing ? 'Pushing...' : 'Push to Production'}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-10 text-base font-semibold shadow"
                          disabled={!val || rollingBack}
                          onClick={async () => {
                            setRollingBack(true);
                            try {
                              const res = await fetch('/api/society-upload/rollback', { method: 'POST' });
                              const data = await res.json();
                              if (data.success) {
                                toast({ title: 'Rollback complete', description: data.message });
                                setValidation((prev: any) => ({ ...prev, [t.key]: undefined }));
                              } else {
                                toast({ title: 'Rollback failed', description: data.error || 'Unknown error', variant: 'destructive' });
                              }
                            } catch (err) {
                              toast({ title: 'Rollback error', description: String(err), variant: 'destructive' });
                            } finally {
                              setRollingBack(false);
                            }
                          }}
                        >
                          {rollingBack ? 'Rolling back...' : 'Rollback/Delete'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
      {/* Template download section */}
      <div className="mt-10 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 shadow border border-orange-100 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4 text-orange-500">Download Excel Templates</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base font-semibold border-orange-300 dark:border-orange-500 text-orange-600 dark:text-orange-300 bg-white dark:bg-slate-900 shadow"
            onClick={() => window.open('/api/society-upload/template?type=residents', '_blank')}
          >
            Download Resident Template
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 text-base font-semibold border-orange-300 dark:border-orange-500 text-orange-600 dark:text-orange-300 bg-white dark:bg-slate-900 shadow"
            onClick={() => window.open('/api/society-upload/template?type=staff', '_blank')}
          >
            Download Staff Template
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 text-base font-semibold border-orange-300 dark:border-orange-500 text-orange-600 dark:text-orange-300 bg-white dark:bg-slate-900 shadow"
            onClick={() => window.open('/api/society-upload/template?type=vehicles', '_blank')}
          >
            Download Vehicle Template
          </Button>
        </div>
      </div>
    </div>
  );
}
