/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getAllPages, 
  savePage, 
  deletePageFromDB, 
  createWelcomePage, 
  generateId 
} from './lib/db';
import { WorkspacePage, Block } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import LandingPage from './components/LandingPage';
import DriveExplorer from './components/DriveExplorer';
import { HelpCircle, FolderSync, Info, Plus, Sparkles } from 'lucide-react';
import { initAuth, logout } from './lib/googleAuth';
import { executeDriveSync } from './lib/driveSync';

export default function App() {
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'synced' | 'error'>('offline');
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auth synchronization inside App
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, activeToken) => {
        setUser(currentUser);
        setToken(activeToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setSyncStatus('offline');
      }
    );
    return () => unsubscribe();
  }, []);

  // Trigger automatic synchronization when token becomes available
  useEffect(() => {
    if (!token || isLoading) return;

    async function runInitialSync() {
      setSyncStatus('syncing');
      try {
        console.log('[Sync] Initializing automatic sync with Google Drive appDataFolder...');
        const stats = await executeDriveSync(token!, pages);
        
        if (stats.localUpdated) {
          console.log('[Sync] Writing remote updates and new pages to local IndexedDB...');
          for (const page of stats.pages) {
            await savePage(page);
          }
          setPages(stats.pages);
        }
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('[Sync] Initial sync failed:', err);
        setSyncStatus('error');
        
        // Handle unauthorized or invalid tokens automatically
        const isUnauthorized = err?.message?.includes('401') || err?.message?.includes('Unauthorized');
        if (isUnauthorized) {
          console.warn('[Sync] Unauthorized error detected. Discarding cached login token to prompt re-login.');
          await logout();
        }
      }
    }

    runInitialSync();
  }, [token, isLoading]);

  // Synchronize state with popstate browser navigation events
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Initialize and load pages from IndexedDB
  useEffect(() => {
    async function initAndLoad() {
      try {
        setIsLoading(true);
        let loadedPages = await getAllPages();
        
        // Seed database if empty
        if (loadedPages.length === 0) {
          const welcome = createWelcomePage();
          await savePage(welcome);
          loadedPages = [welcome];
        }

        setPages(loadedPages);

        // If the path name is currently /Willkommen, set the active page id to the first page.
        // If it is anything else, we will show the landing page.
        const isWorkspacePath = window.location.pathname.toLowerCase() === '/willkommen';
        if (isWorkspacePath) {
          if (loadedPages.length > 0) {
            setActivePageId(loadedPages[0].id);
          }
        } else {
          setActivePageId(null);
        }
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAndLoad();
  }, []);

  const handleTriggerSyncSetup = () => {
    setShowSyncInfoModal(true);
  };

  // Create a new blank page
  const handleCreatePage = async () => {
    const now = Date.now();
    const newPage: WorkspacePage = {
      id: generateId(),
      title: 'Neue Seite',
      icon: '📝',
      createdAt: now,
      updatedAt: now,
      blocks: [
        {
          id: generateId(),
          type: 'heading1',
          content: 'Neue Seite 📝',
        },
        {
          id: generateId(),
          type: 'text',
          content: 'Schreibe hier etwas nützliches ... Füge neue Blöcke hinzu oder verknüpfe ein Google Drive Dokument am Ende der Seite.',
        }
      ]
    };

    try {
      await savePage(newPage);
      const updatedList = [newPage, ...pages];
      setPages(updatedList);
      setActivePageId(newPage.id);
      navigate('/Willkommen');

      if (token) {
        setSyncStatus('syncing');
        try {
          await executeDriveSync(token, updatedList);
          setSyncStatus('synced');
        } catch (syncErr: any) {
          console.error('[Sync] Background page creation sync failed:', syncErr);
          setSyncStatus('error');
          const isUnauthorized = syncErr?.message?.includes('401') || syncErr?.message?.includes('Unauthorized');
          if (isUnauthorized) {
            console.warn('[Sync] Unauthorized token detected. Clearing cached session.');
            await logout();
          }
        }
      }
    } catch (err) {
      console.error('Konnte neue Seite nicht in IndexedDB sichern:', err);
    }
  };

  // Delete page
  const handleDeletePage = async (id: string) => {
    const isConfirmed = window.confirm('Möchtest du diese Seite wirklich unwiderruflich aus deiner lokalen IndexedDB und Google Drive Cloud löschen?');
    if (!isConfirmed) return;

    try {
      await deletePageFromDB(id);
      let updatedList = pages.filter(p => p.id !== id);
      
      let finalActivePageId = activePageId;
      if (activePageId === id) {
        if (updatedList.length > 0) {
          finalActivePageId = updatedList[0].id;
        } else {
          const welcome = createWelcomePage();
          await savePage(welcome);
          updatedList = [welcome];
          finalActivePageId = welcome.id;
        }
      }

      setPages(updatedList);
      setActivePageId(finalActivePageId);

      if (token) {
        setSyncStatus('syncing');
        try {
          await executeDriveSync(token, updatedList, true); // Force overwrite to reflect the deletion
          setSyncStatus('synced');
        } catch (syncErr: any) {
          console.error('[Sync] Background deletion sync failed:', syncErr);
          setSyncStatus('error');
          const isUnauthorized = syncErr?.message?.includes('401') || syncErr?.message?.includes('Unauthorized');
          if (isUnauthorized) {
            console.warn('[Sync] Unauthorized token detected. Clearing cached session.');
            await logout();
          }
        }
      }
    } catch (err) {
      console.error('Fehler beim Löschen der Seite:', err);
    }
  };

  // Update page blocks
  const handleUpdatePage = async (updatedPage: WorkspacePage) => {
    try {
      const updatedList = pages.map(p => p.id === updatedPage.id ? updatedPage : p);
      setPages(updatedList);
      await savePage(updatedPage);

      if (token) {
        setSyncStatus('syncing');
        try {
          await executeDriveSync(token, updatedList);
          setSyncStatus('synced');
        } catch (syncErr: any) {
          console.error('[Sync] Background update sync failed:', syncErr);
          setSyncStatus('error');
          const isUnauthorized = syncErr?.message?.includes('401') || syncErr?.message?.includes('Unauthorized');
          if (isUnauthorized) {
            console.warn('[Sync] Unauthorized token detected. Clearing cached session.');
            await logout();
          }
        }
      }
    } catch (err) {
      console.error('Fehler beim Sichern der Seite in IndexedDB:', err);
    }
  };

  const activePage = pages.find(p => p.id === activePageId) || pages[0] || null;

  const isWorkspacePath = currentPath.toLowerCase() === '/willkommen';

  if (!isWorkspacePath) {
    return (
      <div id="landing-page-root" className="flex h-screen w-screen overflow-hidden bg-slate-50">
        <LandingPage 
          onStartCreating={async () => {
            // Pick or create first page
            let pageId = activePageId;
            if (!pageId || pageId === 'landing') {
              if (pages.length > 0) {
                pageId = pages[0].id;
              } else {
                await handleCreatePage();
                return;
              }
            }
            setActivePageId(pageId);
            navigate('/Willkommen');
          }}
          onConnectDrive={handleTriggerSyncSetup}
        />

        {/* Cloud Sync Information Onboarding Modal */}
        {showSyncInfoModal && (
          <div className="fixed inset-0 bg-notion-text/40 flex items-center justify-center p-4 z-55 backdrop-blur-2xs animate-in fade-in transition-all">
            <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-lg border border-notion-border animate-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-2.5 mb-3 text-accent-blue font-sans">
                <FolderSync className="w-6 h-6" />
                <h3 className="text-base font-bold text-notion-text leading-tight">Bring Your Own Cloud (Google Drive)</h3>
              </div>
              
              <p className="text-xs text-notion-secondary leading-relaxed mb-4">
                Als nächster logischer Architekturschritt wird dein persönliches Google Drive als Synchronisationspartner angebunden.
              </p>

              <div className="space-y-2 bg-notion-sidebar p-3.5 rounded border border-notion-border text-xs text-notion-text mb-4">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-accent-blue select-none">1.</span>
                  <span><strong>Privater App-Ordner:</strong> Die App speichert dorthin die Struktur als JSON-Dateien im verborgenen <code>appdata</code> Ordner.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-accent-blue select-none">2.</span>
                  <span><strong>Keine Datenlecks:</strong> Die Dateien liegen 100% in deinem Drive. Fremde Server haben keinen Zugriff.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-accent-blue select-none">3.</span>
                  <span><strong>Sicherer Embed:</strong> Google Picker liest Dokumente niemals direkt ein, sondern liefert nur die ID für den sicheren iFrame Preview.</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded p-2 mb-4">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Wir starten mit Schritt #1 (Lokaler Speicher). Bist du bereit, OAuth hinzuzufügen?</span>
              </div>

              <div className="flex justify-end space-x-2.5">
                <button
                  onClick={() => setShowSyncInfoModal(false)}
                  className="px-3.5 py-1.5 border border-notion-border text-notion-secondary hover:bg-notion-sidebar rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Weiter lokal arbeiten
                </button>
                <button
                  onClick={() => {
                    setShowSyncInfoModal(false);
                    setActivePageId('drive-explorer');
                    navigate('/Willkommen');
                  }}
                  className="px-3.5 py-1.5 bg-accent-blue hover:opacity-90 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Verstanden, weiter geht's!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="app-container" className="flex h-screen w-screen overflow-hidden bg-notion-bg text-notion-text font-sans">
      
      {/* Sidebar Component */}
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        onSelectPage={(id) => {
          if (id === 'landing') {
            navigate('/');
          } else {
            setActivePageId(id);
          }
        }}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSyncSetup}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-notion-bg">
        
        {/* Navigation Bar (45px strictly detailed matching Geometric Balance top-nav) */}
        <header className="h-[45px] border-b border-notion-border flex items-center justify-between px-4 shrink-0 z-10 bg-notion-bg select-none">
          <div className="flex items-center space-x-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 text-notion-secondary hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] rounded cursor-pointer mr-1.5 transition-all text-xs font-bold"
                title="Sidebar einblenden"
              >
                📂 Sidebar zeigen
              </button>
            )}
            <div className="flex items-center space-x-1.5 text-xs text-notion-secondary">
              <span>Privat</span>
              <span>/</span>
              <span className="text-notion-text font-medium truncate max-w-[200px]">
                {activePageId === 'drive-explorer' 
                  ? '📅 Drive-Organisator' 
                  : activePage 
                  ? activePage.title 
                  : 'Wähle eine Seite'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Status Badge according to the live sync status */}
            {syncStatus === 'offline' && (
              <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
                <span>IndexedDB Aktiv (Privat)</span>
              </div>
            )}
            {syncStatus === 'syncing' && (
              <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E1F5FE] text-[#0288D1] border border-[#B3E5FC]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1] inline-block animate-pulse"></span>
                <span>🔄 Drive-Sync läuft...</span>
              </div>
            )}
            {syncStatus === 'synced' && (
              <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>🌐 GDrive Cloud-Sync aktiv (100% Privat)</span>
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                <span>⚠️ Sync-Abbruch</span>
              </div>
            )}
            
            <button
              onClick={handleTriggerSyncSetup}
              className="text-xs font-bold text-accent-blue hover:opacity-80 flex items-center gap-1 cursor-pointer"
            >
              <span>Sync Infos</span>
            </button>
          </div>
        </header>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-notion-bg">
            <div className="h-6.5 w-6.5 border-2 border-notion-border border-t-accent-blue rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-notion-secondary font-mono">Bereite Workspace vor ...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-notion-bg flex flex-col">
            {activePageId === 'drive-explorer' ? (
              <DriveExplorer 
                onBackToLocal={() => {
                  if (pages.length > 0) {
                    setActivePageId(pages[0].id);
                  } else {
                    setActivePageId(null);
                  }
                }}
              />
            ) : activePage ? (
              <Editor
                page={activePage}
                onUpdatePage={handleUpdatePage}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-notion-bg">
                <p className="text-notion-secondary text-xs mb-3">Keine aktive Seite gelistet.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="px-3.5 py-1.5 border border-notion-border text-notion-text rounded-[4px] text-xs font-semibold shadow-xs hover:bg-notion-sidebar cursor-pointer transition-colors"
                  >
                    🚀 Zur Startseite
                  </button>
                  <button
                    onClick={handleCreatePage}
                    className="px-3.5 py-1.5 bg-accent-blue hover:opacity-90 text-white rounded-[4px] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Neue Seite erstellen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cloud Sync Information Onboarding Modal */}
      {showSyncInfoModal && (
        <div className="fixed inset-0 bg-notion-text/40 flex items-center justify-center p-4 z-55 backdrop-blur-2xs animate-in fade-in transition-all">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-lg border border-notion-border animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 mb-3 text-accent-blue">
              <FolderSync className="w-6 h-6" />
              <h3 className="text-base font-bold text-notion-text leading-tight">Bring Your Own Cloud (Google Drive)</h3>
            </div>
            
            <p className="text-xs text-notion-secondary leading-relaxed mb-4">
              Als nächster logischer Architekturschritt wird dein persönliches Google Drive als Synchronisationspartner angebunden.
            </p>

            <div className="space-y-2 bg-notion-sidebar p-3.5 rounded border border-notion-border text-xs text-notion-text mb-4">
              <div className="flex items-start gap-2">
                <span className="font-bold text-accent-blue select-none">1.</span>
                <span><strong>Privater App-Ordner:</strong> Die App speichert dorthin die Struktur als JSON-Dateien im verborgenen <code>appdata</code> Ordner.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-accent-blue select-none">2.</span>
                <span><strong>Keine Datenlecks:</strong> Die Dateien liegen 100% in deinem Drive. Fremde Server haben keinen Zugriff.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-accent-blue select-none">3.</span>
                <span><strong>Sicherer Embed:</strong> Google Picker liest Dokumente niemals direkt ein, sondern liefert nur die ID für den sicheren iFrame Preview.</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded p-2 mb-4">
              <Info className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Wir starten mit Schritt #1 (Lokaler Speicher). Bist du bereit, OAuth hinzuzufügen?</span>
            </div>

            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => setShowSyncInfoModal(false)}
                className="px-3.5 py-1.5 border border-notion-border text-notion-secondary hover:bg-notion-sidebar rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Weiter lokal arbeiten
              </button>
              <button
                onClick={() => {
                  setShowSyncInfoModal(false);
                  setActivePageId('drive-explorer');
                  navigate('/Willkommen');
                }}
                className="px-3.5 py-1.5 bg-accent-blue hover:opacity-90 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Verstanden, weiter geht's!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
