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
  X
} from 'lucide-react';
import { WorkspacePage, Block, BlockType } from '../types';
import { generateId } from '../lib/db';
import { initAuth, googleSignIn } from '../lib/googleAuth';

interface EditorProps {
  page: WorkspacePage;
  onUpdatePage: (updatedPage: WorkspacePage) => void;
  onOpenPicker?: (blockId: string) => void;
}

const EMOJIS = ['📔', '📝', '📁', '💡', '🚀', '🎯', '🥑', '📅', '💬', '🧠', '💼', '🏡', '🛠️', '⚙️', '📈', '✨'];

const SLASH_OPTIONS = [
  { key: 't1', label: 'Titel 1', sub: 'Große Kapitelüberschrift', icon: 'H1', type: 'heading1' as BlockType, mimeType: undefined },
  { key: 't2', label: 'Titel 2', sub: 'Mittlere Überschrift', icon: 'H2', type: 'heading2' as BlockType, mimeType: undefined },
  { key: 't3', label: 'Titel 3', sub: 'Kleine Unterüberschrift', icon: 'H3', type: 'heading3' as BlockType, mimeType: undefined },
  { key: 'text', label: 'Fließtext', sub: 'Normaler Absatz', icon: 'Type', type: 'text' as BlockType, mimeType: undefined },
  { key: 'todo', label: 'Checkliste', sub: 'Aufgaben-Abhakliste', icon: 'CheckSquare', type: 'todo' as BlockType, mimeType: undefined },
  { key: 'bullet', label: 'Aufzählung', sub: 'Einfache ungeordnete Liste', icon: 'List', type: 'bullet' as BlockType, mimeType: undefined },
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

export default function Editor({
  page,
  onUpdatePage,
  onOpenPicker
}: EditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [pastedUrl, setPastedUrl] = useState<{ [blockId: string]: string }>({});
  
  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Slash Commands State
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string>('');
  const [slashActiveIndex, setSlashActiveIndex] = useState<number>(0);

  // Google Auth integration for Picker
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Picker Modal State
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerTargetBlockId, setPickerTargetBlockId] = useState<string | null>(null);
  const [pickerFiles, setPickerFiles] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerFolderId, setPickerFolderId] = useState<string>('root');
  const [pickerHistory, setPickerHistory] = useState<Array<{ id: string; name: string }>>([{ id: 'root', name: 'Drive' }]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedPickerFile, setSelectedPickerFile] = useState<any | null>(null);

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

  const loadPickerFiles = async (folderId: string, searchVal: string = '') => {
    if (!token) return;
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
        headers: { Authorization: `Bearer ${token}` }
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

  // Fetch files when Picker folder changes or search query changes
  useEffect(() => {
    if (showPickerModal && token) {
      loadPickerFiles(pickerFolderId, pickerSearch);
    }
  }, [showPickerModal, pickerFolderId, pickerSearch, token]);

  const selectDriveFileForBlock = (blockId: string, file: { id: string; name: string; mimeType: string; webViewLink?: string }) => {
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

  // Set Page Cover URL
  const handleSetCover = (url: string) => {
    onUpdatePage({
      ...page,
      coverUrl: url,
      updatedAt: Date.now(),
    });
    setShowCoverSelector(false);
  };

  // Remove Cover
  const handleRemoveCover = () => {
    onUpdatePage({
      ...page,
      coverUrl: undefined,
      updatedAt: Date.now(),
    });
    setShowCoverSelector(false);
  };


  // Update Page Title
  const handleTitleChange = (newTitle: string) => {
    onUpdatePage({
      ...page,
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  // Update Icon
  const handleIconChange = (newIcon: string) => {
    onUpdatePage({
      ...page,
      icon: newIcon,
      updatedAt: Date.now(),
    });
    setShowEmojiPicker(false);
  };

  // Update Block Content
  const handleBlockContentChange = (blockId: string, newContent: string) => {
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

  // Delete Block
  const deleteBlock = (blockId: string) => {
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
      if (trimmed.includes('?src=')) {
        try {
          const urlObj = new URL(trimmed);
          calId = urlObj.searchParams.get('src') || trimmed;
        } catch (_) {}
      } else if (trimmed.includes('/embed?')) {
        try {
          const urlObj = new URL(trimmed);
          calId = urlObj.searchParams.get('src') || trimmed;
        } catch (_) {}
      }
      return {
        fileId: calId,
        embedUrl: `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calId)}`,
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

    // Fallback: If it's a generic URL (starts with http/https), treat as generic embed/preview
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return {
        fileId: trimmed,
        embedUrl: trimmed,
        fileName: 'Eingebettete Webseite',
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
        } else if (option.type === 'google-drive') {
          updated.properties = {
            ...b.properties,
            mimeType: option.mimeType,
            fileName: `Neuer Google ${option.label}`,
            checked: false
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
        <div className="w-full h-44 sm:h-56 md:h-60 relative group overflow-hidden select-none shrink-0">
          <img 
            src={page.coverUrl} 
            alt="Page Cover" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover:opacity-100 flex items-end justify-end p-4 gap-2">
            <button
              onClick={() => setShowCoverSelector(!showCoverSelector)}
              className="bg-white/95 text-xs text-slate-800 hover:bg-white border border-slate-200 rounded py-1 px-3 shadow-xs font-semibold cursor-pointer transition-all duration-150"
            >
              🔄 Cover ändern
            </button>
            <button
              onClick={handleRemoveCover}
              className="bg-red-500/90 text-xs text-white hover:bg-red-600 border border-red-605 rounded py-1 px-3 shadow-xs font-semibold cursor-pointer transition-all duration-150"
            >
              🗑️ Entfernen
            </button>
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-[920px] mx-auto px-6 sm:px-10 py-8 transition-all flex-1">
        
        {/* Notion style Top Aux Options */}
        <div className="text-xs text-notion-secondary font-medium mb-5 flex items-center gap-2 select-none">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="hover:bg-[rgba(0,0,0,0.04)] px-2 py-1 rounded transition-colors cursor-pointer border border-transparent hover:border-notion-border/40"
          >
            ➕ Icon ändern
          </button>
          <span>&bull;</span>
          <button 
            onClick={() => setShowCoverSelector(!showCoverSelector)}
            className="hover:bg-[rgba(0,0,0,0.04)] px-2 py-1 rounded transition-colors cursor-pointer border border-transparent hover:border-notion-border/40 text-[#0288D1]"
          >
            🖼️ {page.coverUrl ? 'Cover ändern' : 'Cover hinzufügen'}
          </button>
          {page.coverUrl && (
            <>
              <span>&bull;</span>
              <button 
                onClick={handleRemoveCover}
                className="hover:bg-[rgba(239,68,68,0.05)] text-red-500 px-2 py-1 rounded transition-colors cursor-pointer border border-transparent"
              >
                🗑️ Cover entfernen
              </button>
            </>
          )}
          <span>&bull;</span>
          <span className="text-notion-secondary/60">100% Zero-Backend Storage</span>
        </div>

        {/* Cover Selector Popup Dialog */}
        {showCoverSelector && (
          <div className="bg-white border border-notion-border rounded-lg shadow-xl p-4.5 mb-6 max-w-lg transition-all animate-in fade-in slide-in-from-top-4 select-none">
            <div className="flex items-center justify-between pb-2 border-b border-notion-border mb-3.5">
              <span className="text-xs uppercase font-bold tracking-wider text-notion-secondary">Seiten-Cover wählen</span>
              <button 
                onClick={() => setShowCoverSelector(false)}
                className="text-xs text-notion-secondary hover:text-notion-text px-1.5 py-0.5 rounded hover:bg-[rgba(0,0,0,0.04)] cursor-pointer"
              >
                Schließen
              </button>
            </div>
            
            {/* Presets List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
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

            {/* Custom URL Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-notion-secondary">Eigenes Banner-Bild verlinken</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... oder andere Bild-URL"
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  className="flex-1 text-xs bg-white border border-notion-border rounded py-1.5 px-3 focus:outline-none focus:border-accent-blue placeholder:text-notion-secondary/40"
                />
                <button
                  onClick={() => {
                    if (customCoverUrl.trim()) {
                      handleSetCover(customCoverUrl.trim());
                      setCustomCoverUrl('');
                    } else {
                      alert('Bitte gib eine gültige Bild-URL ein.');
                    }
                  }}
                  className="bg-[#0288D1] hover:opacity-90 text-white font-semibold rounded text-xs px-4 py-1.5 select-none transition-all cursor-pointer shadow-xs"
                >
                  Binden
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Title block with Inline Emoji and title input */}
      <div className="flex flex-col mb-8 relative group">
        <div className="flex items-start gap-4">
          <button
            id="page-icon-selector"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-4xl p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] transition-colors select-none cursor-pointer"
            title="Seiten-Icon ändern"
          >
            {page.icon || '📄'}
          </button>

          <input
            id="page-title-input"
            type="text"
            value={page.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Unbenannte Seite"
            className="text-4xl font-bold tracking-tight text-notion-text border-none bg-transparent focus:ring-0 focus:outline-none placeholder:text-notion-secondary/30 py-1.5 w-full font-serif"
          />
        </div>

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="absolute top-20 left-4 bg-white border border-notion-border rounded-lg shadow-lg p-3.5 z-55 max-w-xs transition-all animate-in fade-in slide-in-from-top-3">
            <div className="text-[10px] font-bold text-notion-secondary mb-2.5 uppercase tracking-wider">Symbol wählen</div>
            <div className="grid grid-cols-6 gap-1">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleIconChange(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-xl rounded-md hover:bg-[rgba(0,0,0,0.04)] transition-colors cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-notion-border pt-2.5 flex justify-end">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-xs text-notion-secondary hover:text-notion-text px-2 py-1 rounded hover:bg-[rgba(0,0,0,0.04)] cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Blocks Listing with perfect margin layout */}
      <div className="space-y-3 mt-4">
        {page.blocks.map((block, index) => {
          const isDraggingThis = draggedIndex === index;
          const isDragOverThis = dragOverIndex === index;

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
              
              {/* HTML5 Drag Trigger: Only visible on mouseover (group hover) */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                className="opacity-0 group-hover/block:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing text-notion-secondary hover:text-accent-blue p-1 rounded hover:bg-[rgba(0,0,0,0.04)] flex items-center justify-center shrink-0 select-none mt-0.5"
                title="Verschieben (Ziehen)"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Right Content Editor Box (Takes all rest space without overlapping) */}
              <div className="w-full flex-1 flex flex-col justify-center py-0.5 relative">
                <div className="flex items-center w-full">
                  {block.type === 'heading1' && (
                    <textarea
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
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
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
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
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
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
                      value={block.content}
                      onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
                      placeholder="Schreibe einfach etwas oder tippe '/' für Optionen..."
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
                        className="p-0.5 mt-0.5 rounded text-notion-secondary hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] cursor-pointer select-none transition-colors"
                      >
                        {block.properties?.checked ? (
                          <CheckSquare className="w-4 h-4 text-accent-blue" />
                        ) : (
                          <Square className="w-4 h-4 text-notion-secondary" />
                        )}
                      </button>
                      <textarea
                        value={block.content}
                        onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
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
                        value={block.content}
                        onChange={(e) => handleContentChangeWithSlash(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, block, filteredOptions)}
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
                        <span>Pure Local Scratchpad (IndexedDB)</span>
                      </div>
                      <textarea
                        value={block.content}
                        onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                        placeholder="// Schreibe Code-Fragmente ..."
                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-notion-text resize-none font-mono leading-relaxed min-h-[5rem]"
                        rows={4}
                      />
                    </div>
                  )}

                  {block.type === 'google-drive' && (
                    <div className="border border-notion-border bg-white rounded-lg p-6 w-full flex flex-col gap-3 transition-colors duration-200 picker-module">
                      
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
                        
                        {block.properties?.fileId && (
                          <div className="flex items-center space-x-2">
                            <a
                              href={
                                block.properties.mimeType === 'video/youtube' 
                                  ? `https://www.youtube.com/watch?v=${block.properties.fileId}`
                                  : block.properties.mimeType === 'calendar/google'
                                  ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(block.properties.fileId)}`
                                  : block.properties.embedUrl || `https://drive.google.com/open?id=${block.properties.fileId}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent-blue hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>Live ansehen</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {!block.properties?.fileId ? (
                        <div className="flex flex-col gap-3 text-center py-2">
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
                          
                          <div className="flex gap-2 max-w-md mx-auto w-full mt-2">
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
                              className="btn py-1 px-4 hover:opacity-90 transition-all select-none"
                            >
                              Binden
                            </button>
                          </div>

                          {/* Show real Picker text block unless it's youtube / calendar */}
                          {block.properties?.mimeType !== 'video/youtube' && block.properties?.mimeType !== 'calendar/google' ? (
                            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-notion-secondary font-bold uppercase tracking-wider mb-2">Einfache Alternative ohne Link-Kopieren</span>
                              <button
                                onClick={async () => {
                                  if (token) {
                                    setPickerTargetBlockId(block.id);
                                    setPickerFolderId('root');
                                    setPickerHistory([{ id: 'root', name: 'Drive' }]);
                                    setPickerSearch('');
                                    setSelectedPickerFile(null);
                                    setShowPickerModal(true);
                                  } else {
                                    if (window.confirm("Du bist aktuell nicht angemeldet oder das Token ist abgelaufen. Möchtest du dich per Google anmelden, um dein Drive zu durchsuchen?")) {
                                      try {
                                        const result = await googleSignIn();
                                        if (result) {
                                          setUser(result.user);
                                          setToken(result.accessToken);
                                          setPickerTargetBlockId(block.id);
                                          setPickerFolderId('root');
                                          setPickerHistory([{ id: 'root', name: 'Drive' }]);
                                          setPickerSearch('');
                                          setSelectedPickerFile(null);
                                          setShowPickerModal(true);
                                        }
                                      } catch (err) {
                                        alert("Google-Anmeldung fehlgeschlagen.");
                                      }
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
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="bg-notion-sidebar border border-notion-border p-2.5 rounded flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {block.properties.mimeType?.includes('sheet') ? (
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                              ) : block.properties.mimeType === 'video/youtube' ? (
                                <Youtube className="w-5 h-5 text-red-600" />
                              ) : block.properties.mimeType === 'calendar/google' ? (
                                <Calendar className="w-5 h-5 text-amber-500" />
                              ) : (
                                <FileText className="w-5 h-5 text-accent-blue" />
                              )}
                              <div className="truncate">
                                <h4 className="font-bold text-notion-text truncate">{block.properties.fileName}</h4>
                                <p className="text-[10px] font-mono text-notion-secondary truncate">
                                  {block.properties.mimeType === 'video/youtube' ? `YouTube: ${block.properties.fileId}` : block.properties.mimeType === 'calendar/google' ? `Kalender: ${block.properties.fileId}` : `ID: ${block.properties.fileId}`}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleClearDriveBlock(block.id)}
                              className="text-[11px] font-bold text-red-500 hover:text-red-700 px-2.5 py-1 rounded hover:bg-red-50/50 cursor-pointer text-right shrink-0"
                            >
                              Verknüpfung aufheben
                            </button>
                          </div>

                          {/* Responsive iframe preview */}
                          <div className="relative w-full aspect-video rounded-md bg-notion-bg border border-notion-border overflow-hidden mt-1 shadow-sm font-sans">
                            <iframe
                              src={
                                block.properties.mimeType === 'video/youtube'
                                  ? `https://www.youtube.com/embed/${block.properties.fileId}`
                                  : block.properties.mimeType === 'calendar/google'
                                  ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(block.properties.fileId)}`
                                  : block.properties.embedUrl || `https://drive.google.com/file/d/${block.properties.fileId}/preview`
                              }
                              className="w-full h-full border-none"
                              referrerPolicy="no-referrer"
                              title={block.properties.fileName}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* FLOATING SLASH MENU POPUP */}
                {activeSlashBlockId === block.id && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-notion-border rounded-lg shadow-xl z-[60] w-80 max-h-72 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 select-none font-sans">
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
            </div>
          );
        })}
      </div>

      {/* Append New Block toolbox */}
      <div className="mt-12 pt-6 border-t border-notion-border flex flex-wrap gap-2 justify-center select-none">
        <button
          onClick={() => appendBlock('text')}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-notion-border text-notion-text hover:bg-[rgba(0,0,0,0.03)] rounded-[4px] shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>
        <button
          onClick={() => appendBlock('heading2')}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-notion-border text-notion-text hover:bg-[rgba(0,0,0,0.03)] rounded-[4px] shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Überschrift</span>
        </button>
        <button
          onClick={() => appendBlock('todo')}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-notion-border text-notion-text hover:bg-[rgba(0,0,0,0.03)] rounded-[4px] shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>To-Do</span>
        </button>
        <button
          onClick={() => appendBlock('bullet')}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-notion-border text-notion-text hover:bg-[rgba(0,0,0,0.03)] rounded-[4px] shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aufzählung</span>
        </button>
        <button
          onClick={() => appendBlock('code')}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-notion-border text-notion-text hover:bg-[rgba(0,0,0,0.03)] rounded-[4px] shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Code Block</span>
        </button>
        <button
          onClick={() => appendBlock('google-drive')}
          className="text-xs font-bold px-3 py-1.5 bg-[#E1F5FE] text-[#0288D1] hover:bg-[#B3E5FC] border border-[#B3E5FC] rounded-[4px] shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-accent-blue" />
          <span>Google Embed</span>
        </button>
      </div>

      <div className="mt-14 pb-12 border-t border-notion-border pt-4 flex justify-between items-center text-[11px] text-notion-secondary/75 select-none font-mono">
        <div>Unterstützt durch IndexedDB</div>
        <div>Automatische Speicherung erfasst</div>
      </div>

      {/* PERFECT GOOGLE DRIVE PICKER MODAL */}
      {showPickerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col h-[520px] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-sky-100 p-1.5 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">In Google Drive stöbern</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Binde Dokumente, PDFs, Tabellen oder Medien direkt ein</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPickerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation and Search controls */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Breadcrumbs path */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 overflow-x-auto max-w-full no-scrollbar">
                {pickerHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <span className="text-slate-300 font-mono text-[10px]">&gt;</span>}
                    <button
                      onClick={() => {
                        const newHistory = pickerHistory.slice(0, idx + 1);
                        setPickerHistory(newHistory);
                        setPickerFolderId(item.id);
                        setSelectedPickerFile(null);
                        setPickerSearch('');
                      }}
                      className={`hover:text-sky-600 font-semibold cursor-pointer truncate max-w-[100px] py-0.5 px-1 rounded transition-colors ${
                        idx === pickerHistory.length - 1 ? 'text-sky-600 bg-sky-50' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Search bar inside picker */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Konto-Dateien durchsuchen..."
                  value={pickerSearch}
                  onChange={(e) => {
                    setPickerSearch(e.target.value);
                    setSelectedPickerFile(null);
                  }}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-md text-xs font-sans placeholder:text-slate-400 focus:outline-none transition-all"
                />
                {pickerSearch && (
                  <button 
                    onClick={() => setPickerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List viewport */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {pickerLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="w-7 h-7 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin mb-2"></div>
                  <p className="text-[11px] text-slate-400 font-mono">Lade Google Drive Inhalte ...</p>
                </div>
              ) : pickerFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-300 mb-2.5" />
                  <p className="text-xs font-semibold text-slate-605">Keine Dateien gefunden</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal">
                    {pickerSearch ? 'Versuche es mit einem anderen Suchbegriff.' : 'Dieser Ordner ist leer.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pickerFiles.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isSelected = selectedPickerFile?.id === file.id;
                    return (
                      <div
                        key={file.id}
                        onDoubleClick={() => {
                          if (isFolder) {
                            setPickerHistory([...pickerHistory, { id: file.id, name: file.name }]);
                            setPickerFolderId(file.id);
                            setSelectedPickerFile(null);
                            setPickerSearch('');
                          } else {
                            if (pickerTargetBlockId) {
                              selectDriveFileForBlock(pickerTargetBlockId, file);
                              setShowPickerModal(false);
                            }
                          }
                        }}
                        onClick={() => {
                          if (!isFolder) {
                            setSelectedPickerFile(file);
                          }
                        }}
                        className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isFolder 
                            ? 'border-slate-150 bg-white hover:border-sky-300 hover:shadow-2xs active:scale-[0.99] hover:bg-slate-50/20' 
                            : isSelected
                            ? 'border-sky-500 bg-sky-50/50 shadow-3xs ring-1 ring-sky-400'
                            : 'border-slate-150 bg-white hover:border-sky-200 hover:shadow-3xs'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isFolder ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {isFolder ? (
                              <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />
                            ) : file.mimeType.includes('document') ? (
                              <FileText className="w-5 h-5 text-blue-500" />
                            ) : file.mimeType.includes('spreadsheet') ? (
                              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            ) : file.mimeType.includes('presentation') ? (
                              <Presentation className="w-5 h-5 text-orange-500" />
                            ) : file.mimeType.includes('pdf') ? (
                              <FileText className="w-5 h-5 text-rose-500" />
                            ) : file.mimeType.startsWith('image/') ? (
                              <Image className="w-5 h-5 text-[#9C27B0]" />
                            ) : file.mimeType.startsWith('audio/') ? (
                              <Music className="w-5 h-5 text-pink-500" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-slate-500" />
                            )}
                          </div>

                          <div className="min-w-0 pr-2">
                            <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">{file.name}</h4>
                            <p className="text-[9px] text-slate-400 truncate mt-0.5 leading-none">
                              {isFolder ? 'Ordner' : file.mimeType.split('.').pop()?.split('/').pop()}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-slate-300">
                          {isFolder ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : isSelected ? (
                            <span className="text-[10px] font-bold text-[#0288D1] bg-sky-100 px-2 py-0.5 rounded-full select-none">Ausgewählt</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Tipp: Doppelklicke auf Ordner zum Öffnen, doppelklicke auf Dateien zum direkten Verlinken.
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPickerModal(false)}
                  className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md text-xs cursor-pointer transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  disabled={!selectedPickerFile}
                  onClick={() => {
                    if (selectedPickerFile && pickerTargetBlockId) {
                      selectDriveFileForBlock(pickerTargetBlockId, selectedPickerFile);
                      setShowPickerModal(false);
                    }
                  }}
                  className={`px-4.5 py-1.5 text-white font-semibold rounded-md text-xs transition-all shadow-3xs ${
                    selectedPickerFile 
                      ? 'bg-[#0288D1] hover:opacity-95 cursor-pointer' 
                      : 'bg-slate-300 pointer-events-none text-slate-100'
                  }`}
                >
                  Auswählen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
