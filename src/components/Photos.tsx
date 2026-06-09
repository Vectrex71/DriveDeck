/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderOpen,
  Image as ImageIcon,
  ArrowLeft,
  Search,
  Settings,
  Link,
  Download,
  RefreshCw,
  Camera,
  Grid,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  FileImage,
  Sparkles,
  ExternalLink,
  Clock,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';

interface PhotosProps {
  token: string | null;
  onConnectDrive: (method: 'popup' | 'redirect') => void;
  showConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText?: string,
    cancelText?: string,
    isAlert?: boolean
  ) => void;
}

interface DriveFolder {
  id: string;
  name: string;
}

interface PhotoAlbum {
  id: string;
  name: string;
  coverUrl?: string; // Loaded from first image
  coverUrls?: string[]; // Multiple photos for collage/grid
  photoCount?: number;
  subfolderCount?: number;
}

const fetchFolderPreviews = async (
  folderId: string, 
  currentToken: string, 
  maxPreviews = 4
): Promise<{ urls: string[], subfolderCount: number, photoCount: number }> => {
  let urls: string[] = [];
  let subfolderCount = 0;
  let photoCount = 0;

  try {
    // 1. Fetch children of folderId (both subfolders and files)
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,mimeType,thumbnailLink)&pageSize=100&orderBy=name`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    if (!res.ok) return { urls: [], subfolderCount: 0, photoCount: 0 };
    const data = await res.json();
    const files = data.files || [];

    const immediateFolders = files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder');
    const immediatePhotos = files.filter((f: any) => f.mimeType?.startsWith('image/') || f.mimeType?.startsWith('video/'));

    subfolderCount = immediateFolders.length;
    photoCount = immediatePhotos.length;

    // Collect immediate images
    immediatePhotos.forEach((file: any) => {
      if (file.thumbnailLink && urls.length < maxPreviews) {
        urls.push(file.thumbnailLink.replace(/=s\d+/, '=s500'));
      }
    });

    // If we need more preview images and have subfolders, let's query the subfolders recursively
    if (urls.length < maxPreviews && immediateFolders.length > 0) {
      // Query up to 3 subfolders to get extra previews
      for (let i = 0; i < Math.min(immediateFolders.length, 3); i++) {
        if (urls.length >= maxPreviews) break;
        try {
          const subQ = encodeURIComponent(`'${immediateFolders[i].id}' in parents and trashed = false`);
          const subUrl = `https://www.googleapis.com/drive/v3/files?q=${subQ}&fields=files(id,mimeType,thumbnailLink)&pageSize=50&orderBy=name`;
          const subRes = await fetch(subUrl, {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            const subFiles = subData.files || [];
            const subPhotos = subFiles.filter((f: any) => f.mimeType?.startsWith('image/') || f.mimeType?.startsWith('video/'));
            
            subPhotos.forEach((file: any) => {
              if (file.thumbnailLink && urls.length < maxPreviews) {
                urls.push(file.thumbnailLink.replace(/=s\d+/, '=s500'));
              }
            });
          }
        } catch (err) {
          console.error('Error fetching nested previews:', err);
        }
      }
    }
  } catch (err) {
    console.error('Error in fetchFolderPreviews:', err);
  }

  return { urls, subfolderCount, photoCount };
};

const renderFolderCover = (folder: PhotoAlbum) => {
  const urls = folder.coverUrls || (folder.coverUrl ? [folder.coverUrl] : []);

  if (urls.length >= 4) {
    // Elegant 2x2 collage
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px] bg-slate-100 p-[1px] group-hover:scale-[1.03] transition-transform duration-300">
        {urls.slice(0, 4).map((url, i) => (
          <img 
            key={i}
            src={url} 
            alt={folder.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    // Beautiful asymmetrical split (1 large left, 2 small right)
    return (
      <div className="w-full h-full grid grid-cols-3 gap-[2px] bg-slate-100 p-[1px] group-hover:scale-[1.03] transition-transform duration-300">
        <div className="col-span-2 h-full">
          <img 
            src={urls[0]} 
            alt={folder.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
        </div>
        <div className="col-span-1 grid grid-rows-2 gap-[2px] h-full">
          <img 
            src={urls[1]} 
            alt={folder.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
          <img 
            src={urls[2]} 
            alt={folder.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  if (urls.length === 2) {
    // Side by side split
    return (
      <div className="w-full h-full grid grid-cols-2 gap-[2px] bg-slate-100 p-[1px] group-hover:scale-[1.03] transition-transform duration-300">
        <img 
          src={urls[0]} 
          alt={folder.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />
        <img 
          src={urls[1]} 
          alt={folder.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />
      </div>
    );
  }

  if (urls.length === 1) {
    // Full bleed image
    return (
      <img 
        src={urls[0]} 
        alt={folder.name} 
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300 select-none"
        loading="lazy"
      />
    );
  }

  // Beautiful fallback illustration card when no images are present
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100/90 group-hover:from-sky-50/40 group-hover:to-sky-100/30 transition-colors duration-300">
      {/* Abstract decorative lens patterns inside placeholder */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25 select-none pointer-events-none overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-slate-200 blur-xl translate-x-3 -translate-y-3 group-hover:scale-110 transition-transform duration-500" />
        <div className="w-14 h-14 rounded-full bg-sky-100 blur-lg -translate-x-5 translate-y-5 group-hover:scale-125 transition-transform duration-500" />
      </div>

      <div className="relative flex flex-col items-center text-slate-350 group-hover:text-sky-500/80 transition-colors duration-300">
        <FolderOpen className="w-10 h-10 stroke-[1.25] drop-shadow-3xs group-hover:scale-105 transition-transform duration-300" />
        <span className="text-[9px] mt-2 font-mono uppercase tracking-widest font-extrabold text-slate-400 group-hover:text-sky-600 transition-colors bg-white group-hover:bg-sky-50 border border-slate-200/50 group-hover:border-sky-100 px-2 py-0.5 rounded-full shadow-3xs">
          {folder.subfolderCount && folder.subfolderCount > 0 ? 'Sammlung' : 'Ordner'}
        </span>
      </div>
    </div>
  );
};

interface MediaFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  createdTime?: string;
  imageMediaMetadata?: {
    time?: string;
    cameraMake?: string;
    cameraModel?: string;
    exposureTime?: number;
    aperture?: number;
    flashUsed?: boolean;
    focalLength?: number;
    isoSpeed?: number;
    width?: number;
    height?: number;
    rotation?: number;
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
}

export default function Photos({ token, onConnectDrive, showConfirm }: PhotosProps) {
  // Local storage keys
  const PARENT_FOLDER_ID_KEY = 'drivedeck_photos_parent_folder_id';
  const PARENT_FOLDER_NAME_KEY = 'drivedeck_photos_parent_folder_name';

  // State
  const [parentFolderId, setParentFolderId] = useState<string | null>(() => 
    localStorage.getItem(PARENT_FOLDER_ID_KEY)
  );
  const [parentFolderName, setParentFolderName] = useState<string | null>(() => 
    localStorage.getItem(PARENT_FOLDER_NAME_KEY)
  );

  // Sorting direction: asc (A-Z) or desc (Z-A)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('drivedeck_photos_sort_direction') as 'asc' | 'desc') || 'asc';
  });

  // Persist preference
  useEffect(() => {
    localStorage.setItem('drivedeck_photos_sort_direction', sortDirection);
  }, [sortDirection]);

  // Layout states
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>(() => {
    const cachedId = localStorage.getItem(PARENT_FOLDER_ID_KEY);
    const cachedName = localStorage.getItem(PARENT_FOLDER_NAME_KEY);
    return cachedId ? [{ id: cachedId, name: cachedName || 'Hauptordner' }] : [];
  });
  const [subfolders, setSubfolders] = useState<PhotoAlbum[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable sorted arrays
  const displayedSubfolders = React.useMemo(() => {
    return [...subfolders].sort((a, b) => {
      const comp = a.name.localeCompare(b.name, 'de', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [subfolders, sortDirection]);

  const displayedPhotos = React.useMemo(() => {
    return [...albumPhotos].sort((a, b) => {
      const comp = a.name.localeCompare(b.name, 'de', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [albumPhotos, sortDirection]);

  // Configuration modal / Folder Selector
  const [showConfig, setShowConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundFolders, setFoundFolders] = useState<DriveFolder[]>([]);
  const [searchingFolders, setSearchingFolders] = useState(false);
  const [customFolderId, setCustomFolderId] = useState('');

  // Lightbox / Modal view for photo
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxVideoUrl, setLightboxVideoUrl] = useState<string | null>(null);
  const [loadingLightbox, setLoadingLightbox] = useState(false);

  const currentFolder = folderPath[folderPath.length - 1] ?? null;

  // Save parent folder selection to localStorage
  const handleSelectParentFolder = (id: string, name: string) => {
    localStorage.setItem(PARENT_FOLDER_ID_KEY, id);
    localStorage.setItem(PARENT_FOLDER_NAME_KEY, name);
    setParentFolderId(id);
    setParentFolderName(name);
    setShowConfig(false);
    setFolderPath([{ id, name }]);
  };

  const handleResetParentFolder = () => {
    localStorage.removeItem(PARENT_FOLDER_ID_KEY);
    localStorage.removeItem(PARENT_FOLDER_NAME_KEY);
    setParentFolderId(null);
    setParentFolderName(null);
    setFolderPath([]);
    setSubfolders([]);
    setAlbumPhotos([]);
  };

  // Search/fetch folders on Google Drive
  const searchGoogleDriveFolders = async (queryTerm = '') => {
    if (!token) return;
    setSearchingFolders(true);
    try {
      let queryList = ["mimeType = 'application/vnd.google-apps.folder'", "trashed = false"];
      if (queryTerm.trim()) {
        const sanitized = queryTerm.replace(/'/g, "\\'");
        queryList.push(`name contains '${sanitized}'`);
      }
      const q = encodeURIComponent(queryList.join(' and '));
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=15&orderBy=name`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFoundFolders(data.files || []);
      }
    } catch (err) {
      console.error('Error listing root folders:', err);
    } finally {
      setSearchingFolders(false);
    }
  };

  // Handle manual ID submit
  const handleManualFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFolderId.trim() || !token) return;
    setSearchingFolders(true);
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${customFolderId.trim()}?fields=id,name,mimeType`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const folder = await res.json();
        if (folder.mimeType === 'application/vnd.google-apps.folder') {
          handleSelectParentFolder(folder.id, folder.name);
          setCustomFolderId('');
        } else {
          alert('Die eingegebene ID ist kein Google Drive-Ordner.');
        }
      } else {
        alert('Ordner konnte nicht gefunden werden. Bitte prüfe die ID.');
      }
    } catch (err) {
      console.error('Error fetching manual folder:', err);
      alert('Fehler beim Abrufen des Ordners.');
    } finally {
      setSearchingFolders(false);
    }
  };

  // Load both subfolders and photos of a specific folder ID
  const loadFolderContents = async (folderId: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSubfolders([]);
    setAlbumPhotos([]);
    try {
      // 1. Fetch subfolders
      const qFolders = encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const foldersUrl = `https://www.googleapis.com/drive/v3/files?q=${qFolders}&fields=files(id,name,createdTime)&pageSize=100&orderBy=name`;

      // 2. Fetch image/video files
      const qFiles = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${qFiles}&fields=files(id,name,mimeType,size,thumbnailLink)&pageSize=1000&orderBy=name`;

      const [resFolders, resFiles] = await Promise.all([
        fetch(foldersUrl, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(filesUrl, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!resFolders.ok || !resFiles.ok) {
        throw new Error(`Ordnerinhalte konnten nicht geladen werden (${resFolders.status} / ${resFiles.status})`);
      }

      const [dataFolders, dataFiles] = await Promise.all([
        resFolders.json(),
        resFiles.json()
      ]);

      const rawFolders = dataFolders.files || [];
      const loadedSubfolders: PhotoAlbum[] = rawFolders.map((f: any) => ({
        id: f.id,
        name: f.name
      }));

      const rawFiles = dataFiles.files || [];
      const loadedPhotos = rawFiles.filter((f: any) => 
        f.mimeType?.startsWith('image/') || f.mimeType?.startsWith('video/')
      );

      setSubfolders(loadedSubfolders);
      setAlbumPhotos(loadedPhotos);

      // Lazy-load cover images and metadata for each subfolder in separate background calls
      loadedSubfolders.forEach(async (sub) => {
        try {
          const result = await fetchFolderPreviews(sub.id, token);
          setSubfolders(prev => 
            prev.map(s => s.id === sub.id ? { 
              ...s, 
              coverUrls: result.urls,
              coverUrl: result.urls[0] || undefined,
              subfolderCount: result.subfolderCount,
              photoCount: result.photoCount
            } : s)
          );
        } catch (coverErr) {
          console.error(`Error loading cover for subfolder ${sub.name}:`, coverErr);
        }
      });

    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden des Ordners.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch lightboxed high-res image or video blob URL
  useEffect(() => {
    if (lightboxIndex === null || displayedPhotos.length === 0) {
      setLightboxUrl(null);
      setLightboxVideoUrl(null);
      return;
    }

    const activeFile = displayedPhotos[lightboxIndex];
    let isCurrent = true;
    let url: string | null = null;
    
    async function fetchLightboxBlob() {
      setLoadingLightbox(true);
      setLightboxUrl(null);
      setLightboxVideoUrl(null);
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${activeFile.id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error();
        const blob = await response.blob();
        
        if (isCurrent) {
          url = URL.createObjectURL(blob);
          if (activeFile.mimeType.startsWith('video/')) {
            setLightboxVideoUrl(url);
          } else {
            setLightboxUrl(url);
          }
        }
      } catch (err) {
        if (isCurrent) {
          if (activeFile.mimeType.startsWith('video/')) {
            setLightboxVideoUrl(null);
          } else {
            // fallback to higher resolution thumbnail
            const fallback = activeFile.thumbnailLink 
              ? activeFile.thumbnailLink.replace(/=s\d+/, '=s1200') 
              : null;
            setLightboxUrl(fallback);
          }
        }
      } finally {
        if (isCurrent) {
          setLoadingLightbox(false);
        }
      }
    }

    fetchLightboxBlob();

    return () => {
      isCurrent = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [lightboxIndex, displayedPhotos, token]);

  // Load folders initially when opening search
  useEffect(() => {
    if (showConfig && token) {
      searchGoogleDriveFolders();
    }
  }, [showConfig, token]);

  // Load folder contents when the active path / folder shifts
  useEffect(() => {
    if (currentFolder?.id && token) {
      loadFolderContents(currentFolder.id);
    } else {
      setSubfolders([]);
      setAlbumPhotos([]);
    }
  }, [currentFolder?.id, token]);

  return (
    <div className="flex-1 bg-slate-50 min-h-full flex flex-col p-4 md:p-8 select-none font-sans overflow-y-auto">
      
      {/* 1. Header Area */}
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <Camera className="w-6.5 h-6.5 text-sky-600 shrink-0" />
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-none">Foto-Verzeichnis</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
            {parentFolderName 
              ? `Unterordner aus "${parentFolderName}" werden automatisch als Fotoalben synchronisiert.`
              : 'Verbinde einen Google Drive-Hauptordner, um alle Unterordner als Fotoalben darzustellen.'
            }
          </p>
        </div>

        {token && (
          <div className="flex items-center gap-2 shrink-0">
            {parentFolderId && currentFolder && (
              <button
                onClick={() => loadFolderContents(currentFolder.id)}
                disabled={loading}
                className="p-1.75 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Aktualisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-1.5 px-3 py-1.75 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-3xs transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{parentFolderId ? 'Quellordner ändern' : 'Hauptordner verknüpfen'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Body Content */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {!token ? (
          /* Authentication Block */
          <div className="bg-white border border-slate-250/60 rounded-2xl p-8 text-center max-w-sm mx-auto my-12 shadow-3xs animate-in fade-in slide-in-from-y-3">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1.5">Google Drive Verbindung erforderlich</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Um deine Fotoalben direkt aus deinem Google Drive einzubinden, verbinde bitte zuerst deinen Google Account.
            </p>
            <button
              onClick={() => onConnectDrive('popup')}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-3xs"
            >
              Mit Google Drive verbinden
            </button>
          </div>
        ) : !parentFolderId ? (
          /* Configuration Screen / Set Parent Folder Banner */
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-12 shadow-3xs">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">Wähle deinen Fotos-Quellordner</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
              Lege einen Ordner auf Google Drive fest (z.B. "Foto-Archiv" oder "2025"). DriveDeck liest alle darin liegenden Unterordner ein und bildet diese als bildschöne Alben ab.
            </p>
            <button
              onClick={() => setShowConfig(true)}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-transform duration-100 hover:scale-[1.02] shadow-sm flex items-center gap-1.5 mx-auto"
            >
              <Folder className="w-4 h-4" />
              <span>Quellordner jetzt auswählen</span>
            </button>
          </div>
        ) : (
          /* The Unified Folder/Photo Explorer */
          <div className="animate-in fade-in duration-200">
            {/* 1. Breadcrumbs Nav / Sort & Navigation Controls */}
            {folderPath.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-505 font-semibold">
                  <span className="text-slate-400 flex items-center gap-1 gap-x-1.5">
                    <Camera className="w-4 h-4 text-sky-600 mr-1 shrink-0" />
                    Fotos
                  </span>
                  {folderPath.map((folder, index) => {
                    const isLast = index === folderPath.length - 1;
                    return (
                      <React.Fragment key={folder.id}>
                        <span className="text-slate-350">/</span>
                        <button
                          onClick={() => {
                            if (!isLast) {
                              setFolderPath(folderPath.slice(0, index + 1));
                            }
                          }}
                          className={`hover:bg-slate-50 rounded px-1.5 py-0.5 transition-colors cursor-pointer ${
                            isLast ? 'text-slate-800 font-extrabold' : 'text-sky-650 hover:text-sky-700'
                          }`}
                          disabled={isLast}
                        >
                          {folder.name}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {/* Robust Up/Down sorting toggler */}
                  <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-xl p-0.5 shadow-3xs">
                    <button
                      onClick={() => setSortDirection('asc')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        sortDirection === 'asc' 
                          ? 'bg-white text-sky-600 shadow-3xs ring-1 ring-slate-100 font-black' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Alphabetisch aufsteigend sortieren (A - Z)"
                    >
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-sky-505 shrink-0" />
                      <span>A-Z</span>
                    </button>
                    <button
                      onClick={() => setSortDirection('desc')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        sortDirection === 'desc' 
                          ? 'bg-white text-sky-600 shadow-3xs ring-1 ring-slate-100 font-black' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Alphabetisch absteigend sortieren (Z - A)"
                    >
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-sky-550 shrink-0 rotate-180 transition-transform" />
                      <span>Z-A</span>
                    </button>
                  </div>

                  {folderPath.length > 1 && (
                    <button
                      onClick={() => setFolderPath(folderPath.slice(0, -1))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-605 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-205/60 rounded-xl cursor-pointer transition-colors shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Zurück</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-6.5 h-6.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-mono">Ordnerinhalte werden geladen...</p>
              </div>
            ) : error ? (
              /* Error Display */
              <div className="p-6 bg-red-50 border border-red-100 text-red-700 font-medium rounded-lg text-xs leading-relaxed max-w-md mx-auto my-6 shadow-3xs">
                <p className="font-bold mb-1">Fehler beim Laden:</p>
                <p>{error}</p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      if (currentFolder) loadFolderContents(currentFolder.id);
                    }} 
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-3xs"
                  >
                    Erneut versuchen
                  </button>
                  <button 
                    onClick={() => setFolderPath([{ id: parentFolderId, name: parentFolderName || 'Hauptordner' }])} 
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-800 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Zum Hauptordner
                  </button>
                </div>
              </div>
            ) : displayedSubfolders.length === 0 && displayedPhotos.length === 0 ? (
              /* Empty Folder View */
              <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-2xl p-8 max-w-md mx-auto shadow-3xs">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-sm mb-1">Dieser Ordner ist leer</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-5">
                  Es wurden keine Unterordner oder Bild-/Videodateien in diesem Ordner gefunden.
                </p>
                {currentFolder && (
                  <a 
                    href={`https://drive.google.com/drive/folders/${currentFolder.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.75 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shadow-3xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Auf Google Drive öffnen</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-205">
                {/* 2. Subfolders Block */}
                {displayedSubfolders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                      <h3 className="text-xs uppercase font-extrabold text-slate-450 tracking-wider">Ordner & Alben ({displayedSubfolders.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {displayedSubfolders.map((folder) => (
                        <motion.div
                          key={folder.id}
                          whileHover={{ y: -3 }}
                          onClick={() => {
                            setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
                          }}
                          className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-3xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100 shrink-0">
                            {renderFolderCover(folder)}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <div className="p-4 bg-white flex-1 flex flex-col justify-between gap-1">
                            <h4 className="font-extrabold text-slate-800 text-xs truncate leading-tight group-hover:text-sky-600 transition-colors">
                              {folder.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              {folder.subfolderCount !== undefined && folder.subfolderCount > 0 ? (
                                <span className="flex items-center gap-1">
                                  <Folder className="w-3 h-3 text-slate-400" />
                                  <span>{folder.subfolderCount} Alb{folder.subfolderCount === 1 ? 'um' : 'en'}</span>
                                </span>
                              ) : null}
                              {folder.subfolderCount !== undefined && folder.subfolderCount > 0 && folder.photoCount !== undefined && folder.photoCount > 0 ? (
                                <span className="text-slate-300">•</span>
                              ) : null}
                              {folder.photoCount !== undefined && folder.photoCount > 0 ? (
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 text-slate-400" />
                                  <span>{folder.photoCount} Foto{folder.photoCount === 1 ? '' : 's'}</span>
                                </span>
                              ) : null}
                              {(!folder.subfolderCount && !folder.photoCount && folder.coverUrls && folder.coverUrls.length > 0) ? (
                                <span className="flex items-center gap-1 text-sky-600/80">
                                  <ImageIcon className="w-3 h-3 text-sky-600" />
                                  <span>Vorschau verfügbar</span>
                                </span>
                              ) : (!folder.subfolderCount && !folder.photoCount) ? (
                                <span className="text-slate-350">Keine Medien</span>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Media Files Block */}
                {displayedPhotos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-150">
                      <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <h3 className="text-xs uppercase font-extrabold text-slate-450 tracking-wider">Fotos & Videos ({displayedPhotos.length})</h3>
                    </div>
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                      {displayedPhotos.map((file, idx) => {
                        const isVideo = file.mimeType.startsWith('video/');
                        const previewUrl = file.thumbnailLink 
                          ? file.thumbnailLink.replace(/=s\d+/, '=s640') 
                          : '';

                        return (
                          <div 
                            key={file.id}
                            onClick={() => setLightboxIndex(idx)}
                            className="break-inside-avoid relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-3xs cursor-pointer group hover:border-slate-350 hover:shadow-xs transition-all duration-200"
                          >
                            {previewUrl ? (
                              <div className="relative">
                                <img 
                                  src={previewUrl} 
                                  alt={file.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-full object-cover max-h-[400px] select-none"
                                  loading="lazy"
                                />
                                {isVideo && (
                                  <div className="absolute top-2.5 right-2.5 bg-slate-900/70 p-1 rounded text-white text-[9px] uppercase font-bold tracking-wider">
                                    Video
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                                  <div className="bg-white/90 backdrop-blur-xs p-2 rounded-full shadow-md text-slate-800 scale-90 group-hover:scale-100 transition-transform">
                                    <Maximize2 className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-8 text-center flex flex-col items-center justify-center bg-slate-50 border-b border-slate-100 text-slate-400 min-h-32">
                                <FileImage className="w-8 h-8 stroke-[1.5] text-slate-350" />
                                <span className="text-[10px] font-semibold mt-2 truncate max-w-full italic px-2">Kein Vorschaubild</span>
                              </div>
                            )}

                            <div className="p-3 bg-white border-t border-slate-50 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate" title={file.name}>
                                  {file.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Choose Custom Google Drive Directory Modal */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg flex flex-col max-h-[85vh] animate-in"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-5 h-5 text-sky-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm">G-Drive Hauptordner wählen</h3>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="p-1 hover:bg-slate-250/60 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Description */}
              <div className="p-4 border-b border-slate-100 bg-sky-50/40 text-slate-600 text-xs leading-relaxed">
                <span className="font-bold text-[#0288D1]">💡 So funktioniert's:</span> Alle Ordner, die direkt in diesem Hauptordner liegen (z.B. Urlaub 2025, Geburtstag Hubert) werden als Alben geladen. Bilder und Videos darin bilden die Album-Fotos.
              </div>

              {/* Search input for Root Folders */}
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Suche Ordner auf Google Drive</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ordnernamen eintippen..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchGoogleDriveFolders(e.target.value);
                      }}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Grid List of matches folders */}
                <div className="overflow-y-auto max-h-56 pr-1 space-y-1.5">
                  {searchingFolders ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Google Drive wird durchforstet...</span>
                    </div>
                  ) : foundFolders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-150 rounded-lg">
                      Keine Ordner gefunden. Tippe etwas anderes ein.
                    </div>
                  ) : (
                    foundFolders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleSelectParentFolder(folder.id, folder.name)}
                        className="w-full p-2.5 text-left text-xs text-slate-700 bg-white border border-slate-250/50 hover:bg-sky-50 hover:border-sky-300 rounded-lg cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Folder className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                          <span className="font-bold truncate">{folder.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">id: {folder.id.slice(0,8)}...</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Direct ID paste layout */}
                <form onSubmit={handleManualFolderSubmit} className="border-t border-slate-150 pt-4">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Oder direkt Google Folder ID hinterlegen</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="z.B. 1A2b3C_4d5E6F7g8H9i..."
                      value={customFolderId}
                      onChange={(e) => setCustomFolderId(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!customFolderId.trim() || searchingFolders}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer shadow-3xs shrink-0 transition-colors"
                    >
                      Verknüpfen
                    </button>
                  </div>
                </form>
              </div>

              {/* Modal footer with reset configuration options */}
              {parentFolderId && (
                <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                    Verknüpft: <span className="font-mono font-bold text-slate-700">{parentFolderName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = 'Verknüpfung wirklich aufheben? Deine Google Drive Fotos bleiben vollständig unberührt.';
                      if (showConfirm) {
                        showConfirm(
                          'Verknüpfung aufheben',
                          msg,
                          () => {
                            handleResetParentFolder();
                            setShowConfig(false);
                          },
                          'Verbindung aufheben',
                          'Abbrechen'
                        );
                      } else if (confirm(msg)) {
                        handleResetParentFolder();
                        setShowConfig(false);
                      }
                    }}
                    className="px-2.5 py-1.5 hover:bg-red-50 text-red-650 text-[11px] font-bold rounded-md cursor-pointer transition-colors"
                  >
                    Verbindung aufheben
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Immersive Lightbox Modal Overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-sm flex flex-col justify-between p-4">
            
            {/* Lightbox Head Navigation */}
            <div className="flex items-center justify-between text-white p-2">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold text-slate-200 truncate max-w-md">
                  {displayedPhotos[lightboxIndex].name}
                </p>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Galerie schließen"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Lightbox Main Stage (Viewer) */}
            <div className="relative flex-1 flex items-center justify-center p-2 md:p-6 group/stage">
              {/* Back photo action */}
              {lightboxIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex - 1);
                  }}
                  className="absolute left-2 md:left-6 p-3 bg-slate-900/40 hover:bg-slate-900/80 hover:scale-105 border border-white/5 active:scale-95 text-white rounded-full cursor-pointer transition-all shrink-0 z-10"
                  title="Vorheriges Bild"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}

              {/* Media viewer center */}
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                {loadingLightbox ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-300 font-mono">Lade Medium...</span>
                  </div>
                ) : displayedPhotos[lightboxIndex].mimeType.startsWith('video/') ? (
                  lightboxVideoUrl ? (
                    <video 
                      src={lightboxVideoUrl} 
                      controls
                      autoPlay
                      className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
                    />
                  ) : (
                    <div className="text-center text-slate-450 p-6 bg-slate-900/40 rounded-lg border border-white/10">
                      <X className="w-10 h-10 mx-auto text-rose-500 mb-2" />
                      <p className="text-xs font-semibold">Video konnte nicht geladen werden.</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Ggf. sperrt dein Browser Drittanbieter-Anfragen.</p>
                    </div>
                  )
                ) : lightboxUrl ? (
                  <img 
                    src={lightboxUrl} 
                    alt={displayedPhotos[lightboxIndex].name} 
                    referrerPolicy="no-referrer"
                    className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl select-none animate-in fade-in duration-150"
                  />
                ) : (
                  <div className="text-center text-slate-450 p-6 bg-slate-900/40 rounded-lg border border-white/10">
                    <X className="w-10 h-10 mx-auto text-rose-500 mb-2" />
                    <p className="text-xs font-semibold">Bild konnte nicht im Viewer angezeigt werden.</p>
                  </div>
                )}
              </div>

              {/* Next photo action */}
              {lightboxIndex < displayedPhotos.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(lightboxIndex + 1);
                  }}
                  className="absolute right-2 md:right-6 p-3 bg-slate-900/40 hover:bg-slate-900/80 hover:scale-105 border border-white/5 active:scale-95 text-white rounded-full cursor-pointer transition-all shrink-0 z-10"
                  title="Nächstes Bild"
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Lightbox Footer Actions */}
            <div className="text-center text-white/50 text-[11px] p-2 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-white/5 bg-slate-950/50">
              <span>{lightboxIndex + 1} von {displayedPhotos.length} Medien</span>
              
              <div className="flex items-center gap-2">
                <a 
                  href={`https://drive.google.com/uc?export=download&id=${displayedPhotos[lightboxIndex].id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.75 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold leading-none flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <a 
                  href={`https://drive.google.com/drive/folders/${currentFolder?.id || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.75 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg text-xs font-semibold leading-none flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ordner zeigen</span>
                </a>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
