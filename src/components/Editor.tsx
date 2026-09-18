/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Square, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  List, 
  Code,
  FileSpreadsheet,
  ExternalLink,
  GripVertical,
  RefreshCw,
  
  // Custom new icons for Slash Menu
  Image,
  Link,
  Video,
  Youtube,
  Music,
  Mic,
  Paperclip,
  Camera,
  Calendar,
  Presentation,
  FolderOpen,
  Folder,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Volume2,
  FolderArchive,
  File,
  Download,
  BookOpen,
  Loader2,
  Upload,
  CloudUpload,
  Edit2,
  Check,
  Settings2,
  AlertTriangle,
  Globe,
  Kanban
} from 'lucide-react';
import { WorkspacePage, Block, BlockType, CalendarSource } from '../types';
import { generateId } from '../lib/db';
import { initAuth, googleSignIn } from '../lib/googleAuth';
import { launchGooglePicker } from '../lib/googlePicker';
import firebaseConfig from '../../firebase-applet-config.json';
import { getOrCreateShareFolder } from '../lib/driveSync';
import { SecureAudioPlayer, SecureVideoPlayer, SecureImage, SecureAlbum } from './SecureMedia';
import VoiceRecorder from './VoiceRecorder';
import EmbeddedKanbanBlock from './EmbeddedKanbanBlock';
import { useLanguage } from '../lib/LanguageContext';
import { EMOJI_GROUPS, ALL_EMOJIS_FLAT } from '../data/emojis';
import { CURATED_BANNERS } from '../data/banners';

interface EditorProps {
  page: WorkspacePage;
  onUpdatePage: (updatedPage: WorkspacePage) => void;
  onOpenPicker?: (blockId: string) => void;
  showConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText?: string,
    cancelText?: string,
    isAlert?: boolean
  ) => void;
}

const SLASH_OPTIONS = [
  { key: 't1', label: 'Titel 1', sub: 'Große Kapitelüberschrift', icon: 'H1', type: 'heading1' as BlockType, mimeType: undefined },
  { key: 't2', label: 'Titel 2', sub: 'Mittlere Überschrift', icon: 'H2', type: 'heading2' as BlockType, mimeType: undefined },
  { key: 't3', label: 'Titel 3', sub: 'Kleine Unterüberschrift', icon: 'H3', type: 'heading3' as BlockType, mimeType: undefined },
  { key: 'text', label: 'Fließtext', sub: 'Normaler Absatz', icon: 'Type', type: 'text' as BlockType, mimeType: undefined },
  { key: 'todo', label: 'Checkliste', sub: 'Aufgaben-Abhakliste', icon: 'CheckSquare', type: 'todo' as BlockType, mimeType: undefined },
  { key: 'bullet', label: 'Aufzählung', sub: 'Einfache ungeordnete Liste', icon: 'List', type: 'bullet' as BlockType, mimeType: undefined },
  { key: 'kanban', label: 'Kanban Board', sub: 'Projekt-Board mit Spalten & Karten einbetten', icon: 'Kanban', type: 'kanban' as BlockType, mimeType: undefined },
  { key: 'code', label: 'Code Block', sub: 'Interaktives Programmierfeld (IndexedDB)', icon: 'Code', type: 'code' as BlockType, mimeType: undefined },
  
  // Custom Google Embed components requested
  { key: 'doc', label: 'Docs Datei', sub: 'Google Textdokument anzeigen/bearbeiten', icon: 'FileText', type: 'google-drive' as BlockType, mimeType: 'application/vnd.google-apps.document' },
  { key: 'sheet', label: 'Sheet Datei', sub: 'Google Tabelle einbetten', icon: 'FileSpreadsheet', type: 'google-drive' as BlockType, mimeType: 'application/vnd.google-apps.spreadsheet' },
  { key: 'slide', label: 'Slide Präsentation', sub: 'Google Slides Präsentation anzeigen', icon: 'Presentation', type: 'google-drive' as BlockType, mimeType: 'application/vnd.google-apps.presentation' },
  { key: 'youtube', label: 'YouTube Video', sub: 'YouTube Video-Player einbetten', icon: 'Youtube', type: 'google-drive' as BlockType, mimeType: 'video/youtube' },
  { key: 'video', label: 'Video / Vids', sub: 'Direkte MP4 / WebM Videodatei', icon: 'Video', type: 'google-drive' as BlockType, mimeType: 'video/generic' },
  { key: 'image', label: 'Image / Foto', sub: 'Google Photos oder Drive Bild einbinden', icon: 'Image', type: 'google-drive' as BlockType, mimeType: 'image/generic' },
  { key: 'audio', label: 'Audio', sub: 'Drive-Audiodatei abspielen', icon: 'Music', type: 'google-drive' as BlockType, mimeType: 'audio/generic' },
  { key: 'record', label: 'Record / Sprachaufnahme', sub: 'Eigene Voice-Audios speichern', icon: 'Mic', type: 'google-drive' as BlockType, mimeType: 'audio/generic' },
  { key: 'calendar', label: 'Kalender', sub: 'Interaktiven Google Kalender einbinden', icon: 'Calendar', type: 'google-drive' as BlockType, mimeType: 'calendar/google' },
  { key: 'photos', label: 'Photos / Album', sub: 'Google Fotos Medium oder Album einbetten', icon: 'Camera', type: 'google-drive' as BlockType, mimeType: 'image/generic' },
  { key: 'link', label: 'Link / URL', sub: 'Webseite-Vorschaufenster einbetten', icon: 'Link', type: 'google-drive' as BlockType, mimeType: 'link/generic' },
  { key: 'file', label: 'File / Sonstige Datei', sub: 'PDF, ZIP oder sonstige Mediendatei', icon: 'Paperclip', type: 'google-drive' as BlockType, mimeType: 'application/pdf' },
];

const renderSlashIcon = (iconName: string) => {
  switch (iconName) {
    case 'H1': return <Heading1 className="w-4 h-4 text-rose-500" />;
    case 'H2': return <Heading2 className="w-4 h-4 text-orange-500" />;
    case 'H3': return <Heading3 className="w-4 h-4 text-amber-500" />;
    case 'Type': return <Type className="w-4 h-4 text-emerald-500" />;
    case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-sky-500" />;
    case 'List': return <List className="w-4 h-4 text-teal-500" />;
    case 'Kanban': return <Kanban className="w-4 h-4 text-sky-600" />;
    case 'Code': return <Code className="w-4 h-4 text-indigo-500" />;
    case 'FileText': return <FileText className="w-4 h-4 text-blue-500" />;
    case 'FileSpreadsheet': return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    case 'Presentation': return <Presentation className="w-4 h-4 text-orange-600" />;
    case 'Youtube': return <Youtube className="w-4 h-4 text-red-500" />;
    case 'Video': return <Video className="w-4 h-4 text-red-400" />;
    case 'Image': return <Image className="w-4 h-4 text-purple-500" />;
    case 'Music': return <Music className="w-4 h-4 text-pink-500" />;
    case 'Mic': return <Mic className="w-4 h-4 text-fuchsia-500" />;
    case 'Calendar': return <Calendar className="w-4 h-4 text-violet-500" />;
    case 'Camera': return <Camera className="w-4 h-4 text-cyan-500" />;
    case 'Link': return <Link className="w-4 h-4 text-slate-500" />;
    case 'Paperclip': return <Paperclip className="w-4 h-4 text-gray-500" />;
    default: return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

const COVER_PRESETS = [
  { name: 'Sunset Aura', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Deep Cosmic', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Rainforest', url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Dune Minimal', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Neotech Setup', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Blue Abstract', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&auto=format&fit=crop&q=80' }
];

async function uploadFileToDrive(file: File, token: string): Promise<string> {
  const folderId = await getOrCreateShareFolder(token);
  const metadata = {
    name: `drivedeck_cover_${Date.now()}_${file.name}`,
    mimeType: file.type,
    parents: [folderId]
  };

  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const metadataPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  
  const headerBlob = new Blob([
    delimiter,
    metadataPart,
    delimiter,
    `Content-Type: ${file.type}\r\n\r\n`
  ]);
  const footerBlob = new Blob([closeDelimiter]);

  const bodyBlob = new Blob([headerBlob, fileData, footerBlob]);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBlob,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errText}`);
  }

  const result = await response.json();
  return result.id;
}

function SecureCoverImage({ fileId, token }: { fileId: string; token: string | null }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileId) return;
    if (!token) {
      setImageUrl(`https://lh3.googleusercontent.com/d/${fileId}`);
      setLoading(false);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    async function fetchCover() {
      try {
        setLoading(true);
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Cover fetch failed');
        const blob = await res.blob();
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        }
      } catch (err) {
        console.error('Error fetching cover from Drive:', err);
        if (active) {
          setImageUrl(`https://lh3.googleusercontent.com/d/${fileId}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCover();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, token]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl || ''} 
      alt="Page Cover" 
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
    />
  );
}

export default function Editor({
  page,
  onUpdatePage,
  onOpenPicker,
  showConfirm
}: EditorProps) {
  const { language } = useLanguage();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [activeEmojiGroupId, setActiveEmojiGroupId] = useState('popular');
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [coverSelectorTab, setCoverSelectorTab] = useState<'presets' | 'unsplash' | 'custom'>('presets');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<Array<{ name: string; url: string; photographer: string; photographerUrl?: string }>>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState<string | null>(null);
  const [activeUnsplashCat, setActiveUnsplashCat] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState<{ [blockId: string]: string }>({});
  
  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Slash Commands State
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string>('');
  const [slashActiveIndex, setSlashActiveIndex] = useState<number>(0);

  // Transform Block Type State & Helper
  const [activeTransformBlockId, setActiveTransformBlockId] = useState<string | null>(null);

  // Lazy-load states for Google Drive integrations to boost rendering performance
  const [loadedDriveBlocks, setLoadedDriveBlocks] = useState<{ [blockId: string]: boolean }>({});

  // Renaming block files state
  const [renamingBlockId, setRenamingBlockId] = useState<string | null>(null);
  const [tempRenameValue, setTempRenameValue] = useState<string>('');
  const [renamingLoading, setRenamingLoading] = useState<boolean>(false);

  // Collapsible state for calendar settings panels per block ID
  const [expandedCalendars, setExpandedCalendars] = useState<{ [blockId: string]: boolean }>({});
  const [activeColorPickerRow, setActiveColorPickerRow] = useState<{ [blockId: string]: number | null }>({});

  // Keep active slash popup option scrolled into view during arrow key navigation
  useEffect(() => {
    if (activeSlashBlockId !== null) {
      const container = document.getElementById(`slash-popup-${activeSlashBlockId}`);
      const selectedItem = document.getElementById(`slash-option-${activeSlashBlockId}-${slashActiveIndex}`);
      if (container && selectedItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        
        // Offset representing the header margin or border if any
        const elemTop = selectedItem.offsetTop;
        const elemBottom = elemTop + selectedItem.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [slashActiveIndex, activeSlashBlockId]);

  const handleRenameBlockFile = async (blockId: string, fileId: string, newFileName: string) => {
    if (!newFileName.trim()) return;
    
    // Auto-preserve file extension suffix (e.g., .webm, .m4a, .mp4, etc.) to prevent accidental deletion
    const block = page.blocks.find(b => b.id === blockId);
    const originalName = block?.properties?.fileName || '';
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extMatch ? extMatch[1] : '';
    
    let finalFileName = newFileName.trim();
    if (extension) {
      const extWithDot = `.${extension}`;
      if (!finalFileName.toLowerCase().endsWith(extWithDot.toLowerCase())) {
        finalFileName = `${finalFileName}${extWithDot}`;
      }
    }
    
    // 1. Instantly update locally (optimistic UI & offline compatibility)
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          properties: {
            ...b.properties,
            fileName: finalFileName
          }
        };
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });

    setRenamingBlockId(null);

    // 2. Async API update in Google Drive if token & fileId are valid
    if (token && fileId && !fileId.startsWith('mock-')) {
      try {
        setRenamingLoading(true);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: finalFileName
          })
        });
        if (!response.ok) {
          console.warn("Failed to rename file in Google Drive:", response.statusText);
        }
      } catch (err) {
        console.error("Error renaming file on Google Drive:", err);
      } finally {
        setRenamingLoading(false);
      }
    }
  };

  // Helper to parse calendar sources in a safe way with backward-compatibility
  const getBlockCalendars = (block: Block): CalendarSource[] => {
    if (block.properties?.calendars && block.properties.calendars.length > 0) {
      return block.properties.calendars;
    }
    // Otherwise parse from properties.fileId
    const ids = (block.properties?.fileId || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    // Modern, bright, clean Google Calendar event colors requested by the user
    const colorPresets = ['#039BE5', '#7CB342', '#F06292', '#795548', '#E67C73', '#F4511E', '#F6BF26', '#0B8043', '#3F51B5', '#8E24AA'];
    return ids.map((id, index) => ({
      id,
      color: colorPresets[index % colorPresets.length]
    }));
  };

  // Helper to construct the Google Calendar embed URL with custom query parameters (e.g. showCalendars=0 to clean, custom paired src/color)
  const buildCalendarUrl = (calendars: CalendarSource[]): string => {
    const baseParams = 'showCalendars=0&showTitle=0&showTz=0&showPrint=0&hl=de';
    if (calendars.length === 0) {
      return `https://calendar.google.com/calendar/embed?${baseParams}`;
    }
    
    // We append showCalendars=0 to hide Google's default duplicative sidebar dropdown lists,
    // making the design gorgeous and extremely clean, matching DriveDeck styling!
    const queryParts = calendars.map(cal => {
      const cleanColor = cal.color.startsWith('#') ? cal.color : `#${cal.color}`;
      return `src=${encodeURIComponent(cal.id)}&color=${encodeURIComponent(cleanColor)}`;
    });
    
    return `https://calendar.google.com/calendar/embed?${baseParams}&${queryParts.join('&')}`;
  };

  // Updates the calendar sources list, syncs local view, triggers optimistic state on page save
  const handleUpdateCalendarBlock = (blockId: string, updatedCalendars: CalendarSource[]) => {
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        const fileId = updatedCalendars.map(c => c.id).join(',');
        const embedUrl = buildCalendarUrl(updatedCalendars);
        return {
          ...b,
          properties: {
            ...b.properties,
            fileId,
            embedUrl,
            calendars: updatedCalendars
          }
        };
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  const handleUpdateBlockOrientation = (blockId: string, orientation: 'portrait' | 'landscape') => {
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          properties: {
            ...b.properties,
            orientation
          }
        };
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Interactive PDF reader modal state
  const [activeReaderBlock, setActiveReaderBlock] = useState<any | null>(null);

  const getSensibleTransformations = (currentType: BlockType) => {
    const options = [
      { type: 'text' as BlockType, label: 'Fließtext', icon: 'Type' },
      { type: 'heading1' as BlockType, label: 'Überschrift 1', icon: 'H1' },
      { type: 'heading2' as BlockType, label: 'Überschrift 2', icon: 'H2' },
      { type: 'heading3' as BlockType, label: 'Überschrift 3', icon: 'H3' },
      { type: 'todo' as BlockType, label: 'Checkliste', icon: 'CheckSquare' },
      { type: 'bullet' as BlockType, label: 'Aufzählung', icon: 'List' },
      { type: 'code' as BlockType, label: 'Code Block', icon: 'Code' },
    ];

    if (currentType === 'google-drive') {
      return [];
    }

    return options.filter(opt => opt.type !== currentType);
  };

  // Google Auth integration for Picker
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Picker Modal State
  const [showPickerApiErrorDetails, setShowPickerApiErrorDetails] = useState(false);
  const [pickerErrorMessage, setPickerErrorMessage] = useState<string | null>(null);

  // Listen for login state in Editor
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, activeToken) => {
        setUser(currentUser);
        setToken(activeToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const selectDriveFileForBlock = (blockId: string, file: { id: string; name: string; mimeType: string; webViewLink?: string }) => {
    if (blockId === 'page-cover') {
      handleSetCover(`drive://${file.id}`);
      return;
    }

    let embedUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/preview`;
    
    // docs/sheets/slides embeds often look better with preview or edit inside iframe
    if (file.mimeType === 'application/vnd.google-apps.document') {
      embedUrl = `https://docs.google.com/document/d/${file.id}/preview`;
    } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      embedUrl = `https://docs.google.com/spreadsheets/d/${file.id}/preview`;
    } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
      embedUrl = `https://docs.google.com/presentation/d/${file.id}/preview`;
    } else if (file.mimeType.startsWith('image/')) {
      embedUrl = `https://drive.google.com/file/d/${file.id}/preview`;
    }

    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          content: file.id,
          properties: {
            ...b.properties,
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            embedUrl: embedUrl
          }
        };
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  const openOfficialGooglePicker = (targetBlockId: string) => {
    if (!token) return;
    
    let filter: string | undefined = undefined;
    if (targetBlockId === 'page-cover') {
      filter = 'image/*';
    } else {
      const block = page.blocks.find(b => b.id === targetBlockId);
      if (block && block.properties?.mimeType) {
        const mime = block.properties.mimeType;
        if (mime === 'image/generic' || mime.startsWith('image/')) {
          filter = 'image/*';
        } else if (mime === 'audio/generic' || mime.startsWith('audio/')) {
          filter = 'audio/*,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/x-m4a,audio/mp4';
        } else if (mime === 'video/generic' || mime.startsWith('video/')) {
          filter = 'video/*,video/mp4,video/webm';
        } else {
          // Keep specific mimeTypes like 'application/vnd.google-apps.document', 'application/vnd.google-apps.spreadsheet', 'application/pdf', etc.
          filter = mime;
        }
      }
    }

    launchGooglePicker(token, (file) => {
      // Create properties object to map what block expects
      const updatedFile = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        thumbnailLink: file.mimeType.startsWith('image/') ? file.url : undefined,
        webViewLink: file.url
      };
      selectDriveFileForBlock(targetBlockId, updatedFile as any);
    }, filter).catch(err => {
      console.error('Error opening Google Picker:', err);
      setPickerErrorMessage(err instanceof Error ? err.message : String(err));
      setShowPickerApiErrorDetails(true);
    });
  };

  // Set Page Cover URL
  const [coverUploading, setCoverUploading] = useState(false);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Bitte wähle ein Bild aus (PNG, JPG, WEBP etc.).');
      return;
    }

    try {
      setCoverUploading(true);
      if (token) {
        // Logged into Google Drive! Upload directly to Google Drive.
        const fileId = await uploadFileToDrive(file, token);
        handleSetCover(`drive://${fileId}`);
      } else {
        // Offline-first/unauthenticated: Upload as base64 data-URL
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            handleSetCover(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Fehler beim Hochladen des Covers:', err);
      alert('Der Upload ist fehlgeschlagen: ' + (err.message || err));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleUnsplashSearch = async (query: string) => {
    if (!query.trim()) {
      setUnsplashResults([]);
      setUnsplashError(null);
      return;
    }
    setUnsplashLoading(true);
    setUnsplashError(null);
    try {
      const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=24`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const formatted = data.results.map((item: any) => ({
            name: item.alt_description || item.description || 'Unsplash Bild',
            url: item.urls.regular,
            photographer: item.user.name,
            photographerUrl: item.user.links?.html || `https://unsplash.com/@${item.user.username}`
          }));
          setUnsplashResults(formatted);
          setUnsplashLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Client-side Unsplash NAPI failed or was blocked by CORS, falling back to database tags:", e);
    }

    const queryLower = query.toLowerCase();
    const filteredCurated = CURATED_BANNERS.filter(item => 
      item.name.toLowerCase().includes(queryLower) || 
      item.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );

    if (filteredCurated.length > 0) {
      setUnsplashResults(filteredCurated);
    } else {
      setUnsplashError('Keine Bilder offline gefunden. Versuche es mit Begriffen wie "Natur", "Tech", "Space" oder "Blau"!');
      setUnsplashResults([]);
    }
    setUnsplashLoading(false);
  };

  const handleSetCover = (url: string) => {
    if (page.isSubscription) return;
    onUpdatePage({
      ...page,
      coverUrl: url,
      updatedAt: Date.now(),
    });
    setShowCoverSelector(false);
  };

  // Remove Cover
  const handleRemoveCover = () => {
    if (page.isSubscription) return;
    onUpdatePage({
      ...page,
      coverUrl: undefined,
      updatedAt: Date.now(),
    });
    setShowCoverSelector(false);
  };


  // Update Page Title
  const handleTitleChange = (newTitle: string) => {
    if (page.isSubscription) return;
    onUpdatePage({
      ...page,
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  // Update Icon
  const handleIconChange = (newIcon: string) => {
    if (page.isSubscription) return;
    onUpdatePage({
      ...page,
      icon: newIcon,
      updatedAt: Date.now(),
    });
    setShowEmojiPicker(false);
  };

  // Update Block Content
  const handleBlockContentChange = (blockId: string, newContent: string) => {
    if (page.isSubscription) return;
    const updatedBlocks = page.blocks.map(b => 
      b.id === blockId ? { ...b, content: newContent } : b
    );
    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Update Block Type
  const handleBlockTypeChange = (blockId: string, newType: BlockType) => {
    if (page.isSubscription) return;
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        const updated: Block = { ...b, type: newType };
        if (newType === 'todo' && !b.properties?.checked) {
          updated.properties = { ...b.properties, checked: false };
        }
        return updated;
      }
      return b;
    });
    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Update Block Checkbox
  const handleTodoCheckChange = (blockId: string, checked: boolean) => {
    if (page.isSubscription) return;
    const updatedBlocks = page.blocks.map(b => 
      b.id === blockId 
        ? { ...b, properties: { ...b.properties, checked } } 
        : b
    );
    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Insert a new default block beneath a certain block
  const insertBlock = (afterBlockId: string) => {
    if (page.isSubscription) return;
    const newBlock: Block = {
      id: generateId(),
      type: 'text',
      content: '',
    };
    
    const index = page.blocks.findIndex(b => b.id === afterBlockId);
    const updatedBlocks = [...page.blocks];
    if (index !== -1) {
      updatedBlocks.splice(index + 1, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Append block to back of list
  const appendBlock = (type: BlockType = 'text') => {
    if (page.isSubscription) return;
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      properties: type === 'todo' ? { checked: false } : undefined,
    };
    onUpdatePage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now(),
    });
  };

  // Append a new text block, auto-type "/" and trigger formatting popover
  const appendBlockAndOpenSlash = () => {
    if (page.isSubscription) return;
    const newBlock: Block = {
      id: generateId(),
      type: 'text',
      content: '/',
    };
    onUpdatePage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now(),
    });
    setActiveSlashBlockId(newBlock.id);
    setSlashQuery('');
    setSlashActiveIndex(0);
    setTimeout(() => {
      const textarea = document.getElementById(`textarea-${newBlock.id}`);
      if (textarea) {
        textarea.focus();
        if ('setSelectionRange' in textarea) {
          (textarea as any).setSelectionRange(1, 1);
        }
      }
    }, 50);
  };

  // Delete Block
  const deleteBlock = (blockId: string) => {
    if (page.isSubscription) return;
    if (page.blocks.length <= 1) {
      const resetBlocks = [{ id: generateId(), type: 'text' as BlockType, content: '' }];
      onUpdatePage({
        ...page,
        blocks: resetBlocks,
        updatedAt: Date.now(),
      });
      return;
    }

    const updatedBlocks = page.blocks.filter(b => b.id !== blockId);
    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Native HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedBlocks = [...page.blocks];
    const [draggedBlock] = updatedBlocks.splice(draggedIndex, 1);
    updatedBlocks.splice(targetIndex, 0, draggedBlock);

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Helper method: Extract Google File ID or parse other links
  const extractMediaTarget = (input: string, customType?: string): { fileId: string; embedUrl?: string; fileName?: string; mimeType?: string } | null => {
    if (!input) return null;
    const trimmed = input.trim();

    // Check YouTube first
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = trimmed.match(regExp);
      if (match && match[2].length === 11) {
        return {
          fileId: match[2],
          embedUrl: `https://www.youtube.com/embed/${match[2]}`,
          fileName: 'YouTube Video',
          mimeType: 'video/youtube'
        };
      }
    }

    // Check Google Calendar
    if (customType === 'calendar/google' || trimmed.includes('calendar.google.com')) {
      let calId = trimmed;
      let finalEmbed = '';
      if (trimmed.includes('calendar.google.com')) {
        if (trimmed.includes('/embed')) {
          finalEmbed = trimmed;
          try {
            const urlObj = new URL(trimmed);
            const srcIds = urlObj.searchParams.getAll('src');
            if (srcIds.length > 0) {
              calId = srcIds.join(',');
            }
          } catch (_) {}
        } else {
          try {
            const urlObj = new URL(trimmed);
            const srcIds = urlObj.searchParams.getAll('src');
            if (srcIds.length > 0) {
              calId = srcIds.join(',');
              finalEmbed = `https://calendar.google.com/calendar/embed?src=${srcIds.map(encodeURIComponent).join('&src=')}`;
            } else {
              const cid = urlObj.searchParams.get('cid');
              if (cid) {
                calId = cid;
                finalEmbed = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(cid)}`;
              }
            }
          } catch (_) {}
        }
      }

      if (!finalEmbed) {
        const calIds = trimmed.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        if (calIds.length > 0) {
          calId = calIds.join(',');
          finalEmbed = `https://calendar.google.com/calendar/embed?src=${calIds.map(encodeURIComponent).join('&src=')}`;
        } else {
          calId = trimmed;
          finalEmbed = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(trimmed)}`;
        }
      }

      return {
        fileId: calId,
        embedUrl: finalEmbed,
        fileName: 'Google Kalender',
        mimeType: 'calendar/google'
      };
    }

    // Check GDrive dPatterns / idParamPattern
    const dPatterns = /\/d\/([a-zA-Z0-9_-]{25,50})/i;
    const idParamPattern = /[?&]id=([a-zA-Z0-9_-]{25,50})/i;
    const dMatch = trimmed.match(dPatterns);
    if (dMatch && dMatch[1]) {
      const id = dMatch[1];
      let mime = 'application/vnd.google-apps.document';
      let name = 'Zugeordnetes Dokument';
      if (trimmed.includes('spreadsheets')) {
        mime = 'application/vnd.google-apps.spreadsheet';
        name = 'Zugeordnete Google Tabelle';
      } else if (trimmed.includes('presentation')) {
        mime = 'application/vnd.google-apps.presentation';
        name = 'Zugeordnete Google Präsentation';
      }
      return {
        fileId: id,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        fileName: name,
        mimeType: mime
      };
    }

    const idMatch = trimmed.match(idParamPattern);
    if (idMatch && idMatch[1]) {
      return {
        fileId: idMatch[1],
        embedUrl: `https://drive.google.com/file/d/${idMatch[1]}/preview`,
        fileName: 'Zugeordnete Google Datei',
        mimeType: 'application/vnd.google-apps.document'
      };
    }

    if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
      return {
        fileId: trimmed,
        embedUrl: `https://drive.google.com/file/d/${trimmed}/preview`,
        fileName: 'Google Datei',
        mimeType: 'application/vnd.google-apps.document'
      };
    }

    // Standardize human input without schema like 'www.google.com' or 'rsser.news' to include 'https://'
    let urlCandidate = trimmed;
    if (!urlCandidate.startsWith('http://') && !urlCandidate.startsWith('https://')) {
      // If it looks like a domain or website url (e.g., has a '.', or has 'www.', or we know customType is 'link/generic')
      if (customType === 'link/generic' || urlCandidate.startsWith('www.') || /\.[a-z]{2,6}(\/|$)/i.test(urlCandidate)) {
        urlCandidate = `https://${urlCandidate}`;
      }
    }

    // Fallback: If it's a generic URL (starts with http/https), treat as generic embed/preview
    if (urlCandidate.startsWith('http://') || urlCandidate.startsWith('https://')) {
      // Derive a nice name from hostname if possible
      let niceName = 'Eingebettete Webseite';
      try {
        const parsedUrl = new URL(urlCandidate);
        const host = parsedUrl.hostname.replace('www.', '');
        niceName = host.charAt(0).toUpperCase() + host.slice(1);
      } catch (_) {}

      return {
        fileId: urlCandidate,
        embedUrl: urlCandidate,
        fileName: niceName,
        mimeType: 'link/generic'
      };
    }

    return null;
  };

  // Save manual Drive/Media link
  const handleSaveDriveLink = (blockId: string) => {
    const rawInput = pastedUrl[blockId] || '';
    const block = page.blocks.find(b => b.id === blockId);
    if (!block) return;

    const parsed = extractMediaTarget(rawInput, block.properties?.mimeType);
    if (!parsed) {
      alert('Konnte keine gültige ID oder Link extrahieren. Verwende eine Google-ID, einen Drive/Photos-Freigabelink, einen YouTube-Link, eine Kalender-ID oder eine Standardwebadresse.');
      return;
    }

    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          content: rawInput,
          properties: {
            ...b.properties,
            fileId: parsed.fileId,
            fileName: parsed.fileName || b.properties?.fileName || 'Ressource',
            mimeType: parsed.mimeType || b.properties?.mimeType || 'link/generic',
            embedUrl: parsed.embedUrl
          }
        };
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  const handleVoiceUploadSuccess = (blockId: string, fileId: string, fileName: string) => {
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          content: `https://drive.google.com/file/d/${fileId}/view`,
          properties: {
            ...b.properties,
            fileId,
            fileName,
            mimeType: 'audio/generic',
          }
        };
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Reset/unlink Drive Block
  const handleClearDriveBlock = (blockId: string) => {
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          content: '',
          properties: {}
        };
      }
      return b;
    });

    setPastedUrl(prev => {
      const copy = { ...prev };
      delete copy[blockId];
      return copy;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Content Change with Slash Detection
  const handleContentChangeWithSlash = (blockId: string, value: string) => {
    // Immediate content update
    handleBlockContentChange(blockId, value);

    // Look for "/" followed by search characters at the end of text
    const match = value.match(/\/([a-zA-Z0-9äöüÄÖÜß]*)$/);
    if (match) {
      setActiveSlashBlockId(blockId);
      setSlashQuery(match[1]);
      setSlashActiveIndex(0);
    } else {
      if (activeSlashBlockId === blockId) {
        setActiveSlashBlockId(null);
        setSlashQuery('');
      }
    }
  };

  // Apply Slash Command Option to a Block
  const selectSlashOption = (block: Block, option: typeof SLASH_OPTIONS[0]) => {
    const parsedText = block.content.replace(/\/([a-zA-Z0-9äöüÄÖÜß]*)$/, '');
    
    // Reset Slash Menu State
    setActiveSlashBlockId(null);
    setSlashQuery('');
    setSlashActiveIndex(0);

    const updatedBlocks = page.blocks.map(b => {
      if (b.id === block.id) {
        const updated: Block = {
          ...b,
          type: option.type,
          content: parsedText
        };

        if (option.type === 'todo') {
          updated.properties = { ...b.properties, checked: false };
        } else if (option.type === 'kanban') {
          const isEn = language === 'en';
          updated.properties = {
            ...b.properties,
            kanbanBoard: {
              id: `board-${Date.now()}`,
              title: isEn ? 'Project Board' : 'Projekt-Board',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              columns: [
                {
                  id: `col-${Date.now()}-1`,
                  title: isEn ? 'To Do' : 'Zu erledigen',
                  color: 'amber',
                  cards: [
                    {
                      id: `card-${Date.now()}-1`,
                      title: isEn ? 'Draft first milestone task' : 'Erste Aufgabe formulieren',
                      priority: 'medium',
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    }
                  ]
                },
                {
                  id: `col-${Date.now()}-2`,
                  title: isEn ? 'In Progress' : 'In Arbeit',
                  color: 'sky',
                  cards: []
                },
                {
                  id: `col-${Date.now()}-3`,
                  title: isEn ? 'Done' : 'Erledigt',
                  color: 'emerald',
                  cards: []
                }
              ]
            }
          };
        } else if (option.type === 'google-drive') {
          updated.properties = {
            ...b.properties,
            mimeType: option.mimeType,
            fileName: `Neuer Google ${option.label}`,
            checked: false,
            ...(option.key === 'record' ? { isVoiceRecorder: true } : {})
          };
        }

        return updated;
      }
      return b;
    });

    onUpdatePage({
      ...page,
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  };

  // Keyboard navigation inside Slash Popup
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
    block: Block,
    filteredOpts: typeof SLASH_OPTIONS
  ) => {
    if (activeSlashBlockId === block.id) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashActiveIndex(prev => (prev + 1) % filteredOpts.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashActiveIndex(prev => (prev - 1 + filteredOpts.length) % filteredOpts.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredOpts[slashActiveIndex]) {
          selectSlashOption(block, filteredOpts[slashActiveIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveSlashBlockId(null);
      }
    }
  };

  // Renders block type select dropdown
  const renderBlockTypeSelector = (block: Block, index: number) => {
    const types: { value: BlockType; label: string }[] = [
      { value: 'text', label: 'Text' },
      { value: 'heading1', label: 'Überschrift 1' },
      { value: 'heading2', label: 'Überschrift 2' },
      { value: 'heading3', label: 'Überschrift 3' },
      { value: 'todo', label: 'Checkliste' },
      { value: 'bullet', label: 'Aufzählung' },
      { value: 'code', label: 'Code Block' },
      { value: 'google-drive', label: 'Google Embed' },
    ];

    return (
      <select
        value={block.type}
        onChange={(e) => handleBlockTypeChange(block.id, e.target.value as BlockType)}
        className="text-[10px] uppercase font-bold tracking-tight bg-notion-sidebar border border-notion-border text-notion-secondary py-0.5 px-1 rounded hover:bg-[rgba(0,0,0,0.04)] focus:outline-none w-20 cursor-pointer transition-colors"
      >
        {types.map(t => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="w-full flex-1 relative flex flex-col min-h-full">
      {/* Banner Cover Image If It Exists */}
      {page.coverUrl ? (
        <div className="w-full h-44 sm:h-56 md:h-60 relative overflow-hidden select-none shrink-0 bg-slate-900 border-b border-notion-border/40 group/cover">
          {page.coverUrl.startsWith('drive://') ? (
            <SecureCoverImage fileId={page.coverUrl.replace('drive://', '')} token={token} />
          ) : (
            <img 
              src={page.coverUrl} 
              alt="Page Cover" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          {/* Bottom right hover hotspot area */}
          {!page.isSubscription && (
            <div className="absolute bottom-4 right-4 z-20">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 p-1.5 rounded-xl opacity-0 group-hover/cover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 shadow-md">
                <button
                  onClick={() => setShowCoverSelector(!showCoverSelector)}
                  className="bg-white/95 hover:bg-white text-xs text-slate-800 border border-slate-200 rounded-lg py-1 px-3 shadow-xs font-semibold cursor-pointer transition-all duration-150"
                >
                  🔄 Cover ändern
                </button>
                <button
                  onClick={handleRemoveCover}
                  className="bg-red-500/90 text-xs text-white hover:bg-red-600 border border-red-605 rounded-lg py-1 px-3 shadow-xs font-semibold cursor-pointer transition-all duration-150"
                >
                  🗑️ Entfernen
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="w-full max-w-[920px] mx-auto px-6 sm:px-10 py-8 transition-all flex-1">
        {page.isSubscription && (
          <div className="mb-6 p-4 rounded-xl border border-sky-200/90 bg-sky-50 text-slate-800 flex items-center justify-between font-sans select-none shadow-3xs animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-lg shrink-0 text-[#0288D1]">
                <BookOpen className="w-5 h-5 text-[#0288D1]" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-snug text-slate-900">Abonniertes Dokument (Schreibgeschützt)</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">Du siehst dieses Dokument über einen sicheren, abonnierten Kanal. Änderungen sind nur für den Besitzer möglich.</p>
              </div>
            </div>
            <div className="text-[9px] uppercase tracking-wider font-bold bg-[#0288D1]/10 text-[#0288D1] px-2 py-1 rounded">Abonnement</div>
          </div>
        )}
        


        {/* Cover Selector Popup Dialog */}
        {showCoverSelector && (
          <div className="bg-white border border-notion-border rounded-lg shadow-xl p-4.5 mb-6 max-w-xl transition-all animate-in fade-in slide-in-from-top-4 select-none">
            <div className="flex items-center justify-between pb-2 border-b border-notion-border mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-notion-secondary">Seiten-Cover wählen</span>
              <button 
                onClick={() => setShowCoverSelector(false)}
                className="text-xs text-notion-secondary hover:text-notion-text px-1.5 py-0.5 rounded hover:bg-[rgba(0,0,0,0.04)] cursor-pointer"
              >
                Schließen
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-1.5 border-b border-slate-100 mb-4 pb-1 select-none">
              <button
                type="button"
                onClick={() => setCoverSelectorTab('presets')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  coverSelectorTab === 'presets'
                    ? 'bg-[#0288D1]/10 text-[#0288D1]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Galerie Presets
              </button>
              <button
                type="button"
                onClick={() => setCoverSelectorTab('unsplash')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  coverSelectorTab === 'unsplash'
                    ? 'bg-[#0288D1]/10 text-[#0288D1]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                🖼️ Unsplash Suche
              </button>
              <button
                type="button"
                onClick={() => setCoverSelectorTab('custom')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  coverSelectorTab === 'custom'
                    ? 'bg-[#0288D1]/10 text-[#0288D1]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                📁 Datei hochladen / GDrive
              </button>
            </div>

            {/* TAB 1: PRESETS */}
            {coverSelectorTab === 'presets' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-2">
                {COVER_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => handleSetCover(preset.url)}
                    className="group relative flex flex-col h-18 rounded overflow-hidden border border-notion-border/80 hover:border-[#0288D1] focus:outline-none transition-colors cursor-pointer text-left"
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/30 flex items-end p-1.5">
                      <span className="text-[10px] text-white font-semibold truncate w-full">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TAB 2: UNSPLASH SEARCH */}
            {coverSelectorTab === 'unsplash' && (
              <div className="flex flex-col">
                <div className="relative mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Unsplash durchsuchen... (z.B. Weltall, Natur, Kaffee)"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUnsplashSearch(unsplashQuery);
                        }
                      }}
                      className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                    />
                    {unsplashQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setUnsplashQuery('');
                          setUnsplashResults([]);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnsplashSearch(unsplashQuery)}
                    className="bg-[#0288D1] hover:opacity-95 text-white font-semibold rounded-lg text-xs px-3 py-1.5 transition-all shadow-3xs cursor-pointer"
                  >
                    Suchen
                  </button>
                </div>

                {/* Categories tags for fast search */}
                <div className="flex flex-wrap gap-1.5 mb-3 select-none">
                  {['Weltall', 'Natur', 'Workspace', 'Minimal', 'Gradient', 'Cyberpunk', 'Kunst'].map(kw => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setUnsplashQuery(kw);
                        handleUnsplashSearch(kw);
                        setActiveUnsplashCat(kw);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                        activeUnsplashCat === kw || unsplashQuery === kw
                          ? 'bg-[#0288D1]/10 text-[#0288D1] border-[#0288D1]/20'
                          : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>

                {/* Query visual displays */}
                {unsplashLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0288D1] mb-2" />
                    <span className="text-xs text-slate-400">Suche auf Unsplash...</span>
                  </div>
                ) : unsplashError ? (
                  <div className="text-center py-4">
                    <div className="text-xs text-amber-600 mb-3">{unsplashError}</div>
                    {/* fallback display */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {CURATED_BANNERS.slice(0, 6).map(item => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => handleSetCover(item.url)}
                          className="group relative flex flex-col h-16 rounded overflow-hidden border border-slate-150 hover:border-[#0288D1] cursor-pointer text-left"
                        >
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] text-white truncate font-medium w-full font-serif">by {item.photographer}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : unsplashResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-0.5 select-none scrollbar-thin scrollbar-thumb-slate-200">
                    {unsplashResults.map((item, idx) => (
                      <button
                        key={item.url + idx}
                        type="button"
                        onClick={() => handleSetCover(item.url)}
                        className="group relative flex flex-col h-18 rounded overflow-hidden border border-slate-150 hover:border-[#0288D1] transition-all cursor-pointer text-left"
                        title={`${item.name} von ${item.photographer}`}
                      >
                        <img 
                          src={item.url} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                          <span className="text-[8px] text-white/90 truncate font-medium w-full">
                            von {item.photographer}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Suche live nach Millionen hochauflösenden Cover-Bildern von Unsplash oder nutze die Klick-Kategorien oben!
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CUSTOM UPLOAD & GDRIVE */}
            {coverSelectorTab === 'custom' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Local Upload */}
                  <label className={`group flex flex-col items-center justify-center p-3 border border-dashed border-slate-200 hover:border-sky-500 rounded-lg bg-slate-50/50 hover:bg-slate-50/80 transition-all text-center cursor-pointer select-none relative h-24 ${coverUploading ? 'pointer-events-none opacity-60' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={coverUploading}
                    />
                    {coverUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 text-sky-600 animate-spin mb-1" />
                        <span className="text-[11px] font-medium text-slate-500 font-sans">Hochladen...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-500 mb-1 group-hover:text-sky-600 transition-all" />
                        <span className="text-[11px] font-semibold text-slate-700 font-sans">Datei hochladen</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 font-sans">Offline (Base64) / Drive</span>
                      </>
                    )}
                  </label>

                  {/* Google Drive Picker */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (token) {
                        openOfficialGooglePicker('page-cover');
                        setShowCoverSelector(false);
                      } else {
                        const msg = "Verbinde dich mit Google Drive, um deine dort gespeicherten Bilder direkt als Banner zu wählen. Möchtest du dich anmelden?";
                        const performSignIn = async () => {
                          try {
                            const result = await googleSignIn();
                            if (result) {
                              setUser(result.user);
                              setToken(result.accessToken);
                              setTimeout(() => {
                                openOfficialGooglePicker('page-cover');
                              }, 100);
                              setShowCoverSelector(false);
                            }
                          } catch (err) {
                            console.error("Google login failed", err);
                            if (showConfirm) {
                              showConfirm("Fehler", "Google Anmeldung fehlgeschlagen.", () => {}, "OK", undefined, true);
                            } else {
                              alert("Google Anmeldung fehlgeschlagen.");
                            }
                          }
                        };

                        if (showConfirm) {
                          showConfirm(
                            'Anmelden',
                            msg,
                            performSignIn,
                            'Anmelden',
                            'Abbrechen'
                          );
                        } else if (window.confirm(msg)) {
                          await performSignIn();
                        }
                      }
                    }}
                    className="group flex flex-col items-center justify-center p-3 border border-slate-200 hover:border-[#0288D1] rounded-lg bg-white hover:bg-slate-50/50 transition-all text-center cursor-pointer select-none h-24"
                  >
                    <CloudUpload className="w-5 h-5 text-sky-600 mb-1 group-hover:scale-105 transition-transform" />
                    <span className="text-[11px] font-semibold text-slate-700 font-sans">Aus Google Drive</span>
                    <span className="text-[9px] text-sky-600/80 mt-0.5">
                      {token ? 'Verbunden 🟢' : 'Anmelden & wählen'}
                    </span>
                  </button>
                </div>

                {/* Custom URL Option */}
                <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                  <label className="text-[10px] uppercase font-bold text-notion-secondary font-sans">Eigenes Banner-Bild verlinken</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... oder andere Bild-URL"
                      value={customCoverUrl}
                      onChange={(e) => setCustomCoverUrl(e.target.value)}
                      className="flex-1 text-xs bg-white border border-notion-border rounded py-1.5 px-3 focus:outline-none focus:border-accent-blue placeholder:text-notion-secondary/40 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customCoverUrl.trim()) {
                          handleSetCover(customCoverUrl.trim());
                          setCustomCoverUrl('');
                        } else {
                          alert('Bitte gib eine gültige Bild-URL ein.');
                        }
                      }}
                      className="bg-[#0288D1] hover:opacity-90 text-white font-semibold rounded text-xs px-4 py-1.5 select-none transition-all cursor-pointer shadow-xs flex items-center gap-1.5 font-sans"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Hinzufügen</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Title block with Inline Emoji and title input */}
      <div className="flex flex-col mb-8 relative group">
        {/* Cover selector hover trigger row */}
        {!page.isSubscription && !page.coverUrl && (
          <div className="flex items-center gap-1.5 mb-3.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 select-none">
            <button
              type="button"
              onClick={() => setShowCoverSelector(!showCoverSelector)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-lg border border-slate-200/60 hover:border-slate-350/70 transition-all duration-150 cursor-pointer shadow-3xs select-none"
            >
              <span>🖼️</span>
              <span>Banner Cover hinzufügen</span>
            </button>
          </div>
        )}

        <div className="flex items-start gap-4">
          <button
            id="page-icon-selector"
            onClick={() => {
              if (page.isSubscription) return;
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className={`text-4xl p-1.5 rounded-lg select-none ${
              page.isSubscription 
                ? 'cursor-default' 
                : 'hover:bg-[rgba(0,0,0,0.04)] cursor-pointer'
            }`}
            title={page.isSubscription ? "Abonniertes Symbol (Schreibgeschützt)" : "Seiten-Icon ändern"}
          >
            {page.icon || '📄'}
          </button>

          <input
            id="page-title-input"
            type="text"
            value={page.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            readOnly={page.isSubscription === true}
            placeholder={language === 'en' ? 'Untitled' : 'Unbenannte Seite'}
            className={`text-4xl font-bold tracking-tight text-notion-text border-none bg-transparent focus:ring-0 focus:outline-none placeholder:text-notion-secondary/30 py-1.5 w-full font-serif ${
              page.isSubscription ? 'cursor-default' : ''
            }`}
          />
        </div>

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="absolute top-20 left-4 bg-white border border-slate-200 rounded-xl shadow-xl p-4.5 z-55 w-[330px] transition-all animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between mb-3 select-none">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Symbol wählen</span>
              <button 
                onClick={() => {
                  setEmojiSearchQuery('');
                  setShowEmojiPicker(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                title="Schließen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Suchen Input */}
            <div className="relative mb-3.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Symbol suchen... (z.B. Kaffee, Haken, Herz)"
                value={emojiSearchQuery}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-400 bg-slate-50/50 transition-all font-sans"
              />
              {emojiSearchQuery && (
                <button
                  onClick={() => setEmojiSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Categories Selector */}
            {!emojiSearchQuery && (
              <div className="flex gap-1 overflow-x-auto pb-2.5 mb-2.5 no-scrollbar border-b border-slate-100 select-none">
                {EMOJI_GROUPS.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setActiveEmojiGroupId(group.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer border border-transparent ${
                      activeEmojiGroupId === group.id
                        ? 'bg-slate-100 text-slate-900 font-semibold border-slate-200/50'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    title={group.name}
                  >
                    <span>{group.icon}</span>
                    <span>{group.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Emojis Grid display */}
            {(() => {
              const filteredEmojis = emojiSearchQuery
                ? ALL_EMOJIS_FLAT.filter(item => 
                    item.name.toLowerCase().includes(emojiSearchQuery.toLowerCase()) ||
                    item.keywords.some(keyword => keyword.toLowerCase().includes(emojiSearchQuery.toLowerCase()))
                  )
                : EMOJI_GROUPS.find(g => g.id === activeEmojiGroupId)?.items || [];

              return (
                <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto pr-0.5 select-none scrollbar-thin scrollbar-thumb-slate-200">
                  {filteredEmojis.length > 0 ? (
                    filteredEmojis.map(emojiItem => (
                      <button
                        key={emojiItem.char}
                        onClick={() => {
                          handleIconChange(emojiItem.char);
                          setEmojiSearchQuery('');
                          setShowEmojiPicker(false);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                        title={emojiItem.name}
                      >
                        {emojiItem.char}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-6 py-8 text-center text-xs text-slate-400 font-sans">
                      Keine Symbole gefunden
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Main Canvas Blocks Listing with perfect margin layout */}
      <div className="space-y-3 mt-4">
        {page.blocks.map((block, index) => {
          const isDraggingThis = draggedIndex === index;
          const isDragOverThis = dragOverIndex === index;

          // File representation flags
          const isAudio = block.properties?.mimeType?.startsWith('audio/') || 
                         block.properties?.mimeType === 'audio/generic' ||
                         /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(block.properties?.fileName || '');
                         
          const isVideo = (block.properties?.mimeType?.startsWith('video/') ||
                          /\.(mp4|webm|ogv|mov)$/i.test(block.properties?.fileName || '')) &&
                          block.properties?.mimeType !== 'video/youtube';
                          
          const isYouTube = block.properties?.mimeType === 'video/youtube';

          const isImage = block.properties?.mimeType?.startsWith('image/') ||
                          /\.(png|jpe?g|gif|svg|webp)$/i.test(block.properties?.fileName || '');

          const isDocSheetSlideOrCalendar = 
            block.properties?.mimeType === 'application/vnd.google-apps.document' ||
            block.properties?.mimeType === 'application/vnd.google-apps.spreadsheet' ||
            block.properties?.mimeType === 'application/vnd.google-apps.presentation' ||
            block.properties?.mimeType === 'calendar/google';

          const isFolder = block.properties?.mimeType === 'application/vnd.google-apps.folder';

          const isLink = block.properties?.mimeType === 'link/generic';

          const isDownloadFile = !isAudio && !isVideo && !isYouTube && !isImage && !isDocSheetSlideOrCalendar && !isFolder && !isLink;

          // Case-insensitive slash option list filter
          const filteredOptions = SLASH_OPTIONS.filter(opt => 
            opt.label.toLowerCase().includes(slashQuery.toLowerCase()) || 
            opt.key.toLowerCase().includes(slashQuery.toLowerCase()) ||
            opt.sub.toLowerCase().includes(slashQuery.toLowerCase())
          );

          return (
            <div
              key={block.id}
              className={`group/block flex flex-row items-start gap-1 p-1 rounded transition-all duration-155 relative ${
                isDraggingThis ? 'opacity-30 bg-notion-sidebar border border-dashed border-accent-blue/40' : ''
              } ${
                isDragOverThis ? 'border-t-2 border-accent-blue/50 bg-accent-blue/5' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              
              {/* Block Actions: Drag Handle & Delete Button */}
              {!page.isSubscription ? (
                <div 
                  className={`transition-opacity duration-300 select-none mt-0.5 flex items-center gap-1 shrink-0 md:min-w-[72px] ${
                    activeTransformBlockId === block.id
                      ? 'opacity-100'
                      : 'opacity-0 hover:opacity-100 delay-0 hover:delay-[350ms]'
                  }`}
                >
                  {/* HTML5 Drag Trigger */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing text-notion-secondary hover:text-accent-blue p-1 rounded hover:bg-[rgba(0,0,0,0.04)] flex items-center justify-center"
                    title="Verschieben (Ziehen)"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Transform Block Type Trigger */}
                  {getSensibleTransformations(block.type).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTransformBlockId(activeTransformBlockId === block.id ? null : block.id)}
                      className={`p-1 rounded flex items-center justify-center cursor-pointer transition-all ${
                        activeTransformBlockId === block.id 
                          ? 'text-accent-blue bg-accent-blue/10' 
                          : 'text-notion-secondary hover:text-accent-blue hover:bg-[rgba(0,0,0,0.04)]'
                      }`}
                      title="Block-Typ umwandeln"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete/Trash Button */}
                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id)}
                    className="text-notion-secondary hover:text-red-600 hover:bg-red-50 p-1 rounded flex items-center justify-center cursor-pointer transition-all"
                    title="Block löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="shrink-0 md:w-6" />
              )}

              {/* Right Content Editor Box (Takes all rest space without overlapping) */}
              <div className="w-full flex-1 flex flex-col justify-center py-0.5 relative">
                <div className="flex items-center w-full">
                  {block.type === 'heading1' && (
                    <textarea
                      id={`textarea-${block.id}`}
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                      readOnly={page.isSubscription === true}
                      placeholder="Kapitelüberschrift 1"
                      className="w-full text-2xl font-bold text-notion-text bg-transparent border-none outline-none focus:ring-0 placeholder:text-notion-secondary/30 font-sans tracking-tight resize-none overflow-hidden min-h-[2rem] leading-snug"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                    />
                  )}

                  {block.type === 'heading2' && (
                    <textarea
                      id={`textarea-${block.id}`}
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                      readOnly={page.isSubscription === true}
                      placeholder="Zwischenüberschrift 2"
                      className="w-full text-xl font-semibold text-notion-text bg-transparent border-none outline-none focus:ring-0 placeholder:text-notion-secondary/30 font-sans tracking-tight resize-none overflow-hidden min-h-[1.75rem] leading-snug"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                    />
                  )}

                  {block.type === 'heading3' && (
                    <textarea
                      id={`textarea-${block.id}`}
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                      readOnly={page.isSubscription === true}
                      placeholder="Unterkapitel 3"
                      className="w-full text-lg font-medium text-notion-text/80 bg-transparent border-none outline-none focus:ring-0 placeholder:text-notion-secondary/30 font-sans tracking-tight resize-none overflow-hidden min-h-[1.5rem] leading-snug"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                    />
                  )}

                  {block.type === 'text' && (
                    <textarea
                      id={`textarea-${block.id}`}
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                      readOnly={page.isSubscription === true}
                      placeholder={page.isSubscription ? "" : "Schreibe einfach etwas oder tippe '/' für Optionen..."}
                      className="w-full text-sm text-notion-text bg-transparent border-none outline-none focus:ring-0 placeholder:text-notion-secondary/30 resize-none font-sans leading-relaxed min-h-[1.5rem] overflow-hidden"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                    />
                  )}

                  {block.type === 'todo' && (
                    <div className="flex items-start space-x-2.5 w-full">
                      <button
                        onClick={() => handleTodoCheckChange(block.id, !block.properties?.checked)}
                        className={`p-0.5 mt-0.5 rounded text-notion-secondary transition-colors ${
                          page.isSubscription
                            ? 'cursor-default'
                            : 'hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] cursor-pointer'
                        }`}
                      >
                        {block.properties?.checked ? (
                          <CheckSquare className="w-4 h-4 text-accent-blue" />
                        ) : (
                          <Square className="w-4 h-4 text-notion-secondary" />
                        )}
                      </button>
                      <textarea
                        id={`textarea-${block.id}`}
                        value={block.content}
                        onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                        readOnly={page.isSubscription === true}
                        placeholder="To-Do hinzufügen..."
                        className={`w-full text-sm text-notion-text bg-transparent border-none outline-none focus:ring-0 placeholder:text-notion-secondary/30 font-sans resize-none overflow-hidden min-h-[1.5rem] leading-relaxed ${
                          block.properties?.checked ? 'line-through text-notion-secondary/60 decoration-notion-secondary/30' : ''
                        }`}
                        rows={1}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }
                        }}
                      />
                    </div>
                  )}

                  {block.type === 'bullet' && (
                    <div className="flex items-start space-x-2 w-full">
                      <span className="text-notion-secondary select-none mt-1 font-bold text-center w-5">&bull;</span>
                      <textarea
                        id={`textarea-${block.id}`}
                        value={block.content}
                        onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                        readOnly={page.isSubscription === true}
                        placeholder="Aufzählungspunkt..."
                        className="w-full text-sm text-notion-text bg-transparent border-none outline-none focus:ring-0 placeholder:text-notion-secondary/30 font-sans resize-none overflow-hidden min-h-[1.5rem] leading-relaxed"
                        rows={1}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }
                        }}
                      />
                    </div>
                  )}

                  {block.type === 'code' && (
                    <div className="bg-notion-sidebar border border-notion-border rounded-lg p-3.5 w-full font-mono text-[12px] text-notion-text flex flex-col gap-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-notion-secondary uppercase font-semibold border-b border-notion-border pb-1.5 mb-2">
                        <span>{page.isSubscription ? "Abonniertes Code-Segment (Schreibgeschützt)" : "Pure Local Scratchpad (IndexedDB)"}</span>
                      </div>
                      <textarea
                        id={`textarea-${block.id}`}
                        value={block.content}
                        onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                        readOnly={page.isSubscription === true}
                        placeholder="// Code-Inhalt"
                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-notion-text resize-none font-mono leading-relaxed min-h-[5rem]"
                        rows={4}
                      />
                    </div>
                  )}

                  {block.type === 'kanban' && (
                    <EmbeddedKanbanBlock
                      block={block}
                      onUpdateBlock={(updated) => {
                        if (page.isSubscription) return;
                        const updatedBlocks = page.blocks.map(b => (b.id === block.id ? updated : b));
                        onUpdatePage({
                          ...page,
                          blocks: updatedBlocks,
                          updatedAt: Date.now(),
                        });
                      }}
                      isReadOnly={page.isSubscription === true}
                    />
                  )}

                  {block.type === 'google-drive' && (
                    <div className={`transition-all duration-200 picker-module group/drive w-full flex flex-col ${
                      block.properties?.fileId && isDownloadFile 
                        ? 'p-0 bg-transparent border-none' 
                        : block.properties?.fileId 
                          ? 'border border-notion-border bg-white rounded-lg p-3.5 md:p-4 gap-3.5 shadow-3xs border-slate-200/90' 
                          : 'border border-notion-border bg-white rounded-lg p-6 gap-3'
                    }`}>
                      
                      {!block.properties?.fileId ? (
                        block.properties?.isVoiceRecorder ? (
                          token ? (
                            <VoiceRecorder 
                              token={token} 
                              onUploadSuccess={(fileId, fileName) => handleVoiceUploadSuccess(block.id, fileId, fileName)}
                            />
                          ) : (
                            <div className="text-center p-6 border border-dashed border-slate-200 bg-white rounded-xl font-sans w-full flex flex-col items-center">
                              <Mic className="w-8 h-8 text-rose-500 mb-2 scale-110" />
                              <p className="text-xs font-bold text-slate-700">Google-Anmeldung erforderlich</p>
                              <p className="text-[11px] text-slate-500 mt-1 mb-3">Bitte melde dich per Google an, um direkte Sprachaufnahmen in deinem Google Drive zu speichern.</p>
                              <button
                                onClick={async () => {
                                  try {
                                    const result = await googleSignIn();
                                    if (result) {
                                      setToken(result.accessToken);
                                    }
                                  } catch (err) {
                                    alert("Google-Anmeldung fehlgeschlagen.");
                                  }
                                }}
                                className="px-4 py-2 bg-[#0288D1] hover:bg-[#0277bd] text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-3xs hover:shadow-2xs"
                              >
                                Anmelden
                              </button>
                            </div>
                          )
                        ) : (
                          <>
                            <div className="flex items-center justify-between pb-2 border-b border-notion-border">
                              <div className="flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-pulse"></span>
                                <span className="text-xs uppercase font-bold tracking-wider text-notion-text">
                                  {block.properties?.mimeType === 'video/youtube' ? 'YouTube Video' : 
                                   block.properties?.mimeType === 'calendar/google' ? 'Google Kalender' : 
                                   block.properties?.mimeType === 'image/generic' ? 'Bild / Foto' :
                                   block.properties?.mimeType === 'link/generic' ? 'Web Vorschau / Link' :
                                   block.properties?.mimeType === 'audio/generic' ? 'Audio Player' :
                                   'Google Drive Embed'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 text-center py-2">
                              {/* Drive Picker/Browsing Section (ONLY if NOT YouTube, NOT Calendar, and NOT Link) */}
                              {block.properties?.mimeType !== 'video/youtube' && block.properties?.mimeType !== 'calendar/google' && block.properties?.mimeType !== 'link/generic' ? (
                                <div className="flex flex-col items-center justify-center text-center">
                                  <button
                                    onClick={async () => {
                                      if (token) {
                                        openOfficialGooglePicker(block.id);
                                      } else {
                                        const msg = "Du bist aktuell nicht angemeldet oder das Token ist abgelaufen. Möchtest du dich per Google anmelden, um dein Drive zu durchsuchen?";
                                        const performSignIn = async () => {
                                          try {
                                            const result = await googleSignIn();
                                            if (result) {
                                              setToken(result.accessToken);
                                              setTimeout(() => {
                                                openOfficialGooglePicker(block.id);
                                              }, 100);
                                            }
                                          } catch (err) {
                                            if (showConfirm) {
                                              showConfirm("Fehler", "Google Anmeldung fehlgeschlagen.", () => {}, "OK", undefined, true);
                                            } else {
                                              alert("Google-Anmeldung fehlgeschlagen.");
                                            }
                                          }
                                        };

                                        if (showConfirm) {
                                          showConfirm(
                                            'Anmelden',
                                            msg,
                                            performSignIn,
                                            'Anmelden',
                                            'Abbrechen'
                                          );
                                        } else if (window.confirm(msg)) {
                                          await performSignIn();
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-50 hover:bg-sky-100/80 text-[#0288D1] border border-sky-200/80 hover:border-sky-300 rounded-md font-bold text-xs shadow-3xs cursor-pointer transition-all duration-150"
                                  >
                                    <FolderOpen className="w-4 h-4 text-[#0288D1]" />
                                    <span>📂 In meinem Google Drive stöbern &amp; auswählen</span>
                                  </button>
                                  <p className="text-[10px] text-slate-500 max-w-sm mt-2 leading-relaxed">
                                    Das öffnet den offiziellen <strong>Google Picker</strong>. Das ist ein sicherer Datei-Explorer direkt von Google, in dem du durch deine vertraute Ordnerstruktur browsen und die Datei direkt anklicken kannst.
                                  </p>

                                  {/* Visual Divider to separate from manual input */}
                                  <div className="relative w-full max-w-sm my-4 flex items-center justify-center select-none">
                                    <div className="absolute inset-0 flex items-center">
                                      <div className="w-full border-t border-slate-150"></div>
                                    </div>
                                    <span className="relative bg-[#FCFBF9] px-3 text-[9px] font-bold text-notion-secondary/70 uppercase tracking-widest">
                                      Oder direkte Eingabe
                                    </span>
                                  </div>
                                </div>
                              ) : null}

                              {/* Manual Link/ID Input Section */}
                              <div className="flex flex-col gap-2.5">
                                <p className="text-xs text-notion-secondary max-w-sm mx-auto leading-normal">
                                  {block.properties?.mimeType === 'video/youtube' && "Betten Sie ein YouTube-Video ein. Geben Sie die YouTube-URL oder Video-ID ein."}
                                  {block.properties?.mimeType === 'calendar/google' && "Integrieren Sie einen Google Kalender. Geben Sie die Kalender-ID (z. B. Ihre Gmail-Adresse) ein."}
                                  {block.properties?.mimeType === 'image/generic' && "Fügen Sie ein Bild aus Google Drive oder Google Fotos hinzu (Freigabelink oder ID)."}
                                  {block.properties?.mimeType === 'link/generic' && "Geben Sie eine Webadresse (z. B. https://google.com) ein, um ein Vorschaufenster einzubetten."}
                                  {block.properties?.mimeType === 'audio/generic' && "Geben Sie den Freigabelink für eine Audio- oder Sprachaufnahmedatei aus Drive ein."}
                                  {block.properties?.mimeType === 'application/vnd.google-apps.document' && "Google Textdokument aus Drive einbetten (Link oder ID)."}
                                  {block.properties?.mimeType === 'application/vnd.google-apps.spreadsheet' && "Google Tabelle aus Drive einbetten (Link oder ID)."}
                                  {block.properties?.mimeType === 'application/vnd.google-apps.presentation' && "Google Präsentation aus Drive einbetten (Link oder ID)."}
                                  {!block.properties?.mimeType && "Google-Datei (Doc, Presentation, Sheet, PDF) oder Medien-ID eingeben, um diese sicher einzubetten."}
                                </p>
                                
                                <div className="flex gap-2 max-w-md mx-auto w-full">
                                  <input
                                    type="text"
                                    placeholder={
                                      block.properties?.mimeType === 'video/youtube' ? 'YouTube-Link oder ID...' : 
                                      block.properties?.mimeType === 'calendar/google' ? 'E-Mail oder Kalender ID...' : 
                                      block.properties?.mimeType === 'link/generic' ? 'https://...' :
                                      'Google Drive Link oder ID...'
                                    }
                                    value={pastedUrl[block.id] || ''}
                                    onChange={(e) => setPastedUrl({ ...pastedUrl, [block.id]: e.target.value })}
                                    className="flex-1 text-xs bg-white border border-notion-border rounded py-1.5 px-3 focus:outline-none focus:border-accent-blue placeholder:text-notion-secondary/40"
                                  />
                                  <button
                                    onClick={() => handleSaveDriveLink(block.id)}
                                    className="bg-[#0288D1] hover:bg-[#0277bd] text-white font-semibold rounded text-xs px-4 py-1.5 select-none transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Hinzufügen</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      ) : (
                        <div className="flex flex-col gap-3.5">
                          {/* Consolidated Premium Flat Header Row */}
                          {!isDownloadFile && (
                            <div className="flex items-center justify-between gap-3 min-w-0 pb-1">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0 text-slate-500">
                                  {block.properties.mimeType === 'application/vnd.google-apps.folder' ? (
                                    <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
                                  ) : block.properties.mimeType?.includes('sheet') ? (
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                  ) : block.properties.mimeType === 'video/youtube' ? (
                                    <Youtube className="w-4 h-4 text-red-650" />
                                  ) : block.properties.mimeType === 'calendar/google' ? (
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                  ) : block.properties.mimeType?.startsWith('audio/') || block.properties.mimeType === 'audio/generic' || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(block.properties.fileName || '') ? (
                                    <Music className="w-4 h-4 text-sky-600" />
                                  ) : block.properties.mimeType?.startsWith('video/') || block.properties.mimeType === 'video/generic' || /\.(mp4|webm|ogv|mov)$/i.test(block.properties.fileName || '') ? (
                                    <Video className="w-4 h-4 text-indigo-600" />
                                  ) : block.properties.mimeType?.startsWith('image/') || block.properties.mimeType === 'image/generic' || /\.(png|jpe?g|gif|svg|webp)$/i.test(block.properties.fileName || '') ? (
                                    <Image className="w-4 h-4 text-violet-600" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-slate-600" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  {renamingBlockId === block.id ? (
                                    <div className="flex items-center gap-1 w-full max-w-sm">
                                      <input
                                        type="text"
                                        value={tempRenameValue}
                                        onChange={(e) => setTempRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleRenameBlockFile(block.id, block.properties.fileId || '', tempRenameValue);
                                          } else if (e.key === 'Escape') {
                                            setRenamingBlockId(null);
                                          }
                                        }}
                                        className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-[#0288D1] focus:ring-1 focus:ring-sky-100 min-w-[200px]"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleRenameBlockFile(block.id, block.properties.fileId || '', tempRenameValue)}
                                        className="p-1 rounded bg-sky-50 hover:bg-sky-100 text-[#0288D1] border border-sky-200 shrink-0 cursor-pointer"
                                        title="Speichern"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setRenamingBlockId(null)}
                                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200 shrink-0 cursor-pointer"
                                        title="Abbrechen"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 group/title cursor-pointer truncate max-w-sm" onClick={() => {
                                      setRenamingBlockId(block.id);
                                      setTempRenameValue(block.properties.fileName || '');
                                    }}>
                                      <h4 className="font-bold text-xs text-slate-800 truncate" title={block.properties.fileName}>
                                        {block.properties.fileName}
                                      </h4>
                                      <button 
                                        className="opacity-0 group-hover/title:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-all cursor-pointer shrink-0"
                                        title="Name bearbeiten"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                               <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-1.5">
                                 {(() => {
                                   const isDocMime = block.properties?.mimeType === 'application/vnd.google-apps.document';
                                   const isSheetMime = block.properties?.mimeType === 'application/vnd.google-apps.spreadsheet';
                                   const isPresentationMime = block.properties?.mimeType === 'application/vnd.google-apps.presentation';
                                   const isDocSheetOrSlide = isDocMime || isSheetMime || isPresentationMime;

                                   if (!isDocSheetOrSlide) return null;

                                   const activeOrientation = block.properties?.orientation || (isDocMime ? 'portrait' : 'landscape');

                                   return (
                                     <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50 select-none transition-colors mr-1 shrink-0">
                                       <button
                                         type="button"
                                         onClick={() => handleUpdateBlockOrientation(block.id, 'portrait')}
                                         className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                                           activeOrientation === 'portrait'
                                             ? 'bg-white text-slate-800 shadow-3xs border border-slate-200/40'
                                             : 'text-slate-400 hover:text-slate-600'
                                         }`}
                                         title="Hochformat (A4 Portrait)"
                                       >
                                         <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                                         <span className="hidden sm:inline">Hoch</span>
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => handleUpdateBlockOrientation(block.id, 'landscape')}
                                         className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                                           activeOrientation === 'landscape'
                                             ? 'bg-white text-slate-800 shadow-3xs border border-slate-250/40'
                                             : 'text-slate-400 hover:text-slate-600'
                                         }`}
                                         title="Querformat (A4 Landscape)"
                                       >
                                         <FileSpreadsheet className="w-3 h-3 text-slate-500 shrink-0" />
                                         <span className="hidden sm:inline">Breit</span>
                                       </button>
                                     </div>
                                   );
                                 })()}

                                 <div className="group/drive-link flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 hover:bg-slate-50 shrink-0">
                                 {block.properties.fileId && (
                                   <a
                                     href={
                                       block.properties.mimeType === 'video/youtube' 
                                         ? `https://www.youtube.com/watch?v=${block.properties.fileId}`
                                         : block.properties.mimeType === 'calendar/google'
                                         ? (block.properties.embedUrl || (() => {
                                             const ids = (block.properties.fileId || '').split(',').map(s => s.trim()).filter(Boolean);
                                             return `https://calendar.google.com/calendar/embed?src=${ids.map(encodeURIComponent).join('&src=')}`;
                                           })())
                                         : block.properties.mimeType === 'application/vnd.google-apps.document'
                                         ? `https://docs.google.com/document/d/${block.properties.fileId}/edit`
                                         : block.properties.mimeType === 'application/vnd.google-apps.spreadsheet'
                                         ? `https://docs.google.com/spreadsheets/d/${block.properties.fileId}/edit`
                                         : block.properties.mimeType === 'application/vnd.google-apps.presentation'
                                         ? `https://docs.google.com/presentation/d/${block.properties.fileId}/edit`
                                         : block.properties.embedUrl || `https://drive.google.com/file/d/${block.properties.fileId}/view`
                                     }
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="opacity-0 group-hover/drive-link:opacity-100 transition-all duration-300 delay-0 group-hover/drive-link:delay-[350ms] p-1.5 rounded-md border border-slate-150 bg-white hover:bg-slate-50 hover:border-slate-250 hover:text-accent-blue text-slate-400 flex items-center justify-center select-none shadow-3xs shrink-0 cursor-pointer"
                                     title="Live ansehen"
                                   >
                                     <ExternalLink className="w-3.5 h-3.5" />
                                   </a>
                                 )}
                               </div>
                             </div>
                            </div>
                          )}

                           {/* Responsive file preview container */}
                           {(() => {
                            const isAudio = block.properties.mimeType?.startsWith('audio/') || 
                                           block.properties.mimeType === 'audio/generic' ||
                                           /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(block.properties.fileName || '');
                                           
                            const isVideo = (block.properties.mimeType?.startsWith('video/') ||
                                            /\.(mp4|webm|ogv|mov)$/i.test(block.properties.fileName || '')) &&
                                            block.properties.mimeType !== 'video/youtube';
                                            
                            const isYouTube = block.properties.mimeType === 'video/youtube';

                            const isImage = block.properties.mimeType?.startsWith('image/') ||
                                            /\.(png|jpe?g|gif|svg|webp)$/i.test(block.properties.fileName || '');

                            const isDocSheetSlideOrCalendar = 
                              block.properties.mimeType === 'application/vnd.google-apps.document' ||
                              block.properties.mimeType === 'application/vnd.google-apps.spreadsheet' ||
                              block.properties.mimeType === 'application/vnd.google-apps.presentation' ||
                              block.properties.mimeType === 'calendar/google';

                            // Any file that is not directly previewable in-line is handled as a file download link
                            const isFolder = block.properties.mimeType === 'application/vnd.google-apps.folder';
                            const isLink = block.properties.mimeType === 'link/generic';

                            // Any file that is not directly previewable in-line is handled as a file download link
                            const isDownloadFile = !isAudio && !isVideo && !isYouTube && !isImage && !isDocSheetSlideOrCalendar && !isFolder && !isLink;

                            // For Docs, Sheets, Slides, Calendar and Images, we always load immediately!
                            const isLoaded = !!loadedDriveBlocks[block.id] || isDocSheetSlideOrCalendar || isImage;

                            const handleActivate = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setLoadedDriveBlocks(prev => ({ ...prev, [block.id]: true }));
                            };

                            const formatSize = (bytesStr?: string) => {
                              if (!bytesStr) return '';
                              const bytes = parseInt(bytesStr, 10);
                              if (isNaN(bytes)) return '';
                              if (bytes < 1024) return `${bytes} B`;
                              const kb = bytes / 1024;
                              if (kb < 1024) return `${kb.toFixed(1)} KB`;
                              const mb = kb / 1024;
                              return `${mb.toFixed(1)} MB`;
                            };

                            // --- 1. General Download files (e.g. ZIP, RAR, PDF) ---
                            if (isDownloadFile) {
                              const isZip = /\.(zip|rar|7z|tar|gz)$/i.test(block.properties.fileName || '');
                              const isPdf = /\.(pdf)$/i.test(block.properties.fileName || '');
                              let fileBadge = "DATEI";
                              if (isZip) fileBadge = "ARCHIV";
                              else if (isPdf) fileBadge = "PDF DOKUMENT";

                              if (isPdf) {
                                return (
                                  <div className="w-full font-sans select-none animate-in fade-in duration-300">
                                    <div className="w-full flex flex-col md:flex-row items-stretch gap-6 p-5 bg-slate-50 border border-slate-100/80 rounded-2xl shadow-3xs hover:bg-slate-100/60 transition-all duration-300">
                                      {/* Massive high-fidelity Book Cover */}
                                      <div className="w-[170px] h-[240px] bg-white border border-slate-200/95 rounded-xl shadow-xs overflow-hidden relative shrink-0 flex items-center justify-center self-center md:self-auto">
                                        <iframe
                                          src={`https://drive.google.com/file/d/${block.properties.fileId}/preview`}
                                          className="absolute pointer-events-none select-none border-none opacity-90"
                                          style={{
                                            width: '850px',
                                            height: '1200px',
                                            transform: 'scale(0.20)',
                                            transformOrigin: 'top left',
                                            top: 0,
                                            left: 0,
                                          }}
                                          title="PDF Cover"
                                          referrerPolicy="no-referrer"
                                          allow="autoplay"
                                        />
                                        {/* Photorealistic cover spine and highlights shading */}
                                        <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-r from-black/8 via-transparent to-black/3 pointer-events-none" />
                                        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                                        <div className="absolute top-2.5 left-2.5 bg-rose-600 font-sans text-[8px] tracking-wider text-white font-black px-1.5 py-0.5 rounded-sm shadow-3xs uppercase">
                                          PDF
                                        </div>
                                      </div>

                                      {/* Informative description & controls beside cover */}
                                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 mb-2 bg-slate-100/40 p-1 rounded-lg w-fit">
                                            <span className="text-[10px] font-extrabold tracking-wider text-rose-600 bg-rose-50 border border-rose-100/60 px-2 py-0.5 rounded-md uppercase">
                                              {fileBadge}
                                            </span>
                                            {(block.properties as any).fileSize && (
                                              <span className="text-xs text-slate-500 font-mono font-medium px-1">
                                                {formatSize((block.properties as any).fileSize)}
                                              </span>
                                            )}
                                          </div>
                                          <h4 className="text-base sm:text-lg font-extrabold text-slate-800 leading-snug break-words" title={block.properties.fileName}>
                                            {block.properties.fileName || "Unbenannte Datei"}
                                          </h4>
                                          <p className="text-xs text-slate-500 mt-2 font-medium">
                                            Klicke auf den Button, um dieses Dokument im interaktiven Reader-Modus direkt zu lesen und zu durchblättern.
                                          </p>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center gap-3">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveReaderBlock(block);
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-3xs hover:shadow-2xs cursor-pointer transition-all duration-200 animate-pulse-subtle"
                                          >
                                            <BookOpen className="w-4 h-4" />
                                            <span>LESEN</span>
                                          </button>
                                          
                                          <a 
                                            href={block.properties.embedUrl || `https://drive.google.com/file/d/${block.properties.fileId}/view`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all duration-200"
                                            title="Herunterladen"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Herunterladen</span>
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="w-full font-sans select-none animate-in fade-in duration-300">
                                  <div className="w-full flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-100/80 rounded-xl shadow-3xs hover:bg-slate-100/60 transition-all duration-300">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 shrink-0 ${
                                        isZip ? 'bg-amber-50 text-amber-600 border border-amber-100/50' : 
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {isZip ? (
                                          <FolderArchive className="w-5 h-5" />
                                        ) : (
                                          <File className="w-5 h-5" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-bold text-slate-800 truncate" title={block.properties.fileName}>
                                          {block.properties.fileName || "Unbenannte Datei"}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[9px] font-extrabold tracking-wider text-slate-450 bg-slate-200/50 px-1.5 py-0.5 rounded-md uppercase">
                                            {fileBadge}
                                          </span>
                                          {(block.properties as any).fileSize && (
                                            <span className="text-[10px] text-slate-400 font-mono">
                                              {formatSize((block.properties as any).fileSize)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <a 
                                      href={block.properties.embedUrl || `https://drive.google.com/file/d/${block.properties.fileId}/view`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs rounded-lg shadow-3xs cursor-pointer transition-all duration-200 shrink-0"
                                    >
                                      <span>Download</span>
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              );
                            }

                            // --- 2. Lazy and Play Holder (Videos & Audios) ---
                            if (!isLoaded) {
                              if (isAudio && token) {
                                const waveBars = [14, 28, 42, 22, 35, 12, 18, 30, 44, 26, 14, 20, 36, 48, 32, 24, 16, 30, 42, 28, 12, 8, 16, 24, 38, 50, 40, 26, 12, 22, 34, 18, 12, 6];
                                return (
                                  <div 
                                    onClick={handleActivate}
                                    className="w-full font-sans cursor-pointer group/audioplay select-none"
                                  >
                                    <div className="w-full flex items-center gap-4 bg-slate-50 border border-slate-100 p-3 rounded-xl shadow-3xs hover:bg-slate-100/60 hover:border-slate-200/90 transition-all duration-300">
                                      <div className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-600 transition-all flex items-center justify-center text-white shadow-2xs group-hover/audioplay:scale-105 transform duration-300 shrink-0">
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[10px] text-sky-600 font-extrabold tracking-tight uppercase group-hover/audioplay:underline flex items-center gap-1 select-none">
                                            Audio abspielen
                                          </span>
                                          {(block.properties as any).fileSize && (
                                            <span className="text-[10px] text-slate-400 font-mono">
                                              Größe: {formatSize((block.properties as any).fileSize)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="h-6 flex items-end gap-1 overflow-hidden opacity-65 group-hover/audioplay:opacity-85 transition-opacity py-0.5">
                                          {waveBars.map((height, i) => (
                                            <div 
                                              key={i} 
                                              style={{ height: `${height}%` }}
                                              className="flex-1 bg-sky-500/35 group-hover/audioplay:bg-sky-500/50 rounded-t-[1.5px] transition-colors"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 pr-1 text-slate-400">
                                        <Volume2 className="w-4 h-4 text-slate-400 opacity-60" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              if (isVideo && token) {
                                const VIDEO_FRAMES = [
                                  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
                                  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
                                  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
                                  'https://images.unsplash.com/photo-1574717024453-354056afd6fc?w=800&auto=format&fit=crop&q=80',
                                  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
                                ];
                                const frameUrl = VIDEO_FRAMES[block.id.charCodeAt(0) % VIDEO_FRAMES.length || 0];

                                return (
                                  <div 
                                    onClick={handleActivate}
                                    className="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-950 overflow-hidden shadow-2xs font-sans group/videoplay flex flex-col items-center justify-center cursor-pointer select-none"
                                  >
                                    <img 
                                      src={frameUrl} 
                                      alt="Video Frame Vorschau" 
                                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover/videoplay:scale-102 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/30 group-hover/videoplay:bg-black/20 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 hover:scale-105 transition-all text-white shadow-md flex items-center justify-center z-10 duration-200">
                                        <Play className="w-6 h-6 fill-current ml-0.5" />
                                      </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white z-10 text-[10px] sm:text-xs">
                                      <span className="font-semibold bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5 text-white/90 animate-pulse" /> Video-Datei
                                      </span>
                                      <span className="text-white bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs group-hover/videoplay:text-rose-300 font-bold">
                                        Klicken zum Abspielen
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              if (isYouTube) {
                                return (
                                  <div 
                                    onClick={handleActivate}
                                    className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-900 overflow-hidden shadow-2xs font-sans group/ytplay flex flex-col items-center justify-center cursor-pointer select-none"
                                  >
                                    <img 
                                      src={`https://img.youtube.com/vi/${block.properties.fileId}/0.jpg`} 
                                      alt="YouTube Thumbnail" 
                                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/ytplay:scale-102 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 group-hover/ytplay:bg-slate-900/25 transition-all duration-300" />
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                      <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 hover:scale-105 transition-all text-white shadow-md flex items-center justify-center duration-200">
                                        <Play className="w-6 h-6 fill-current ml-0.5" />
                                      </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white/90 z-10 text-[10px] sm:text-xs">
                                      <span className="font-semibold bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 text-[11px]">
                                        <Youtube className="w-4 h-4 text-red-500 animate-pulse" /> YouTube Video
                                      </span>
                                      <span className="text-white/90 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs group-hover/ytplay:text-red-300 transition-colors font-bold">
                                        Klicken zum Abspielen
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            }

                            // --- 3. Actual Active rendering (Docs, Calendar, Images, or activated stream media) ---
                            if (isAudio && token) {
                              return (
                                <SecureAudioPlayer 
                                  fileId={block.properties.fileId || ''} 
                                  fileName={block.properties.fileName || 'Audio'} 
                                  token={token} 
                                />
                              );
                            }

                            if (isVideo && token) {
                              return (
                                <SecureVideoPlayer 
                                  fileId={block.properties.fileId || ''} 
                                  fileName={block.properties.fileName || 'Video'} 
                                  token={token} 
                                />
                              );
                            }

                            if (isImage && token) {
                              return (
                                <SecureImage 
                                  fileId={block.properties.fileId || ''} 
                                  fileName={block.properties.fileName || 'Bild'} 
                                  token={token} 
                                />
                              );
                            }

                            if (isFolder && token) {
                              return (
                                <SecureAlbum 
                                  fileId={block.properties.fileId || ''} 
                                  fileName={block.properties.fileName || 'Album'} 
                                  token={token} 
                                />
                              );
                            }

                            // Embedded UI for YouTube, Calendar, Docs, Sheets, Slides or Fallbacks
                            const isDoc = block.properties.mimeType === 'application/vnd.google-apps.document';
                            const isSheet = block.properties.mimeType === 'application/vnd.google-apps.spreadsheet';
                            const isCalendar = block.properties.mimeType === 'calendar/google';

                             if (isLink) {
                               const hostname = (() => {
                                 try {
                                   return new URL(block.properties.embedUrl || '').hostname.replace('www.', '');
                                 } catch (_) {
                                   return '';
                                 }
                               })();

                               const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : null;

                               return (
                                 <div className="w-full font-sans text-left select-none animate-in fade-in duration-300">
                                   {/* Smart Compact Premium Link Bookmark Card */}
                                   <a 
                                     href={block.properties.embedUrl || '#'}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl shadow-3xs transition-all duration-200 group/link"
                                   >
                                     <div className="flex items-center gap-3 min-w-0 flex-1">
                                       <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center p-1.5 shrink-0 shadow-3xs group-hover/link:border-slate-300/90 transition-colors">
                                         {faviconUrl ? (
                                           <img 
                                             src={faviconUrl} 
                                             alt="Favicon" 
                                             className="w-5 h-5 object-contain"
                                             referrerPolicy="no-referrer"
                                             onError={(e) => {
                                               // Fallback to text initials or default globe icon
                                               (e.target as HTMLElement).style.display = 'none';
                                             }}
                                           />
                                         ) : null}
                                         <Globe className="w-4 h-4 text-slate-400 group-hover/link:text-sky-500 transition-colors absolute" style={{ zIndex: -1 }} />
                                       </div>
                                       <div className="min-w-0 flex-1">
                                         <h4 className="text-xs font-bold text-slate-755 truncate group-hover/link:text-sky-700 transition-colors" title={block.properties.fileName}>
                                           {block.properties.fileName || "Webseite"}
                                         </h4>
                                         <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                           {hostname && (
                                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                                               {hostname}
                                             </span>
                                           )}
                                           <span className="text-[10px] text-slate-405 font-medium truncate max-w-[200px] sm:max-w-[320px]">
                                             {block.properties.embedUrl}
                                           </span>
                                         </div>
                                       </div>
                                     </div>

                                     <div className="flex items-center gap-1 shrink-0 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-150 rounded-lg shadow-3xs text-slate-600 group-hover/link:text-sky-600 group-hover/link:border-sky-200 transition-all duration-150">
                                       <span className="text-[10px] font-bold hidden sm:inline select-none pr-0.5">Besuchen</span>
                                       <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-sky-500 transition-colors" />
                                     </div>
                                   </a>
                                 </div>
                               );
                             }

                            if (isCalendar) {
                              const calendars = getBlockCalendars(block);
                              const isExpanded = !!expandedCalendars[block.id];
                              const activeRowIdx = activeColorPickerRow[block.id] ?? null;

                              return (
                                <div className="flex flex-col gap-3.5 w-full font-sans text-left relative">
                                  {/* The Masked/Clipped Calendar Iframe Wrapper */}
                                  <div className="relative w-full h-[410px] sm:h-[490px] rounded-xl bg-slate-50 border border-slate-200/70 overflow-hidden shadow-2xs">
                                    <iframe
                                      src={buildCalendarUrl(calendars)}
                                      className="w-full border-none animate-in fade-in duration-300"
                                      style={{ height: 'calc(100% + 56px)', marginBottom: '-55px' }}
                                      referrerPolicy="no-referrer"
                                      title={block.properties?.fileName || 'Google Calendar'}
                                    />

                                    {/* Icon-only floating settings button placed in the top header bar next to standard Google icons */}
                                    <div className="absolute top-[13px] right-[182px] sm:right-[188px] z-35">
                                      <button
                                        onClick={() => {
                                          setExpandedCalendars(prev => ({
                                            ...prev,
                                            [block.id]: !prev[block.id]
                                          }));
                                        }}
                                        className={`p-1.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center select-none shadow-3xs hover:shadow-2xs ${
                                          isExpanded 
                                            ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-900' 
                                            : 'bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
                                        }`}
                                        title="Kalender verwalten"
                                      >
                                        <Settings2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* GORGEOUS FLOATING CALENDAR OPTIONS OVERLAY PANEL */}
                                    {isExpanded && (
                                      <div className="absolute right-3 top-[52px] z-40 w-76 sm:w-80 max-w-[calc(100%-24px)] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-4 text-left animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto border-t-4 border-t-sky-500">
                                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                                          <div className="flex items-center gap-1.5">
                                            <Settings2 className="w-3.5 h-3.5 text-sky-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                              Kalender verwalten ({calendars.length})
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => setExpandedCalendars(prev => ({ ...prev, [block.id]: false }))}
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {/* List of active calendars - ultra-compact */}
                                        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                                          {calendars.map((cal, calIdx) => (
                                            <div key={calIdx} className="flex items-center gap-2 relative">
                                              
                                              {/* Simple circle dot: click to choose color */}
                                              <div className="relative shrink-0">
                                                <button
                                                  onClick={() => {
                                                    setActiveColorPickerRow(prev => ({
                                                      ...prev,
                                                      [block.id]: prev[block.id] === calIdx ? null : calIdx
                                                    }));
                                                  }}
                                                  className="w-4 h-4 rounded-full border border-slate-200/80 shadow-3xs cursor-pointer transition-all hover:scale-110 flex items-center justify-center relative group-colors"
                                                  style={{ backgroundColor: cal.color }}
                                                  title="Farbe ändern"
                                                >
                                                  <div className="w-1 h-1 bg-white rounded-full opacity-60 group-colors-hover:opacity-100" />
                                                </button>
                                                
                                                {/* Popover choice palette for this specific row */}
                                                {activeRowIdx === calIdx && (
                                                  <div className="absolute top-6 left-0 z-50 bg-white/95 border border-slate-200 rounded-xl p-2 shadow-xl flex flex-wrap items-center gap-1.5 w-[140px] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                                                    {['#039BE5', '#7CB342', '#F06292', '#795548', '#E67C73', '#F4511E', '#F6BF26', '#0B8043', '#3F51B5', '#8E24AA'].map((presetColor) => (
                                                      <button
                                                        key={presetColor}
                                                        onClick={() => {
                                                          const cals = [...calendars];
                                                          cals[calIdx].color = presetColor;
                                                          handleUpdateCalendarBlock(block.id, cals);
                                                          setActiveColorPickerRow(prev => ({ ...prev, [block.id]: null }));
                                                        }}
                                                        className="w-4.5 h-4.5 rounded-full border border-white hover:scale-115 transition-all shadow-3xs cursor-pointer shrink-0"
                                                        style={{ backgroundColor: presetColor }}
                                                      />
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Calendar e-mail / index id */}
                                              <input
                                                type="text"
                                                value={cal.id}
                                                placeholder="z.B. user@gmail.com oder ID"
                                                onChange={(e) => {
                                                  const cals = [...calendars];
                                                  cals[calIdx].id = e.target.value.trim();
                                                  handleUpdateCalendarBlock(block.id, cals);
                                                }}
                                                className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-50 transition-all font-sans"
                                              />

                                              {/* Delete */}
                                              <button
                                                onClick={() => {
                                                  const cals = calendars.filter((_, i) => i !== calIdx);
                                                  handleUpdateCalendarBlock(block.id, cals);
                                                }}
                                                className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 transition-all cursor-pointer shrink-0"
                                                title="Entfernen"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ))}

                                          {calendars.length === 0 && (
                                            <div className="text-center py-4 text-xs text-slate-400 font-medium">
                                              Noch kein Kalender eingerichtet.
                                            </div>
                                          )}
                                        </div>

                                        {/* Action buttons at the bottom */}
                                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-end">
                                          <button
                                            onClick={() => {
                                              const nextColor = ['#039BE5', '#7CB342', '#F06292', '#795548', '#E67C73'][calendars.length % 5];
                                              handleUpdateCalendarBlock(block.id, [
                                                ...calendars,
                                                { id: '', color: nextColor }
                                              ]);
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#0288D1] hover:text-[#01579b] bg-sky-50/70 hover:bg-sky-50 border border-sky-100/80 rounded-lg transition-all cursor-pointer shadow-3xs"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Kalender hinzufügen</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            const isDocMimetype = block.properties.mimeType === 'application/vnd.google-apps.document';
                            const isSheetMimetype = block.properties.mimeType === 'application/vnd.google-apps.spreadsheet';
                            const isPresentation = block.properties.mimeType === 'application/vnd.google-apps.presentation';
                            const isWorkspaceItem = isDocMimetype || isSheetMimetype || isPresentation;

                            const activeOrientation = block.properties?.orientation || (isDocMimetype ? 'portrait' : 'landscape');

                            let containerClass = "relative w-full overflow-hidden font-sans transition-all duration-300 ";

                            if (isWorkspaceItem) {
                              if (activeOrientation === 'portrait') {
                                // Dynamic Portrait A4 Layout (Hochformat): aspect-[210/297]
                                containerClass += " aspect-[210/297] bg-white rounded-lg shadow-[0_4px_24px_-3px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.04)] border border-slate-150/90 max-w-[620px] mx-auto";
                              } else {
                                // Dynamic Landscape A4 Layout (Querformat): aspect-[297/210]
                                if (isPresentation) {
                                  containerClass += " aspect-video bg-white rounded-xl shadow-[0_4px_24px_-3px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.04)] border border-slate-150/90";
                                } else {
                                  containerClass += " aspect-[297/210] bg-white rounded-xl shadow-[0_4px_24px_-3px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.04)] border border-slate-150/90";
                                }
                              }
                            } else {
                              // Fallbacks (e.g. YouTube)
                              containerClass += " aspect-video rounded-xl bg-slate-50 border border-slate-100/70 shadow-2xs";
                            }

                            return (
                              <div className={containerClass}>
                                <iframe
                                  src={
                                    isYouTube
                                      ? `https://www.youtube.com/embed/${block.properties.fileId}?autoplay=1`
                                      : block.properties.embedUrl || `https://drive.google.com/file/d/${block.properties.fileId}/preview`
                                  }
                                  className="w-full h-full border-none"
                                  referrerPolicy={isYouTube ? "strict-origin-when-cross-origin" : "no-referrer"}
                                  title={block.properties.fileName}
                                  allow={
                                    isYouTube 
                                      ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                      : "autoplay"
                                  }
                                  allowFullScreen={isYouTube}
                                />
                              </div>
                            );
                          })()}


                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* FLOATING SLASH MENU POPUP */}
                {activeSlashBlockId === block.id && (
                  <div 
                    id={`slash-popup-${block.id}`}
                    className="absolute top-full left-0 mt-1 bg-white border border-notion-border rounded-lg shadow-xl z-[60] w-80 max-h-72 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 select-none font-sans"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-notion-secondary/85 border-b border-notion-border/60 bg-notion-sidebar/40 rounded-t-md">
                      Block formatieren
                    </div>
                    
                    {filteredOptions.length === 0 ? (
                      <div className="p-3 text-xs text-notion-secondary text-center">
                        Keine Ergebnisse für "{slashQuery}"
                      </div>
                    ) : (
                      <div className="p-0.5 space-y-0.5">
                        {filteredOptions.map((option, optIdx) => {
                          const isSelected = optIdx === slashActiveIndex;
                          return (
                            <button
                              id={`slash-option-${block.id}-${optIdx}`}
                              key={option.key}
                              onClick={() => selectSlashOption(block, option)}
                              className={`w-full flex items-center space-x-3 text-left px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-accent-blue/10 text-accent-blue' 
                                  : 'text-notion-text hover:bg-[rgba(0,0,0,0.035)]'
                              }`}
                            >
                              <div className={`p-1.5 rounded transition-all shrink-0 ${
                                isSelected ? 'bg-accent-blue/15 text-accent-blue' : 'bg-notion-sidebar border border-notion-border/50 text-notion-secondary'
                              }`}>
                                {renderSlashIcon(option.icon)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold leading-tight">{option.label}</p>
                                <p className="text-[10px] text-notion-secondary leading-normal truncate">{option.sub}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FLOATING TRANSFORM MENU POPUP */}
              {activeTransformBlockId === block.id && (
                <>
                  {/* Click-away backdrop */}
                  <div 
                    className="fixed inset-0 z-50 cursor-default" 
                    onClick={() => setActiveTransformBlockId(null)}
                  />
                  
                  <div className="absolute top-8 left-6 md:left-[32px] bg-white border border-notion-border rounded-lg shadow-xl z-55 w-52 max-h-72 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 select-none font-sans">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-notion-secondary/85 border-b border-notion-border/60 bg-notion-sidebar/40 rounded-t-md flex items-center justify-between">
                      <span>Typ umwandeln</span>
                      <button 
                        type="button"
                        onClick={() => setActiveTransformBlockId(null)}
                        className="text-[10px] uppercase font-bold text-notion-secondary hover:text-red-500 hover:bg-slate-100 px-1.5 py-0.5 rounded transition-all shrink-0 cursor-pointer"
                      >
                        X
                      </button>
                    </div>
                    
                    <div className="p-0.5 space-y-0.5 mt-1">
                      {getSensibleTransformations(block.type).map((option) => (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => {
                            handleBlockTypeChange(block.id, option.type);
                            setActiveTransformBlockId(null);
                          }}
                          className="w-full flex items-center space-x-2.5 text-left px-2 py-1.5 rounded-md transition-all cursor-pointer text-notion-text hover:bg-[rgba(0,0,0,0.035)] hover:text-accent-blue group/item animate-in fade-in duration-100"
                        >
                          <div className="p-1 rounded bg-notion-sidebar border border-notion-border/50 text-notion-secondary group-hover/item:text-accent-blue group-hover/item:bg-accent-blue/10 shrink-0">
                            {renderSlashIcon(option.icon)}
                          </div>
                          <span className="text-xs font-semibold">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Append New Block [+] trigger */}
      {!page.isSubscription && (
        <div className="mt-8 mb-4 flex justify-center select-none animate-in fade-in duration-300">
          <button
            type="button"
            onClick={appendBlockAndOpenSlash}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-3xs hover:shadow-2xs flex items-center justify-center transition-all duration-205 cursor-pointer hover:scale-110 active:scale-95 group"
            title="Neuen Block hinzufügen und Optionen öffnen"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 text-slate-600" />
          </button>
        </div>
      )}

      {/* DETAILED GOOGLE PICKER API ERROR HELP MODAL */}
      {showPickerApiErrorDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center space-x-3.5">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-650 shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="font-sans">
                <h3 className="text-sm font-bold text-slate-800">Google Picker API aktivieren</h3>
                <p className="text-[10px] text-slate-500 font-medium">Behebt: "The API developer key is invalid"</p>
              </div>
            </div>

            {/* Instruction Body */}
            <div className="p-5 overflow-y-auto max-h-[380px] text-xs text-slate-600 space-y-4 font-sans leading-relaxed">
              {pickerErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-lg text-[11px] font-mono whitespace-pre-wrap break-all">
                  <span className="font-bold font-sans text-xs block mb-1">Detaillierter Systemfehler:</span>
                  {pickerErrorMessage}
                </div>
              )}

              <p className="font-medium text-slate-700">
                Der offizielle Google Picker läuft im geschützten Google-Sicherheitsrahmen. Dadurch bleibt deine App in der Kategorie <b>"Nicht-sensibel" (Non-sensitive / drive.file)</b>. Das bedeutet für dich:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 text-slate-650">
                <li><b>Keine CASA-Zertifizierungskosten</b> (spart $15k-$75k/Jahr)</li>
                <li>Deine Nutzer können trotzdem <b>alle ihre Dateien & Kalender</b> sicher durchsuchen!</li>
              </ul>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="bg-sky-100 text-[#0288D1] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono leading-none">1</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Google Picker API aktivieren</span>
                    Suche in deiner <a href={`https://console.cloud.google.com/apis/library/picker.googleapis.com?project=${(import.meta as any).env.VITE_GOOGLE_PICKER_PROJECT_ID || firebaseConfig.projectId}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-bold">Google Cloud-Konsole (hier klicken)</a> nach der <b>"Google Picker API"</b> und klicke auf <b>Aktivieren (Enable)</b> für dein Cloud-Projekt (<code>{(import.meta as any).env.VITE_GOOGLE_PICKER_PROJECT_ID || firebaseConfig.projectId}</code>).
                    <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-md text-[10.5px] text-amber-800 leading-normal font-sans">
                      <b>WICHTIG (Eigenes Google Cloud Projekt):</b> Da diese Preview-App standardmäßig in einer geschützten AI Studio-Sandbox läuft, kannst du das Standardprojekt nicht selbst verwalten. Wenn du die API auf deinem <b>eigenen Google Cloud-Projekt</b> aktiviert hast, trage deinen API-Schlüssel einfach als <code>VITE_GOOGLE_PICKER_API_KEY</code> and deine Project ID als <code>VITE_GOOGLE_PICKER_PROJECT_ID</code> in den App-Einstellungen (Secrets / Umgebungsvariablen) links in der Seitenleiste ein!
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="bg-sky-100 text-[#0288D1] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono leading-none">2</span>
                  <div>
                    <span className="font-bold text-slate-800 block">API-Schlüssel Einschränkungen freigeben</span>
                    Gehe im Cloud Menü auf <b>APIs & Dienste &gt; Anmeldedaten (Credentials)</b>. Wähle deinen aktiven API-Schlüssel aus. 
                    Stelle sicher, dass unter <b>"API-Einschränkungen"</b> entweder <i>"Schlüssel nicht einschränken"</i> ausgewählt ist, oder füge die <b>"Google Picker API"</b> und <b>"Google Drive API"</b> explizit zu den zugelassenen APIs hinzu!
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="bg-sky-100 text-[#0288D1] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono leading-none">3</span>
                  <div>
                    <span className="font-bold text-slate-800 block">HTTP-Referrer-Beschränkung (optional)</span>
                    Falls dein API-Schlüssel auf HTTP-Referrer beschränkt ist, stelle sicher, dass die Domain deines Applet-Previews (z.B. <code>*.europe-west3.run.app</code>) in den erlaubten Websites gelistet ist.
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[11px] text-emerald-800 leading-normal">
                <span className="font-bold block mb-0.5">💡 Warum das ein Geniestreich ist:</span>
                Sobald deine Nutzer über diesen offiziellen Picker eine Datei heraussuchen, delegiert Google der App das Recht für <b>nur diese spezifische Datei</b>. Deine App sammelt so keine globalen Rechte und gilt vor Google als völlig unbedenklich.
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPickerApiErrorDetails(false);
                  setPickerErrorMessage(null);
                }}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md text-xs cursor-pointer shadow-3xs hover:shadow-2xs active:scale-98 transition-all font-sans"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXQUISITE INTERACTIVE PDF READER MODAL */}
      {activeReaderBlock && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-[110] p-4 select-none animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            {/* Dark Styled Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="bg-red-500/15 p-2 rounded-lg text-red-500 shrink-0">
                  <BookOpen className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0 font-sans">
                  <h3 className="text-sm font-bold text-slate-100 truncate pr-4">
                    {activeReaderBlock.properties?.fileName || "PDF Dokument"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Sichere Drive-Direktansicht (Vorschau)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <a 
                  href={activeReaderBlock.properties?.embedUrl || `https://drive.google.com/file/d/${activeReaderBlock.properties?.fileId}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                  title="In neuem Fenster öffnen"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vollbild</span>
                </a>
                <button 
                  onClick={() => setActiveReaderBlock(null)}
                  className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Interactive Viewing Area */}
            <div className="flex-1 bg-slate-950/40 relative">
              <iframe
                src={`https://drive.google.com/file/d/${activeReaderBlock.properties?.fileId}/preview`}
                className="w-full h-full border-none"
                referrerPolicy="no-referrer"
                title="PDF Dokumenten-Leser"
                allow="autoplay"
              />
            </div>
            
            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-center">
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Tipp: Nutze die Steuerungselemente von Google direkt im PDF-Fenster zum Drucken, Zoomen oder Drehen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
