/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Pin, 
  Tag, 
  ArrowUpDown, 
  CheckCheck,
  RefreshCw,
  AlertCircle,
  GripHorizontal,
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  Image as ImageIcon,
  Link,
  FolderOpen,
  Folder,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { StickyNoteData, StickyAttachment } from '../types';
import { executeStickyNotesSync } from '../lib/driveSync';
import { initAuth } from '../lib/googleAuth';

const getAttachmentIcon = (att: StickyAttachment) => {
  if (att.type === 'drive') {
    const mime = att.mimeType || '';
    if (mime.includes('document')) return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    if (mime.includes('spreadsheet')) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (mime.includes('presentation')) return <Presentation className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (mime.includes('pdf')) return <File className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    if (mime.includes('image')) return <ImageIcon className="w-3.5 h-3.5 text-teal-500 shrink-0" />;
    return <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  }
  if (att.type === 'image') {
    return <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
  }
  return <Link className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
};

const getFirstUrlInText = (text: string): string | null => {
  if (!text) return null;
  const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  const match = text.match(urlRegex);
  if (!match) return null;
  let url = match[0];
  // Remove trailing punctuation at the end of URL
  while (url.length > 0 && ['.', ',', ';', '!', '?', ')', ']'].includes(url[url.length - 1])) {
    url = url.slice(0, -1);
  }
  return url;
};

const RichLinkPreview = ({ url, title, onRemove }: { url: string; title?: string; onRemove?: () => void; key?: React.Key }) => {
  let domain = '';
  try {
    // If it starts with www. format a valid URL string for parsing
    const parseUrl = url.toLowerCase().startsWith('www.') ? `https://${url}` : url;
    domain = new URL(parseUrl).hostname;
  } catch (e) {
    if (url.toLowerCase().startsWith('www.')) {
      domain = url.split('/')[0];
    } else {
      domain = url;
    }
  }

  // Remove www. prefix for cleaner display
  let cleanDomain = domain;
  if (cleanDomain.startsWith('www.')) {
    cleanDomain = cleanDomain.substring(4);
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  let displayTitle = title || cleanDomain;
  let displayDescription = "Weblink ansehen und neue Inspirationen entdecken.";
  let bgGradient = "from-slate-50 to-slate-100/50";
  let iconBg = "bg-white";

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    displayTitle = title && title !== url ? title : "YouTube";
    displayDescription = "Faszinierende Videos, Musik & Streams direkt auf YouTube ansehen.";
    bgGradient = "from-red-50/40 to-white hover:from-red-50/60";
    iconBg = "bg-red-50 text-red-600";
  } else if (lowerUrl.includes('github.com')) {
    displayTitle = title && title !== url ? title : "GitHub";
    displayDescription = "Austausch-Plattform für Entwickler. Code, Repositories und Open-Source-Projekte.";
    bgGradient = "from-slate-900/5 to-white hover:from-slate-900/10";
    iconBg = "bg-slate-950 text-white";
  } else if (lowerUrl.includes('wikipedia.org')) {
    displayTitle = title && title !== url ? title : "Wikipedia";
    displayDescription = "Die freie Enzyklopädie mit Millionen Artikeln und wertvollem Wissen.";
    bgGradient = "from-slate-100 to-white hover:from-slate-150";
    iconBg = "bg-white text-slate-800";
  } else if (lowerUrl.includes('google.com')) {
    displayTitle = title && title !== url ? title : "Google";
    displayDescription = "Schnelle Internetsuche für Webseiten, Bilder, News und vieles mehr.";
    bgGradient = "from-blue-50/20 to-white hover:from-blue-50/40";
    iconBg = "bg-white";
  } else if (lowerUrl.includes(' fig')) {
    displayTitle = title && title !== url ? title : "Figma";
    displayDescription = "Präzises Webdesign, Prototyping und interaktives Team-Feedback online.";
    bgGradient = "from-amber-50/20 to-white";
  } else if (lowerUrl.includes('linkedin.com')) {
    displayTitle = title && title !== url ? title : "LinkedIn";
    displayDescription = "Netzwerk für Fach- und Führungskräfte zur beruflichen Vernetzung.";
    bgGradient = "from-sky-50/20 to-white";
  } else if (lowerUrl.includes('spotify.com')) {
    displayTitle = title && title !== url ? title : "Spotify";
    displayDescription = "Kuratierte Playlists, Lieblingsmusik und spannende Podcasts streamen.";
    bgGradient = "from-emerald-50/25 to-white hover:from-emerald-50/40";
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`group/preview relative flex flex-col sm:flex-row items-stretch border border-black/5 rounded-xl overflow-hidden shadow-3xs hover:shadow-2xs transition-all duration-200 bg-gradient-to-br ${bgGradient} text-left select-none text-[11px] font-bold mt-1.5`}>
      <a
        href={url.toLowerCase().startsWith('www.') ? `https://${url}` : url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex gap-3 p-2.5 min-w-0"
        onClick={handleLinkClick}
      >
        <div className={`w-8 h-8 rounded-lg border border-black/5 flex items-center justify-center shrink-0 shadow-3xs ${iconBg}`}>
          <img
            src={faviconUrl}
            alt={cleanDomain}
            className="w-5 h-5 object-contain rounded-xs"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center">
          <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-extrabold truncate">
            {cleanDomain}
          </span>
          <span className="text-[11px] font-black text-slate-800 leading-snug truncate mt-0.5">
            {displayTitle}
          </span>
          <span className="text-[10px] font-medium text-slate-500 line-clamp-1 leading-normal mt-0.5 font-sans">
            {displayDescription}
          </span>
        </div>
      </a>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1.5 right-1.5 p-1 bg-white/80 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-all cursor-pointer border border-black/5"
          title="Anhang entfernen"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const COLOR_CLASSES = {
  yellow: {
    bg: 'bg-amber-50 hover:bg-amber-55 border-amber-200/80',
    titleColor: 'text-amber-950',
    textColor: 'text-amber-900',
    accentLine: 'bg-amber-300',
    pickerBtn: 'bg-amber-100 border-amber-350',
    focusRing: 'focus-within:ring-amber-300',
    label: 'Gelb'
  },
  green: {
    bg: 'bg-emerald-50 hover:bg-emerald-55 border-emerald-200/80',
    titleColor: 'text-emerald-950',
    textColor: 'text-emerald-900',
    accentLine: 'bg-emerald-300',
    pickerBtn: 'bg-emerald-100 border-emerald-350',
    focusRing: 'focus-within:ring-emerald-300',
    label: 'Grün'
  },
  blue: {
    bg: 'bg-sky-50 hover:bg-sky-55 border-sky-200/80',
    titleColor: 'text-sky-950',
    textColor: 'text-sky-900',
    accentLine: 'bg-sky-300',
    pickerBtn: 'bg-sky-100 border-sky-350',
    focusRing: 'focus-within:ring-sky-300',
    label: 'Blau'
  },
  pink: {
    bg: 'bg-rose-50 hover:bg-rose-55 border-rose-200/80',
    titleColor: 'text-rose-950',
    textColor: 'text-rose-900',
    accentLine: 'bg-rose-300',
    pickerBtn: 'bg-rose-100 border-rose-350',
    focusRing: 'focus-within:ring-rose-300',
    label: 'Rosa'
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-55 border-purple-200/80',
    titleColor: 'text-purple-950',
    textColor: 'text-purple-900',
    accentLine: 'bg-purple-300',
    pickerBtn: 'bg-purple-100 border-purple-350',
    focusRing: 'focus-within:ring-purple-300',
    label: 'Violett'
  },
  orange: {
    bg: 'bg-orange-50 hover:bg-orange-55 border-orange-200/80',
    titleColor: 'text-orange-950',
    textColor: 'text-orange-900',
    accentLine: 'bg-orange-300',
    pickerBtn: 'bg-orange-100 border-orange-350',
    focusRing: 'focus-within:ring-orange-300',
    label: 'Orange'
  },
  gray: {
    bg: 'bg-slate-50 hover:bg-slate-55 border-slate-200/80',
    titleColor: 'text-slate-900',
    textColor: 'text-slate-700',
    accentLine: 'bg-slate-300',
    pickerBtn: 'bg-slate-200 border-slate-350',
    focusRing: 'focus-within:ring-slate-300',
    label: 'Grau'
  }
};

const FILTER_COLORS = [
  { value: 'all', label: 'Alle Farben 🎨', bg: 'bg-gradient-to-tr from-amber-400 via-emerald-400 to-sky-450' },
  { value: 'yellow', label: 'Gelbe Notizen', bg: 'bg-amber-400' },
  { value: 'green', label: 'Grüne Notizen', bg: 'bg-emerald-400' },
  { value: 'blue', label: 'Blaue Notizen', bg: 'bg-sky-400' },
  { value: 'pink', label: 'Rosa Notizen', bg: 'bg-rose-400' },
  { value: 'purple', label: 'Violette Notizen', bg: 'bg-purple-400' },
  { value: 'orange', label: 'Orange Notizen', bg: 'bg-orange-400' },
  { value: 'gray', label: 'Graue Notizen', bg: 'bg-slate-400' },
];

interface StickyNotesProps {
  isCreationBlocked?: boolean;
  onBlockedCreation?: () => void;
}

export default function StickyNotes({ isCreationBlocked = false, onBlockedCreation }: StickyNotesProps = {}) {
  const [notes, setNotes] = useState<StickyNoteData[]>([]);
  const skipNextSyncRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [isColorFilterOpen, setIsColorFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'position' | 'updated' | 'created' | 'title'>('position');
  const [showAutoSaveTick, setShowAutoSaveTick] = useState(false);
  
  // Drag and drop sorting state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragAllowedId, setDragAllowedId] = useState<string | null>(null);

  // Labels & Attachments & Textarea state
  const [filterTag, setFilterTag] = useState<string>('all');
  const [activePopup, setActivePopup] = useState<{ noteId: string, type: 'tag' | 'attach' | 'image-url' | 'link-url' } | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Drive Picker states
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [pickerFolderId, setPickerFolderId] = useState('root');
  const [pickerHistory, setPickerHistory] = useState<Array<{ id: string, name: string }>>([
    { id: 'root', name: 'Drive' }
  ]);
  const [pickerFiles, setPickerFiles] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [attachingToNoteId, setAttachingToNoteId] = useState<string | null>(null);

  // Cloud sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [hasLoggedInToken, setHasLoggedInToken] = useState(false);

  // Load notes on component mount, and run initial Drive pull-sync
  useEffect(() => {
    let initialNotes: StickyNoteData[] = [];
    try {
      const stored = localStorage.getItem('drivedeck_sticky_notes');
      if (stored) {
        initialNotes = JSON.parse(stored);
        setNotes(initialNotes);
      } else {
        // Seed initial notes
        initialNotes = [
          {
            id: 'note-welcome-1',
            title: 'Willkommen bei den Haftnotizen! 📌',
            content: 'Das ist dein neuer, dedizierter Bereich für schnelle Gedanken, Geistesblitze, Todo-Fragmente oder Telefonnotizen.\n\nDu kannst diese Notizen direkt bearbeiten – klicke einfach in den Text!\n\n✓ Wird immer live im Browser gesichert.',
            color: 'yellow',
            pinned: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            position: 0
          },
          {
            id: 'note-welcome-2',
            title: 'Neu: Drag and Drop Sortierung! ↕',
            content: 'Halte einfach das Griff-Symbol oben links gedrückt und ziehe den Zettel zur Seite, um die Reihenfolge manuell zu verändern.\n\nDeine ganz persönliche Anordnung wird live gesichert!',
            color: 'purple',
            pinned: false,
            createdAt: Date.now() - 30000,
            updatedAt: Date.now() - 30000,
            position: 1
          },
          {
            id: 'note-welcome-3',
            title: 'Cloud-Sync über Google Drive ☁',
            content: 'Hast du dich oben über Google angemeldet? Deine Haftnotizen werden vollautomatisch im Hintergrund in deinen versteckten Anwendungsordner (appDataFolder) hochgeladen. Dadurch sind sie auf all deinen Geräten perfekt synchronisiert!',
            color: 'blue',
            pinned: false,
            createdAt: Date.now() - 60000,
            updatedAt: Date.now() - 60000,
            position: 2
          },
          {
            id: 'note-welcome-4',
            title: '100% Mobil & Responsiv! 📱',
            content: 'Egal ob auf dem Desktop, Tablet oder Smartphone: Dieses Dashboard passt sich automatisch an.\n\nAuf mobilen Bildschirmen lassen sich Notizen wunderbar scrollen und verwalten. Probier es gleich aus!',
            color: 'green',
            pinned: false,
            createdAt: Date.now() - 120000,
            updatedAt: Date.now() - 120000,
            position: 3
          }
        ];
        setNotes(initialNotes);
        localStorage.setItem('drivedeck_sticky_notes', JSON.stringify(initialNotes));
      }
    } catch (e) {
      console.error('Failed to load sticky notes', e);
    }

    // Pull sync from Google Drive
    const token = sessionStorage.getItem('drive_access_token');
    if (token) {
      setHasLoggedInToken(true);
      setSyncStatus('syncing');
      executeStickyNotesSync(token, initialNotes)
        .then((stats) => {
          if (stats.localUpdated) {
            setNotes(stats.notes);
            localStorage.setItem('drivedeck_sticky_notes', JSON.stringify(stats.notes));
          }
          setSyncStatus('synced');
        })
        .catch((err) => {
          console.error('[DriveSync] Initial pull sync failed: ', err);
          setSyncStatus('error');
        });
    } else {
      setSyncStatus('idle');
    }
  }, []);

  // Save changes locally
  const saveNotesToStore = (newNotes: StickyNoteData[]) => {
    setNotes(newNotes);
    try {
      localStorage.setItem('drivedeck_sticky_notes', JSON.stringify(newNotes));
      setShowAutoSaveTick(true);
      const timer = setTimeout(() => setShowAutoSaveTick(false), 1200);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to save sticky notes', e);
    }
  };

  // Debounced cloud synchronization with 1.5 second throttle to avoid Google Drive API quota rate-limits while typing
  useEffect(() => {
    const token = sessionStorage.getItem('drive_access_token');
    if (!token) {
      setHasLoggedInToken(false);
      return;
    }
    setHasLoggedInToken(true);

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    if (notes.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSyncStatus('syncing');
      executeStickyNotesSync(token, notes)
        .then((stats) => {
          if (stats.localUpdated) {
            setNotes(stats.notes);
            localStorage.setItem('drivedeck_sticky_notes', JSON.stringify(stats.notes));
          }
          setSyncStatus('synced');
        })
        .catch((err) => {
          console.error('[DriveSync] Incremental sticky notes cloud upload failed:', err);
          setSyncStatus('error');
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [notes]);

  // Trigger manual cloud upload
  const handleForceSync = () => {
    const token = sessionStorage.getItem('drive_access_token');
    if (!token) return;
    setSyncStatus('syncing');
    executeStickyNotesSync(token, notes, true)
      .then(() => {
        setSyncStatus('synced');
      })
      .catch((err) => {
        console.error('[DriveSync] Manual cloud force sync failed:', err);
        setSyncStatus('error');
      });
  };

  // Drag & drop handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id);
    setSortBy('position'); // Automatically switch to position sorting on drag
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    // Resolve index of elements from the visually sorted list
    const fromIndex = sortedNotes.findIndex(n => n.id === draggedId);
    const toIndex = sortedNotes.findIndex(n => n.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updatedVisual = [...sortedNotes];
      const [draggedItem] = updatedVisual.splice(fromIndex, 1);
      updatedVisual.splice(toIndex, 0, draggedItem);

      // Re-assign positions sequentially based on the visual order
      const reRanked = notes.map(note => {
        const visualIdx = updatedVisual.findIndex(n => n.id === note.id);
        if (visualIdx !== -1) {
          // If we drag an element, let's see if we should auto-adjust its pinned status to match its new neighbors/section
          let pinnedVal = note.pinned;
          if (note.id === draggedId) {
            const prevItem = visualIdx > 0 ? updatedVisual[visualIdx - 1] : null;
            const nextItem = visualIdx < updatedVisual.length - 1 ? updatedVisual[visualIdx + 1] : null;
            if (prevItem && nextItem) {
              if (prevItem.pinned === nextItem.pinned) {
                pinnedVal = prevItem.pinned;
              }
            } else if (prevItem) {
              pinnedVal = prevItem.pinned;
            } else if (nextItem) {
              pinnedVal = nextItem.pinned;
            }
          }
          return {
            ...note,
            position: visualIdx,
            pinned: pinnedVal,
            updatedAt: note.id === draggedId ? Date.now() : note.updatedAt
          };
        }
        return note;
      });

      // Update state & trigger storage
      saveNotesToStore(reRanked);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragAllowedId(null);
  };

  // Add a new note
  const handleAddNote = (color: keyof typeof COLOR_CLASSES = 'yellow') => {
    if (isCreationBlocked) {
      if (onBlockedCreation) {
        onBlockedCreation();
      }
      return;
    }
    // Determine highest current position to append at the end of ranks
    const maxPos = notes.reduce((max, n) => (n.position ?? 0) > max ? (n.position ?? 0) : max, 0);
    
    const newNote: StickyNoteData = {
      id: `note-${Math.random().toString(36).substring(2, 11)}`,
      title: '',
      content: '',
      color,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: maxPos + 1
    };
    const updated = [newNote, ...notes];
    saveNotesToStore(updated);
  };

  // Update notes attributes inline
  const handleUpdateNote = (id: string, fields: Partial<StickyNoteData>) => {
    const updated = notes.map(note => {
      if (note.id === id) {
        return {
          ...note,
          ...fields,
          updatedAt: Date.now()
        };
      }
      return note;
    });
    saveNotesToStore(updated);
  };

  // Toggle pinning status
  const handleTogglePin = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      handleUpdateNote(id, { pinned: !note.pinned });
    }
  };

  // Change note color
  const handleChangeColor = (id: string, color: keyof typeof COLOR_CLASSES) => {
    handleUpdateNote(id, { color });
  };

  // Delete notes with direct overwrite synchronization
  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter(note => note.id !== id);
    skipNextSyncRef.current = true;
    saveNotesToStore(updated);

    const token = sessionStorage.getItem('drive_access_token');
    if (token) {
      setSyncStatus('syncing');
      try {
        await executeStickyNotesSync(token, updated, true);
        setSyncStatus('synced');
      } catch (err) {
        console.error('[DriveSync] Sticky note deletion sync failed:', err);
        setSyncStatus('error');
      }
    }
  };

  // Tag modification helpers
  const handleAddTag = (noteId: string, tag: string) => {
    const formattedTag = tag.trim();
    if (!formattedTag) return;
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const existingTags = note.tags || [];
      if (!existingTags.includes(formattedTag)) {
        handleUpdateNote(noteId, { tags: [...existingTags, formattedTag] });
      }
    }
  };

  const handleRemoveTag = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const remaining = (note.tags || []).filter(t => t !== tag);
      handleUpdateNote(noteId, { tags: remaining });
    }
  };

  // Attachment modification helpers
  const handleAttachFile = (noteId: string, attachment: Omit<StickyAttachment, 'id'>) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const newAttachment: StickyAttachment = {
        ...attachment,
        id: `att-${Math.random().toString(36).substring(2, 11)}`
      };
      const existing = note.attachments || [];
      handleUpdateNote(noteId, { attachments: [...existing, newAttachment] });
    }
  };

  const handleRemoveAttachment = (noteId: string, attachmentId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const remaining = (note.attachments || []).filter(a => a.id !== attachmentId);
      handleUpdateNote(noteId, { attachments: remaining });
    }
  };

  const loadPickerFiles = async (folderId: string, searchVal: string = '') => {
    const currentToken = token || sessionStorage.getItem('drive_access_token');
    if (!currentToken) return;
    setPickerLoading(true);
    try {
      let queryList: string[] = ['trashed = false'];
      if (searchVal.trim()) {
        queryList.push(`name contains '${searchVal.replace(/'/g, "\\'")}'`);
      } else {
        queryList.push(`'${folderId}' in parents`);
      }
      
      const q = encodeURIComponent(queryList.join(' and '));
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,createdTime,modifiedTime,thumbnailLink,webViewLink,size)&pageSize=50&orderBy=folder,name`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (!res.ok) {
        throw new Error(`Google API status ${res.status}`);
      }
      
      const data = await res.json();
      setPickerFiles(data.files || []);
    } catch (err) {
      console.error('Error loading picker files:', err);
    } finally {
      setPickerLoading(false);
    }
  };

  useEffect(() => {
    const currentToken = token || sessionStorage.getItem('drive_access_token');
    if (showDrivePicker && currentToken) {
      loadPickerFiles(pickerFolderId, pickerSearch);
    }
  }, [showDrivePicker, pickerFolderId, pickerSearch, token]);

  const handlePickerSelect = (file: any) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setPickerFolderId(file.id);
      setPickerHistory([...pickerHistory, { id: file.id, name: file.name }]);
      setPickerSearch('');
    } else {
      if (attachingToNoteId) {
        const isImage = file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);
        if (isImage) {
          // Direct direct high-quality streaming URL for Google Drive images
          const directUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
          handleAttachFile(attachingToNoteId, {
            type: 'image',
            title: file.name,
            url: directUrl,
            mimeType: file.mimeType,
            fileId: file.id
          });
        } else {
          let embedUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/preview`;
          if (file.mimeType === 'application/vnd.google-apps.document') {
            embedUrl = `https://docs.google.com/document/d/${file.id}/preview`;
          } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            embedUrl = `https://docs.google.com/spreadsheets/d/${file.id}/preview`;
          } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
            embedUrl = `https://docs.google.com/presentation/d/${file.id}/preview`;
          }

          handleAttachFile(attachingToNoteId, {
            type: 'drive',
            title: file.name,
            url: embedUrl,
            mimeType: file.mimeType,
            fileId: file.id
          });
        }
      }
      setShowDrivePicker(false);
      setAttachingToNoteId(null);
    }
  };

  // Helper to extract all existing tags from all notes
  const allAvailableTags: string[] = Array.from(
    new Set<string>(notes.flatMap(note => note.tags || []))
  ).filter(Boolean);

  // Link parsing helper inside StickyNotes context
  const renderTextWithLinks = (text: string) => {
    if (!text) return '';
    // Split by any web address starting with either http(s):// or www.
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      const isUrl = /^(https?:\/\/|www\.)[^\s]+$/i.test(part);
      if (isUrl) {
        let urlText = part;
        let trailing = '';
        while (urlText.length > 0 && ['.', ',', ';', '!', '?', ')', ']'].includes(urlText[urlText.length - 1])) {
          trailing = urlText[urlText.length - 1] + trailing;
          urlText = urlText.slice(0, -1);
        }
        
        const href = urlText.toLowerCase().startsWith('www.') ? `https://${urlText}` : urlText;
        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-bold break-all inline-flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {urlText.length > 25 ? urlText.substring(0, 25) + '...' : urlText}
              <ExternalLink className="w-3 h-3 inline shrink-0" />
            </a>
            {trailing}
          </React.Fragment>
        );
      }
      return part;
    });
  };

  // Filter & Sort computation
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = filterColor === 'all' || note.color === filterColor;
    const matchesTag = filterTag === 'all' || (note.tags && note.tags.includes(filterTag));
    return matchesSearch && matchesColor && matchesTag;
  });

  // Sort notes logic: pinned are ALWAYS first, then secondary sorting
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    if (sortBy === 'position') {
      const posA = a.position !== undefined ? a.position : Number.MAX_SAFE_INTEGER;
      const posB = b.position !== undefined ? b.position : Number.MAX_SAFE_INTEGER;
      return posA - posB;
    }
    if (sortBy === 'updated') {
      return b.updatedAt - a.updatedAt;
    }
    if (sortBy === 'created') {
      return b.createdAt - a.createdAt;
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50/45 min-h-0 font-sans">
      
      {/* Search and control bar (Highly responsive design) */}
      <section className="bg-white border-b border-slate-100 px-4 py-3 sm:py-4 shadow-3xs shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          
          {/* Section Header with dynamic state indicator */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg border border-amber-200/50">
                <Pin className="w-5 h-5 -rotate-45" />
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">Privater Haftnotiz-Bereich</h1>
                
                {/* Responsive subtitle */}
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold leading-none mt-1">
                  Memos &amp; Geistesblitze in Sekundenschnelle festhalten
                </p>
              </div>
            </div>

            {/* Live Autosave tick element */}
            <div className="flex items-center gap-1 text-[10px] font-bold select-none text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-1 rounded-full opacity-0 transition-all duration-300 pointer-events-none" style={{ opacity: showAutoSaveTick ? 1 : 0 }}>
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Live gespeichert</span>
            </div>
          </div>

          {/* Filtering and Quick Actions row */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Input width handles spacing cleanly */}
            <div className="relative flex-1 sm:flex-initial min-w-[140px] xs:min-w-[190px]">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Notizen durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50/90 hover:bg-slate-50 border border-slate-200 focus:border-accent-blue rounded-lg text-xs font-semibold focus:outline-none placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Color Filter Picker dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsColorFilterOpen(!isColorFilterOpen)}
                className="flex items-center gap-2 bg-slate-50/90 hover:bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-accent-blue cursor-pointer transition-all min-w-[115px] justify-between shadow-2xs select-none"
              >
                <div className="flex items-center gap-2">
                  {filterColor === 'all' ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-sky-450 border border-black/10 shadow-3xs shrink-0" />
                  ) : (
                    <span className={`w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs shrink-0 ${
                      filterColor === 'yellow' ? 'bg-amber-400' :
                      filterColor === 'green' ? 'bg-emerald-400' :
                      filterColor === 'blue' ? 'bg-sky-400' :
                      filterColor === 'pink' ? 'bg-rose-400' :
                      filterColor === 'purple' ? 'bg-purple-400' :
                      filterColor === 'orange' ? 'bg-orange-400' :
                      'bg-slate-400'
                    }`} />
                  )}
                  <span>
                    {FILTER_COLORS.find(item => item.value === filterColor)?.label || 'Farben'}
                  </span>
                </div>
              </button>

              {isColorFilterOpen && (
                <>
                  {/* Backdrop click away listener wrapper */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsColorFilterOpen(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200/90 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {FILTER_COLORS.map((item) => {
                      const isSelected = filterColor === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setFilterColor(item.value);
                            setIsColorFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer text-left hover:bg-slate-50 transition-colors ${
                            isSelected ? 'text-slate-900 bg-slate-50/40' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs shrink-0 ${item.bg}`} />
                            <span>{item.label}</span>
                          </div>
                          {isSelected && <CheckCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Tag Filter Picker dropdown */}
            <div className="relative shrink-0">
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="appearance-none bg-slate-50/90 hover:bg-slate-50 border border-slate-200 text-xs font-bold pl-3 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-accent-blue cursor-pointer transition-colors"
                title="Nach Label filtern"
              >
                <option value="all">Alle Labels 🏷️</option>
                {allAvailableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Sorting Selection dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-slate-50/90 hover:bg-slate-50 border border-slate-200 text-xs font-bold pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-accent-blue cursor-pointer transition-colors"
                title="Sortieren nach"
              >
                <option value="position">Manuell</option>
                <option value="updated">Zuletzt aktualisiert</option>
                <option value="created">Neu erstellt</option>
                <option value="title">Titel (A-Z)</option>
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Create Trigger buttons inside Header actions */}
            <button
              onClick={() => handleAddNote('yellow')}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-2xs select-none cursor-pointer transition-all ml-auto md:ml-0 animate-in fade-in"
            >
              <Plus className="w-4 h-4" />
              <span>Haftnotiz</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Canvas with Grid rendering (Broader style: exactly 3 columns max on LG screens and up) */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto">
          
          {sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-800">Keine Haftnotizen gefunden</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Es wurden keine Haftnotizen für deine Filtereinstellungen gefunden. Erstelle jetzt einen neuen gelben Zettel!
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterColor('all');
                  handleAddNote('yellow');
                }}
                className="mt-4 px-4 py-2 bg-[#0288D1] hover:opacity-95 text-white text-xs font-extrabold rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Erste Haftnotiz hinzufügen</span>
              </button>
            </div>
          ) : (
            /* EXACTLY 3 COLUMN CONFIGURATION ON LARGE SCREENS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {sortedNotes.map((note) => {
                const colorConfig = COLOR_CLASSES[note.color] || COLOR_CLASSES.yellow;
                const isItemDragged = draggedId === note.id;

                return (
                  <div
                    key={note.id}
                    draggable={dragAllowedId === note.id}
                    onDragStart={() => handleDragStart(note.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(note.id)}
                    onDragEnd={handleDragEnd}
                    className={`group relative rounded-2xl shadow-sm border p-5 flex flex-col gap-3.5 min-h-[360px] max-h-[440px] transition-all duration-200 select-none ${colorConfig.bg} ${colorConfig.focusRing} ${
                      isItemDragged ? 'opacity-30 scale-95 border-dashed border-slate-400' : 'opacity-100 hover:shadow-md'
                    }`}
                  >
                    
                    {/* Inner wrapper to suppress pointer-events on nested nodes while dragging is active */}
                    <div className={`flex flex-col gap-3.5 h-full w-full ${draggedId ? 'pointer-events-none' : ''}`}>
                      
                      {/* Drag Handle & Pin status in a unified top bar row */}
                      <div className="flex items-center justify-between -mt-1 shrink-0 select-none">
                        
                        {/* Left Drag Handle */}
                        <div 
                          onMouseDown={() => setDragAllowedId(note.id)}
                          onMouseUp={() => setDragAllowedId(null)}
                          className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-black/5 rounded-md transition-colors"
                          title="Haftnotiz verschieben (Ziehen)"
                        >
                          <GripHorizontal className="w-4 h-4" />
                        </div>

                        {/* Right Pin controller */}
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          className={`p-1.5 rounded-full shadow-4xs transition-all cursor-pointer ${
                            note.pinned 
                              ? 'bg-red-500 text-white hover:bg-red-650 rotate-0 scale-105' 
                              : 'bg-white/80 hover:bg-white border border-slate-200/50 text-slate-400 hover:text-slate-600 hover:scale-110 -rotate-45'
                          }`}
                          title={note.pinned ? "Haftnotiz lösen" : "Oben anpinnen"}
                        >
                          <Pin className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>

                      {/* Note Card Top Header with Inline Title & Trash Option */}
                      <div className="flex items-start justify-between gap-3 shrink-0">
                        <input 
                          type="text"
                          placeholder="Titel..."
                          value={note.title}
                          onChange={(e) => handleUpdateNote(note.id, { title: e.target.value })}
                          className={`w-full bg-transparent font-extrabold text-sm sm:text-base tracking-tight placeholder:opacity-35 focus:outline-none border-b border-transparent focus:border-slate-350/20 pb-0.5 truncate ${colorConfig.titleColor}`}
                        />
                        
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 px-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-black/5 cursor-pointer shrink-0 transition-colors"
                          title="Haftnotiz löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Left Border Accent line */}
                      <div className={`w-1 h-3/5 absolute left-3 top-16 rounded-full ${colorConfig.accentLine}`}></div>

                      {/* Image previews inside the scroll/content flow */}
                      {note.attachments && note.attachments.some(a => a.type === 'image') && (
                        <div className="grid grid-cols-1 gap-2 mt-1 px-2 shrink-0 rounded-lg overflow-hidden relative">
                          {note.attachments
                            .filter(a => a.type === 'image')
                            .map((img) => (
                              <div key={img.id} className="relative group/img aspect-video sm:h-24 w-full overflow-hidden rounded-lg bg-black/5 border border-black/5 animate-in fade-in zoom-in-95">
                                <img 
                                  src={img.url} 
                                  alt={img.title} 
                                  className="w-full h-full object-cover select-none" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAttachment(note.id, img.id);
                                    }}
                                    className="p-1 px-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg cursor-pointer shadow-xs transition-colors"
                                    title="Bild löschen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Main Content Editable Textarea (Scrolls internally if long) */}
                      <div className="flex-1 min-h-0 pl-2 flex flex-col">
                        {editingNoteId === note.id ? (
                          <textarea
                            placeholder="Inhalt aufschreiben..."
                            value={note.content}
                            onChange={(e) => handleUpdateNote(note.id, { content: e.target.value })}
                            onBlur={() => setEditingNoteId(null)}
                            autoFocus
                            className={`w-full h-full bg-transparent text-xs sm:text-sm leading-relaxed resize-none focus:outline-none placeholder:opacity-30 font-sans font-medium overflow-y-auto ${colorConfig.textColor}`}
                          />
                        ) : (
                          <div 
                            onClick={() => setEditingNoteId(note.id)}
                            className={`w-full h-full text-xs sm:text-sm leading-relaxed font-sans font-medium overflow-y-auto whitespace-pre-wrap cursor-text select-text ${colorConfig.textColor} ${!note.content ? 'italic opacity-40' : ''}`}
                          >
                            {note.content ? renderTextWithLinks(note.content) : "Inhalt aufschreiben..."}
                          </div>
                        )}
                      </div>

                      {/* Automated Rich Link Preview for typed links in content (not already in attachments) */}
                      {(() => {
                        const firstUrl = getFirstUrlInText(note.content);
                        if (!firstUrl) return null;
                        
                        const alreadyAttached = note.attachments?.some(a => {
                          const aUrl = a.url.toLowerCase().trim();
                          const fUrl = firstUrl.toLowerCase().trim();
                          return aUrl.includes(fUrl) || fUrl.includes(aUrl);
                        });
                        
                        if (alreadyAttached) return null;
                        
                        return (
                          <div className="mt-2 pl-2 pr-1 shrink-0 animate-in fade-in duration-300">
                            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-extrabold block mb-1">
                              Anhang-Vorschau 🌐
                            </span>
                            <RichLinkPreview url={firstUrl} />
                          </div>
                        );
                      })()}

                      {/* Labels/Tags List */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-2 shrink-0 select-none">
                          {note.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 hover:bg-black/10 border border-black/5 text-slate-800 transition-all duration-150"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTag(note.id, tag);
                                }}
                                className="text-slate-400 hover:text-red-650 font-bold ml-1 cursor-pointer"
                                title="Label entfernen"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* File and web-link attachments list (horizontally scrollable or stacked) */}
                      {note.attachments && note.attachments.some(a => a.type !== 'image') && (
                        <div className="flex flex-col gap-1.5 mt-2 pl-2 shrink-0 select-none">
                          {note.attachments
                            .filter(a => a.type !== 'image')
                            .map((att) => {
                              if (att.type === 'link') {
                                return (
                                  <RichLinkPreview 
                                    key={att.id} 
                                    url={att.url} 
                                    title={att.title} 
                                    onRemove={() => handleRemoveAttachment(note.id, att.id)} 
                                  />
                                );
                              }

                              const isDrive = att.type === 'drive';
                              let badgeColor = 'bg-black/5 hover:bg-black/10 border-black/5 text-slate-800';
                              
                              if (isDrive) {
                                const mime = att.mimeType || '';
                                if (mime.includes('document')) badgeColor = 'bg-blue-600/10 hover:bg-blue-600/15 border-blue-500/20 text-blue-800';
                                else if (mime.includes('spreadsheet')) badgeColor = 'bg-emerald-600/10 hover:bg-emerald-600/15 border-emerald-500/20 text-emerald-800';
                                else if (mime.includes('presentation')) badgeColor = 'bg-amber-600/10 hover:bg-amber-600/15 border-amber-500/20 text-amber-850';
                              } else {
                                badgeColor = 'bg-indigo-650/10 hover:bg-indigo-650/15 border-indigo-500/20 text-indigo-900';
                              }

                              return (
                                <div 
                                  key={att.id} 
                                  className={`group/att flex items-center justify-between p-1.5 pl-2 rounded-lg border text-[11px] font-bold transition-all ${badgeColor}`}
                                >
                                  <a 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-1.5 min-w-0 flex-1 truncate pr-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {getAttachmentIcon(att)}
                                    <span className="truncate">{att.title}</span>
                                  </a>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAttachment(note.id, att.id);
                                    }}
                                    className="p-1 opacity-60 group-hover/att:opacity-100 hover:bg-black/10 text-slate-500 hover:text-red-700 rounded transition-all cursor-pointer"
                                    title="Anhang entfernen"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Bottom Toolbar inside Node: Color selection Picker, Tags and Attach triggers */}
                      <div className="pt-2.5 border-t border-slate-400/10 flex items-center justify-between gap-2 shrink-0 select-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 font-mono">
                            {new Date(note.updatedAt).toLocaleDateString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <button
                            type="button"
                            onClick={() => setActivePopup({ noteId: note.id, type: 'tag' })}
                            className="p-1 hover:bg-black/5 text-slate-400 hover:text-slate-700 rounded transition-all cursor-pointer"
                            title="Labels verwalten"
                          >
                            <Tag className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActivePopup({ noteId: note.id, type: 'attach' })}
                            className="p-1 hover:bg-black/5 text-slate-400 hover:text-slate-700 rounded transition-all cursor-pointer"
                            title="Dateien, Link oder Bild anhängen"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Mini Round Color dots for swift swap (visible only on hover or active focus, faded in after a certain delay) */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 ease-out delay-500">
                          {(Object.keys(COLOR_CLASSES) as Array<keyof typeof COLOR_CLASSES>).map((col) => {
                            const config = COLOR_CLASSES[col];
                            const isSelected = note.color === col;
                            
                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => handleChangeColor(note.id, col)}
                                className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-all ${config.pickerBtn} ${
                                  isSelected ? 'ring-2 ring-sky-500 scale-110 shadow-4xs' : 'hover:scale-105 opacity-80'
                                }`}
                                title={`Farbe auf ${config.label} ändern`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Popup Overlay for labels or attachments inside card context */}
                      {activePopup && activePopup.noteId === note.id && (
                        <div className="absolute inset-x-3 bottom-[45px] top-[45px] bg-white border border-slate-200/90 rounded-xl shadow-lg z-25 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
                          {activePopup.type === 'tag' && (
                            <div className="flex flex-col h-full min-h-0">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                                  Labels verwalten
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => setActivePopup(null)}
                                  className="text-slate-400 hover:text-slate-650 font-bold text-sm px-1.5 rounded hover:bg-slate-50"
                                >
                                  ×
                                </button>
                              </div>

                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const input = form.elements.namedItem('newTag') as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    handleAddTag(note.id, input.value.trim());
                                    input.value = '';
                                  }
                                }}
                                className="flex gap-1.5 mt-2.5 shrink-0"
                              >
                                <input 
                                  name="newTag"
                                  type="text"
                                  placeholder="Neues Label..."
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 focus:outline-none focus:border-sky-500"
                                />
                                <button 
                                  type="submit"
                                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-2 rounded-lg"
                                >
                                  +
                                </button>
                              </form>

                              <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Vorschläge
                                </span>
                                {allAvailableTags.filter(t => !note.tags?.includes(t)).length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">Keine weiteren Vorschläge</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {allAvailableTags
                                      .filter(t => !note.tags?.includes(t))
                                      .map(t => (
                                        <button
                                          key={t}
                                          type="button"
                                          onClick={() => handleAddTag(note.id, t)}
                                          className="px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-750 text-slate-700 text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                          {t}
                                        </button>
                                      ))
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {activePopup.type === 'attach' && (
                            <div className="flex flex-col h-full justify-between">
                              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                                <span className="text-xs font-extrabold text-slate-800">Anhang hinzufügen</span>
                                <button 
                                  type="button" 
                                  onClick={() => setActivePopup(null)}
                                  className="text-slate-400 hover:text-slate-655 font-bold"
                                >
                                  ×
                                </button>
                              </div>

                              <div className="flex flex-col gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!hasLoggedInToken) {
                                      alert("Bitte erstelle eine Google-Verbindung über das Profil-Symbol oben, um deine Drive Dokumente einzubinden.");
                                      return;
                                    }
                                    setAttachingToNoteId(note.id);
                                    setShowDrivePicker(true);
                                    setPickerFolderId('root');
                                    setPickerHistory([{ id: 'root', name: 'Drive' }]);
                                    setActivePopup(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-sky-50 hover:text-sky-700 text-slate-700 hover:font-bold text-xs rounded-lg border border-slate-100 transition-all font-semibold cursor-pointer"
                                >
                                  <span>📎</span>
                                  <span>Google Drive Datei</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePopup({ noteId: note.id, type: 'image-url' });
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 hover:font-bold text-xs rounded-lg border border-slate-100 transition-all font-semibold cursor-pointer"
                                >
                                  <span>🖼️</span>
                                  <span>Bild-URL einbinden</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePopup({ noteId: note.id, type: 'link-url' });
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-amber-50 hover:text-amber-700 text-slate-700 hover:font-bold text-xs rounded-lg border border-slate-100 transition-all font-semibold cursor-pointer"
                                >
                                  <span>🌐</span>
                                  <span>Web-Link einpflegen</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActivePopup(null)}
                                className="w-full py-1 text-slate-400 hover:text-slate-650 font-bold text-xs uppercase cursor-pointer"
                              >
                                Abbrechen
                              </button>
                            </div>
                          )}

                          {activePopup.type === 'image-url' && (
                            <div className="flex flex-col h-full justify-between">
                              <div className="border-b border-slate-150 pb-2 flex justify-between items-center">
                                <span className="text-xs font-extrabold text-slate-800">Bild-URL hinzufügen</span>
                                <button type="button" onClick={() => setActivePopup({ noteId: note.id, type: 'attach' })} className="text-slate-400 hover:text-slate-600 text-xs">Zurück</button>
                              </div>

                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const urlInput = form.elements.namedItem('imgUrl') as HTMLInputElement;
                                  if (urlInput && urlInput.value.trim()) {
                                    handleAttachFile(note.id, {
                                      type: 'image',
                                      title: 'Eingebundenes Bild',
                                      url: urlInput.value.trim()
                                    });
                                    setActivePopup(null);
                                  }
                                }}
                                className="flex flex-col gap-2.5 mt-2.5"
                              >
                                <input 
                                  name="imgUrl"
                                  type="url"
                                  required
                                  placeholder="https://example.com/bild.jpg"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 focus:outline-none focus:border-sky-500"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActivePopup({ noteId: note.id, type: 'attach' })}
                                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    Abbrechen
                                  </button>
                                  <button
                                    type="submit"
                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    Hinzufügen
                                  </button>
                                </div>
                              </form>
                              <div />
                            </div>
                          )}

                          {activePopup.type === 'link-url' && (
                            <div className="flex flex-col h-full justify-between">
                              <div className="border-b border-slate-150 pb-2 flex justify-between items-center">
                                <span className="text-xs font-extrabold text-slate-800">Web-Link hinzufügen</span>
                                <button type="button" onClick={() => setActivePopup({ noteId: note.id, type: 'attach' })} className="text-slate-400 hover:text-slate-600 text-xs">Zurück</button>
                              </div>

                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const urlInput = form.elements.namedItem('linkUrl') as HTMLInputElement;
                                  const titleInput = form.elements.namedItem('linkTitle') as HTMLInputElement;
                                  if (urlInput && urlInput.value.trim()) {
                                    const url = urlInput.value.trim();
                                    const title = titleInput.value.trim() || url;
                                    handleAttachFile(note.id, {
                                      type: 'link',
                                      title: title,
                                      url: url
                                    });
                                    setActivePopup(null);
                                  }
                                }}
                                className="flex flex-col gap-2 mt-2"
                              >
                                <input 
                                  name="linkUrl"
                                  type="url"
                                  required
                                  placeholder="https://wikipedia.org"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1 focus:outline-none focus:border-sky-500"
                                />
                                <input 
                                  name="linkTitle"
                                  type="text"
                                  placeholder="Titel (z.B. Wikipedia)"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1 focus:outline-none focus:border-sky-500"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActivePopup({ noteId: note.id, type: 'attach' })}
                                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    Abbrechen
                                  </button>
                                  <button
                                    type="submit"
                                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    Hinzufügen
                                  </button>
                                </div>
                              </form>
                              <div />
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Info hint block under the grid */}
          <section className="mt-8 bg-amber-50/50 border border-amber-200/40 rounded-xl p-4.5 select-none animate-in fade-in">
            <div className="flex items-start gap-2.5 max-w-2xl">
              <span className="text-lg shrink-0">☁️</span>
              <div className="text-xs text-amber-900 font-medium font-sans">
                <p className="font-bold text-amber-950">Echtzeit Google Drive-Synchronisierung</p>
                <p className="opacity-90 leading-relaxed mt-1">
                  Alle Änderungen an Haftnotizen, Farbcodes und Drag-Kombinationen werden automatisch in ein getrenntes, sicheres Datendokument in deinem Google-Konto hochgeladen. Dadurch rufen alle lizenzierten Geräte stets denselben Stand ab. Offline erstellte Notizen werden zusammengeführt, sobald du wieder eine Internetverbindung herstellst!
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Google Drive Multi-utility File Picker modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col h-[520px] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="bg-sky-100 p-1.5 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Dateien aus Google Drive wählen</h3>
                  <p className="text-[10px] text-slate-500 font-semibold align-middle">Wähle Dokumente, PDFs oder Präsentationen zum Anpinnen</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowDrivePicker(false);
                  setAttachingToNoteId(null);
                }}
                className="text-slate-400 hover:text-slate-650 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation and Search controls */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              {/* Breadcrumbs path */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 overflow-x-auto max-w-full no-scrollbar">
                {pickerHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <span className="text-slate-300 font-mono text-[10px]">&gt;</span>}
                    <button
                      type="button"
                      onClick={() => {
                        const newHistory = pickerHistory.slice(0, idx + 1);
                        setPickerHistory(newHistory);
                        setPickerFolderId(item.id);
                        setPickerSearch('');
                      }}
                      className={`hover:text-sky-600 font-semibold cursor-pointer truncate max-w-[100px] py-0.5 px-0.5 rounded transition-colors ${
                        idx === pickerHistory.length - 1 ? 'text-sky-600 bg-sky-50' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Search input inside Picker */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Dateien durchsuchen..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-lg text-xs font-semibold focus:outline-none placeholder:text-slate-400 transition-colors"
                />
                {pickerSearch && (
                  <button
                    type="button"
                    onClick={() => setPickerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List block */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {pickerLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                  <Loader2 className="w-7 h-7 text-sky-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Lade Google Drive Inhalte...</p>
                </div>
              ) : pickerFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
                  <FolderOpen className="w-8 h-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">Keine gängigen Dokumente hier vorhanden</p>
                  <p className="text-[10px] opacity-80 mt-1 max-w-xs">Dieser Ordner ist leer oder Suchergebnisse blieben ohne Treffer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pickerFiles.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handlePickerSelect(file)}
                        className={`group/file flex items-center gap-3 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isFolder 
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:scale-[1.01]' 
                            : 'bg-white hover:bg-sky-50/40 hover:border-sky-200 border-slate-150 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {isFolder ? (
                            <Folder className="w-5 h-5 text-amber-500 select-none fill-amber-500/20" />
                          ) : file.mimeType?.startsWith('image/') && file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt=""
                              className="w-5 h-5 object-cover rounded shadow-3xs border border-black/10"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            getAttachmentIcon({ id: file.id, type: 'drive', title: file.name, url: '', mimeType: file.mimeType })
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold leading-tight truncate ${isFolder ? 'text-slate-800' : 'text-slate-700'}`}>
                            {file.name}
                          </p>
                          <p className="text-[9px] font-mono font-semibold text-slate-400 mt-0.5">
                            {isFolder ? 'Ordner' : file.mimeType?.split('.').pop()?.toUpperCase()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDrivePicker(false);
                  setAttachingToNoteId(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-250 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
