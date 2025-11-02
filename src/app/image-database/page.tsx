'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Folder, ArrowLeft } from "lucide-react";

interface Directory {
  name: string;
  path: string;
}

interface File {
  name: string;
  url: string;
}

export default function ImageDatabasePage() {
  const [path, setPath] = useState('/');
  const [items, setItems] = useState<{ directories: Directory[]; files: File[] }>({ directories: [], files: [] });
  const [error, setError] = useState<string | null>(null);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async (currentPath: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/image-database-list?path=${currentPath}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();

      // Sort files numerically by name
      data.files.sort((a, b) => {
        const numA = parseInt(a.name.split('.')[0], 10);
        const numB = parseInt(b.name.split('.')[0], 10);
        return numA - numB;
      });

      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  useEffect(() => {
    fetchData(path);
  }, [path]);

  const handleDirectoryClick = (dirPath: string) => { console.log('dirPath', dirPath); setPath(dirPath); };

  const handleBackClick = () => {
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    setPath(parentPath || '/');
  };

  return (
    <>
      <div className="flex items-center mb-4">
        {path !== '/' && (
          <button onClick={handleBackClick} className="mr-4 p-2 rounded-full hover:bg-gray-200">
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Image Database: {path}</h1>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {items.directories.map((dir) => (
          <Card key={dir.name} className="bg-blue-100 hover:bg-blue-200 transition-colors duration-300 cursor-pointer" onClick={() => handleDirectoryClick(dir.path)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dir.name}
              </CardTitle>
              <Folder className="h-6 w-6 text-blue-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Browse</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mt-8">
        {items.files.map((file) => {
          const nameWithoutLeadingZeros = parseInt(file.name.split('.')[0], 10) + '.jpg';
          return (
            <Card key={file.name} className="cursor-pointer" onClick={() => { setModalSrc(`http://localhost:3001${file.url}`); requestAnimationFrame(() => setModalOpen(true)); }}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{nameWithoutLeadingZeros}</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={`http://localhost:3001${file.url}`} alt={file.name} className="max-w-full h-auto rounded-lg" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modalSrc && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${modalOpen ? 'opacity-100' : 'opacity-0'} bg-black/60 transition-opacity duration-200`}
          onClick={() => {
            setModalOpen(false);
            setTimeout(() => setModalSrc(null), 200);
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setModalOpen(false); setTimeout(() => setModalSrc(null), 200); } }}
          role="dialog"
          tabIndex={-1}
        >
          <img
            src={modalSrc}
            alt="preview"
            className={`max-h-[90vh] max-w-[90vw] shadow-lg transform transition-all duration-200 ${modalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          />
        </div>
      )}
    </>
  );
}