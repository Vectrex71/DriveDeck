/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderSync, 
  Search, 
  Calendar as CalendarIcon, 
  Image as ImageIcon, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink, 
  Lock, 
  Info, 
  CornerDownRight, 
  Filter, 
  ArrowLeft, 
  FileSpreadsheet, 
  Presentation, 
  Folder, 
  X, 
  ChevronDown, 
  Sliders, 
  Eye, 
  RefreshCw,
  LogOut,
  Sparkles,
  Camera,
  CalendarDays,
  FileImage,
  BookOpen,
  CloudLightning,
  ShieldAlert,
  User,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { googleSignIn, logout as googleLogout, initAuth } from '../lib/googleAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { getAllPages } from '../lib/db';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface DriveExplorerProps {
  onBackToLocal?: () => void;
}

export default function DriveExplorer({ onBackToLocal }: DriveExplorerProps) {
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [pagesCount, setPagesCount] = useState<number>(0);
  
  // Load pages count for synchronization card
  useEffect(() => {
    let active = true;
    getAllPages()
      .then(p => {
        if (active) setPagesCount(p.length);
      })
      .catch(err => console.error('[DriveExplorer] Failed to load pages count:', err));
    return () => { active = false; };
  }, []);

  // Layout tabs / views: 'dashboard' | 'explorer' | 'albums' | 'calendar'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'albums'>('dashboard');

  // GDrive state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<Array<{id: string, name: string}>>([{id: 'root', name: 'Drive Root'}]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'docs' | 'sheets' | 'folders' | 'tagebuch'>('all');

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayFiles, setSelectedDayFiles] = useState<DriveFile[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Image Album State
  const [photos, setPhotos] = useState<DriveFile[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DriveFile | null>(null);

  // Active Document Preview State (Split Screen Widget)
  const [activePreviewFile, setActivePreviewFile] = useState<DriveFile | null>(null);
  const [showWebsitesOption, setShowWebsitesOption] = useState(true);

  // Diary Analyzer State (searches for "Tagebuch" or "Diary" documents dynamically)
  const [hasScannedDiaries, setHasScannedDiaries] = useState(false);
  const [diaryDocs, setDiaryDocs] = useState<DriveFile[]>([]);

  // Trigger Auth check or login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Anmeldung fehlgeschlagen:', err);
      setAuthError('Anmeldung fehlgeschlagen. Bitte versuche es erneut und lasse Popups zu.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Möchtest du die Google-Verbindung wirklich trennen? Dein Token wird sofort aus dem Arbeitsspeicher gelöscht.')) {
      await googleLogout();
      setUser(null);
      setToken(null);
      setFiles([]);
      setPhotos([]);
      setCalendarEvents([]);
      setActivePreviewFile(null);
      setDiaryDocs([]);
      setHasScannedDiaries(false);
    }
  };

  // Fetch items from specific folder
  const loadFolderFiles = async (folderId: string, searchVal: string = '', filter: string = 'all') => {
    if (!token) return;
    setGdriveLoading(true);
    try {
      let queryList: string[] = ['trashed = false'];
      
      if (searchVal.trim()) {
        queryList.push(`name contains '${searchVal.replace(/'/g, "\\'")}'`);
      } else {
        queryList.push(`'${folderId}' in parents`);
      }

      if (filter === 'docs') {
        queryList.push("mimeType = 'application/vnd.google-apps.document'");
      } else if (filter === 'sheets') {
        queryList.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
      } else if (filter === 'folders') {
        queryList.push("mimeType = 'application/vnd.google-apps.folder'");
      } else if (filter === 'tagebuch') {
        queryList.push("(name contains 'Tagebuch' or name contains 'Diary' or name contains 'Journal')");
      }

      const q = encodeURIComponent(queryList.join(' and '));
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,createdTime,modifiedTime,thumbnailLink,webViewLink,size)&pageSize=60&orderBy=folder,name`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn('[Session] Session expired or unauthorized (401). Logging out.');
          await googleLogout();
        }
        throw new Error(`Google API returned status ${res.status}`);
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching drive files:', err);
    } finally {
      setGdriveLoading(false);
    }
  };

  // Fetch photos across Google Drive
  const loadDrivePhotos = async () => {
    if (!token) return;
    setPhotosLoading(true);
    try {
      const queryList = [
        "trashed = false",
        "(mimeType contains 'image/' or mimeType contains 'video/')"
      ];
      const q = encodeURIComponent(queryList.join(' and '));
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,createdTime,modifiedTime,thumbnailLink,webViewLink,size)&pageSize=60&orderBy=createdTime desc`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn('[Session] Session expired or unauthorized (401). Logging out.');
          await googleLogout();
        }
        throw new Error(`Google API returned status ${res.status}`);
      }
      const data = await res.json();
      setPhotos(data.files || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Fetch Calendar Events
  const loadCalendarEvents = async () => {
    if (!token) return;
    setCalendarLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfMonth)}&timeMax=${encodeURIComponent(endOfMonth)}&singleEvents=true&orderBy=startTime&maxResults=150`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn('[Session] Session expired or unauthorized (401). Logging out.');
          await googleLogout();
        }
        throw new Error(`Google Calendar API returned status ${res.status}`);
      }
      const data = await res.json();
      setCalendarEvents(data.items || []);
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Scan all diary-like files dynamically
  const scanDiariesAndTagebuecher = async () => {
    if (!token || hasScannedDiaries) return;
    try {
      const query = encodeURIComponent("trashed = false and mimeType = 'application/vnd.google-apps.document' and (name contains 'Tagebuch' or name contains 'Diary' or name contains 'Journal' or name contains 'Eintrag')");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime)&pageSize=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn('[Session] Session expired or unauthorized (401). Logging out.');
          await googleLogout();
        }
        throw new Error(`Google API returned status ${res.status}`);
      }
      const data = await res.json();
      setDiaryDocs(data.files || []);
      setHasScannedDiaries(true);
    } catch (err) {
      console.error('Error scanning diaries:', err);
    }
  };

  // Synchronisiere Session beim Mounten und behalte Anmeldung über Page-Wechsel hinweg aktiv
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, activeToken) => {
        setUser(currentUser);
        setToken(activeToken);
      },
      () => {
        // Falls kein Token gecached ist, bleibt der User ausgeloggt
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load everything upon login/token change
  useEffect(() => {
    if (token) {
      loadFolderFiles(currentFolderId, searchQuery, quickFilter);
      loadDrivePhotos();
      loadCalendarEvents();
      scanDiariesAndTagebuecher();
    }
  }, [token, currentFolderId, quickFilter]);

  // Load calendar events on month change
  useEffect(() => {
    if (token) {
      loadCalendarEvents();
    }
  }, [currentDate]);

  const handleNavigateToFolder = (folderId: string, folderName: string) => {
    // Avoid double entries
    const existsIdx = folderHistory.findIndex(h => h.id === folderId);
    if (existsIdx !== -1) {
      setFolderHistory(folderHistory.slice(0, existsIdx + 1));
    } else {
      setFolderHistory([...folderHistory, { id: folderId, name: folderName }]);
    }
    setCurrentFolderId(folderId);
    setSearchQuery('');
  };

  const handleBackHistory = () => {
    if (folderHistory.length <= 1) return;
    const previous = folderHistory[folderHistory.length - 2];
    setFolderHistory(folderHistory.slice(0, -1));
    setCurrentFolderId(previous.id);
    setSearchQuery('');
  };

  // Calendar render helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    // Adjust Sunday to 6 and Monday to 0
    return day === 0 ? 6 : day - 1;
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadFolderFiles(currentFolderId, searchQuery, quickFilter);
    }
  };

  const handleViewDayDetails = (dayNum: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayString = String(dayNum).padStart(2, '0');
    const dateQueryStr = `${year}-${month}-${dayString}`;

    setSelectedDateStr(dateQueryStr);

    // Filter Events on this day
    const dayEvents = calendarEvents.filter(event => {
      const startStr = event.start.dateTime || event.start.date || '';
      return startStr.startsWith(dateQueryStr);
    });
    setSelectedDayEvents(dayEvents);

    // Filter GDrive Tagebuch-Docs matching this exact date (either created on this day or file name contains date)
    const dayFiles = [...files, ...diaryDocs].filter((file, idx, self) => {
      const isDuplicate = self.findIndex(f => f.id === file.id) !== idx;
      if (isDuplicate) return false;

      const createdStr = file.createdTime?.slice(0, 10);
      const modifiedStr = file.modifiedTime?.slice(0, 10);
      const nameHasDate = file.name.includes(`${dayString}.${month}`) || 
                          file.name.includes(`${year}-${month}-${dayString}`) ||
                          file.name.includes(dateQueryStr);
      
      return createdStr === dateQueryStr || modifiedStr === dateQueryStr || nameHasDate;
    });

    setSelectedDayFiles(dayFiles);
  };

  // Render file picker card depending on mimeType
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-5 h-5 text-amber-500 fill-amber-500" />;
    if (mimeType === 'application/vnd.google-apps.document') return <FileText className="w-5 h-5 text-blue-500 fill-blue-50" />;
    if (mimeType === 'application/vnd.google-apps.spreadsheet') return <FileSpreadsheet className="w-5 h-5 text-emerald-600 fill-emerald-50" />;
    if (mimeType === 'application/vnd.google-apps.presentation') return <Presentation className="w-5 h-5 text-orange-500 fill-orange-50" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  // Human bytes converter
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Setup Month Calendar Details
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayIndex = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const gridCells = Array(42).fill(null);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDateStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDateStr(null);
  };

  const currentMonthGerman = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 relative select-none">
      
      {/* Notion Cover Layout Style */}
      <div className="w-full h-32 relative bg-slate-100 overflow-hidden shrink-0 border-b border-slate-200">
        <img 
          src="/BannerLogo.png" 
          alt="Banner Logo" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute -top-10 left-10 w-[400px] h-[200px] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-4 left-6 flex items-center space-x-2.5 z-10 text-slate-900">
          <FolderSync className="w-7 h-7 text-sky-600" />
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900">Dein Google Workspace Portal</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">Google Drive &amp; Kalender Organisations-Deck</p>
          </div>
        </div>
        {onBackToLocal && (
          <button
            onClick={onBackToLocal}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white border border-slate-200 shadow-3xs text-slate-700 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zurück zum Editor</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      {!token ? (
        // Beautiful landing login form with absolute security promise
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200/80 p-8 max-w-lg w-full shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3.5 bg-sky-50 text-sky-600 rounded-full mb-4 ring-4 ring-sky-50/50">
                <Lock className="w-7 h-7" />
              </div>
              
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">Google Drive Verbindung autorisieren</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-6">
                Um Tagebücher, Alben und Dokumente direkt aus deinem Google Drive sicher und in Echtzeit zu organisieren, kopple jetzt deine Cloud.
              </p>

              {/* Security Banner answering specifically "Die daten sind auf fremden servern" */}
              <div className="w-full bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4 text-left space-y-2 mb-6">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                  <span className="text-sm">🛡️</span>
                  <span>100% Sicher: Keine fremden Server</span>
                </div>
                <p className="text-[11px] text-emerald-700/95 leading-relaxed">
                  Deine Daten bleiben vollkommen in deinem Google Drive! DriveDeck besitzt **keinen** eigenen File-Server und kopiert deine Dokumente nicht. Die Anmeldung findet direkt bei Google statt; die Token liegen ausschließlich in deinem Browser-Arbeitsspeicher (in-memory) und erlöschen sofort beim Schließen oder Abmelden.
                </p>
              </div>

              {authError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-5 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full gsi-material-button relative flex items-center justify-center p-3 sm:py-2.5 hover:shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold text-slate-700">Google Popup lädt...</span>
                  </div>
                ) : (
                  <div className="gsi-material-button-content-wrapper flex items-center justify-center gap-3">
                    <div className="gsi-material-button-icon scale-95 shrink-0">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-slate-700">Mit Google Konto anmelden</span>
                  </div>
                )}
              </button>

              <button
                onClick={onBackToLocal}
                className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Inaktiven Offline-Workspace fortsetzen
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        // Interactive Dashboard
        <div id="drive-app-core" className="flex-1 flex overflow-hidden">
          
          {/* Main workspace (Left side: Content widgets, Right side: Doc view split screen if active) */}
          <div className="flex-1 flex divide-x divide-slate-200 overflow-hidden">
            
            {/* Control Dashboard Center */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              
              {/* Dashboard Action Header bar */}
              <div className="bg-white border-b border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'Google'} className="w-7 h-7 rounded-full border border-sky-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600"><User className="w-4 h-4" /></div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{user?.displayName || 'Verbundener Nutzer'}</span>
                    <span className="text-[10px] text-slate-400">{user?.email || ''}</span>
                  </div>
                </div>

                {/* Subnav tab toggle button group */}
                <div className="flex bg-slate-100 rounded-md p-0.5 max-w-sm">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    📊 Info &amp; Kalender
                  </button>
                  <button
                    onClick={() => setActiveTab('explorer')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'explorer' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    📂 GDrive Browser
                  </button>
                  <button
                    onClick={() => setActiveTab('albums')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'albums' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    📸 Fotos &amp; Alben
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1 px-2.5 text-xs text-red-500 hover:bg-red-50 rounded flex items-center gap-1.5 cursor-pointer font-bold border border-transparent hover:border-red-100 transition-all"
                  title="Abmelden"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Abkoppeln</span>
                </button>
              </div>

              {/* Center Content depending on Tab */}
              <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
                
                {/* 1. DASHBOARD VIEW: Info, Tagebuch tracker & Calendar */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Welcome status grid containing AppData sync confirmation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left Widget: Welcome & Tracker */}
                      <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-3.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h2 className="text-[11px] font-bold text-[#0288D1] uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#0288D1]" />
                            <span>Tagebuch &amp; Dokumenten-Deck</span>
                          </h2>
                          <p className="text-[11px] text-slate-600 leading-normal font-sans">
                            Wir scannen dein Google Drive live nach Tagebüchern und Notizen. Nutze den interaktiven Kalender unten, um Dokumente direkt anhand ihrer Bearbeitungsdaten zu sichten oder zu editieren.
                          </p>
                        </div>
                        
                        <button
                          onClick={() => setActiveTab('explorer')}
                          className="mt-2.5 w-fit px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" />
                          <span>Ordner durchsuchen</span>
                        </button>
                      </div>

                      {/* Right Widget: GDrive AppData Sync confirmation (0 cost, GDPR compliant) */}
                      <div className="bg-emerald-50/40 border border-emerald-100/70 rounded-lg p-3.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h2 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FolderSync className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span>Dauerhafte App-Daten Synchronisation</span>
                          </h2>
                          <p className="text-[11px] text-slate-600 leading-normal font-sans">
                            Deine Notion-Seiten liegen zu 100% verschlüsselt im versteckten App-Ordner deines Google Drives (<code>appData</code>). Keine Drittanbieter-Server, keine Extrakosten, 100% datenschutzkonform gemäß DSGVO.
                          </p>
                        </div>
                        
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-emerald-800 font-bold bg-emerald-100/50 border border-emerald-200/40 rounded px-2 py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-2xs"></span>
                            <span>Synchronisation Aktiv</span>
                          </div>
                          <span>{pagesCount} Seiten gesichert</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Organizer Layout: Left side: Interactive Dot Calendar. Right side: Selected Day details & Diary shortcuts */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Interactive Calendar Grid representing user's diary notes on dots */}
                      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 select-none">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <CalendarDays className="w-4.5 h-4.5 text-sky-500" />
                            <span>Tagebuch-Kalender Tracker</span>
                          </h3>

                          <div className="flex items-center space-x-2">
                            <button onClick={prevMonth} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-slate-700 min-w-[110px] text-center">{currentMonthGerman}</span>
                            <button onClick={nextMonth} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {calendarLoading ? (
                          <div className="h-60 flex flex-col items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-sky-500 animate-spin mb-2" />
                            <span className="text-[11px] text-slate-400 font-mono">Synchronisiere Google Kalender Termine...</span>
                          </div>
                        ) : (
                          <div>
                            {/* Days labels */}
                            <div className="grid grid-cols-7 text-center text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-2">
                              <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
                            </div>

                            {/* Calendar Grid cells */}
                            <div className="grid grid-cols-7 gap-1">
                              {/* Empty padding cells */}
                              {Array(firstDayIndex).fill(null).map((_, idx) => (
                                <div key={`empty-${idx}`} className="h-10 bg-slate-50/40 rounded border border-transparent"></div>
                              ))}

                              {/* Day cells */}
                              {Array(daysInMonth).fill(null).map((_, idx) => {
                                const dayNum = idx + 1;
                                const year = currentDate.getFullYear();
                                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                const cellDateStr = `${year}-${month}-${String(dayNum).padStart(2, '0')}`;
                                
                                // Detect calendar events on this date
                                const dateEvents = calendarEvents.filter(ev => {
                                  const startStr = ev.start.dateTime || ev.start.date || '';
                                  return startStr.startsWith(cellDateStr);
                                });

                                // Detect Google doc diary files associated with this date
                                const dateDocs = diaryDocs.filter(doc => {
                                  // Created or Modified matches, OR title contains standard format
                                  const createdStr = doc.createdTime?.slice(0, 10);
                                  const modifiedStr = doc.modifiedTime?.slice(0, 10);
                                  const nameHasDateStr = doc.name.includes(`${String(dayNum).padStart(2, '0')}.${month}`) || 
                                                         doc.name.includes(`${year}-${month}-${String(dayNum).padStart(2, '0')}`) ||
                                                         doc.name.includes(cellDateStr);
                                  return createdStr === cellDateStr || modifiedStr === cellDateStr || nameHasDateStr;
                                });

                                const isSelected = selectedDateStr === cellDateStr;

                                return (
                                  <button
                                    key={`day-${dayNum}`}
                                    onClick={() => handleViewDayDetails(dayNum)}
                                    className={`h-11 rounded border flex flex-col justify-between items-center p-1 cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'border-sky-500 bg-sky-50 text-sky-800' 
                                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                                    }`}
                                  >
                                    <span className="text-xs font-bold">{dayNum}</span>
                                    
                                    {/* Small bottom dot indicators */}
                                    <div className="flex gap-0.5 items-center justify-center w-full">
                                      {/* Event dot (Red) */}
                                      {dateEvents.length > 0 && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title={`${dateEvents.length} Termine`} />
                                      )}
                                      {/* Diary file dot (Blue) */}
                                      {dateDocs.length > 0 && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" title="Tagebucheintrag vorhanden!" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Legend */}
                        <div className="mt-4 flex items-center justify-end space-x-4 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none select-none">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                            <span>Tagebucheintrag (Drive)</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span>Termin / Kalender</span>
                          </div>
                        </div>
                      </div>

                      {/* Day Details panel & Quick Scanned list */}
                      <div className="lg:col-span-5 flex flex-col space-y-4">
                        
                        {/* Day Card view */}
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs flex-1 flex flex-col">
                          <div className="border-b border-slate-100 pb-2.5 mb-3 flex items-center justify-between select-none">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Datum Details</span>
                            {selectedDateStr ? (
                              <span className="text-xs font-bold bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-100">
                                {new Date(selectedDateStr).toLocaleDateString('de-DE', { dateStyle: 'medium' })}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 italic">Klicke einen Tag</span>
                            )}
                          </div>

                          {selectedDateStr ? (
                            <div className="space-y-4 flex-1 flex flex-col overflow-y-auto">
                              
                              {/* Tagebuch/Doc matches */}
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1 select-none">
                                  <FileText className="w-3.5 h-3.5 text-sky-500" />
                                  <span>Dokumente &amp; Tagebucheinträge ({selectedDayFiles.length})</span>
                                </h4>

                                {selectedDayFiles.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic leading-snug p-2.5 bg-slate-50 rounded border border-transparent">
                                    Keine verknüpften Tagebücher oder Dokumente für diesen Tag im Drive gefunden.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {selectedDayFiles.map(file => (
                                      <div 
                                        key={file.id} 
                                        onClick={() => setActivePreviewFile(file)}
                                        className="p-2 border border-slate-100 hover:border-sky-300 hover:bg-sky-50/20 rounded flex items-center justify-between cursor-pointer group transition-all"
                                      >
                                        <div className="flex items-center space-x-2 min-w-0">
                                          {getFileIcon(file.mimeType)}
                                          <span className="text-xs font-semibold text-slate-700 truncate">{file.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                          <span className="text-[10px] text-slate-400 font-medium">{file.modifiedTime?.slice(11, 16)} Uhr</span>
                                          <Eye className="w-3.5 h-3.5 text-sky-500" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Calendar Events matches */}
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1 select-none">
                                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Google Kalender Termine ({selectedDayEvents.length})</span>
                                </h4>

                                {selectedDayEvents.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic leading-snug p-2.5 bg-slate-50 rounded border border-transparent">
                                    Keine Kalendertermine an diesem Tag gelistet.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {selectedDayEvents.map(event => {
                                      const timeStr = event.start.dateTime 
                                        ? new Date(event.start.dateTime).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})
                                        : 'Ganztägig';
                                      return (
                                        <div key={event.id} className="p-2 bg-rose-50/50 border border-rose-100/60 rounded text-xs">
                                          <div className="flex items-center justify-between font-bold text-rose-900 mb-0.5">
                                            <span className="truncate">{event.summary || 'Unbenanntes Ereignis'}</span>
                                            <span className="text-[10px] shrink-0">{timeStr}</span>
                                          </div>
                                          {event.description && (
                                            <p className="text-[10px] text-rose-700 font-medium truncate mt-0.5">{event.description}</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded">
                              <span className="text-2xl mb-1.5">📅</span>
                              <p className="text-xs text-slate-400 font-medium">Wähle einen Tag im Kalender, um Tagebucheinträge, Google-Dokumente und Kalendertermine für diesen Tag aufzurufen.</p>
                            </div>
                          )}
                        </div>

                        {/* Quick Scanned Journal panel */}
                        <div id="quick-scanned-diaries" className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 select-none flex items-center space-x-1">
                            <BookOpen className="w-4 h-4 text-sky-500" />
                            <span>Gescannte Tagebücher ({diaryDocs.length})</span>
                          </h4>

                          {diaryDocs.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Noch keine "Tagebuch"-Dateien gefunden.</p>
                          ) : (
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                              {diaryDocs.slice(0, 5).map(doc => (
                                <button
                                  key={doc.id}
                                  onClick={() => setActivePreviewFile(doc)}
                                  className="w-full text-left p-1.5 hover:bg-slate-50 rounded text-xs flex items-center justify-between cursor-pointer font-medium"
                                >
                                  <span className="truncate pr-4 text-slate-700">{doc.name}</span>
                                  <span className="text-[10px] text-slate-400 select-none shrink-0 font-mono">{doc.modifiedTime?.slice(0, 10)}</span>
                                </button>
                              ))}
                              {diaryDocs.length > 5 && (
                                <button
                                  onClick={() => {
                                    setActiveTab('explorer');
                                    setQuickFilter('tagebuch');
                                  }}
                                  className="w-full text-center text-[11px] text-sky-500 hover:underline font-bold pt-1 pb-0.5 select-none"
                                >
                                  Alle {diaryDocs.length} Einträge im Explorer anzeigen &rarr;
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {/* 2. EXPLORER VIEW: Tree, folder and file listing */}
                {activeTab === 'explorer' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Header bar and filters */}
                    <div id="explorer-toolbar" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs select-none">
                      
                      {/* Nav paths */}
                      <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-bold text-slate-500">
                        {folderHistory.map((h, idx) => (
                          <React.Fragment key={h.id}>
                            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                            <button
                              onClick={() => handleNavigateToFolder(h.id, h.name)}
                              className={`hover:text-sky-600 transition-colors shrink-0 cursor-pointer ${
                                idx === folderHistory.length - 1 ? 'text-sky-600 font-black' : ''
                              }`}
                            >
                              {h.name}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Search box and search type filters */}
                      <div className="flex items-center gap-2">
                        
                        {/* Filters select dropdown */}
                        <div className="relative shrink-0 flex items-center">
                          <Sliders className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                          <select
                            value={quickFilter}
                            onChange={(e) => setQuickFilter(e.target.value as any)}
                            className="text-xs font-semibold pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded cursor-pointer transition-all focus:outline-none"
                          >
                            <option value="all">Sämtliche Dateien</option>
                            <option value="docs">📖 Google Docs</option>
                            <option value="sheets">📊 Google Sheets</option>
                            <option value="folders">📁 Nur Ordner</option>
                            <option value="tagebuch">📝 Tagebücher</option>
                          </select>
                        </div>

                        {/* Search input field */}
                        <div className="relative flex-1 sm:w-60">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Im Ordner suchen... (Enter)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyPress}
                            className="text-xs pl-8 pr-2.5 py-1.5 w-full bg-slate-50 border border-slate-200 focus:border-sky-400 rounded focus:outline-none transition-colors"
                          />
                        </div>

                      </div>

                    </div>

                    {/* Files listing container */}
                    <div id="main-files-list" className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                      {gdriveLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                          <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mb-2" />
                          <span className="text-xs text-slate-400 font-mono">Synchronisiere Google Drive Einträge...</span>
                        </div>
                      ) : files.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                          <span className="text-3xl mb-2">📁</span>
                          <h4 className="text-sm font-bold text-slate-700">Keine Dateien entsprechen diesem Filter</h4>
                          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal">
                            Dieser Ordner ist leer oder keiner der gelisteten Einträge entspricht den aktuell eingestellten Filtern.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                          {files.map(file => {
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                            return (
                              <div
                                key={file.id}
                                onClick={() => {
                                  if (isFolder) {
                                    handleNavigateToFolder(file.id, file.name);
                                  } else {
                                    setActivePreviewFile(file);
                                  }
                                }}
                                className={`p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group ${
                                  activePreviewFile?.id === file.id ? 'bg-sky-50/20' : ''
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-4">
                                  <div className="shrink-0 p-1 bg-slate-50 rounded-md border border-slate-100 group-hover:bg-white transition-colors">
                                    {getFileIcon(file.mimeType)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-700 truncate group-hover:text-sky-600 transition-colors">
                                      {file.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5 select-none">
                                      Geändert {new Date(file.modifiedTime).toLocaleDateString('de-DE', {dateStyle: 'medium'})}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 text-slate-400 text-xs shrink-0 select-none">
                                  {!isFolder && (
                                    <span className="text-[11px] font-mono text-slate-400 leading-none">
                                      {file.size ? formatBytes(file.size) : '---'}
                                    </span>
                                  )}
                                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 3. ALBUMS VIEW: Gallery view of photos */}
                {activeTab === 'albums' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    <div className="bg-white p-4 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
                          <Camera className="w-4.5 h-4.5 text-purple-500" />
                          <span>Google Drive Bilderalbum</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 leading-snug font-medium mt-0.5">Visuelle Schnappschüsse direkt aus deiner Google Drive Instanz auslesen</p>
                      </div>

                      <button
                        onClick={loadDrivePhotos}
                        className="p-1 px-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-700 font-bold text-xs rounded transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Album neu laden</span>
                      </button>
                    </div>

                    {photosLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <RefreshCw className="w-7 h-7 text-purple-500 animate-spin mb-2" />
                        <span className="text-xs text-slate-400 font-mono">Lese Fotos &amp; Alben aus...</span>
                      </div>
                    ) : photos.length === 0 ? (
                      <div className="py-16 bg-white border border-dashed border-slate-200 rounded-lg text-center p-6">
                        <span className="text-3xl mb-1.5 inline-block">📸</span>
                        <h4 className="text-sm font-bold text-slate-700">Keine Bilddateien gefunden</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
                          Wir haben in deinen Drive-Verzeichnissen keine Mediendateien (PNG, JPG) finden können. Lade Dokument-Bilder hoch, um Alben zu füllen.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4.5">
                        {photos.map(pic => (
                          <div
                            key={pic.id}
                            onClick={() => setSelectedPhoto(pic)}
                            className="group relative bg-white border border-slate-200/80 hover:border-purple-300 rounded-xl overflow-hidden cursor-pointer shadow-3xs hover:shadow-xs transition-all duration-155"
                          >
                            <div className="aspect-square bg-slate-900 overflow-hidden relative">
                              {pic.thumbnailLink ? (
                                <img
                                  src={pic.thumbnailLink.replace(/=s\d+/, '=s250')}
                                  alt={pic.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                  <FileImage className="w-8 h-8 opacity-40" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all"></div>
                            </div>
                            
                            <div className="p-2.5 select-none">
                              <span className="text-[11px] font-bold text-slate-700 block truncate leading-none">
                                {pic.name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold block mt-1 tracking-wider leading-none">
                                {pic.modifiedTime?.slice(0, 10)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>

            {/* Split Screen Document Viewer Panel */}
            <AnimatePresence>
              {activePreviewFile && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '48%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden"
                >
                  <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 select-none">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {getFileIcon(activePreviewFile.mimeType)}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">{activePreviewFile.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">Google Drive Betrachter</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <a
                        href={`https://docs.google.com/document/d/${activePreviewFile.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                        title="In Google Docs bearbeiten"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setActivePreviewFile(null)}
                        className="p-1 hover:bg-slate-200 text-slate-500 rounded cursor-pointer"
                        title="Schließen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* iFrame embed viewer container */}
                  <div className="flex-1 bg-slate-100 flex flex-col relative">
                    <iframe
                      src={`https://docs.google.com/document/d/${activePreviewFile.id}/preview?authuser=0`}
                      className="w-full h-full border-none"
                      title={activePreviewFile.name}
                      allow="autoplay"
                    ></iframe>
                  </div>

                  {/* Safety advice and actions below previews */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0 select-none text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center flex items-center justify-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                    <span>Lokal verschlüsselter iFrame Preview (SSL zertifiziert)</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Lightbox for large photo display */}
          <AnimatePresence>
            {selectedPhoto && (
              <div 
                className="fixed inset-0 z-55 bg-black/90 p-4 sm:p-8 flex flex-col items-center justify-center backdrop-blur-xs select-none"
                onClick={() => setSelectedPhoto(null)}
              >
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>

                <div 
                  className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center relative p-2"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Generate actual high resolution link using Google Drive proxy directly if possible */}
                  <img
                    src={`https://drive.google.com/uc?export=view&id=${selectedPhoto.id}`}
                    alt={selectedPhoto.name}
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                    onError={(e) => {
                      // Fallback if proxy blocks or auth fails for hotlink
                      (e.target as HTMLImageElement).src = selectedPhoto.thumbnailLink?.replace(/=s\d+/, '=s1000') || '';
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="mt-4 text-center max-w-xl text-white">
                  <h3 className="text-sm font-bold truncate">{selectedPhoto.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Geändert {new Date(selectedPhoto.modifiedTime).toLocaleDateString('de-DE', {dateStyle: 'long'})}</p>
                </div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
