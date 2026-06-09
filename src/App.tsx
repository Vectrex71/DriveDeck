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
import { WorkspacePage, Block, ProjectAlbum } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import LandingPage from './components/LandingPage';
import StickyNotes from './components/StickyNotes';
import GoogleTasks from './components/GoogleTasks';
import SettingsPage from './components/SettingsPage';
import Library from './components/Library';
import Photos from './components/Photos';
import { HelpCircle, FolderSync, Info, Plus, Sparkles, User, Share2, Loader2, Eye, Edit3, AlertTriangle } from 'lucide-react';
import { initAuth, logout, googleSignIn, googleSignInRedirect, handleRedirectResult } from './lib/googleAuth';
import { executeDriveSync, executeAlbumsSync, sharePageOnDrive, shareAlbumOnDrive, downloadSharedFile } from './lib/driveSync';

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
  const [signInError, setSignInError] = useState<{ code?: string; message: string; showRedirectSuggestion?: boolean } | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      return localStorage.getItem('drivedeck_is_premium') === 'true';
    } catch {
      return false;
    }
  });
  const [stripeNotification, setStripeNotification] = useState<{ type: 'success' | 'cancel'; message: string } | null>(null);

  // Sharing states (Option B)
  const [sharedFileId, setSharedFileId] = useState<string | null>(null);
  const [isDownloadingSharedFile, setIsDownloadingSharedFile] = useState<boolean>(false);
  const [sharedData, setSharedData] = useState<any | null>(null);
  const [sharedFileError, setSharedFileError] = useState<string | null>(null);
  const [showSharedImportModal, setShowSharedImportModal] = useState<boolean>(false);

  // Sharing feedback states
  const [sharingPageId, setSharingPageId] = useState<string | null>(null);
  const [sharingAlbumId, setSharingAlbumId] = useState<string | null>(null);
  const [shareResultUrl, setShareResultUrl] = useState<string | null>(null);
  const [showShareResultModal, setShowShareResultModal] = useState<boolean>(false);
  const [shareRole, setShareRole] = useState<'reader' | 'writer'>('reader');
  const [shareStep, setShareStep] = useState<'setup' | 'loading' | 'ready'>('setup');

  // Custom simulator-safe confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    isAlert?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText = 'Bestätigen',
    cancelText = 'Abbrechen',
    isAlert = false
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isAlert,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      }
    });
  };

  // Trial limitations states (3 months free, tracked via Google registration creationTime)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);
  const [showTrialPopup, setShowTrialPopup] = useState<boolean>(false);
  const [trialNotificationType, setTrialNotificationType] = useState<'expired' | 'warning' | null>(null);

  useEffect(() => {
    if (!user) {
      setTrialDaysLeft(null);
      setIsTrialExpired(false);
      setShowTrialPopup(false);
      setTrialNotificationType(null);
      return;
    }

    // Get creation time or fallback to a local storage timestamp if undefined (to be fully safe)
    let signupTime = 0;
    try {
      if (user.metadata?.creationTime) {
        signupTime = new Date(user.metadata.creationTime).getTime();
      }
    } catch (e) {
      console.warn('[Sync] Could not parse creationTime:', e);
    }

    if (signupTime === 0) {
      // Fallback: Store the first time we see this user to track local trial
      const key = `drivedeck_signup_time_${user.uid || 'default'}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        signupTime = parseInt(cached, 10);
      } else {
        signupTime = Date.now();
        localStorage.setItem(key, signupTime.toString());
      }
    }

    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const elapsedMs = Date.now() - signupTime;
    const daysLeft = Math.ceil((ninetyDaysMs - elapsedMs) / (24 * 60 * 60 * 1000));

    if (elapsedMs > ninetyDaysMs) {
      setIsTrialExpired(true);
      setTrialDaysLeft(0);
    } else {
      setIsTrialExpired(false);
      setTrialDaysLeft(daysLeft > 0 ? daysLeft : 0);
    }
  }, [user]);

  // Trigger popup once per session when user, isPremium, and trial calculations are ready
  useEffect(() => {
    if (!user || isPremium || trialDaysLeft === null) {
      return;
    }

    const sessionKey = `drivedeck_trial_pop_notified_${user.uid || 'default'}`;
    const alreadyNotified = sessionStorage.getItem(sessionKey);
    if (alreadyNotified) return;

    if (isTrialExpired) {
      setTrialNotificationType('expired');
      setShowTrialPopup(true);
      sessionStorage.setItem(sessionKey, 'true');
    } else if (trialDaysLeft <= 30) {
      setTrialNotificationType('warning');
      setShowTrialPopup(true);
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [user, isPremium, trialDaysLeft, isTrialExpired]);

  // Albums state initialization and sync with localStorage
  const [albums, setAlbums] = useState<ProjectAlbum[]>(() => {
    try {
      const saved = localStorage.getItem('drivedeck_albums');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading albums:', e);
    }
    return [
      {
        id: 'welcome-project',
        name: 'Willkommen',
        createdAt: Date.now()
      }
    ];
  });

  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('drivedeck_active_album_id');
      if (saved) return saved;
    } catch (e) {}
    return 'welcome-project';
  });

  useEffect(() => {
    try {
      localStorage.setItem('drivedeck_albums', JSON.stringify(albums));
    } catch (e) {}
  }, [albums]);

  useEffect(() => {
    try {
      if (activeAlbumId) {
        localStorage.setItem('drivedeck_active_album_id', activeAlbumId);
      } else {
        localStorage.removeItem('drivedeck_active_album_id');
      }
    } catch (e) {}
  }, [activeAlbumId]);

  // Handle Stripe Session Verification on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('stripe_success') === 'true';
    const cancel = params.get('stripe_cancel') === 'true';
    const sessionId = params.get('session_id');

    if (success && sessionId) {
      setStripeNotification({ type: 'success', message: 'Zahlungsverifizierung läuft...' });
      
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsPremium(true);
            try {
              localStorage.setItem('drivedeck_is_premium', 'true');
            } catch (e) {}
            setStripeNotification({ 
              type: 'success', 
              message: 'Vielen Dank! Dein Premium-Zugang wurde erfolgreich freigeschaltet.' 
            });
          } else {
            setStripeNotification({ 
              type: 'cancel', 
              message: 'Die Verifizierung von Stripe ist fehlgeschlagen oder noch nicht freigegeben.' 
            });
          }
        })
        .catch(err => {
          console.error('[Stripe Verifying Interface Error]:', err);
          setStripeNotification({ 
            type: 'cancel', 
            message: 'Es gab ein Problem beim Abfragen deines Checkout-Status.' 
          });
        });

      // Maintain a clean address bar without query parameters
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    } else if (cancel) {
      setStripeNotification({ 
        type: 'cancel', 
        message: 'Das Premium-Upgrade wurde abgebrochen.' 
      });
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  // --- SHARING INTEGRATION (OPTION B) ---

  // Check URL search parameters on boot/mount for sharedFileId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sfId = params.get('sharedFileId') || params.get('sharePageId') || params.get('shareAlbumId') || params.get('sharedId');
    if (sfId) {
      console.log('[Share] Found sharedFileId in URL on load:', sfId);
      setSharedFileId(sfId);
      setShowSharedImportModal(true);
      // Clean query parameters from address bar to keep things tidy
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  // Fetch shared file details from Google Drive when fileId and token are both available
  useEffect(() => {
    if (!sharedFileId || !token) return;

    async function loadSharedData() {
      setIsDownloadingSharedFile(true);
      setSharedFileError(null);
      try {
        console.log('[Share] Downloading shared file content for ID:', sharedFileId);
        const data = await downloadSharedFile(token!, sharedFileId!);
        if (data && (data.type === 'page' || data.type === 'album')) {
          setSharedData(data);
        } else {
          throw new Error('Ungültiges Format für die freigegebenen DriveDeck-Daten.');
        }
      } catch (err: any) {
        console.error('[Share] Failed to download shared file:', err);
        setSharedFileError(
          err?.message || 'Diese Datei konnte nicht geladen werden. Bitte stelle sicher, dass der Link gültig ist und das Google Drive Dokument öffentlich zugänglich ist.'
        );
      } finally {
        setIsDownloadingSharedFile(false);
      }
    }

    loadSharedData();
  }, [sharedFileId, token]);

  // Handle sharing of individual Page (Setup phase)
  const handleSharePage = async (pageId: string) => {
    if (!token) {
      alert('Bitte verbinde dich zuerst oben rechts mit deinem Google-Konto, um Dokumente teilen zu können!');
      return;
    }
    const targetPage = pages.find(p => p.id === pageId);
    if (!targetPage) {
      alert('Die zu teilende Seite existiert nicht.');
      return;
    }

    setSharingPageId(pageId);
    setSharingAlbumId(null);
    setShareResultUrl(null);
    setShareRole('reader');
    setShareStep('setup');
    setShowShareResultModal(true);
  };

  // Handle sharing of entire Album (Project folder including all child pages - Setup phase)
  const handleShareAlbum = async (albumId: string) => {
    if (!token) {
      alert('Bitte verbinde dich zuerst oben rechts mit deinem Google-Konto, um Alben teilen zu können!');
      return;
    }
    const targetAlbum = albums.find(a => a.id === albumId);
    if (!targetAlbum) {
      alert('Das zu teilende Album existiert nicht.');
      return;
    }

    setSharingAlbumId(albumId);
    setSharingPageId(null);
    setShareResultUrl(null);
    setShareRole('reader');
    setShareStep('setup');
    setShowShareResultModal(true);
  };

  // Triggers the actual upload/sharing on Google Drive with chosen permission role
  const executeSharing = async () => {
    if (!token) return;

    setShareStep('loading');

    if (sharingPageId) {
      const targetPage = pages.find(p => p.id === sharingPageId);
      if (!targetPage) {
        alert('Die zu teilende Seite existiert nicht.');
        setShowShareResultModal(false);
        setSharingPageId(null);
        return;
      }

      try {
        console.log('[Share] Creating public share for page:', targetPage.title, 'with role:', shareRole);
        const res = await sharePageOnDrive(token, targetPage, shareRole);
        const shareUrl = `${window.location.protocol}//${window.location.host}?sharedFileId=${res.fileId}`;
        setShareResultUrl(shareUrl);
        setShareStep('ready');
      } catch (err: any) {
        console.error('[Share] Error sharing page:', err);
        setShowShareResultModal(false);
        setSharingPageId(null);
        alert(`Fehler beim Freigeben der Seite: ${err.message || err}`);
      }
    } else if (sharingAlbumId) {
      const targetAlbum = albums.find(a => a.id === sharingAlbumId);
      if (!targetAlbum) {
        alert('Das zu teilende Album existiert nicht.');
        setShowShareResultModal(false);
        setSharingAlbumId(null);
        return;
      }

      try {
        console.log('[Share] Creating public share for project folder:', targetAlbum.name, 'with role:', shareRole);
        const res = await shareAlbumOnDrive(token, targetAlbum, pages, shareRole);
        const shareUrl = `${window.location.protocol}//${window.location.host}?sharedFileId=${res.fileId}`;
        setShareResultUrl(shareUrl);
        setShareStep('ready');
      } catch (err: any) {
        console.error('[Share] Error sharing album:', err);
        setShowShareResultModal(false);
        setSharingAlbumId(null);
        alert(`Fehler beim Freigeben des Projektordners: ${err.message || err}`);
      }
    }
  };

  // Handles importing of parsed shared item (page / album)
  const handleImportSharedData = async () => {
    if (!checkDataCreationAllowed()) {
      setShowShareResultModal(false); // Close the share result modal to show the subscription paywall
      return;
    }
    if (!sharedData) return;

    try {
      if (sharedData.type === 'page') {
        const sourcePage = sharedData.page;
        const newPageId = `page_${Date.now()}_shared`;
        const newPage: WorkspacePage = {
          ...sourcePage,
          id: newPageId,
          albumId: activeAlbumId === 'sticky-notes' || activeAlbumId === 'tasks' || activeAlbumId === 'photos' ? 'welcome-project' : (activeAlbumId || 'welcome-project'),
          isSubscription: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await savePage(newPage);
        setPages(prev => [newPage, ...prev]);
        setActivePageId(newPageId);
        setCurrentPath(`/page/${newPageId}`);
        navigate(`/page/${newPageId}`);
      } else if (sharedData.type === 'album') {
        const sourceAlbum = sharedData.album;
        const sourcePages = sharedData.pages || [];

        const newAlbumId = `album_${Date.now()}_shared`;
        const newAlbum: ProjectAlbum = {
          id: newAlbumId,
          name: `${sourceAlbum.name} (Abonnement)`,
          color: sourceAlbum.color || '#3b82f6',
          icon: sourceAlbum.icon || '📁',
          isSubscription: true,
          createdAt: Date.now(),
          pinned: true
        };

        // Add to albums state
        setAlbums(prev => [...prev, newAlbum]);

        // Duplicating child pages
        const importedPages: WorkspacePage[] = [];
        for (const page of sourcePages) {
          const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const newPage: WorkspacePage = {
            ...page,
            id: pageId,
            albumId: newAlbumId,
            isSubscription: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await savePage(newPage);
          importedPages.push(newPage);
        }

        if (importedPages.length > 0) {
          setPages(prev => [...importedPages, ...prev]);
          setActivePageId(importedPages[0].id);
          setCurrentPath(`/page/${importedPages[0].id}`);
          navigate(`/page/${importedPages[0].id}`);
        }
        setActiveAlbumId(newAlbumId);
      }

      // Cleanup
      setShowSharedImportModal(false);
      setSharedFileId(null);
      setSharedData(null);
    } catch (err: any) {
      console.error('[Share] Import failed:', err);
      alert(`Import fehlgeschlagen: ${err.message || err}`);
    }
  };

  // --- END OF SHARING INTEGRATION ---

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

  // Handle redirect login check on page mount/load
  useEffect(() => {
    handleRedirectResult()
      .then((res) => {
        if (res) {
          console.log('[Auth] Successful redirect login handle:', res.user.email);
        }
      })
      .catch((err: any) => {
        console.error('[Auth] Error handling redirect result:', err);
        setSignInError({
          code: err?.code,
          message: err?.message || 'Redirect-Anmeldung fehlgeschlagen.',
          showRedirectSuggestion: false
        });
      });
  }, []);

  // Trigger automatic synchronization when token becomes available
  useEffect(() => {
    if (!token || isLoading) return;

    async function runInitialSync() {
      // Gating check: Active sync requires premium or active trial
      if (!isPremium && isTrialExpired) {
        console.warn('[Sync] Trial is expired and user is not Premium. Active sync is skipped.');
        setSyncStatus('offline');
        return;
      }

      setSyncStatus('syncing');
      try {
        console.log('[Sync] Initializing automatic sync with Google Drive appDataFolder...');
        const stats = await executeDriveSync(token!, pages);
        const albumStats = await executeAlbumsSync(token!, albums);
        
        if (stats.localUpdated) {
          console.log('[Sync] Writing remote updates and new pages to local IndexedDB...');
          for (const page of stats.pages) {
            await savePage(page);
          }
          setPages(stats.pages);
        }

        // Always set the combined local & remote merged albums list
        setAlbums(albumStats.albums);

        setSyncStatus('synced');
      } catch (err: any) {
        setSyncStatus('error');
        
        // Handle unauthorized or invalid tokens automatically
        const isUnauthorized = 
          err?.message?.includes('401') || 
          err?.message?.includes('Unauthorized') || 
          err?.message?.includes('Failed to fetch') ||
          err?.toString()?.includes('Failed to fetch');
        if (isUnauthorized) {
          console.warn('[Sync] Initial sync: Access token is expired or unauthorized (401). Clearing stale cached credentials.');
          await logout();
        } else {
          console.error('[Sync] Initial sync failed:', err);
        }
      }
    }

    runInitialSync();
  }, [token, isLoading, isPremium, isTrialExpired]);

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

  const handleBackgroundSyncError = async (scope: string, syncErr: any) => {
    setSyncStatus('error');
    const isUnauthorized = 
      syncErr?.message?.includes('401') || 
      syncErr?.message?.includes('Unauthorized') || 
      syncErr?.message?.includes('Failed to fetch') ||
      syncErr?.toString()?.includes('Failed to fetch');
    if (isUnauthorized) {
      console.warn(`[Sync] ${scope}: Stale session or unauthorized (401). Clearing credentials.`);
      await logout();
    } else {
      console.error(`[Sync] ${scope}:`, syncErr);
    }
  };

  const checkSyncAccess = (): boolean => {
    if (!token) return false;
    if (!isPremium && isTrialExpired) {
      console.warn('[Sync] Action skipped on Google Drive because free trial period (3 months) has expired and user is not Premium.');
      setSyncStatus('offline');
      return false;
    }
    return true;
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
        } else {
          // Auto-migrate: rename welcome page & assign missing album IDs to welcome-project
          let hadMigrated = false;
          for (const page of loadedPages) {
            if (page.id === 'welcome' && (page.title === 'Willkommen' || page.title === 'Willkommen 👋')) {
              page.title = 'Hier starten 👋';
              hadMigrated = true;
            }
            if (!page.albumId) {
              page.albumId = 'welcome-project';
              hadMigrated = true;
            }
          }
          if (hadMigrated) {
            for (const page of loadedPages) {
              await savePage(page);
            }
          }
        }

        setPages(loadedPages);

        // If the path name is currently /Willkommen, set the active page id to the first page.
        // If it is anything else, we will show the landing page.
        const isWorkspacePath = window.location.pathname.toLowerCase() === '/willkommen';
        if (isWorkspacePath) {
          const defaultAlbumId = localStorage.getItem('drivedeck_active_album_id') || 'welcome-project';
          const albumPages = loadedPages.filter(p => p.albumId === defaultAlbumId || (defaultAlbumId === 'welcome-project' && !p.albumId));
          if (albumPages.length > 0) {
            setActivePageId(albumPages[0].id);
          } else if (loadedPages.length > 0) {
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

  // Check if data creation is allowed (trial active or premium subscription active)
  const checkDataCreationAllowed = (): boolean => {
    if (!isPremium && isTrialExpired) {
      setTrialNotificationType('expired');
      setShowTrialPopup(true);
      return false;
    }
    return true;
  };

  // Create a new blank page
  const handleCreatePage = async () => {
    if (!checkDataCreationAllowed()) return;
    const now = Date.now();
    const newPage: WorkspacePage = {
      id: generateId(),
      title: 'Neue Seite',
      icon: '📝',
      createdAt: now,
      updatedAt: now,
      albumId: activeAlbumId || undefined,
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

      if (checkSyncAccess()) {
        setSyncStatus('syncing');
        try {
          await executeDriveSync(token!, updatedList);
          setSyncStatus('synced');
        } catch (syncErr: any) {
          await handleBackgroundSyncError('Background page creation sync failed', syncErr);
        }
      }
    } catch (err) {
      console.error('Konnte neue Seite nicht in IndexedDB sichern:', err);
    }
  };

  // Delete page
  const handleDeletePage = async (id: string) => {
    const targetPage = pages.find(p => p.id === id);
    const isSub = targetPage?.isSubscription === true;
    const confirmTitle = isSub ? 'Abonnement beenden' : 'Seite löschen';
    const confirmMsg = isSub 
      ? 'Möchtest du dieses Abonnement wirklich beenden? Die Seite wird aus deiner Liste entfernt.' 
      : 'Möchtest du diese Seite wirklich unwiderruflich aus deiner lokalen IndexedDB und Google Drive Cloud löschen?';

    showConfirm(
      confirmTitle,
      confirmMsg,
      async () => {
        try {
          await deletePageFromDB(id);
          let updatedList = pages.filter(p => p.id !== id);
          
          let finalActivePageId = activePageId;
          if (activePageId === id) {
            // Look within the same album first
            const sameAlbumPages = updatedList.filter(p => p.albumId === activeAlbumId || (activeAlbumId === 'welcome-project' && !p.albumId));
            if (sameAlbumPages.length > 0) {
              finalActivePageId = sameAlbumPages[0].id;
            } else {
              finalActivePageId = null;
            }
          }

          setPages(updatedList);
          setActivePageId(finalActivePageId);

          if (checkSyncAccess()) {
            setSyncStatus('syncing');
            try {
              await executeDriveSync(token!, updatedList, true); // Force overwrite to reflect the deletion
              setSyncStatus('synced');
            } catch (syncErr: any) {
              await handleBackgroundSyncError('Background deletion sync failed', syncErr);
            }
          }
        } catch (err) {
          console.error('Fehler beim Löschen der Seite:', err);
        }
      },
      'Löschen',
      'Abbrechen'
    );
  };

  // Select active Project Album and load its first page automatically
  const handleSelectAlbum = (albumId: string | null) => {
    setActiveAlbumId(albumId);
    
    // Choose the first page belonging to the selected album
    const albumPages = pages.filter(p => p.albumId === albumId || (albumId === 'welcome-project' && !p.albumId));
    if (albumPages.length > 0) {
      setActivePageId(albumPages[0].id);
    } else {
      setActivePageId(null);
    }
  };

  // Create a new Project Album (now supports styling covers & custom emojis)
  const handleCreateAlbum = async (name: string, color?: string, icon?: string) => {
    if (!checkDataCreationAllowed()) return;
    const newAlbum: ProjectAlbum = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      pinned: true, // Automatically pin newly created projects in Sidebar shortcuts
      color: color || 'from-sky-500 to-indigo-700',
      icon: icon || '📁'
    };
    const updatedAlbums = [...albums, newAlbum];
    setAlbums(updatedAlbums);
    setActiveAlbumId(newAlbum.id);
    setActivePageId(null); // Clear active page for the empty album so they can build pages

    if (checkSyncAccess()) {
      setSyncStatus('syncing');
      try {
        await executeAlbumsSync(token!, updatedAlbums);
        setSyncStatus('synced');
      } catch (syncErr: any) {
        await handleBackgroundSyncError('Error syncing albums on create', syncErr);
      }
    }
  };

  // Toggle the sidebar pin / shortcut status of an album
  const handleTogglePinAlbum = async (albumId: string) => {
    const updatedAlbums = albums.map(a => 
      a.id === albumId ? { ...a, pinned: !a.pinned } : a
    );
    setAlbums(updatedAlbums);

    if (checkSyncAccess()) {
      setSyncStatus('syncing');
      try {
        await executeAlbumsSync(token!, updatedAlbums, true);
        setSyncStatus('synced');
      } catch (syncErr: any) {
        await handleBackgroundSyncError('Error syncing album pin status', syncErr);
      }
    }
  };

  // Update album name, color, and emoji icon
  const handleUpdateAlbumMeta = async (albumId: string, updates: Partial<ProjectAlbum>) => {
    const updatedAlbums = albums.map(a => 
      a.id === albumId ? { ...a, ...updates } : a
    );
    setAlbums(updatedAlbums);

    if (checkSyncAccess()) {
      setSyncStatus('syncing');
      try {
        await executeAlbumsSync(token!, updatedAlbums, true);
        setSyncStatus('synced');
      } catch (syncErr: any) {
        await handleBackgroundSyncError('Error syncing album metadata', syncErr);
      }
    }
  };

  // Reorder Project Albums and save / sync
  const handleReorderAlbums = async (reorderedAlbums: ProjectAlbum[]) => {
    // Map with custom sequential coordinate indexes
    const updated = reorderedAlbums.map((album, idx) => ({
      ...album,
      position: idx,
    }));
    setAlbums(updated);

    if (checkSyncAccess()) {
      setSyncStatus('syncing');
      try {
        await executeAlbumsSync(token!, updated, true);
        setSyncStatus('synced');
      } catch (syncErr: any) {
        await handleBackgroundSyncError('Error syncing albums on reorder', syncErr);
      }
    }
  };

  // Delete Project Album and safe migrate its pages, or delete if it is a subscription
  const handleDeleteAlbum = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const isSub = album.isSubscription === true;
    const confirmTitle = isSub ? 'Abonnement beenden' : 'Projektalbum löschen';
    const confirmMsg = isSub 
      ? `Möchtest du das Abonnement "${album.name}" wirklich kündigen? Alle darin enthaltenen abonnierten Seiten werden ebenfalls entfernt.`
      : `Möchtest du das Projektalbum "${album.name}" wirklich löschen? Alle enthaltenen Seiten werden auf ein anderes Projekt übertragen.`;

    showConfirm(
      confirmTitle,
      confirmMsg,
      async () => {
        let fallbackAlbumId = 'welcome-project';
        let updatedAlbums = albums.filter(a => a.id !== albumId);

        if (updatedAlbums.length === 0) {
          // Fallback: create a fresh general workspace
          const newWorkspaceId = generateId();
          const defaultWorkspace: ProjectAlbum = {
            id: newWorkspaceId,
            name: 'Workspace',
            createdAt: Date.now(),
            pinned: true,
            color: 'from-slate-500 to-slate-700',
            icon: '📁'
          };
          updatedAlbums = [defaultWorkspace];
          fallbackAlbumId = newWorkspaceId;
        } else {
          // Fallback to the first remaining album
          fallbackAlbumId = updatedAlbums[0].id;
        }

        let updatedPages: WorkspacePage[];
        if (isSub) {
          // Delete child pages from IndexedDB
          const pagesToDelete = pages.filter(p => p.albumId === albumId);
          for (const p of pagesToDelete) {
            await deletePageFromDB(p.id);
          }
          // Remove child pages from state
          updatedPages = pages.filter(p => p.albumId !== albumId);
        } else {
          // Migrate pages to default project
          updatedPages = pages.map(p => {
            if (p.albumId === albumId || (!p.albumId && albumId === 'welcome-project')) {
              return { ...p, albumId: fallbackAlbumId };
            }
            return p;
          });

          // Save moved pages in IndexedDB
          for (const p of updatedPages) {
            const originalPage = pages.find(orig => orig.id === p.id);
            if (p.albumId === fallbackAlbumId && originalPage?.albumId !== fallbackAlbumId) {
              await savePage(p);
            }
          }
        }

        setPages(updatedPages);
        setAlbums(updatedAlbums);
        
        // Fall back to active fallback album
        handleSelectAlbum(fallbackAlbumId);

        if (checkSyncAccess()) {
          setSyncStatus('syncing');
          try {
            // Force sync albums to remove the deleted one on Google Drive
            await executeAlbumsSync(token!, updatedAlbums, true);
            // Also sync the updated pages to Google Drive since page albumIds were updated/removed!
            await executeDriveSync(token!, updatedPages, true);
            setSyncStatus('synced');
          } catch (syncErr: any) {
            await handleBackgroundSyncError('Error syncing albums on delete', syncErr);
          }
        }
      },
      'Löschen',
      'Abbrechen'
    );
  };

  // Move a page to a different Project Album
  const handleMovePageToAlbum = async (pageId: string, albumId: string) => {
    try {
      const pageToMove = pages.find(p => p.id === pageId);
      if (!pageToMove) return;

      const updatedPage = { ...pageToMove, albumId };
      await savePage(updatedPage);

      setPages(prev => prev.map(p => p.id === pageId ? updatedPage : p));

      // If active pages belong to a filtered album list and was dragged out, auto-select a sibling
      if (activeAlbumId && activeAlbumId !== albumId) {
        if (activePageId === pageId) {
          const siblingPages = pages.filter(p => p.id !== pageId && (p.albumId === activeAlbumId || (activeAlbumId === 'welcome-project' && !p.albumId)));
          if (siblingPages.length > 0) {
            setActivePageId(siblingPages[0].id);
          } else {
            setActivePageId(null);
          }
        }
      }
    } catch (err) {
      console.error('Fehler beim Verschieben der Seite:', err);
    }
  };

  // Update page blocks
  const handleUpdatePage = async (updatedPage: WorkspacePage) => {
    try {
      const updatedList = pages.map(p => p.id === updatedPage.id ? updatedPage : p);
      setPages(updatedList);
      await savePage(updatedPage);

      if (checkSyncAccess()) {
        setSyncStatus('syncing');
        try {
          await executeDriveSync(token!, updatedList);
          setSyncStatus('synced');
        } catch (syncErr: any) {
          await handleBackgroundSyncError('Background update sync failed', syncErr);
        }
      }
    } catch (err) {
      console.error('Fehler beim Sichern der Seite in IndexedDB:', err);
    }
  };

  const activePage = pages.find(p => p.id === activePageId) || pages[0] || null;

  const isWorkspacePath = currentPath.toLowerCase() === '/willkommen';
  const isAuthenticated = !!user && !!token;

  if (!isWorkspacePath || !isAuthenticated) {
    return (
      <div id="landing-page-root" className="flex h-screen w-screen overflow-hidden bg-slate-50">
        <LandingPage 
          onConnectDrive={async (method) => {
            setSignInError(null);
            try {
              if (method === 'redirect') {
                await googleSignInRedirect();
                return;
              }
              const res = await googleSignIn();
              if (res) {
                // Pick or create first page
                let pageId = activePageId;
                if (!pageId || pageId === 'landing') {
                  const loadedPages = pages.length > 0 ? pages : await getAllPages();
                  if (loadedPages.length > 0) {
                    pageId = loadedPages[0].id;
                  } else {
                    const welcome = createWelcomePage();
                    await savePage(welcome);
                    setPages([welcome]);
                    pageId = welcome.id;
                  }
                }
                setActivePageId(pageId);
                navigate('/Willkommen');
              }
            } catch (e: any) {
              console.error('Anmeldung fehlgeschlagen:', e);
              setSignInError({
                code: e?.code || 'auth/unauthorized-domain',
                message: e?.message || 'Die Anmeldung wurde abgebrochen.',
                showRedirectSuggestion: true
              });
            }
          }}
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

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded p-2 mb-4">
                <Info className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Google Drive-Verbindung ist aktiv! Alle deine Notizen werden automatisch synchronisiert.</span>
              </div>

              <div className="flex justify-end space-x-2.5">
                <button
                  onClick={() => setShowSyncInfoModal(false)}
                  className="px-3.5 py-1.5 bg-accent-blue hover:opacity-90 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  OK, verstanden
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
      
      {/* Shaded backdrop for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-25 transition-opacity duration-250 backdrop-blur-[1px] animate-in fade-in"
          title="Sidebar schließen"
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        onSelectPage={(id) => {
          if (id === 'landing') {
            navigate('/');
          } else {
            setActivePageId(id);
            if (window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
          }
        }}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSyncSetup}
        
        // Pass album properties
        albums={albums}
        activeAlbumId={activeAlbumId}
        onSelectAlbum={handleSelectAlbum}
        onCreateAlbum={handleCreateAlbum}
        onDeleteAlbum={handleDeleteAlbum}
        onMovePageToAlbum={handleMovePageToAlbum}
        onReorderAlbums={handleReorderAlbums}
        onSharePage={handleSharePage}
        onShareAlbum={handleShareAlbum}
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
              <span className="font-semibold text-[#0288D1] bg-sky-500/5 px-1.5 py-0.5 rounded border border-sky-400/10">
                📁 {albums.find(a => a.id === activeAlbumId)?.name || 'Workspace'}
              </span>
              <span>/</span>
              <span className="text-notion-text font-medium truncate max-w-[200px]">
                {activePageId === 'library'
                  ? 'Bibliothek'
                  : activePageId === 'sticky-notes'
                  ? 'Haftnotizen'
                  : activePageId === 'tasks'
                  ? 'DriveTasks'
                  : activePageId === 'photos'
                  ? 'Fotos'
                  : activePageId === 'settings'
                  ? 'Profil & Einstellungen'
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
            
            {/* Modern clickable profile/settings button in the top right header */}
            <button
              onClick={() => setActivePageId('settings')}
              className={`p-0.5 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                activePageId === 'settings'
                  ? 'ring-2 ring-[#0288D1] ring-offset-1'
                  : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-1'
              }`}
              title="Profil & Einstellungen öffnen"
            >
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 hover:bg-slate-200/60 transition-colors">
                  <User className="w-4.5 h-4.5 text-slate-500" />
                </div>
              )}
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
            {activePageId === 'library' ? (
              <Library 
                albums={albums}
                pages={pages}
                activeAlbumId={activeAlbumId}
                onSelectAlbum={(albumId) => {
                  handleSelectAlbum(albumId);
                }}
                onCreateAlbum={handleCreateAlbum}
                onDeleteAlbum={handleDeleteAlbum}
                onUpdateAlbumMeta={handleUpdateAlbumMeta}
                onTogglePin={handleTogglePinAlbum}
                onShareAlbum={handleShareAlbum}
              />
            ) : activePageId === 'sticky-notes' ? (
              <StickyNotes 
                isCreationBlocked={!isPremium && isTrialExpired}
                onBlockedCreation={() => {
                  setTrialNotificationType('expired');
                  setShowTrialPopup(true);
                }}
              />
            ) : activePageId === 'tasks' ? (
              <GoogleTasks showConfirm={showConfirm} />
            ) : activePageId === 'photos' ? (
              <Photos 
                token={token}
                onConnectDrive={async (method) => {
                  setSignInError(null);
                  try {
                    if (method === 'redirect') {
                      await googleSignInRedirect();
                    } else {
                      await googleSignIn();
                    }
                  } catch (e: any) {
                    console.error('Anmeldung fehlgeschlagen:', e);
                    setSignInError({
                      code: e?.code || 'auth/unauthorized-domain',
                      message: e?.message || 'Die Anmeldung wurde abgebrochen.',
                      showRedirectSuggestion: true
                    });
                  }
                }}
                showConfirm={showConfirm}
              />
            ) : activePageId === 'settings' ? (
              <SettingsPage 
                user={user}
                token={token}
                syncStatus={syncStatus}
                onConnectDrive={async (method) => {
                  setSignInError(null);
                  try {
                    if (method === 'redirect') {
                      await googleSignInRedirect();
                    } else {
                      await googleSignIn();
                    }
                  } catch (e: any) {
                    console.error('Anmeldung fehlgeschlagen:', e);
                    setSignInError({
                      code: e?.code || 'auth/unauthorized-domain',
                      message: e?.message || 'Die Anmeldung wurde abgebrochen.',
                      showRedirectSuggestion: true
                    });
                  }
                }}
                onDisconnectDrive={async () => {
                  showConfirm(
                    'Verbindung trennen',
                    'Möchtest du die Verbindung zu Google Drive trennen? Offline erstellte Texte bleiben im Browser erhalten.',
                    async () => {
                      await logout();
                    },
                    'Trennen',
                    'Abbrechen'
                  );
                }}
                isPremium={isPremium}
                onResetPremium={() => {
                  setIsPremium(false);
                  try {
                    localStorage.removeItem('drivedeck_is_premium');
                  } catch (e) {}
                  setStripeNotification({ type: 'cancel', message: 'Premium-Status erfolgreich zurückgesetzt.' });
                }}
                trialDaysLeft={trialDaysLeft}
                isTrialExpired={isTrialExpired}
              />
            ) : activePage ? (
              <Editor
                page={activePage}
                onUpdatePage={handleUpdatePage}
                showConfirm={showConfirm}
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
                  setActivePageId('settings');
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

      {/* Trial Status Notice Modal */}
      {showTrialPopup && trialNotificationType && (
        <div className="fixed inset-0 bg-notion-text/40 flex items-center justify-center p-4 z-55 backdrop-blur-2xs animate-in fade-in transition-all">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-lg border border-notion-border animate-in zoom-in-95 duration-150">
            {trialNotificationType === 'expired' ? (
              <>
                <div className="flex items-center space-x-2.5 mb-3 text-rose-600">
                  <FolderSync className="w-6 h-6 animate-pulse" />
                  <h3 className="text-base font-bold text-notion-text leading-tight">Zahlung erforderlich oder Testphase beendet 📡</h3>
                </div>
                
                <p className="text-xs text-notion-secondary leading-relaxed mb-4 text-left">
                  Deine Testphase ist beendet oder dein Premium-Abonnement konnte aufgrund eines Zahlungsproblems (z.B. neue/abgelaufene Kreditkarte oder Bankwechsel) vorübergehend nicht erneuert werden. 
                </p>

                <div className="space-y-2 bg-rose-50/50 p-3.5 rounded border border-rose-100/80 text-xs text-rose-950 mb-4 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-600 select-none">✔</span>
                    <span><strong>100% Datensicherheit:</strong> Deine bestehenden Notizen und Alben auf Google Drive sowie lokal im Browser bleiben zu 100% sicher und unverändert erhalten! Nichts wird gelöscht.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rose-600 select-none">✔</span>
                    <span><strong>Keine neuen Dokumente:</strong> Die Erstellung neuer Seiten, Alben oder Haftnotizen ist vorübergehend gesperrt. Deine Anwendung bleibt in dem aktuellen Zustand wie sie ist.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rose-600 select-none">✔</span>
                    <span><strong>Backup &amp; Export:</strong> Du kannst deinen Workspace weiterhin uneingeschränkt ansehen und deine Dokumente lokal als Standard-JSON, Markdown oder PDF exportieren.</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2.5">
                  <button
                    onClick={() => setShowTrialPopup(false)}
                    className="px-3.5 py-1.5 border border-notion-border text-notion-secondary hover:bg-notion-sidebar rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Bestehenden Workspace ansehen
                  </button>
                  <button
                    onClick={() => {
                      setShowTrialPopup(false);
                      setActivePageId('settings');
                      navigate('/Willkommen');
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer transition-all duration-150 shadow-xs"
                  >
                    Upgrade-Tarife ansehen
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2.5 mb-3 text-amber-600">
                  <FolderSync className="w-6 h-6 animate-pulse" />
                  <h3 className="text-base font-bold text-notion-text leading-tight font-sans">Deine Testphase läuft bald ab</h3>
                </div>
                
                <p className="text-xs text-notion-secondary leading-relaxed mb-4">
                  Deine 3-monatige kostenlose Testphase neigt sich dem Ende zu. Du hast aktuell noch <strong className="text-amber-800 font-extrabold">{trialDaysLeft} Tage</strong> übrig, in denen die automatische Echtzeit-Synchronisation aktiv bleibt.
                </p>

                <div className="space-y-2 bg-amber-50/50 p-3.5 rounded border border-amber-100/80 text-xs text-amber-950 mb-4">
                  <p className="font-semibold text-amber-900 leading-normal">
                    Sichere dir dauerhaften, nahtlosen Google Drive Echtzeit-Sync mit unseren flexiblen Premium-Modellen ab 4.90$ / Monat oder als praktischer Einmalkauf.
                  </p>
                </div>

                <div className="flex justify-end space-x-2.5">
                  <button
                    onClick={() => setShowTrialPopup(false)}
                    className="px-3.5 py-1.5 border border-notion-border text-notion-secondary hover:bg-notion-sidebar rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Später erinnern ({trialDaysLeft} Tage übrig)
                  </button>
                  <button
                    onClick={() => {
                      setShowTrialPopup(false);
                      setActivePageId('settings');
                      navigate('/Willkommen');
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer transition-all duration-150 shadow-xs"
                  >
                    Preise ansehen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Google Login Error / Redirect Suggestion Model */}
      {signInError && (
        <div className="fixed inset-0 bg-notion-text/40 flex items-center justify-center p-4 z-[100] backdrop-blur-2xs animate-in fade-in transition-all">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-notion-border animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 mb-3 text-rose-600">
              <FolderSync className="w-5 h-5 animate-pulse" />
              <h3 className="text-base font-bold text-notion-text leading-tight">Google-Anmeldung fehlgeschlagen</h3>
            </div>
            
            {signInError.code === 'auth/unauthorized-domain' ? (
              <div className="space-y-3.5 text-xs text-notion-text">
                <p className="text-xs text-rose-950 bg-rose-50 border border-rose-100 rounded-lg p-3 leading-relaxed">
                  <strong>⚠️ Obwohl du es eingetragen hast, blockiert Google:</strong> 
                  Deine Screenshots beweisen, dass du sowohl in Firebase als auch in Google Cloud alle Adressen korrekt eingepflegt hast. Wenn es trotzdem blockiert, liegt das an den folgenden <strong>3 extrem feinsinnigen Details</strong>:
                </p>

                <div className="space-y-3.5">
                  <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200/50 space-y-1.5 leading-relaxed">
                    <h4 className="font-bold text-amber-950">1. Die Wildcard-Falle (GCP API-Schlüssel &quot;/*&quot;):</h4>
                    <p className="text-[11px] opacity-90">
                      Der Eintrag <code className="font-mono bg-white px-1">https://drivedeck.xyz/*</code> <strong>erfordert</strong> oft zwingend, dass nach dem Schrägstrich ein Pfad steht. Bei einer Anfrage ohne Pfad (Root-Aufruf) blockiert Google!
                    </p>
                    <p className="text-[11px] font-bold text-amber-950">👉 Schnelle Lösung:</p>
                    <p className="text-[11px] opacity-90">
                      Füge deine Domains in GCP zusätzlich <strong>ohne Wildcards und Schrägstriche</strong> hinzu (z.B. <code className="font-mono bg-white px-1">https://drivedeck.xyz</code> und <code className="font-mono bg-white px-1">https://gen-lang-client-0163563504.firebaseapp.com</code>).
                    </p>
                    <p className="text-[11px] opacity-90">
                      <em>Alternativ:</em> Schalte den Schlüssel in GCP unter &quot;Anwendungseinschränkungen&quot; kurz auf <strong>&quot;Keine&quot;</strong> und klicke Speichern. Wenn es dann klappt, liegt es zu 100% am Format deiner Referrer-Liste!
                    </p>
                  </div>

                  <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-200/40 space-y-1.5 leading-relaxed">
                    <h4 className="font-bold text-sky-950">2. OAuth-Zustimmungsbildschirm (Consent Screen):</h4>
                    <p className="text-[11px] opacity-90">
                      In deiner GCP-Seitenleiste siehst du den Menüpunkt <strong>&quot;OAuth-Zustimmungsbildschirm&quot;</strong>. 
                      Scrolle dort nach unten bis zu <strong>&quot;Autorisierte Domains&quot;</strong> und stelle sicher, dass deine Domain <code className="font-mono text-sky-900 bg-white/70 px-1">drivedeck.xyz</code> (ohne Wildcard oder https://) dort eingetragen und gespeichert ist!
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 leading-relaxed">
                    <h4 className="font-bold text-slate-900">3. Inkognito-Modus testen:</h4>
                    <p className="text-[11px] opacity-90">
                      Verbindungsprobleme können durch Browser-Cache oder Cookies verfälscht werden. Öffne ein <strong>privates/Inkognito-Fenster</strong> und teste dort die Anmeldung!
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-150 p-3.5 rounded-lg space-y-2.5">
                  <span className="font-bold block text-blue-950">🚀 100% zuverlässige Ausweichlösung:</span>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Nutze die <strong>Weiterleitung (Redirect)</strong>. Anstatt eines Popups leitet dich diese direkt auf die sichere Google-Seite um und nach erfolgreicher Anmeldung wieder zurück – das umgeht Popup-Blocker und Cookie-Sperren komplett!
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setSignInError(null);
                      try {
                        await googleSignInRedirect();
                      } catch (redirectErr: any) {
                        setSignInError({
                          code: redirectErr?.code,
                          message: redirectErr?.message || 'Redirect ebenfalls fehlgeschlagen.',
                          showRedirectSuggestion: false
                        });
                      }
                    }}
                    className="w-full text-center px-4 py-2 bg-accent-blue hover:opacity-95 text-white font-bold rounded cursor-pointer shadow-xs text-xs animate-pulse"
                  >
                    Per Weiterleitung (Redirect) anmelden
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-notion-text leading-relaxed mb-3">
                  Das Google-Anmeldefenster (Popup) konnte nicht geladen werden oder hat sich sofort wieder geschlossen. Dies liegt meistens an einer der folgenden Ursachen:
                </p>

                <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-notion-secondary mb-4 leading-normal">
                  <li><strong>Popup-Blocker:</strong> Dein Browser blockiert Popups für diese Webseite (z. B. unter iOS/Safari, Brave oder Chrome Mobile).</li>
                  <li><strong>Einschränkung für Drittanbieter-Cookies:</strong> In manchen Browsern (z. B. Chrome Inkognito oder Safari &quot;Cross-Site-Tracking verhindern&quot;) werden Verbindungen zwischen verschiedenen Domains für Popups unterbunden.</li>
                  <li><strong>In Autorisierungs-Phase (Testmodus):</strong> In der aktuellen Google-Testphase muss deine E-Mail explizit als Test-User im Google Cloud-Projekt autorisiert sein.</li>
                </ul>
              </>
            )}

            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-[11px] text-rose-800 my-4 font-mono break-all leading-normal">
              <span className="font-bold">Fehler-Code:</span> {signInError.code || 'Unbekannt'}
              <br />
              <span className="font-bold">Fehler-Details:</span> {signInError.message || 'Fenster geschlossen oder geblockt.'}
            </div>

            {signInError.showRedirectSuggestion && signInError.code !== 'auth/unauthorized-domain' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-sky-950 mb-4 space-y-2">
                <span className="font-bold block text-sky-950">🚀 100% verlässliche Ausweichlösung:</span>
                <p className="leading-relaxed">
                  Nutze das <strong>Login per Weiterleitung (Redirect)</strong>. Dabei wirst du direkt auf die sichere Google-Seite weitergeleitet und kehrst nach erfolgreicher Anmeldung wieder hierher zurück. Dies umgeht Popup-Blocker und Cookie-Sperren komplett!
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setSignInError(null);
                    try {
                      await googleSignInRedirect();
                    } catch (redirectErr: any) {
                      setSignInError({
                        code: redirectErr?.code,
                        message: redirectErr?.message || 'Redirect ebenfalls fehlgeschlagen.',
                        showRedirectSuggestion: false
                      });
                    }
                  }}
                  className="w-full text-center px-4 py-2 bg-accent-blue hover:opacity-95 text-white font-bold rounded cursor-pointer shadow-xs text-xs"
                >
                  Jetzt per Weiterleitung (Redirect) anmelden
                </button>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSignInError(null)}
                className="px-3 py-1.5 border border-notion-border text-notion-secondary hover:bg-notion-sidebar rounded text-xs font-semibold cursor-pointer transition-colors"
                id="close-signin-error-modal"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SharedImportModal (Option B - Import shared doc) */}
      {showSharedImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-99 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6.5 max-w-md w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
            
            {/* Close button top right */}
            <button
              onClick={() => {
                setShowSharedImportModal(false);
                setSharedFileId(null);
                setSharedData(null);
                setSharedFileError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scenario 1: Not connected with Google */}
            {!token ? (
              <div className="space-y-4 text-center py-2 select-none">
                <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-600">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 font-sans">
                  Freigegebenes Dokument wartet! 📂
                </h2>
                <p className="text-slate-500 text-xs leading-relaxed font-sans">
                  Um geteilte Dokumente zu laden, musst du dich zuerst mit deinem Google Workspace verbinden. So wird die Datei direkt in dein eigenes Google Drive übertragen – ganz ohne teure Drittanbieter-Server.
                </p>
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      try {
                        await googleSignIn();
                      } catch (err) {
                        alert('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
                      }
                    }}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    🚀 Mit Google Drive verbinden
                  </button>
                </div>
              </div>
            ) : isDownloadingSharedFile ? (
              /* Scenario 2: Loading shared data */
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <p className="text-xs text-slate-600 font-semibold font-sans">
                  Lade freigegebene Dokumentdaten...
                </p>
                <p className="text-[10px] text-slate-400 font-sans">
                  Authentifiziere und lese sicheren DriveDeck Freigabe-Container
                </p>
              </div>
            ) : sharedFileError ? (
              /* Scenario 3: Error occurred */
              <div className="space-y-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 text-center font-sans">
                  Laden fehlgeschlagen ⚠️
                </h2>
                <p className="text-slate-600 text-xs text-center leading-relaxed bg-red-50/50 p-3 rounded-lg border border-red-100 font-sans">
                  {sharedFileError}
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      // Trigger download again by resetting state slightly
                      setSharedFileId(sharedFileId);
                    }}
                    className="flex-1 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Erneut versuchen
                  </button>
                  <button
                    onClick={() => {
                      setShowSharedImportModal(false);
                      setSharedFileId(null);
                      setSharedFileError(null);
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            ) : sharedData ? (
              /* Scenario 4: Shared data loaded, ready to import! */
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl select-none leading-none mr-2 block text-center pb-2">
                    {sharedData.type === 'page' ? (sharedData.page?.icon || '📄') : (sharedData.album?.icon || '📁')}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-sans leading-snug">
                    {sharedData.type === 'page' ? 'Einzelne Seite geteilt!' : 'Projekt-Ordner geteilt!'}
                  </h2>
                  <p className="text-slate-500 text-xs font-sans mt-0.5">
                    {sharedData.type === 'page' ? 'Eine DriveDeck-Seite importieren' : `Umfasst ${sharedData.pages?.length || 0} Seite(n)`}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl shrink-0 leading-none">
                      {sharedData.type === 'page' ? (sharedData.page?.icon || '📄') : (sharedData.album?.icon || '📁')}
                    </span>
                    <span className="font-bold text-slate-800 text-sm truncate font-sans">
                      {sharedData.type === 'page' ? sharedData.page?.title : sharedData.album?.name}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-sans">
                    {sharedData.type === 'page' 
                      ? 'Diese Notizseite wird sicher in dein aktuelles Projekt dupliziert. Bestehende Dokumente werden dabei nicht berührt.' 
                      : 'Dieser Ordner wird als neue Shortcut-Kategorie in deiner Seitenleiste erstellt und befüllt.'}
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setShowSharedImportModal(false);
                      setSharedFileId(null);
                      setSharedData(null);
                    }}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs cursor-pointer transition-all duration-150"
                  >
                    Verwerfen
                  </button>
                  <button
                    onClick={handleImportSharedData}
                    className="flex-1 py-2 bg-[#0288D1] hover:bg-[#0288D1]/90 text-white font-bold rounded-lg text-xs cursor-pointer transition-all duration-150 shadow-xs"
                  >
                    Importieren
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* ShareResultModal */}
      {showShareResultModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-99 animate-in fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6.5 max-w-md w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
            
            {shareStep === 'setup' && (
              /* Step 1: Selection showing target document information and permission settings */
              <div className="space-y-5 select-none">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-sans leading-tight">
                      Abo-Kanal konfigurieren
                    </h2>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                      {sharingPageId ? 'Einzelne Notizseite zum Abonnieren freigeben' : 'Projekt-Ordner zum Abonnieren freigeben'}
                    </p>
                  </div>
                </div>
 
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block font-sans">
                    Berechtigungen & Modus:
                  </span>
 
                  {/* Option Reader */}
                  <div
                    className="p-3.5 border border-slate-200 bg-slate-50/50 rounded-xl flex items-start gap-3.5"
                  >
                    <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-[#0288D1]/10 text-[#0288D1]">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 block font-sans">
                        Abonnenten-Modus (Schreibgeschützt / Nur lesen)
                      </span>
                      <span className="text-[10.5px] text-slate-500 leading-normal block font-sans mt-0.5">
                        Standard & Erforderlich. Andere abonnieren das Dokument schreibgeschützt und erhalten deine Aktualisierungen. Deine Originaldatei auf Google Drive ist zu 100% geschützt und kann von Abonnenten nicht editiert werden.
                      </span>
                    </div>
                  </div>
                </div>
 
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setShowShareResultModal(false);
                      setSharingPageId(null);
                      setSharingAlbumId(null);
                    }}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs cursor-pointer transition-all duration-150"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={executeSharing}
                    className="flex-1 py-2 bg-[#0288D1] hover:bg-[#0288D1]/90 text-white font-bold rounded-lg text-xs cursor-pointer transition-all duration-150 shadow-xs"
                  >
                    Abonnement-Link generieren
                  </button>
                </div>
              </div>
            )}
 
            {shareStep === 'loading' && (
              /* Step 2: Immediate loading feedback animation screen */
              <div className="space-y-5 py-3 text-center select-none">
                <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-600 relative">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0288D1]" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500"></span>
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-sans">
                    Abonnement-Kanal wird eingerichtet... 📡
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-1 font-sans mx-auto max-w-[280px] leading-relaxed">
                    Wir bereiten eine freigegebene Instanz auf deinem Google Drive vor und konfigurieren die Zugriffsrechte automatisch.
                  </p>
                </div>
                
                {/* Beautiful custom-styled animated scanning progress/loading bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative border border-slate-200/30">
                  <div className="absolute top-0 bottom-0 bg-linear-to-r from-sky-400 via-[#0288D1] to-sky-400 rounded-full animate-loading-bar"></div>
                </div>
                
                <div className="text-[10px] text-slate-400 font-sans flex items-center justify-center gap-1.5 pt-1">
                  <span>Sichere Abo-Kopplung aktiv (Abonnenten-Modus)</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            )}
 
            {shareStep === 'ready' && shareResultUrl && (
              /* Step 3: Final ready-to-copy link screen */
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-2 font-sans flex items-center gap-2">
                  <span>Abonnement-Kanal aktiv!</span> 📡
                </h2>
                <p className="text-slate-600 text-xs mb-4 leading-relaxed font-sans text-left">
                  Dieses Dokument wurde als <strong className="text-slate-800">schreibgeschütztes Abonnement (Abo-Modus)</strong> auf deinem Google Drive bereitgestellt. Sende diesen Link an andere, damit sie es abonnieren können:
                </p>
 
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg mb-6">
                  <input
                    type="text"
                    readOnly
                    value={shareResultUrl || ''}
                    className="flex-1 bg-transparent text-xs text-slate-800 outline-none select-all font-mono animate-pulse"
                  />
                  <button
                    onClick={() => {
                      if (shareResultUrl) {
                        navigator.clipboard.writeText(shareResultUrl);
                        const btn = document.getElementById('copy-share-url-btn');
                        if (btn) {
                          btn.innerText = 'Kopiert! ✓';
                          setTimeout(() => {
                            if (btn) btn.innerText = 'Kopieren';
                          }, 2000);
                        }
                      }
                    }}
                    id="copy-share-url-btn"
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors shrink-0"
                  >
                    Kopieren
                  </button>
                </div>
 
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowShareResultModal(false);
                      setShareResultUrl(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Schließen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6.5 max-w-sm w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-150 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-red-50 rounded-full text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-950 font-sans">
                  {confirmModal.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed font-sans text-center">
                  {confirmModal.message}
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                {!confirmModal.isAlert && (
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs cursor-pointer transition-all duration-150"
                  >
                    {confirmModal.cancelText || 'Abbrechen'}
                  </button>
                )}
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-all duration-150 shadow-xs"
                >
                  {confirmModal.confirmText || 'Bestätigen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elegant floating Stripe checkout state Notification */}
      {stripeNotification && (
        <div className={`fixed bottom-4 right-4 z-[9999] p-4 rounded-xl shadow-xl flex items-center justify-between gap-4 max-w-sm border border-slate-200/60 transition-all animate-in slide-in-from-bottom duration-300 ${
          stripeNotification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-start gap-2 text-xs text-left">
            {stripeNotification.type === 'success' ? (
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-semibold leading-relaxed">{stripeNotification.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setStripeNotification(null)}
            className="text-[10px] font-bold hover:underline opacity-80 cursor-pointer bg-slate-200/80 text-slate-700 hover:bg-slate-300/80 px-2 py-0.5 rounded transition-all shrink-0"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
