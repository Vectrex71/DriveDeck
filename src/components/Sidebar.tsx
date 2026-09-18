/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronLeft, 
  Menu, 
  Database, 
  CloudOff, 
  FileText, 
  Settings,
  HelpCircle,
  FolderSync,
  ShieldCheck,
  StickyNote,
  CheckSquare,
  BookMarked,
  Pin,
  Camera,
  Share2,
  Kanban
} from 'lucide-react';
import { WorkspacePage, ProjectAlbum } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface SidebarProps {
  pages: WorkspacePage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: () => void;
  onDeletePage: (id: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  onTriggerSync?: () => void;

  // Album specific properties
  albums: ProjectAlbum[];
  activeAlbumId: string | null;
  onSelectAlbum: (id: string | null) => void;
  onCreateAlbum: (name: string) => void;
  onDeleteAlbum: (id: string) => void;
  onMovePageToAlbum: (pageId: string, albumId: string) => void;
  onReorderAlbums?: (reordered: ProjectAlbum[]) => void;
  onSharePage?: (pageId: string) => void;
  onShareAlbum?: (albumId: string) => void;
}

export default function Sidebar({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  isSidebarOpen,
  setSidebarOpen,
  syncStatus = 'offline',
  onTriggerSync,
  albums,
  activeAlbumId,
  onSelectAlbum,
  onCreateAlbum,
  onDeleteAlbum,
  onMovePageToAlbum,
  onReorderAlbums,
  onSharePage,
  onShareAlbum,
}: SidebarProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);
  const [dragSourceAlbumId, setDragSourceAlbumId] = useState<string | null>(null);

  const filteredPages = pages.filter(page => {
    // 1. Matches text search
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    // 2. Belongs to active album
    if (activeAlbumId) {
      if (activeAlbumId === 'welcome-project') {
        return !page.albumId || page.albumId === 'welcome-project';
      }
      return page.albumId === activeAlbumId;
    }
    
    return true; // if no album active, show everything
  });

  const activeAlbum = albums.find(a => a.id === activeAlbumId);
  const activeAlbumDisplayName = activeAlbum 
    ? (activeAlbum.id === 'welcome-project' || activeAlbum.name === 'Willkommen' || activeAlbum.name === 'Welcome'
        ? (language === 'en' ? 'Welcome' : 'Willkommen')
        : activeAlbum.name)
    : null;
  const activeSectionLabel = activeAlbumDisplayName 
    ? (language === 'en' ? `Pages in "${activeAlbumDisplayName}"` : `Seiten in "${activeAlbumDisplayName}"`) 
    : (language === 'en' ? 'Pages' : 'Seiten');

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isSidebarOpen && (
        <button
          id="sidebar-toggle-open"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-40 p-2 text-notion-text bg-notion-bg rounded-md shadow-xs border border-notion-border hover:bg-[rgba(0,0,0,0.04)] md:flex items-center justify-center cursor-pointer transition-all duration-200"
          title="Sidebar öffnen"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Sidebar Container */}
      <div
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-notion-sidebar transition-all duration-300 ease-in-out transform overflow-hidden ${
          isSidebarOpen 
            ? 'w-60 border-r border-notion-border translate-x-0 lg:relative lg:translate-x-0 lg:opacity-100' 
            : 'w-0 border-r-0 border-transparent -translate-x-full lg:relative lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-notion-border">
          <div 
            onClick={() => onSelectPage('landing')}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-85 select-none transition-all group/logo"
            title="Sicherheits-Info & Landing-Page anzeigen"
          >
            <div className="relative flex items-center justify-center w-9 h-9 shrink-0 select-none">
              <svg viewBox="0 0 32 32" className="w-9 h-9 select-none transition-all duration-300 group-hover/logo:scale-110 group-hover/logo:rotate-3" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logo-sidebar-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#0288D1" />
                    <stop offset="100%" stopColor="#01579B" />
                  </linearGradient>
                  <filter id="logo-sidebar-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0288D1" floodOpacity="0.25"/>
                  </filter>
                </defs>

                {/* Overlapping back-shadow silhouette layer for ultra premium touch */}
                {/* First D shadow */}
                <path d="M 4 4 H 14 C 19 4 23 8.5 23 16 C 23 23.5 19 28 14 28 H 4 Z" stroke="#01579B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.1" />
                {/* Second D shadow */}
                <path d="M 13 4 H 22 C 27 4 31 8.5 31 16 C 31 23.5 27 28 22 28 H 13" stroke="#01579B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.08" />

                {/* Custom Elegant Double 'D' Vector Geometry */}
                {/* First D */}
                <path d="M 4 4 H 14 C 19 4 23 8.5 23 16 C 23 23.5 19 28 14 28 H 4 Z" stroke="url(#logo-sidebar-stroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#logo-sidebar-glow)" />
                {/* Second D (overlapping & interlocked) */}
                <path d="M 13 4 H 22 C 27 4 31 8.5 31 16 C 31 23.5 27 28 22 28 H 13" stroke="url(#logo-sidebar-stroke)" strokeWidth="3" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round" filter="url(#logo-sidebar-glow)" />
              </svg>

              {/* Responsive sync status dot overlapping the DD badge */}
              <span 
                className={`absolute -bottom-1 -right-1 w-3.2 h-3.2 rounded-full border-2 border-white inline-block shadow-xs ${
                  syncStatus === 'synced' 
                    ? 'bg-emerald-500 animate-[pulse_3s_infinite]' 
                    : syncStatus === 'syncing' 
                    ? 'bg-amber-500 animate-pulse' 
                    : syncStatus === 'error' 
                    ? 'bg-rose-500 animate-[bounce_2s_infinite]' 
                    : 'bg-slate-350'
                }`} 
                title={
                  syncStatus === 'synced' 
                    ? 'Google Drive verbunden & synchron' 
                    : syncStatus === 'syncing' 
                    ? 'In Synchronisierung mit Google Drive...' 
                    : syncStatus === 'error' 
                    ? 'Synchronisierungs-Störung' 
                    : 'Lokal aktiv / Google Drive offline'
                }
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-sm tracking-tight leading-none group-hover/logo:text-[#0288D1] transition-colors">DriveDeck</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-[5px] leading-none">für Google Drive</span>
            </div>
          </div>
          
          <button
            id="sidebar-toggle-close"
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-notion-secondary hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] rounded cursor-pointer"
            title="Sidebar einklappen"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Landing Page Button & Drive Organizer Button */}
        <div className="px-3 pb-1.5 space-y-1.5 animate-in fade-in">
          <button
            id="open-library-btn"
            onClick={() => onSelectPage('library')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'library'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20 shadow-3xs'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <BookMarked className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span className="font-bold">{language === 'en' ? 'Library' : 'Bibliothek'}</span>
          </button>

          <button
            id="open-sticky-notes-btn"
            onClick={() => onSelectPage('sticky-notes')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'sticky-notes'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20 shadow-3xs'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <StickyNote className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span className="font-bold">{language === 'en' ? 'Notes' : 'Haftnotizen'}</span>
          </button>

          <button
            id="open-tasks-btn"
            onClick={() => onSelectPage('tasks')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'tasks'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20 shadow-3xs'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span className="font-bold">Google Tasks</span>
          </button>

          <button
            id="open-kanban-btn"
            onClick={() => onSelectPage('kanban')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'kanban'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20 shadow-3xs'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <Kanban className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span className="font-bold">Kanban</span>
          </button>

          <button
            id="open-photos-btn"
            onClick={() => onSelectPage('photos')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'photos'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20 shadow-3xs'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <Camera className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span className="font-bold">{language === 'en' ? 'Photos' : 'Fotos'}</span>
          </button>
        </div>

        {/* Project Albums Title Bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[11px] font-bold text-notion-secondary uppercase tracking-wider select-none border-t border-notion-border/30 mt-1">
          <span>{language === 'en' ? 'Project Shortcuts' : 'Projekt-Shortcuts'}</span>
          <button
            onClick={() => setShowAddAlbum(!showAddAlbum)}
            className="p-1 hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] rounded transition-colors cursor-pointer"
            title={language === 'en' ? 'Create new project album' : 'Neues Projektalbum erstellen'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Album inline form */}
        {showAddAlbum && (
          <div className="mx-3 my-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-[4px] space-y-2 animate-in slide-in-from-top-2 duration-150">
            <input
              type="text"
              placeholder={language === 'en' ? 'Project name...' : 'Projektname...'}
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => {
                  setShowAddAlbum(false);
                  setNewAlbumName('');
                }}
                className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Abbrechen'}
              </button>
              <button
                onClick={() => {
                  if (newAlbumName.trim()) {
                    onCreateAlbum(newAlbumName.trim());
                    setNewAlbumName('');
                    setShowAddAlbum(false);
                  }
                }}
                className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#0288D1] hover:opacity-95 rounded cursor-pointer shadow-3xs"
              >
                {language === 'en' ? 'Add' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        )}

        {/* Albums list display */}
        <div className="px-2 max-h-40 overflow-y-auto space-y-0.5 mb-2 scrollbar-thin">
          {albums.filter(album => album.pinned || album.id === 'welcome-project').map((album) => {
            const isSelected = album.id === activeAlbumId;
            const isDragOver = album.id === dragOverAlbumId;
            const isSelfDragOver = dragSourceAlbumId === album.id;
            const albumPageCount = pages.filter(p => p.albumId === album.id || (album.id === 'welcome-project' && !p.albumId)).length;

            return (
              <div
                key={album.id}
                draggable={true}
                onDragStart={(e) => {
                  setDragSourceAlbumId(album.id);
                  e.dataTransfer.setData('application/drivedeck-albumId', album.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDragSourceAlbumId(null);
                  setDragOverAlbumId(null);
                }}
                onClick={() => onSelectAlbum(album.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverAlbumId !== album.id) {
                    setDragOverAlbumId(album.id);
                  }
                }}
                onDragLeave={() => {
                  setDragOverAlbumId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverAlbumId(null);
                  
                  if (dragSourceAlbumId !== null) {
                    // Reordering albums logic
                    if (dragSourceAlbumId !== album.id) {
                      const sourceIdx = albums.findIndex(a => a.id === dragSourceAlbumId);
                      const targetIdx = albums.findIndex(a => a.id === album.id);
                      if (sourceIdx !== -1 && targetIdx !== -1) {
                        const updated = [...albums];
                        const [moved] = updated.splice(sourceIdx, 1);
                        updated.splice(targetIdx, 0, moved);
                        onReorderAlbums?.(updated);
                      }
                    }
                    setDragSourceAlbumId(null);
                  } else {
                    // Moving a page into album
                    const pageId = e.dataTransfer.getData('text/plain');
                    if (pageId) {
                      onMovePageToAlbum(pageId, album.id);
                    }
                  }
                }}
                className={`group/album flex items-center justify-between px-2.5 py-1.5 text-xs rounded-[4px] cursor-grab active:cursor-grabbing border transition-all duration-150 ${
                  dragSourceAlbumId !== null && isDragOver && !isSelfDragOver
                    ? 'bg-sky-500/10 border-sky-400 scale-[1.02] shadow-3xs text-[#0288D1] font-semibold'
                    : dragSourceAlbumId === null && isDragOver
                    ? 'bg-emerald-500/10 border-emerald-500 scale-[1.03] shadow-xs text-emerald-700 font-semibold'
                    : isSelected
                    ? 'bg-sky-500/10 text-[#0288D1] font-semibold border-sky-300/30'
                    : 'text-slate-600 hover:bg-[rgba(0,0,0,0.025)] border-transparent'
                } ${dragSourceAlbumId === album.id ? 'opacity-40 border-dashed border-slate-300' : ''}`}
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-sm shrink-0 select-none mr-0.5 leading-none">
                    {album.icon || '📁'}
                  </span>
                  <span className="truncate flex items-center gap-1">
                    {album.id === 'welcome-project' || album.name === 'Willkommen' || album.name === 'Welcome'
                      ? (language === 'en' ? 'Welcome' : 'Willkommen')
                      : album.name}
                    {album.isSubscription && (
                      <span className="text-[8px] bg-sky-100 text-[#0288D1] px-1 py-0.2 rounded font-sans shrink-0 font-bold tracking-tight">
                        {language === 'en' ? 'Sub' : 'Abo'}
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Perfect page count alignment & responsive hide logic on hover */}
                <div className="w-12 h-5 flex items-center justify-end space-x-1 shrink-0">
                  <>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100/60 px-1.5 py-0.5 select-none rounded-[3.5px] group-hover/album:hidden">
                      {albumPageCount}
                    </span>
                    {!album.isSubscription && onShareAlbum && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareAlbum(album.id);
                        }}
                        className="hidden group-hover/album:flex items-center justify-center p-0.5 text-slate-400 hover:text-sky-600 rounded transition-all cursor-pointer"
                        title="Diesen Ordner für andere abonnieren lassen"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAlbum(album.id);
                      }}
                      className="hidden group-hover/album:flex items-center justify-center p-0.5 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                      title={album.isSubscription ? "Abonnement beenden" : "Projektalbum löschen"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="px-3 py-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-notion-secondary" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search...' : 'Suchen...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-notion-border rounded-md text-notion-text placeholder-notion-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Section Header with Add Button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[11px] font-semibold text-notion-secondary uppercase tracking-wider border-t border-notion-border/20 mt-1">
          <span className="truncate pr-1">{activeSectionLabel}</span>
          <button
            id="create-new-page-btn"
            onClick={onCreatePage}
            className="p-1 hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] rounded transition-colors cursor-pointer shrink-0"
            title={language === 'en' ? 'Create new page' : 'Neue Seite erstellen'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredPages.length === 0 ? (
            <div className="px-3 py-4 text-xs text-notion-secondary text-center italic">
              {language === 'en' ? 'No pages' : 'Keine Seiten'}
            </div>
          ) : (
            filteredPages.map((page) => {
              const isActive = page.id === activePageId;
              const displayTitle = () => {
                if (page.id === 'welcome') {
                  return language === 'en' ? 'Start here 👋' : 'Hier starten 👋';
                }
                if (language === 'en' && (page.title === 'Neue Seite' || page.title === 'Neue Seite 📝')) {
                  return 'New Page';
                }
                if (language === 'de' && (page.title === 'New Page' || page.title === 'New Page 📝')) {
                  return 'Neue Seite';
                }
                return page.title || (language === 'en' ? 'Untitled' : 'Unbenannt');
              };

              return (
                <div
                  key={page.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', page.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`group flex items-center justify-between px-2.5 py-1.5 text-xs rounded-[4px] cursor-grab active:cursor-grabbing transition-colors ${
                    isActive
                      ? 'bg-[rgba(0,0,0,0.04)] text-notion-text font-medium'
                      : 'text-notion-text hover:bg-[rgba(0,0,0,0.04)]'
                  }`}
                  onClick={() => onSelectPage(page.id)}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-sm select-none flex-shrink-0">{page.icon || '📄'}</span>
                    <span className="truncate flex items-center gap-1">
                      {displayTitle()}
                      {page.isSubscription && (
                        <span className="text-[8px] bg-sky-100 text-[#0288D1] px-1 py-0.2 rounded font-sans shrink-0 font-bold tracking-tight">
                          {language === 'en' ? 'Sub' : 'Abo'}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Share Button representing Option B */}
                    {!page.isSubscription && onSharePage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSharePage(page.id);
                        }}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-600 hover:bg-[rgba(0,0,0,0.06)] rounded transition-all cursor-pointer"
                        title={language === 'en' ? 'Share this document for subscription' : 'Andere dieses Dokument abonnieren lassen'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Button (visible on hover or always on mobile/tablet) */}
                    <button
                      id={`delete-page-${page.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(page.id);
                      }}
                      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-[rgba(0,0,0,0.06)] rounded transition-all cursor-pointer"
                      title={page.isSubscription ? (language === 'en' ? 'Cancel subscription' : 'Abonnement beenden') : (language === 'en' ? 'Delete page' : 'Seite löschen')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Sidebar Action block */}
        <div className="h-[45px] px-3 border-t border-notion-border bg-notion-sidebar mt-auto flex items-center space-x-1.5 shrink-0 select-none">
          <button
            onClick={onCreatePage}
            className="flex-1 flex items-center space-x-2 text-xs text-notion-secondary hover:text-notion-text p-1.5 rounded-[4px] hover:bg-[rgba(0,0,0,0.04)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'New Page' : 'Neue Seite'}</span>
          </button>
          
          <button
            onClick={() => onSelectPage('settings')}
            className={`p-1.5 rounded-[4px] cursor-pointer transition-all border shrink-0 ${
              activePageId === 'settings'
                ? 'bg-sky-500/10 text-[#0288D1] border-sky-400/20 shadow-3xs'
                : 'text-notion-secondary hover:text-[#0288D1] bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
            title={language === 'en' ? 'Open settings & profile' : 'Profil & Einstellungen öffnen'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
