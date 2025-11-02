'use client';

import { useState } from 'react';

export default function ImageDatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCheckingRaw, setIsCheckingRaw] = useState(false);
  const [checkRawStatus, setCheckRawStatus] = useState<'success' | 'error' | null>(null);
  const [isCheckingBranded, setIsCheckingBranded] = useState(false);
  const [checkBrandedStatus, setCheckBrandedStatus] = useState<'success' | 'error' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'success' | 'error' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<'success' | 'error' | null>(null);

  const handleCheckRaw = async () => {
    setIsCheckingRaw(true);
    setCheckRawStatus(null);
    try {
      const res = await fetch('http://localhost:3001/api/check-latest', { method: 'POST' });
      if (res.ok) {
        setCheckRawStatus('success');
      } else {
        setCheckRawStatus('error');
      }
    } catch (err) {
      setCheckRawStatus('error');
    } finally {
      setIsCheckingRaw(false);
    }
  };

  const handleCheckBranded = async () => {
    setIsCheckingBranded(true);
    setCheckBrandedStatus(null);
    try {
      const res = await fetch('http://localhost:3001/api/check-branded', { method: 'POST' });
      if (res.ok) {
        setCheckBrandedStatus('success');
      } else {
        const data = await res.json();
        console.error('Missing branded images:', data.missing);
        setCheckBrandedStatus('error');
      }
    } catch (err) {
      setCheckBrandedStatus('error');
    } finally {
      setIsCheckingBranded(false);
    }
  };

  const handleDownloadRaw = async () => {
    setIsDownloading(true);
    setDownloadStatus(null);
    try {
      const res = await fetch('http://localhost:3001/api/download-raw-images', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        console.log('Downloaded:', data);
        if (data.failed && data.failed.length > 0) {
          setDownloadStatus('error');
        } else {
          setDownloadStatus('success');
        }
      } else {
        setDownloadStatus('error');
      }
    } catch (err) {
      setDownloadStatus('error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateBranded = async () => {
    setIsGenerating(true);
    setGenerateStatus(null);
    try {
      const res = await fetch('http://localhost:3001/api/generate-branded-images', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.failed && data.failed.length > 0) {
          setGenerateStatus('error');
        } else {
          setGenerateStatus('success');
        }
      } else {
        setGenerateStatus('error');
      }
    } catch (err) {
      setGenerateStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mt-4">
        <h1 className="text-2xl font-bold">Image Database</h1>
        <div className="flex gap-4 ml-auto">
          <button className="bg-yellow-400 text-white px-4 py-2 rounded-md" onClick={handleCheckRaw} disabled={isCheckingRaw}>
            {isCheckingRaw ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Checking...</span>
              </div>
            ) : checkRawStatus === 'success' ? (
              'Check Raw ✅'
            ) : checkRawStatus === 'error' ? (
              'Check Raw ❌'
            ) : (
              'Check Raw'
            )}
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md" onClick={handleCheckBranded} disabled={isCheckingBranded}>
            {isCheckingBranded ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Checking...</span>
              </div>
            ) : checkBrandedStatus === 'success' ? (
              'Check Branded ✅'
            ) : checkBrandedStatus === 'error' ? (
              'Check Branded ❌'
            ) : (
              'Check Branded'
            )}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md" onClick={handleDownloadRaw} disabled={isDownloading}>
            {isDownloading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Downloading...</span>
              </div>
            ) : downloadStatus === 'success' ? (
              'Download Raw ✅'
            ) : downloadStatus === 'error' ? (
              'Download Raw ❌'
            ) : (
              'Download Raw'
            )}
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md" onClick={handleGenerateBranded} disabled={isGenerating}>
            {isGenerating ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </div>
            ) : generateStatus === 'success' ? (
              'Generate Branded Image ✅'
            ) : generateStatus === 'error' ? (
              'Generate Branded Image ❌'
            ) : (
              'Generate Branded Image'
            )}
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
