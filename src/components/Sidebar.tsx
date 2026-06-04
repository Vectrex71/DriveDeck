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
  ShieldCheck
} from 'lucide-react';
import { WorkspacePage } from '../types';

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
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-60 bg-notion-sidebar border-r border-notion-border transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-notion-border">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-[4px] bg-[#0288D1] text-white font-extrabold text-xs select-none shadow-xs">
              DD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-sm tracking-tight leading-none">DriveDeck</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">für Google Drive</span>
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

        {/* Sync Status / Google Cloud Indicator */}
        <div className="p-3 mx-3 my-2.5 rounded-lg bg-white border border-notion-border flex flex-col gap-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-notion-secondary">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]"></span>
              <span className="text-[#0288D1]">IndexedDB Aktiv</span>
            </div>
          </div>
          <p className="text-[11px] text-notion-secondary/90 leading-normal">
            Deine Daten werden live im Browser gespeichert und bleiben offline erhalten.
          </p>
          <button
            id="google-drive-auth-init"
            onClick={() => onSelectPage('drive-explorer')}
            className="mt-1 text-center py-1.5 px-2 text-[11px] font-semibold text-white bg-accent-blue hover:opacity-90 rounded-[4px] shadow-2xs transition-all cursor-pointer flex items-center justify-center space-x-1"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Drive verbinden</span>
          </button>
        </div>

        {/* Landing Page Button & Drive Organizer Button */}
        <div className="px-3 pb-1.5 space-y-1.5 animate-in fade-in">
          <button
            id="open-landing-page-btn"
            onClick={() => onSelectPage('landing')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'landing'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span>🚀 Vorteile &amp; Sicherheit</span>
          </button>

          <button
            id="open-drive-explorer-btn"
            onClick={() => onSelectPage('drive-explorer')}
            className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
              activePageId === 'drive-explorer'
                ? 'bg-sky-500/10 text-[#0288D1] border border-sky-400/20 shadow-3xs'
                : 'text-slate-700 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <FolderSync className="w-4 h-4 text-[#0288D1] shrink-0 animate-pulse" />
            <span className="font-bold">📅 Drive-Organisator</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 py-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-notion-secondary" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-notion-border rounded-md text-notion-text placeholder-notion-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Section Header with Add Button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[11px] font-semibold text-notion-secondary uppercase tracking-wider">
          <span>Privat</span>
          <button
            id="create-new-page-btn"
            onClick={onCreatePage}
            className="p-1 hover:text-notion-text hover:bg-[rgba(0,0,0,0.04)] rounded transition-colors cursor-pointer"
            title="Neue Seite erstellen"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredPages.length === 0 ? (
            <div className="px-3 py-4 text-xs text-notion-secondary text-center italic">
              Keine Seiten
            </div>
          ) : (
            filteredPages.map((page) => {
              const isActive = page.id === activePageId;
              return (
                <div
                  key={page.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 text-xs rounded-[4px] cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[rgba(0,0,0,0.04)] text-notion-text font-medium'
                      : 'text-notion-text hover:bg-[rgba(0,0,0,0.04)]'
                  }`}
                  onClick={() => onSelectPage(page.id)}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-sm select-none flex-shrink-0">{page.icon || '📄'}</span>
                    <span className="truncate">{page.title || 'Unbenannt'}</span>
                  </div>
                  
                  {/* Delete Button (visible on hover) */}
                  <button
                    id={`delete-page-${page.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-notion-secondary hover:text-red-600 hover:bg-[rgba(0,0,0,0.06)] rounded transition-all cursor-pointer"
                    title="Seite löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Sidebar Action block */}
        <div className="p-2 border-t border-notion-border bg-notion-sidebar mt-auto">
          <button
            onClick={onCreatePage}
            className="w-full flex items-center space-x-2 text-xs text-notion-secondary hover:text-notion-text p-1.5 rounded-[4px] hover:bg-[rgba(0,0,0,0.04)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Neue Seite</span>
          </button>
        </div>
      </div>
    </>
  );
}
