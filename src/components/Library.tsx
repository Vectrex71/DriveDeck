/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Pin, 
  Trash2, 
  BookOpen, 
  FolderOpen, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Search,
  BookMarked,
  Share2
} from 'lucide-react';
import { ProjectAlbum, WorkspacePage } from '../types';

interface LibraryProps {
  albums: ProjectAlbum[];
  pages: WorkspacePage[];
  activeAlbumId: string | null;
  onSelectAlbum: (id: string | null) => void;
  onCreateAlbum: (name: string, color?: string, icon?: string) => void;
  onDeleteAlbum: (id: string) => void;
  onUpdateAlbumMeta: (id: string, updates: Partial<ProjectAlbum>) => void;
  onTogglePin: (id: string) => void;
  onShareAlbum?: (id: string) => void;
}

const PRESET_COVERS = [
  { id: 'nordic-blue', label: 'Nordisch Blau', class: 'from-sky-500 to-indigo-700' },
  { id: 'emerald-sage', label: 'Smaragd Salbei', class: 'from-emerald-500 to-teal-700' },
  { id: 'cosmic-violet', label: 'Kosmisches Violett', class: 'from-violet-500 to-fuchsia-700' },
  { id: 'sunset-amber', label: 'Sonnenuntergang', class: 'from-amber-500 to-orange-600' },
  { id: 'rose-quartz', label: 'Rosenquarz', class: 'from-rose-400 to-pink-600' },
  { id: 'crimson-rust', label: 'Karminrot', class: 'from-red-500 to-rose-700' },
  { id: 'clean-slate', label: 'Schickes Schiefer', class: 'from-slate-500 to-slate-700' },
  { id: 'leather-wood', label: 'Warmes Leder', class: 'from-[#8D6E63] to-[#4E342E]' },
];

const PRESET_EMOJIS = ['📁', '📚', '🚀', '🎨', '💼', '💻', '📝', '🧘', '🍕', '⚙️', '📈', '🔑', '🎯', '🌱'];

export default function Library({
  albums,
  pages,
  activeAlbumId,
  onSelectAlbum,
  onCreateAlbum,
  onDeleteAlbum,
  onUpdateAlbumMeta,
  onTogglePin,
  onShareAlbum,
}: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COVERS[0].class);
  const [selectedIcon, setSelectedIcon] = useState('📁');

  // Editing state
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [editingIcon, setEditingIcon] = useState('');

  const handleStartCreate = () => {
    setNewAlbumName('');
    setSelectedColor(PRESET_COVERS[Math.floor(Math.random() * PRESET_COVERS.length)].class);
    setSelectedIcon(PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)]);
    setIsCreating(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    onCreateAlbum(newAlbumName.trim(), selectedColor, selectedIcon);
    setNewAlbumName('');
    setIsCreating(false);
  };

  const handleStartEdit = (album: ProjectAlbum) => {
    setEditingAlbumId(album.id);
    setEditingName(album.name);
    setEditingColor(album.color || PRESET_COVERS[0].class);
    setEditingIcon(album.icon || '📁');
  };

  const handleConfirmEdit = (id: string) => {
    if (!editingName.trim()) return;
    onUpdateAlbumMeta(id, {
      name: editingName.trim(),
      color: editingColor,
      icon: editingIcon
    });
    setEditingAlbumId(null);
  };

  const getPageCount = (albumId: string) => {
    if (albumId === 'welcome-project') {
      return pages.filter(p => !p.albumId || p.albumId === 'welcome-project').length;
    }
    return pages.filter(p => p.albumId === albumId).length;
  };

  const filteredAlbums = albums.filter(album => 
    album.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="library-layout" className="flex-1 bg-[#FAF9F6] p-6 lg:p-10 overflow-y-auto font-sans leading-normal text-slate-800">
      
      {/* Search and Library Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-200/60 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <BookMarked className="w-6.5 h-6.5 text-[#0288D1]" />
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight leading-none">Projekt-Bibliothek</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
            Verwalte deine Projekt-Alben als schicke Bücherwand. Pinne deine 5 Favoriten direkt an die Sidebar.
          </p>
        </div>

        {/* Library Control Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Alben filtern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8.5 pr-4 py-1.75 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="popLayout">
          
          {/* Create Modal Cover Builder */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2 text-slate-800">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                  <span className="text-xs font-bold">Neues Projektalbum gestalten</span>
                </div>
                <button 
                  onClick={() => setIsCreating(false)} 
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  
                  {/* Real-time Preview */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">Vorschau Einband</span>
                    <div className={`w-32 h-44 rounded-l-lg rounded-r shadow-md bg-gradient-to-br ${selectedColor} relative flex flex-col justify-between p-3.5 border-l-4 border-black/15 overflow-hidden`}>
                      {/* Highlight shimmer */}
                      <div className="absolute -inset-x-20 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent transform -skew-y-12 pointer-events-none" />
                      
                      {/* Top Content: Album Title and metadata */}
                      <div className="z-10 relative select-none space-y-0.5">
                        <p className="text-white text-[11.5px] font-black leading-tight tracking-tight break-words line-clamp-2 filter drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.35)]">
                          {newAlbumName.trim() || 'Unbenanntes Album'}
                        </p>
                        <p className="text-white/80 text-[8.5px] font-mono leading-none tracking-wide uppercase filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
                          0 Seiten
                        </p>
                      </div>

                      {/* Centered larger, opaque icon in middle */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
                        <span className="text-5xl select-none filter drop-shadow-md">
                          {selectedIcon}
                        </span>
                      </div>

                      {/* Empty spacer spacer to balance bottom height */}
                      <div className="h-6 mt-auto z-10 w-full" />
                    </div>
                  </div>

                  {/* Settings Column */}
                  <div className="md:col-span-8 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Titel des Albums</label>
                      <input
                        type="text"
                        placeholder="Z. B. Finanzen 2026, Reiseplanung, Master-Thesis..."
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0288D1]/20 focus:border-[#0288D1] focus:bg-white"
                        autoFocus
                      />
                    </div>

                    {/* Color choice */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Einband-Farbe</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COVERS.map((cover) => (
                          <button
                            key={cover.id}
                            type="button"
                            onClick={() => setSelectedColor(cover.class)}
                            className={`w-7 h-7 rounded-md bg-gradient-to-br ${cover.class} hover:scale-105 active:scale-95 transition-all cursor-pointer border ${selectedColor === cover.class ? 'ring-2 ring-slate-800 ring-offset-2 border-white' : 'border-transparent'}`}
                            title={cover.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Icon choice */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Symbol / Emoji</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedIcon(emoji)}
                            className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 text-lg transition-all cursor-pointer border ${selectedIcon === emoji ? 'border-slate-350 bg-slate-50 shadow-3xs scale-102 font-bold' : 'border-transparent bg-transparent'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={!newAlbumName.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277bd] rounded-lg cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Projekt anlegen
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Bookshelf Library Grid */}
          <motion.div 
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          >
            {filteredAlbums.map((album) => {
              const isSelected = album.id === activeAlbumId;
              const isEditing = album.id === editingAlbumId;
              const isPinned = !!album.pinned;
              const pageCount = getPageCount(album.id);
              const colorGradient = album.color || PRESET_COVERS[0].class;
              const bookIcon = album.icon || '📁';

              return (
                <motion.div
                  key={album.id}
                  layoutId={`album-card-${album.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className={`group relative flex flex-col justify-between transition-all duration-300 ${isEditing ? 'pb-16' : ''}`}
                >
                  {/* Album Cover Graphic Section */}
                  <div 
                    onClick={() => onSelectAlbum(album.id)}
                    className={`aspect-[3/4] rounded-xl shadow-md bg-gradient-to-br from-slate-100 to-slate-200 relative flex flex-col justify-between p-4 cursor-pointer overflow-hidden border-l-[4.5px] border-black/15 group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300 ${isSelected ? 'ring-3 ring-[#0288D1]' : ''}`}
                  >
                    {/* Embedded Cover Book effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} transition-all`} />
                    <div className="absolute top-0 right-0 bottom-0 left-1 bg-gradient-to-r from-black/8 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Highlight shimmer */}
                    <div className="absolute -inset-x-20 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent transform -skew-y-12 pointer-events-none" />

                    {/* Top Content: Album Title and metadata */}
                    <div className="z-10 relative select-none space-y-0.5">
                      <p className="text-white text-[12px] md:text-[13px] font-black leading-tight tracking-tight break-words line-clamp-2 filter drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.4)]">
                        {album.name}
                      </p>
                      <p className="text-white/85 text-[9px] font-mono leading-none tracking-wide uppercase filter drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)]">
                        {pageCount === 1 ? '1 Seite' : `${pageCount} Seiten`}
                      </p>
                    </div>

                    {/* Centered larger, opaque (solid) icon in the middle */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-55">
                      <span className="text-6xl select-none filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)] transition-all duration-300 transform group-hover:scale-110">
                        {bookIcon}
                      </span>
                    </div>

                    {/* Bottom Content: Centered Action Buttons */}
                    <div className="z-10 flex items-center justify-center mt-auto w-full pt-1.5 pb-0.5">
                      <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-155">
                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(album);
                          }}
                          className="p-1.5 bg-white hover:bg-slate-50 text-slate-750 hover:text-slate-900 rounded-md shadow-xs border border-slate-150 cursor-pointer transition-colors"
                          title="Titel & Einband bearbeiten"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Dock-Shortcut Pin toggler */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(album.id);
                          }}
                          className={`p-1.5 rounded-md border cursor-pointer transition-colors shadow-xs ${isPinned ? 'bg-amber-100 text-amber-705 border-amber-200' : 'bg-white hover:bg-slate-50 text-slate-705 border-slate-150'}`}
                          title={isPinned ? "Aus Sidebar Shortcuts entfernen" : "An die Sidebar andocken"}
                        >
                          <Pin className={`w-3.5 h-3.5 fill-current ${isPinned ? 'rotate-45' : 'rotate-0'}`} />
                        </button>

                        {/* Share folder button */}
                        {onShareAlbum && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareAlbum(album.id);
                            }}
                            className="p-1.5 bg-white hover:bg-sky-50 text-sky-705 hover:text-sky-900 rounded-md shadow-xs border border-slate-150 cursor-pointer transition-colors"
                            title="Gesamtes Album teilen"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAlbum(album.id);
                          }}
                          className="p-1.5 bg-white hover:bg-red-50 text-slate-705 hover:text-red-500 rounded-md shadow-xs border border-slate-150 cursor-pointer transition-colors"
                          title="Album löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Album Info & Action Panel at Footer */}
                  {isEditing && (
                    <div className="space-y-1.5 mt-1">
                      <div className="space-y-1.5 animate-in slide-in-from-bottom-2 duration-100">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {/* Inline color & emoji settings */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex gap-1 overflow-x-auto py-0.5 max-w-[90px] scrollbar-none">
                            {PRESET_COVERS.map(cover => (
                              <button
                                key={cover.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingColor(cover.class);
                                }}
                                className={`w-3.5 h-3.5 rounded-full shrink-0 bg-gradient-to-br ${cover.class} border ${editingColor === cover.class ? 'ring-1 ring-slate-800 border-white' : 'border-transparent'}`}
                              />
                            ))}
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmEdit(album.id);
                              }}
                              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAlbumId(null);
                              }}
                              className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Inline emoji options */}
                        <div className="flex gap-1 overflow-x-auto py-1 max-w-[130px] scrollbar-none">
                          {PRESET_EMOJIS.slice(0, 7).map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingIcon(emoji);
                              }}
                              className={`text-xs hover:bg-slate-100 p-0.5 rounded ${editingIcon === emoji ? 'bg-slate-200' : ''}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Visual Dotted Placeholder layout representation */}
            <motion.div
              layoutId="create-album-placeholder"
              onClick={handleStartCreate}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white hover:border-[#0288D1]/40 hover:text-[#0288D1] transition-all cursor-pointer aspect-[3/4]"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[#0288D1]/10 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-slate-550" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Album hinzufügen</span>
              <p className="text-[9px] text-slate-400 mt-1 max-w-[124px] uppercase font-sans">
                Einband & Farbe frei wählbar
              </p>
            </motion.div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
