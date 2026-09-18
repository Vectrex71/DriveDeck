/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar as CalendarIcon,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  Copy,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Tag as TagIcon,
  Clock,
  Bell,
  Cloud,
  CloudCheck,
  RefreshCw,
  SlidersHorizontal,
  FolderPlus,
  ArrowRightLeft,
  GripVertical
} from 'lucide-react';
import { KanbanBoardData, KanbanColumn, KanbanCard } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { executeKanbanSync } from '../lib/driveSync';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  showSystemNotification, 
  playNotificationSound 
} from '../lib/notificationService';

interface KanbanBoardProps {
  token?: string | null;
  showConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText?: string,
    cancelText?: string,
    isAlert?: boolean
  ) => void;
}

const STORAGE_KEY = 'drivedeck_kanban_boards';

const DEFAULT_BOARD_DE: KanbanBoardData = {
  id: 'board-welcome-de',
  title: '🚀 Projekt: Website & Launch',
  description: 'Zentrales Projekt-Board für Entwicklung, Aufgaben und Meilensteine.',
  createdAt: Date.now() - 86400000 * 2,
  updatedAt: Date.now(),
  columns: [
    {
      id: 'col-backlog',
      title: 'Backlog / Ideen 💡',
      color: 'slate',
      cards: [
        {
          id: 'card-1',
          title: 'Landingpage Performance analysieren',
          description: 'Lighthouse Score prüfen und Asset-Kompression für mobile Geräte optimieren.',
          priority: 'medium',
          color: 'sky',
          tags: ['Performance', 'SEO'],
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          checklists: [
            { id: 'c1', text: 'Bilder im WebP Format prüfen', completed: true },
            { id: 'c2', text: 'Bundle Size verifizieren', completed: false }
          ],
          createdAt: Date.now() - 3600000 * 5,
          updatedAt: Date.now() - 3600000 * 5
        },
        {
          id: 'card-2',
          title: 'Dark Mode Farbpalette testen',
          description: 'Kontrast-Verhältnisse nach WCAG AA Richtlinien evaluieren.',
          priority: 'low',
          color: 'purple',
          tags: ['Design', 'UI'],
          createdAt: Date.now() - 3600000 * 3,
          updatedAt: Date.now() - 3600000 * 3
        }
      ]
    },
    {
      id: 'col-todo',
      title: 'Zu erledigen 📋',
      color: 'amber',
      cards: [
        {
          id: 'card-3',
          title: 'Discord Ankündigung & Werbetext posten',
          description: 'Werbetext in Discord-Community veröffentlichen und Feedback-Kanal eröffnen.',
          priority: 'high',
          color: 'amber',
          tags: ['Community', 'Marketing'],
          dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
          checklists: [
            { id: 'c3', text: 'Discord Server beitreten', completed: true },
            { id: 'c4', text: 'Showcase Text einfügen', completed: false },
            { id: 'c5', text: 'Link testen (drivedeck.xyz)', completed: false }
          ],
          createdAt: Date.now() - 3600000 * 2,
          updatedAt: Date.now() - 3600000 * 2
        }
      ]
    },
    {
      id: 'col-progress',
      title: 'In Bearbeitung ⏳',
      color: 'sky',
      cards: [
        {
          id: 'card-4',
          title: 'Kanban-Board für Projekte integrieren',
          description: 'Eigenständiges Projekt-Kanban unter DriveTasks und Embedded-Block per Slash-Command.',
          priority: 'urgent',
          color: 'rose',
          tags: ['Feature', 'Prio1'],
          dueDate: new Date(Date.now()).toISOString().split('T')[0],
          checklists: [
            { id: 'c6', text: 'Sidebar Menüpunkt anlegen', completed: true },
            { id: 'c7', text: 'Drag & Drop Logik implementieren', completed: true },
            { id: 'c8', text: 'Slash-Command /kanban einbetten', completed: true }
          ],
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now()
        }
      ]
    },
    {
      id: 'col-done',
      title: 'Erledigt ✅',
      color: 'emerald',
      cards: [
        {
          id: 'card-5',
          title: 'Haftnotizen Lokalisierung gefixt',
          description: 'Demo-Karten und UI schalten nun sauber zwischen Deutsch und Englisch um.',
          priority: 'medium',
          color: 'emerald',
          tags: ['Bugfix', 'i18n'],
          createdAt: Date.now() - 3600000 * 12,
          updatedAt: Date.now() - 3600000 * 12
        },
        {
          id: 'card-6',
          title: 'IndexedDB Footer-Texte entfernt',
          description: 'Unnötige Debug-Texte am Ende des Notiz-Editors bereinigt.',
          priority: 'low',
          color: 'slate',
          tags: ['UI-Cleanup'],
          createdAt: Date.now() - 3600000 * 20,
          updatedAt: Date.now() - 3600000 * 20
        }
      ]
    }
  ]
};

const DEFAULT_BOARD_EN: KanbanBoardData = {
  id: 'board-welcome-en',
  title: '🚀 Project: Website & Launch',
  description: 'Central project board for product development, tasks, and team milestones.',
  createdAt: Date.now() - 86400000 * 2,
  updatedAt: Date.now(),
  columns: [
    {
      id: 'col-backlog',
      title: 'Backlog / Ideas 💡',
      color: 'slate',
      cards: [
        {
          id: 'card-1',
          title: 'Analyze landing page speed score',
          description: 'Audit Lighthouse metrics and optimize image compression for mobile devices.',
          priority: 'medium',
          color: 'sky',
          tags: ['Performance', 'SEO'],
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          checklists: [
            { id: 'c1', text: 'Verify WebP format images', completed: true },
            { id: 'c2', text: 'Check JavaScript bundle size', completed: false }
          ],
          createdAt: Date.now() - 3600000 * 5,
          updatedAt: Date.now() - 3600000 * 5
        },
        {
          id: 'card-2',
          title: 'Test Dark Mode color palette',
          description: 'Evaluate contrast ratios against WCAG AA accessibility standards.',
          priority: 'low',
          color: 'purple',
          tags: ['Design', 'UI'],
          createdAt: Date.now() - 3600000 * 3,
          updatedAt: Date.now() - 3600000 * 3
        }
      ]
    },
    {
      id: 'col-todo',
      title: 'To Do 📋',
      color: 'amber',
      cards: [
        {
          id: 'card-3',
          title: 'Post Discord announcement & ad text',
          description: 'Publish project showcase to Discord and collect initial user feedback.',
          priority: 'high',
          color: 'amber',
          tags: ['Community', 'Marketing'],
          dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
          checklists: [
            { id: 'c3', text: 'Join Discord channel', completed: true },
            { id: 'c4', text: 'Paste showcase copy', completed: false },
            { id: 'c5', text: 'Test domain link (drivedeck.xyz)', completed: false }
          ],
          createdAt: Date.now() - 3600000 * 2,
          updatedAt: Date.now() - 3600000 * 2
        }
      ]
    },
    {
      id: 'col-progress',
      title: 'In Progress ⏳',
      color: 'sky',
      cards: [
        {
          id: 'card-4',
          title: 'Integrate dedicated Kanban board',
          description: 'Build project kanban board under DriveTasks and embedded page block with /kanban.',
          priority: 'urgent',
          color: 'rose',
          tags: ['Feature', 'Prio1'],
          dueDate: new Date(Date.now()).toISOString().split('T')[0],
          checklists: [
            { id: 'c6', text: 'Add sidebar navigation button', completed: true },
            { id: 'c7', text: 'Build drag and drop card engine', completed: true },
            { id: 'c8', text: 'Slash command support in editor', completed: true }
          ],
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now()
        }
      ]
    },
    {
      id: 'col-done',
      title: 'Done ✅',
      color: 'emerald',
      cards: [
        {
          id: 'card-5',
          title: 'Sticky notes localization fixed',
          description: 'Welcome demo cards and controls now update cleanly based on language.',
          priority: 'medium',
          color: 'emerald',
          tags: ['Bugfix', 'i18n'],
          createdAt: Date.now() - 3600000 * 12,
          updatedAt: Date.now() - 3600000 * 12
        },
        {
          id: 'card-6',
          title: 'Removed IndexedDB footer texts',
          description: 'Cleaned up debug notes and status messages from the note editor.',
          priority: 'low',
          color: 'slate',
          tags: ['UI-Cleanup'],
          createdAt: Date.now() - 3600000 * 20,
          updatedAt: Date.now() - 3600000 * 20
        }
      ]
    }
  ]
};

function translateWelcomeBoard(board: KanbanBoardData, targetLang: 'de' | 'en'): KanbanBoardData {
  const isTargetDe = targetLang === 'de';
  const targetTemplate = isTargetDe ? DEFAULT_BOARD_DE : DEFAULT_BOARD_EN;
  const otherTemplate = isTargetDe ? DEFAULT_BOARD_EN : DEFAULT_BOARD_DE;

  const isDemo = 
    board.id === 'board-welcome-de' || 
    board.id === 'board-welcome-en' || 
    board.id === 'board-welcome' ||
    board.id === 'board-welcome-default' ||
    board.title === DEFAULT_BOARD_DE.title || 
    board.title === DEFAULT_BOARD_EN.title;

  if (!isDemo) return board;

  const updatedColumns: KanbanColumn[] = board.columns.map((col) => {
    const otherCol = otherTemplate.columns.find(c => c.id === col.id || c.title === col.title);
    const targetCol = targetTemplate.columns.find(c => c.id === col.id || (otherCol && c.id === otherCol.id));

    const newTitle = targetCol ? targetCol.title : col.title;

    const updatedCards: KanbanCard[] = col.cards.map((card) => {
      let otherCard: KanbanCard | undefined;
      let targetCard: KanbanCard | undefined;

      for (const c of otherTemplate.columns) {
        const found = c.cards.find(cd => cd.id === card.id || cd.title === card.title);
        if (found) {
          otherCard = found;
          break;
        }
      }

      for (const c of targetTemplate.columns) {
        const found = c.cards.find(cd => cd.id === card.id || (otherCard && cd.id === otherCard.id));
        if (found) {
          targetCard = found;
          break;
        }
      }

      if (targetCard) {
        return {
          ...card,
          title: targetCard.title,
          description: targetCard.description,
          tags: targetCard.tags,
          checklists: card.checklists ? card.checklists.map((item, idx) => {
            const targetCheckItem = targetCard?.checklists?.[idx];
            return targetCheckItem ? { ...item, text: targetCheckItem.text } : item;
          }) : targetCard.checklists
        };
      }

      return card;
    });

    return {
      ...col,
      title: newTitle,
      cards: updatedCards
    };
  });

  return {
    ...board,
    title: targetTemplate.title,
    description: targetTemplate.description,
    columns: updatedColumns
  };
}

const COLUMN_COLORS: Record<string, { headerBg: string; border: string; dot: string; label: string }> = {
  slate: { headerBg: 'bg-slate-100/80', border: 'border-slate-300', dot: 'bg-slate-400', label: 'Grau' },
  amber: { headerBg: 'bg-amber-50/90', border: 'border-amber-300', dot: 'bg-amber-500', label: 'Gelb' },
  sky: { headerBg: 'bg-sky-50/90', border: 'border-sky-300', dot: 'bg-sky-500', label: 'Blau' },
  emerald: { headerBg: 'bg-emerald-50/90', border: 'border-emerald-300', dot: 'bg-emerald-500', label: 'Grün' },
  rose: { headerBg: 'bg-rose-50/90', border: 'border-rose-300', dot: 'bg-rose-500', label: 'Rot' },
  purple: { headerBg: 'bg-purple-50/90', border: 'border-purple-300', dot: 'bg-purple-500', label: 'Lila' }
};

const CARD_COLORS: Record<string, { bg: string; border: string; strip: string; label: string }> = {
  white: { bg: 'bg-white', border: 'border-slate-200/90', strip: 'bg-slate-300', label: 'Standard' },
  sky: { bg: 'bg-sky-50/60', border: 'border-sky-200', strip: 'bg-sky-400', label: 'Blau' },
  emerald: { bg: 'bg-emerald-50/60', border: 'border-emerald-200', strip: 'bg-emerald-400', label: 'Grün' },
  amber: { bg: 'bg-amber-50/60', border: 'border-amber-200', strip: 'bg-amber-400', label: 'Gelb' },
  rose: { bg: 'bg-rose-50/60', border: 'border-rose-200', strip: 'bg-rose-400', label: 'Rot' },
  purple: { bg: 'bg-purple-50/60', border: 'border-purple-200', strip: 'bg-purple-400', label: 'Lila' }
};

export default function KanbanBoard({ token, showConfirm }: KanbanBoardProps) {
  const { language } = useLanguage();
  const [boards, setBoards] = useState<KanbanBoardData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const targetLang = language === 'en' ? 'en' : 'de';
          return parsed.map((b: KanbanBoardData) => translateWelcomeBoard(b, targetLang));
        }
      }
    } catch (e) {
      console.error('Failed reading kanban boards:', e);
    }
    return [language === 'de' ? DEFAULT_BOARD_DE : DEFAULT_BOARD_EN];
  });

  // Update demo board content dynamically when user switches language
  useEffect(() => {
    setBoards((prevBoards) => {
      if (!prevBoards || prevBoards.length === 0) return prevBoards;
      const targetLang = language === 'en' ? 'en' : 'de';
      let changed = false;

      const updated = prevBoards.map((board) => {
        const translated = translateWelcomeBoard(board, targetLang);
        if (JSON.stringify(translated) !== JSON.stringify(board)) {
          changed = true;
          return translated;
        }
        return board;
      });

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed saving localized boards:', e);
        }
        return updated;
      }
      return prevBoards;
    });
  }, [language]);

  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    return boards[0]?.id || 'board-welcome';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // New Board Dialog
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardTemplate, setNewBoardTemplate] = useState<'standard' | 'simple' | 'blank'>('standard');

  // Card Detail Modal
  const [activeCard, setActiveCard] = useState<{ card: KanbanCard; columnId: string } | null>(null);

  // Column quick add state: columnId -> input value
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Add Column Form
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('slate');

  // Edit Column Title inline
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  // Push Notifications state
  const [pushPermission, setPushPermission] = useState<string>(() => getNotificationPermission());

  const handleTogglePush = async () => {
    if (pushPermission !== 'granted') {
      const perm = await requestNotificationPermission();
      setPushPermission(perm);
    } else {
      playNotificationSound();
      showSystemNotification(
        language === 'de' ? '📋 Kanban Erinnerungen aktiv! 🔔' : '📋 Kanban Reminders Active! 🔔',
        {
          body: language === 'de'
            ? 'Du wirst pünktlich an fällige Kanban-Karten erinnert.'
            : 'You will be notified on time for due Kanban tasks.'
        }
      );
    }
  };
  const [editingColumnTitle, setEditingColumnTitle] = useState('');

  // Drag and Drop state
  const [draggedCardInfo, setDraggedCardInfo] = useState<{ cardId: string; sourceColumnId: string } | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local' | 'error'>('local');
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Active board reference
  const currentBoard = useMemo(() => {
    return boards.find(b => b.id === activeBoardId) || boards[0] || (language === 'de' ? DEFAULT_BOARD_DE : DEFAULT_BOARD_EN);
  }, [boards, activeBoardId, language]);

  // Persist to local storage
  const saveBoards = (newBoards: KanbanBoardData[]) => {
    setBoards(newBoards);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBoards));
    } catch (e) {
      console.error('Failed saving boards to localStorage:', e);
    }
  };

  // Google Drive Sync
  const triggerSync = async (boardsToSync: KanbanBoardData[] = boards) => {
    if (!token) {
      setSyncStatus('local');
      return;
    }

    try {
      setSyncStatus('syncing');
      setSyncMessage(language === 'de' ? 'Synchronisiere mit Google Drive...' : 'Syncing with Google Drive...');
      const res = await executeKanbanSync(token, boardsToSync);
      if (res.localUpdated) {
        saveBoards(res.boards);
      }
      setSyncStatus('synced');
      setSyncMessage(language === 'de' ? 'Gesichert in Google Drive' : 'Saved to Google Drive');
    } catch (err) {
      console.error('Kanban Drive sync failed:', err);
      setSyncStatus('error');
      setSyncMessage(language === 'de' ? 'Sync-Fehler (Lokal gesichert)' : 'Sync error (Saved locally)');
    }
  };

  // Auto-sync on mount or token change
  useEffect(() => {
    if (token) {
      triggerSync();
    }
  }, [token]);

  // Extract all unique tags in current board
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    currentBoard.columns.forEach(col => {
      col.cards.forEach(card => {
        card.tags?.forEach(t => tags.add(t));
      });
    });
    return Array.from(tags);
  }, [currentBoard]);

  // Board stats
  const boardStats = useMemo(() => {
    let total = 0;
    let done = 0;
    currentBoard.columns.forEach(col => {
      const isDoneCol = col.id.toLowerCase().includes('done') || col.title.toLowerCase().includes('erledigt') || col.title.toLowerCase().includes('done');
      col.cards.forEach(() => {
        total++;
        if (isDoneCol) done++;
      });
    });
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [currentBoard]);

  // Quick Add Card
  const handleQuickAddCard = (columnId: string) => {
    if (!quickAddTitle.trim()) return;

    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: quickAddTitle.trim(),
      priority: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          updatedAt: Date.now(),
          columns: b.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: [...col.cards, newCard]
              };
            }
            return col;
          })
        };
      }
      return b;
    });

    saveBoards(updatedBoards);
    setQuickAddTitle('');
    setQuickAddColumnId(null);
    triggerSync(updatedBoards);
  };

  // Add Column
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;

    const newCol: KanbanColumn = {
      id: `col-${Date.now()}`,
      title: newColumnTitle.trim(),
      color: newColumnColor,
      cards: []
    };

    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          updatedAt: Date.now(),
          columns: [...b.columns, newCol]
        };
      }
      return b;
    });

    saveBoards(updatedBoards);
    setNewColumnTitle('');
    setShowAddColumn(false);
    triggerSync(updatedBoards);
  };

  // Rename Column
  const handleRenameColumn = (columnId: string) => {
    if (!editingColumnTitle.trim()) {
      setEditingColumnId(null);
      return;
    }

    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          updatedAt: Date.now(),
          columns: b.columns.map(col => {
            if (col.id === columnId) {
              return { ...col, title: editingColumnTitle.trim() };
            }
            return col;
          })
        };
      }
      return b;
    });

    saveBoards(updatedBoards);
    setEditingColumnId(null);
    triggerSync(updatedBoards);
  };

  // Delete Column
  const handleDeleteColumn = (columnId: string) => {
    const doDelete = () => {
      const updatedBoards = boards.map(b => {
        if (b.id === currentBoard.id) {
          return {
            ...b,
            updatedAt: Date.now(),
            columns: b.columns.filter(col => col.id !== columnId)
          };
        }
        return b;
      });
      saveBoards(updatedBoards);
      triggerSync(updatedBoards);
    };

    if (showConfirm) {
      showConfirm(
        language === 'de' ? 'Spalte löschen?' : 'Delete Column?',
        language === 'de' ? 'Möchtest du diese Spalte inklusive aller Karten wirklich löschen?' : 'Are you sure you want to delete this column and all its cards?',
        doDelete,
        language === 'de' ? 'Spalte löschen' : 'Delete',
        language === 'de' ? 'Abbrechen' : 'Cancel'
      );
    } else {
      if (window.confirm(language === 'de' ? 'Spalte wirklich löschen?' : 'Delete this column?')) {
        doDelete();
      }
    }
  };

  // Move Card via Drag & Drop
  const handleDragStart = (cardId: string, sourceColumnId: string) => {
    setDraggedCardInfo({ cardId, sourceColumnId });
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    if (!draggedCardInfo) return;

    const { cardId, sourceColumnId } = draggedCardInfo;
    if (sourceColumnId === targetColumnId) {
      setDraggedCardInfo(null);
      return;
    }

    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        let movedCard: KanbanCard | null = null;

        // Extract card from source
        const newColumns = b.columns.map(col => {
          if (col.id === sourceColumnId) {
            const card = col.cards.find(c => c.id === cardId);
            if (card) movedCard = card;
            return {
              ...col,
              cards: col.cards.filter(c => c.id !== cardId)
            };
          }
          return col;
        });

        // Insert card into target
        if (movedCard) {
          return {
            ...b,
            updatedAt: Date.now(),
            columns: newColumns.map(col => {
              if (col.id === targetColumnId && movedCard) {
                return {
                  ...col,
                  cards: [...col.cards, { ...movedCard, updatedAt: Date.now() }]
                };
              }
              return col;
            })
          };
        }
      }
      return b;
    });

    setDraggedCardInfo(null);
    saveBoards(updatedBoards);
    triggerSync(updatedBoards);
  };

  // Update card in modal
  const handleUpdateActiveCard = (updatedCard: KanbanCard, targetColumnId?: string) => {
    if (!activeCard) return;

    const currentColumnId = activeCard.columnId;
    const destColumnId = targetColumnId || currentColumnId;

    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        if (currentColumnId === destColumnId) {
          return {
            ...b,
            updatedAt: Date.now(),
            columns: b.columns.map(col => {
              if (col.id === currentColumnId) {
                return {
                  ...col,
                  cards: col.cards.map(c => (c.id === updatedCard.id ? updatedCard : c))
                };
              }
              return col;
            })
          };
        } else {
          // Column change
          return {
            ...b,
            updatedAt: Date.now(),
            columns: b.columns.map(col => {
              if (col.id === currentColumnId) {
                return {
                  ...col,
                  cards: col.cards.filter(c => c.id !== updatedCard.id)
                };
              }
              if (col.id === destColumnId) {
                return {
                  ...col,
                  cards: [...col.cards, updatedCard]
                };
              }
              return col;
            })
          };
        }
      }
      return b;
    });

    saveBoards(updatedBoards);
    setActiveCard({ card: updatedCard, columnId: destColumnId });
    triggerSync(updatedBoards);
  };

  // Delete card
  const handleDeleteCard = (cardId: string, columnId: string) => {
    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          updatedAt: Date.now(),
          columns: b.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: col.cards.filter(c => c.id !== cardId)
              };
            }
            return col;
          })
        };
      }
      return b;
    });

    saveBoards(updatedBoards);
    setActiveCard(null);
    triggerSync(updatedBoards);
  };

  // Duplicate card
  const handleDuplicateCard = (card: KanbanCard, columnId: string) => {
    const duplicated: KanbanCard = {
      ...card,
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${card.title} (${language === 'de' ? 'Kopie' : 'Copy'})`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedBoards = boards.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          updatedAt: Date.now(),
          columns: b.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: [...col.cards, duplicated]
              };
            }
            return col;
          })
        };
      }
      return b;
    });

    saveBoards(updatedBoards);
    setActiveCard({ card: duplicated, columnId });
    triggerSync(updatedBoards);
  };

  // Create New Board
  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) return;

    let columns: KanbanColumn[] = [];
    if (newBoardTemplate === 'standard') {
      columns = [
        { id: `col-${Date.now()}-1`, title: language === 'de' ? 'Backlog 💡' : 'Backlog 💡', color: 'slate', cards: [] },
        { id: `col-${Date.now()}-2`, title: language === 'de' ? 'Zu erledigen 📋' : 'To Do 📋', color: 'amber', cards: [] },
        { id: `col-${Date.now()}-3`, title: language === 'de' ? 'In Bearbeitung ⏳' : 'In Progress ⏳', color: 'sky', cards: [] },
        { id: `col-${Date.now()}-4`, title: language === 'de' ? 'Erledigt ✅' : 'Done ✅', color: 'emerald', cards: [] }
      ];
    } else if (newBoardTemplate === 'simple') {
      columns = [
        { id: `col-${Date.now()}-1`, title: language === 'de' ? 'Zu erledigen' : 'To Do', color: 'amber', cards: [] },
        { id: `col-${Date.now()}-2`, title: language === 'de' ? 'In Arbeit' : 'Doing', color: 'sky', cards: [] },
        { id: `col-${Date.now()}-3`, title: language === 'de' ? 'Fertig' : 'Done', color: 'emerald', cards: [] }
      ];
    }

    const newBoard: KanbanBoardData = {
      id: `board-${Date.now()}`,
      title: newBoardTitle.trim(),
      columns,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedBoards = [newBoard, ...boards];
    saveBoards(updatedBoards);
    setActiveBoardId(newBoard.id);
    setNewBoardTitle('');
    setShowNewBoardModal(false);
    triggerSync(updatedBoards);
  };

  // Delete Board
  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) {
      alert(language === 'de' ? 'Das letzte verbleibende Board kann nicht gelöscht werden.' : 'Cannot delete the last remaining board.');
      return;
    }

    const doDelete = () => {
      const remaining = boards.filter(b => b.id !== boardId);
      saveBoards(remaining);
      setActiveBoardId(remaining[0].id);
      triggerSync(remaining);
    };

    if (showConfirm) {
      showConfirm(
        language === 'de' ? 'Projekt-Board löschen?' : 'Delete Project Board?',
        language === 'de' ? 'Möchtest du dieses gesamte Kanban-Board unwiderruflich entfernen?' : 'Are you sure you want to permanently delete this entire board?',
        doDelete,
        language === 'de' ? 'Board löschen' : 'Delete',
        language === 'de' ? 'Abbrechen' : 'Cancel'
      );
    } else {
      if (window.confirm(language === 'de' ? 'Board löschen?' : 'Delete board?')) {
        doDelete();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none font-sans text-slate-800">
      {/* Top Header / Control Bar */}
      <header className="bg-white border-b border-slate-200/80 px-4 md:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-3xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[#0288D1] flex items-center justify-center shrink-0">
            <Kanban className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              {/* Board Selector Dropdown */}
              <select
                value={activeBoardId}
                onChange={(e) => setActiveBoardId(e.target.value)}
                className="font-bold text-base md:text-lg text-slate-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer pr-4 hover:text-[#0288D1] transition-colors"
              >
                {boards.map(b => (
                  <option key={b.id} value={b.id} className="text-slate-800 text-sm">
                    {b.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowNewBoardModal(true)}
                className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                title={language === 'de' ? 'Neues Projekt-Board erstellen' : 'Create new project board'}
              >
                <FolderPlus className="w-4 h-4" />
              </button>

              {boards.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteBoard(currentBoard.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title={language === 'de' ? 'Aktuelles Board löschen' : 'Delete current board'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Subtitle / Progress */}
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{boardStats.total} {language === 'de' ? 'Karten' : 'cards'}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">{boardStats.done} {language === 'de' ? 'erledigt' : 'done'} ({boardStats.percent}%)</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${boardStats.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Bar: Search, Filters, Add Column & Sync */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'de' ? 'Karten suchen...' : 'Search cards...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-36 md:w-44 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200/90 rounded-md px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">{language === 'de' ? 'Alle Prioritäten' : 'All Priorities'}</option>
            <option value="urgent">🔴 {language === 'de' ? 'Dringend' : 'Urgent'}</option>
            <option value="high">🟠 {language === 'de' ? 'Hoch' : 'High'}</option>
            <option value="medium">🟡 {language === 'de' ? 'Mittel' : 'Medium'}</option>
            <option value="low">🟢 {language === 'de' ? 'Niedrig' : 'Low'}</option>
          </select>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200/90 rounded-md px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">{language === 'de' ? 'Alle Tags' : 'All Tags'}</option>
              {allTags.map(t => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          )}

          {/* Add Column Button */}
          <button
            type="button"
            onClick={() => setShowAddColumn(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'Spalte' : 'Column'}</span>
          </button>

          {/* Push Notification Button */}
          <button
            type="button"
            onClick={handleTogglePush}
            className={`p-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 text-xs ${
              pushPermission === 'granted'
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                : pushPermission === 'denied'
                ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title={
              pushPermission === 'granted'
                ? (language === 'de' ? 'Push-Meldungen sind aktiv! 🔔 (Klicken zum Testen)' : 'Push notifications active! 🔔 (Click to test)')
                : pushPermission === 'denied'
                ? (language === 'de' ? 'Push-Meldungen im Browser blockiert ❌' : 'Push notifications blocked in browser ❌')
                : (language === 'de' ? 'Push-Meldungen aktivieren 🔔' : 'Enable push notifications 🔔')
            }
          >
            <Bell className={`w-3.5 h-3.5 ${pushPermission === 'granted' ? 'text-amber-500 fill-amber-500/20' : ''}`} />
          </button>

          {/* Sync status indicator */}
          <button
            type="button"
            onClick={() => triggerSync()}
            className={`p-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 text-xs ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : syncStatus === 'syncing'
                ? 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse'
                : syncStatus === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={syncMessage || (language === 'de' ? 'Jetzt mit Google Drive abgleichen' : 'Sync now with Google Drive')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Kanban Board Columns Scroll Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6 flex items-start gap-4">
        {currentBoard.columns.map((column) => {
          const colColor = COLUMN_COLORS[column.color || 'slate'] || COLUMN_COLORS.slate;

          // Filter cards in column
          const filteredCards = column.cards.filter(card => {
            if (priorityFilter !== 'all' && card.priority !== priorityFilter) return false;
            if (tagFilter !== 'all' && (!card.tags || !card.tags.includes(tagFilter))) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const matchTitle = card.title.toLowerCase().includes(q);
              const matchDesc = card.description?.toLowerCase().includes(q);
              const matchTag = card.tags?.some(t => t.toLowerCase().includes(q));
              if (!matchTitle && !matchDesc && !matchTag) return false;
            }
            return true;
          });

          const isOver = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`w-72 md:w-80 shrink-0 bg-slate-50/90 border rounded-xl flex flex-col max-h-full shadow-3xs transition-all ${
                isOver ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40' : 'border-slate-200/90'
              }`}
            >
              {/* Column Header */}
              <div className={`p-3 border-b border-slate-200/80 rounded-t-xl flex items-center justify-between ${colColor.headerBg}`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colColor.dot}`} />
                  {editingColumnId === column.id ? (
                    <input
                      type="text"
                      value={editingColumnTitle}
                      onChange={(e) => setEditingColumnTitle(e.target.value)}
                      onBlur={() => handleRenameColumn(column.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(column.id)}
                      autoFocus
                      className="text-xs font-bold text-slate-800 bg-white border border-sky-400 rounded px-1.5 py-0.5 w-full outline-none"
                    />
                  ) : (
                    <h3
                      onClick={() => {
                        setEditingColumnId(column.id);
                        setEditingColumnTitle(column.title);
                      }}
                      className="text-xs font-bold text-slate-800 truncate cursor-pointer hover:text-sky-600 transition-colors"
                      title={language === 'de' ? 'Klicken zum Umbenennen' : 'Click to rename'}
                    >
                      {column.title}
                    </h3>
                  )}
                  <span className="text-[11px] font-semibold text-slate-400 bg-white/80 px-1.5 py-0.5 rounded-full border border-slate-200/60 shrink-0">
                    {column.cards.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddColumnId(column.id);
                      setQuickAddTitle('');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-white/80 transition-colors"
                    title={language === 'de' ? 'Karte hinzufügen' : 'Add card'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(column.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white/80 transition-colors"
                    title={language === 'de' ? 'Spalte löschen' : 'Delete column'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Quick Add Inline Form */}
              {quickAddColumnId === column.id && (
                <div className="p-2.5 bg-white border-b border-slate-200/70 space-y-2 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="text"
                    placeholder={language === 'de' ? 'Titel der neuen Aufgabe...' : 'Task title...'}
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAddCard(column.id)}
                    autoFocus
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickAddColumnId(null)}
                      className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded"
                    >
                      {language === 'de' ? 'Abbrechen' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddCard(column.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded shadow-3xs"
                    >
                      {language === 'de' ? 'Hinzufügen' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {/* Card List Area */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {filteredCards.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 select-none">
                    {language === 'de' ? 'Keine Aufgaben in dieser Spalte' : 'No tasks in this column'}
                  </div>
                ) : (
                  filteredCards.map((card) => {
                    const cardConfig = CARD_COLORS[card.color || 'white'] || CARD_COLORS.white;
                    const totalCheck = card.checklists?.length || 0;
                    const doneCheck = card.checklists?.filter(c => c.completed).length || 0;

                    const isOverdue = card.dueDate && new Date(card.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card.id, column.id)}
                        onClick={() => setActiveCard({ card, columnId: column.id })}
                        className={`group p-3 rounded-lg border shadow-3xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing relative ${cardConfig.bg} ${cardConfig.border} hover:border-slate-300`}
                      >
                        {/* Top Color Accent Strip */}
                        {card.color && card.color !== 'white' && (
                          <div className={`absolute top-0 left-3 right-3 h-0.5 rounded-t-sm ${cardConfig.strip}`} />
                        )}

                        {/* Card Header: Priority badge & Due Date */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          {card.priority && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                              card.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-700'
                                : card.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : card.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {card.priority === 'urgent'
                                ? (language === 'de' ? 'Dringend' : 'Urgent')
                                : card.priority === 'high'
                                ? (language === 'de' ? 'Hoch' : 'High')
                                : card.priority === 'medium'
                                ? (language === 'de' ? 'Mittel' : 'Medium')
                                : (language === 'de' ? 'Niedrig' : 'Low')}
                            </span>
                          )}

                          {card.dueDate && (
                            <span className={`flex items-center gap-1 text-[11px] font-medium ml-auto ${
                              isOverdue ? 'text-rose-600' : 'text-slate-400'
                            }`}>
                              <CalendarIcon className="w-3 h-3" />
                              <span>{card.dueDate}</span>
                              {card.dueTime && (
                                <span className="flex items-center gap-0.5 text-sky-700 font-mono text-[10px] ml-0.5 bg-sky-50 px-1 py-0.2 rounded border border-sky-150">
                                  <Clock className="w-2.5 h-2.5" />
                                  {card.dueTime}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-800 leading-snug break-words">
                          {card.title}
                        </h4>

                        {/* Description snippet */}
                        {card.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {card.description}
                          </p>
                        )}

                        {/* Tags */}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium text-slate-600 bg-slate-100/90 border border-slate-200/80 px-1.5 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Checklists Summary Footer */}
                        {totalCheck > 0 && (
                          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <CheckSquare className={`w-3 h-3 ${doneCheck === totalCheck ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={doneCheck === totalCheck ? 'text-emerald-600 font-semibold' : ''}>
                              {doneCheck}/{totalCheck}
                            </span>
                            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden ml-1">
                              <div
                                className={`h-full ${doneCheck === totalCheck ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                style={{ width: `${(doneCheck / totalCheck) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Card footer trigger */}
              <div className="p-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddColumnId(column.id);
                    setQuickAddTitle('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-sky-600 hover:bg-white rounded-lg border border-dashed border-slate-300 hover:border-sky-400 transition-all cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'de' ? 'Karte hinzufügen' : 'Add card'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Column Card Prompt */}
        <div className="w-72 md:w-80 shrink-0">
          {showAddColumn ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3 animate-in fade-in zoom-in-95">
              <h4 className="text-xs font-bold text-slate-800">
                {language === 'de' ? 'Neue Spalte anlegen' : 'Create new column'}
              </h4>
              <input
                type="text"
                placeholder={language === 'de' ? 'Spaltenname (z. B. Überprüfung)' : 'Column name (e.g. Review)'}
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                autoFocus
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />

              {/* Color choices */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {language === 'de' ? 'Akzentfarbe' : 'Accent Color'}
                </label>
                <div className="flex gap-2">
                  {Object.keys(COLUMN_COLORS).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewColumnColor(key)}
                      className={`w-5 h-5 rounded-full ${COLUMN_COLORS[key].dot} cursor-pointer transition-transform ${
                        newColumnColor === key ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' : 'hover:scale-105 opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddColumn(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-md"
                >
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-3xs"
                >
                  {language === 'de' ? 'Erstellen' : 'Create'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddColumn(true)}
              className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-sky-600 transition-all cursor-pointer font-medium text-xs"
            >
              <Plus className="w-5 h-5" />
              <span>{language === 'de' ? '+ Neue Spalte hinzufügen' : '+ Add new column'}</span>
            </button>
          )}
        </div>
      </main>

      {/* CARD DETAIL MODAL */}
      {activeCard && (
        <CardDetailModal
          card={activeCard.card}
          columnId={activeCard.columnId}
          columns={currentBoard.columns}
          onClose={() => setActiveCard(null)}
          onUpdate={handleUpdateActiveCard}
          onDelete={() => handleDeleteCard(activeCard.card.id, activeCard.columnId)}
          onDuplicate={() => handleDuplicateCard(activeCard.card, activeCard.columnId)}
          language={language}
        />
      )}

      {/* NEW BOARD MODAL */}
      {showNewBoardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-sky-600" />
                <span>{language === 'de' ? 'Neues Projekt-Board erstellen' : 'Create new project board'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBoardModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'de' ? 'Projektname' : 'Project Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'de' ? 'z. B. Marketing Kampagne Q4' : 'e.g. Marketing Campaign Q4'}
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                autoFocus
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {language === 'de' ? 'Vorlage / Spaltenstruktur' : 'Template / Column Structure'}
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-sky-400 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="board-template"
                    checked={newBoardTemplate === 'standard'}
                    onChange={() => setNewBoardTemplate('standard')}
                    className="text-sky-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold block text-slate-800">
                      {language === 'de' ? 'Standard Projekt (4 Spalten)' : 'Standard Project (4 columns)'}
                    </span>
                    <span className="text-slate-500 text-[11px]">Backlog, Zu erledigen, In Bearbeitung, Erledigt</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-sky-400 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="board-template"
                    checked={newBoardTemplate === 'simple'}
                    onChange={() => setNewBoardTemplate('simple')}
                    className="text-sky-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold block text-slate-800">
                      {language === 'de' ? 'Einfaches Kanban (3 Spalten)' : 'Simple Kanban (3 columns)'}
                    </span>
                    <span className="text-slate-500 text-[11px]">To Do, In Progress, Done</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-sky-400 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="board-template"
                    checked={newBoardTemplate === 'blank'}
                    onChange={() => setNewBoardTemplate('blank')}
                    className="text-sky-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold block text-slate-800">
                      {language === 'de' ? 'Leeres Board' : 'Blank Board'}
                    </span>
                    <span className="text-slate-500 text-[11px]">{language === 'de' ? 'Eigene Spalten frei definieren' : 'Define your own columns freely'}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBoardModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateBoard}
                disabled={!newBoardTitle.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-md shadow-3xs"
              >
                {language === 'de' ? 'Board anlegen' : 'Create Board'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Card Detail Modal Component
interface CardDetailModalProps {
  card: KanbanCard;
  columnId: string;
  columns: KanbanColumn[];
  onClose: () => void;
  onUpdate: (updated: KanbanCard, newColumnId?: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  language: string;
}

function CardDetailModal({
  card,
  columnId,
  columns,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  language
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [color, setColor] = useState(card.color || 'white');
  const [selectedColumnId, setSelectedColumnId] = useState(columnId);
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [dueTime, setDueTime] = useState(card.dueTime || '');
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Checklists
  const [checklists, setChecklists] = useState(card.checklists || []);
  const [newChecklistText, setNewChecklistText] = useState('');

  const handleSave = () => {
    onUpdate(
      {
        ...card,
        title: title.trim() || (language === 'de' ? 'Unbenannte Aufgabe' : 'Untitled Task'),
        description: description.trim(),
        priority,
        color,
        dueDate: dueDate || undefined,
        dueTime: (dueDate && dueTime) ? dueTime : undefined,
        tags,
        checklists,
        updatedAt: Date.now()
      },
      selectedColumnId
    );
    onClose();
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklists([
      ...checklists,
      { id: `c-${Date.now()}`, text: newChecklistText.trim(), completed: false }
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklists(
      checklists.map(c => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleDeleteChecklist = (id: string) => {
    setChecklists(checklists.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'de' ? 'Spalte' : 'Column'}:
            </span>
            <select
              value={selectedColumnId}
              onChange={(e) => setSelectedColumnId(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-sky-500"
            >
              {columns.map(col => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded"
              title={language === 'de' ? 'Aufgabe duplizieren' : 'Duplicate card'}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title={language === 'de' ? 'Aufgabe löschen' : 'Delete card'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {language === 'de' ? 'Kartentitel' : 'Card Title'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Priority & Due Date & Alarm Time & Color Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'de' ? 'Priorität' : 'Priority'}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="low">🟢 {language === 'de' ? 'Niedrig' : 'Low'}</option>
              <option value="medium">🟡 {language === 'de' ? 'Mittel' : 'Medium'}</option>
              <option value="high">🟠 {language === 'de' ? 'Hoch' : 'High'}</option>
              <option value="urgent">🔴 {language === 'de' ? 'Dringend' : 'Urgent'}</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'de' ? 'Fälligkeitsdatum' : 'Due Date'}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{language === 'de' ? 'Uhrzeit (Alarm)' : 'Time (Alarm)'}</span>
              <Bell className="w-3 h-3 text-amber-500" />
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'de' ? 'Karten-Farbe' : 'Card Color'}
            </label>
            <div className="flex gap-1.5 mt-1">
              {Object.keys(CARD_COLORS).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${
                    key === 'white' ? 'bg-white border-slate-300' : CARD_COLORS[key].strip
                  } ${color === key ? 'ring-2 ring-sky-500 scale-110' : 'hover:scale-105 opacity-80'}`}
                  title={CARD_COLORS[key].label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {language === 'de' ? 'Beschreibung & Notizen' : 'Description & Notes'}
          </label>
          <textarea
            rows={3}
            placeholder={language === 'de' ? 'Details, Spezifikationen oder Links hinzufügen...' : 'Add details, specs or links...'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-y"
          />
        </div>

        {/* Checklist Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>{language === 'de' ? 'Checkliste / Teilaufgaben' : 'Checklist / Subtasks'}</span>
            </label>
            {checklists.length > 0 && (
              <span className="text-[11px] text-slate-500 font-medium">
                {checklists.filter(c => c.completed).length}/{checklists.length} {language === 'de' ? 'erledigt' : 'completed'}
              </span>
            )}
          </div>

          <div className="space-y-1.5 mb-2">
            {checklists.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 group transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleToggleChecklist(item.id)}
                  className="text-slate-400 hover:text-sky-600"
                >
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span className={`text-xs flex-1 ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteChecklist(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={language === 'de' ? 'Teilaufgabe hinzufügen...' : 'Add checklist item...'}
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleAddChecklistItem}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              {language === 'de' ? 'Hinzufügen' : 'Add'}
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Tags</span>
          </label>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={language === 'de' ? 'Neuer Tag (Enter)...' : 'New tag (Enter)...'}
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="w-48 text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              + Tag
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {language === 'de' ? 'Abbrechen' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-3xs hover:shadow-2xs transition-all"
          >
            {language === 'de' ? 'Änderungen speichern' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
