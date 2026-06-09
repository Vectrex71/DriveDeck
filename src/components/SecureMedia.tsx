import React, { useState, useEffect } from 'react';
import { Music, Video, Image as ImageIcon, Loader2, AlertCircle, ExternalLink, Folder, ChevronLeft, ChevronRight } from 'lucide-react';

interface SecureMediaProps {
  fileId: string;
  fileName: string;
  token: string;
  mimeType?: string;
}

export function SecureAudioPlayer({ fileId, fileName, token }: SecureMediaProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    async function fetchAudio() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Fehler beim Laden (${response.status})`);
        }

        const blob = await response.blob();
        if (active) {
          url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Die Datei konnte nicht geladen werden.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (fileId && token) {
      fetchAudio();
    } else {
      setLoading(false);
      setError('Nicht autorisiert oder keine Datei-ID.');
    }

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileId, token]);

  if (loading) {
    return (
      <div className="py-2.5 flex items-center gap-2.5 font-sans text-sky-800/80">
        <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
        <span className="text-xs font-medium">Lade MP3 aus deinetm Google Drive...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3.5 bg-red-50/45 border border-red-100/60 rounded-xl flex flex-col gap-2 font-sans mt-1">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-bold">Ladefehler: {error}</span>
        </div>
        <p className="text-[11px] text-red-650 leading-relaxed opacity-90">
          Google-Stream wurde blockiert. Dies liegt meist am iFrame-Cookie Schutz deines Browsers. Tipp: Nutze die Freigabe "Jeder mit dem Link" für dieses Audio.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      {audioUrl && (
        <audio 
          src={audioUrl} 
          controls 
          className="w-full xl:w-full accent-sky-600 focus:outline-none bg-slate-50/70 border border-slate-100 p-1 rounded-xl shadow-3xs" 
        />
      )}
    </div>
  );
}

export function SecureVideoPlayer({ fileId, fileName, token }: SecureMediaProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    async function fetchVideo() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Fehler beim Laden (${response.status})`);
        }

        const blob = await response.blob();
        if (active) {
          url = URL.createObjectURL(blob);
          setVideoUrl(url);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Die Datei konnte nicht geladen werden.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (fileId && token) {
      fetchVideo();
    } else {
      setLoading(false);
      setError('Nicht autorisiert.');
    }

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileId, token]);

  if (loading) {
    return (
      <div className="py-2.5 flex items-center gap-2.5 font-sans justify-center text-slate-500 bg-slate-50/50 rounded-xl border border-slate-100/50">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-xs font-medium">Lade Video...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50/10 border border-red-900/15 rounded-xl text-xs text-red-500 font-sans flex flex-col gap-1 mt-1">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Fehler beim Streamen: {error}</span>
        </div>
        <p className="text-[10px] opacity-85 leading-snug">
          Der Video-Zugriff wurde blockiert. Google Drive Videos können bei strikten Browsereinstellungen alternativ direkt in neuem Tab geöffnet werden.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden shadow-3xs rounded-xl border border-slate-100/55 bg-black font-sans">
      {videoUrl && (
        <video 
          src={videoUrl} 
          controls 
          className="w-full max-h-[460px] block"
        />
      )}
    </div>
  );
}

export function SecureImage({ fileId, fileName, token }: SecureMediaProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: '120px' });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isInViewport) return;

    let active = true;
    let url: string | null = null;

    async function fetchImage() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Fehler beim Laden (${response.status})`);
        }

        const blob = await response.blob();
        if (active) {
          url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Bild konnte nicht geladen werden.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (fileId && token) {
      fetchImage();
    } else {
      setLoading(false);
      setError('Nicht autorisiert.');
    }

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isInViewport, fileId, token]);

  if (!isInViewport) {
    return (
      <div 
        ref={containerRef} 
        className="w-full h-44 bg-slate-50/50 rounded-xl border border-slate-100/50 animate-pulse flex flex-col items-center justify-center gap-1.5 font-sans"
      >
        <ImageIcon className="w-5 h-5 text-slate-300" />
        <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">Bild wird geladen (automatisches Lazy Load)...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-44 flex flex-col items-center justify-center gap-2 font-sans text-slate-500 bg-slate-50/30 rounded-xl border border-slate-100/40">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="text-xs font-semibold">Lade Bild aus Google Drive...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50/20 border border-red-100/30 rounded-xl text-[11px] text-red-500 font-sans flex items-center justify-center gap-2 mt-1">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Bild konnte nicht geladen werden.</span>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      {imageUrl && (
        <div className="relative aspect-video max-h-[460px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-950 shadow-inner">
          <img 
            src={imageUrl} 
            referrerPolicy="no-referrer"
            alt={fileName}
            className="max-h-full max-w-full object-contain select-none"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

export function SecureAlbum({ fileId, fileName, token }: SecureMediaProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [activeImageLoading, setActiveImageLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'slideshow' | 'grid'>('slideshow');

  // Load files in the folder
  useEffect(() => {
    let active = true;
    async function fetchFolderFiles() {
      setLoading(true);
      setError(null);
      try {
        const q = encodeURIComponent(`'${fileId}' in parents and trashed = false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,size)&pageSize=100&orderBy=name`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Fehler beim Laden (${response.status})`);
        }

        const data = await response.json();
        // Filter for images or videos or generic files
        const mediaFiles = (data.files || []).filter((f: any) => 
          f.mimeType.startsWith('image/') || 
          f.mimeType.startsWith('video/') ||
          /\.(png|jpe?g|gif|svg|webp|mp4|webm)$/i.test(f.name)
        );

        if (active) {
          setFiles(mediaFiles);
          if (mediaFiles.length > 0) {
            setActiveIndex(0);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Ordner-Inhalt konnte nicht geladen werden.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (fileId && token) {
      fetchFolderFiles();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [fileId, token]);

  // Load high-resolution active image as blob
  useEffect(() => {
    if (files.length === 0 || activeIndex >= files.length) {
      setActiveImageUrl(null);
      return;
    }

    const activeFile = files[activeIndex];
    
    // If it's a video, we don't need blob for image preview
    if (activeFile.mimeType.startsWith('video/')) {
      setActiveImageUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    async function fetchActiveImage() {
      setActiveImageLoading(true);
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${activeFile.id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error();
        }

        const blob = await response.blob();
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setActiveImageUrl(objectUrl);
        }
      } catch (err) {
        // Fallback to high quality thumbnail if blob fetching failed
        if (active) {
          const fallbackUrl = activeFile.thumbnailLink 
            ? activeFile.thumbnailLink.replace(/=s\d+/, '=s800') 
            : null;
          setActiveImageUrl(fallbackUrl);
        }
      } finally {
        if (active) {
          setActiveImageLoading(false);
        }
      }
    }

    fetchActiveImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [files, activeIndex, token]);

  if (loading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center gap-2 font-sans text-slate-500 bg-slate-50/35 rounded-xl border border-slate-100/50">
        <Loader2 className="w-5 h-5 animate-spin text-[#0288D1]" />
        <span className="text-xs font-semibold">Lade Album-Inhalte aus Google Drive...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50/30 border border-red-100/60 rounded-xl text-xs text-red-500 font-sans flex flex-col gap-1.5 mt-1">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>Fehler beim Laden des Albums: {error}</span>
        </div>
        <p className="text-[10px] text-red-650 opacity-90 leading-relaxed">
          Stelle sicher, dass der Ordner freigegeben oder das Google OAuth-Token gültig ist.
        </p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="w-full py-8 px-4 flex flex-col items-center justify-center gap-2 text-center text-slate-500 bg-slate-50/20 rounded-xl border border-dashed border-slate-200 font-sans">
        <ImageIcon className="w-8 h-8 text-slate-300" />
        <h5 className="text-xs font-bold text-slate-700">Leeres Album</h5>
        <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
          In diesem Drive-Ordner wurden keine kompatiblen Fotos oder Videos für das Album gefunden.
        </p>
      </div>
    );
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % files.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const activeFile = files[activeIndex];
  const isVideo = activeFile.mimeType.startsWith('video/');

  return (
    <div className="w-full flex flex-col gap-3.5 font-sans mt-0.5">
      {/* Title & Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-slate-500">
            {files.length} Medien im Album gefunden
          </span>
        </div>
        
        {/* Toggle between Slideshow and Grid views */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200/50">
          <button
            onClick={() => setViewMode('slideshow')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
              viewMode === 'slideshow' 
                ? 'bg-white text-[#0288D1] shadow-3xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Diashow
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
              viewMode === 'grid' 
                ? 'bg-white text-[#0288D1] shadow-3xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Galerie
          </button>
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'slideshow' ? (
        <div className="flex flex-col gap-2.5">
          {/* Slideshow Display */}
          <div className="relative aspect-video max-h-[460px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-950 shadow-inner group">
            {activeImageLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}

            {isVideo ? (
              // Secure Video Rendering inside Slideshow
              <div className="w-full h-full flex items-center justify-center">
                <SecureVideoPlayer 
                  fileId={activeFile.id} 
                  fileName={activeFile.name} 
                  token={token} 
                />
              </div>
            ) : activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={activeFile.name}
                className="max-h-full max-w-full object-contain select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <ImageIcon className="w-8 h-8 opacity-60" />
                <span className="text-[10px]">Bild wird vorbereitet...</span>
              </div>
            )}

            {/* Left / Right Navigation Overlay */}
            {files.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 duration-200 shadow-sm border border-white/5 active:scale-95 transition-all"
                  title="Vorheriges"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 duration-200 shadow-sm border border-white/5 active:scale-95 transition-all"
                  title="Nächstes"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Caption Overlay */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-6 flex flex-col">
              <span className="text-[10px] text-white/95 font-bold truncate">
                {activeFile.name}
              </span>
              <span className="text-[9px] text-white/55 font-mono mt-0.5">
                Datei {activeIndex + 1} von {files.length}
              </span>
            </div>
          </div>

          {/* Filmstrip Thumbnails Row */}
          {files.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
              {files.map((file, idx) => {
                const isActive = idx === activeIndex;
                const isItemVideo = file.mimeType.startsWith('video/');
                return (
                  <button
                    key={file.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-12 h-12 rounded overflow-hidden border shrink-0 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-[#0288D1] ring-2 ring-sky-300/40 opacity-100' 
                        : 'border-slate-200 hover:border-slate-350 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {isItemVideo ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    ) : file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink.replace(/=s\d+/, '=s100')}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Grid Gallery Display
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[460px] overflow-y-auto pr-1 pb-1">
          {files.map((file, idx) => {
            const isItemVideo = file.mimeType.startsWith('video/');
            return (
              <div
                key={file.id}
                onClick={() => {
                  setActiveIndex(idx);
                  setViewMode('slideshow');
                }}
                className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100 hover:border-sky-400 hover:shadow-2xs cursor-pointer transition-all"
              >
                {isItemVideo ? (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-1.5 p-2 transition-colors">
                    <Video className="w-6 h-6 text-white group-hover:scale-105 transition-transform" />
                    <span className="text-[9px] text-center font-bold tracking-tight text-white/85 line-clamp-1 truncate w-full px-1">{file.name}</span>
                  </div>
                ) : file.thumbnailLink ? (
                  <>
                    <img
                      src={file.thumbnailLink.replace(/=s\d+/, '=s250')}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 translate-y-full group-hover:translate-y-0 transition-all duration-200">
                      <span className="text-[9px] text-white block truncate font-bold">{file.name}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400 gap-1">
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                    <span className="text-[9px] text-center block leading-none truncate w-full">{file.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
