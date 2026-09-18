/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Star, 
  Calendar, 
  ListTodo, 
  FolderPlus, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  ArrowUpDown, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  FileText,
  Clock,
  X,
  Repeat,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { Task, TaskList, SubTask } from '../types';
import { 
  fetchGoogleTaskLists, 
  createGoogleTaskList, 
  updateGoogleTaskList, 
  deleteGoogleTaskList,
  fetchGoogleTasksInList,
  insertGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  clearCompletedGoogleTasks,
  GoogleApiTaskList,
  GoogleApiTask
} from '../lib/googleTasksClient';

// Preset emojis for custom task lists
const PRESET_EMOJIS = [
  // Arbeit, Lernen & Fokus
  '📋', '☑️', '💼', '📝', '📑', '📊', '📂', '📁', '💻', '🖥️', '✉️', '📞', '🗓️', '📅', '📌', '🔍', '💡', '🧠', '🎓', '📚', '✏️', '🏫', '🔬', '📐',
  
  // Ziele, Prioritäten & Finanzen
  '🎯', '🌟', '🚀', '🔥', '⚡', '🏆', '👑', '🥇', '📈', '📉', '💰', '💶', '💵', '💳', '💎', '🔑', '🔒', '🔓', '🛡️',
  
  // Haus, Familie & Alltag
  '🏠', '🏡', '🛋️', '🛌', '🧹', '🧼', '🧺', '🔧', '🔨', '🛠️', '🚗', '🛵', '🚲', '🛒', '🛍️', '📦', '📬', '🪴', '🌱', '🌸', '🐾', '🐶', '🐱',
  
  // Hobbys, Kreativität & Freizeit
  '🎨', '🎵', '🎸', '🎹', '📷', '🎬', '🎮', '🧩', '🧶', '🧵', '🎭', '🎪', '🎲', '🎳', '🛹', 
  
  // Gesundheit, Sport & Wellness
  '🧘', '🏋️', '🏃', '🚴', '🏊', '🧗', '🏄', '🏌️', '⚽', '🏀', '🍎', '🥦', '🍕', '☕', '🥤', '🍷', '🍺', '🧴', '🛀', '💤',
  
  // Reisen & Abenteuer
  '✈️', '⛵', '🗺️', '🧭', '⛰️', '🏕️', '⛺', '🎒', '🧳', '🌴', '🏖️', '🌍', '🗼', '🏰',
  
  // Symbole & Stimmungen
  '💬', '📣', '🎉', '🎁', '🎈', '❤️', '🍀', '✨', '🌈', '☀️', '🌙', '⭐', '🔔', '📢', '⏱️', '⌛'
];

// Helper to extract any leading emoji or symbol from text
const extractLeadingEmoji = (text: string): { emoji: string; cleanText: string } => {
  const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F191}-\u{1F251}☑️]+)\s*/u;
  const match = text.match(emojiRegex);
  if (match) {
    const emoji = match[1];
    const cleanText = text.slice(match[0].length);
    return { emoji, cleanText };
  }
  
  for (const sym of PRESET_EMOJIS) {
    if (text.startsWith(sym)) {
      return { emoji: sym, cleanText: text.slice(sym.length).trim() };
    }
  }
  
  return { emoji: '', cleanText: text };
};

// Returns resolved icon & display name
const getListDetails = (list: TaskList): { icon: string; name: string } => {
  let icon = list.icon || '';
  let name = list.name;
  
  if (!icon) {
    const extracted = extractLeadingEmoji(name);
    if (extracted.emoji) {
      icon = extracted.emoji;
      name = extracted.cleanText;
    } else {
      icon = '📋';
    }
  } else {
    const extracted = extractLeadingEmoji(name);
    if (extracted.emoji === icon) {
      name = extracted.cleanText;
    }
  }
  
  return { icon, name };
};

// Metadata parsing helper: allows star, recurrence, and dueTime to sync seamlessly with Google Tasks notes
interface ParsedNotes {
  cleanNotes: string;
  starred: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueTime?: string;
}

const parseGoogleTaskNotes = (rawNotes?: string): ParsedNotes => {
  if (!rawNotes) {
    return { cleanNotes: '', starred: false };
  }

  let text = rawNotes;
  let starred = false;
  let recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined = undefined;
  let dueTime: string | undefined = undefined;

  // Check metadata block [DriveDeck: starred=true, recurrence=daily, time=14:30]
  const metaMatch = text.match(/\[DriveDeck:\s*([^\]]+)\]/i);
  if (metaMatch) {
    const parts = metaMatch[1].split(',').map(s => s.trim());
    for (const part of parts) {
      const [k, v] = part.split('=').map(s => s.trim().toLowerCase());
      if (k === 'starred' && v === 'true') starred = true;
      if (k === 'recurrence' && ['daily', 'weekly', 'monthly', 'yearly'].includes(v)) {
        recurrence = v as any;
      }
      if (k === 'time' && /^\d{1,2}:\d{2}$/.test(v)) {
        dueTime = v;
      }
    }
    // Remove meta tag from clean displayed text
    text = text.replace(/\[DriveDeck:\s*[^\]]+\]\n?/i, '').trim();
  }

  // Also support simple legacy hashtag markers if present
  if (text.includes('#starred') || text.includes('⭐')) {
    starred = true;
  }

  return { cleanNotes: text, starred, recurrence, dueTime };
};

const serializeGoogleTaskNotes = (
  cleanNotes: string, 
  starred: boolean, 
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly', 
  dueTime?: string
): string => {
  const metaParts: string[] = [];
  if (starred) metaParts.push('starred=true');
  if (recurrence && recurrence !== ('none' as any)) metaParts.push(`recurrence=${recurrence}`);
  if (dueTime) metaParts.push(`time=${dueTime}`);

  const trimmed = cleanNotes.trim();
  if (metaParts.length === 0) {
    return trimmed;
  }

  const metaBlock = `[DriveDeck: ${metaParts.join(', ')}]`;
  return trimmed ? `${trimmed}\n\n${metaBlock}` : metaBlock;
};

// Map Google API task list item to TaskList
const mapApiTaskListToLocal = (apiList: GoogleApiTaskList): TaskList => {
  const extracted = extractLeadingEmoji(apiList.title);
  return {
    id: apiList.id,
    name: apiList.title,
    icon: extracted.emoji || '📋',
    createdAt: apiList.updated ? new Date(apiList.updated).getTime() : Date.now()
  };
};

// Map Google API task items to Task array (parent tasks with hierarchical subtasks)
const mapApiTasksToLocal = (apiTasks: GoogleApiTask[], listId: string): Task[] => {
  // First pass: identify parents and subtasks (parent points to parent task ID)
  const parents: GoogleApiTask[] = [];
  const subtaskMap = new Map<string, GoogleApiTask[]>();

  for (const item of apiTasks) {
    if (item.deleted || item.hidden) continue;
    if (item.parent) {
      const subs = subtaskMap.get(item.parent) || [];
      subs.push(item);
      subtaskMap.set(item.parent, subs);
    } else {
      parents.push(item);
    }
  }

  return parents.map(item => {
    const parsed = parseGoogleTaskNotes(item.notes);
    const subs = (subtaskMap.get(item.id) || []).map(sub => ({
      id: sub.id,
      title: sub.title || 'Unteraufgabe',
      completed: sub.status === 'completed',
      createdAt: sub.updated ? new Date(sub.updated).getTime() : Date.now()
    }));

    let dueDate: string | undefined = undefined;
    if (item.due) {
      try {
        dueDate = item.due.split('T')[0];
      } catch {}
    }

    return {
      id: item.id,
      listId,
      title: item.title || '',
      notes: parsed.cleanNotes,
      completed: item.status === 'completed',
      completedAt: item.completed ? new Date(item.completed).getTime() : undefined,
      dueDate,
      dueTime: parsed.dueTime,
      starred: parsed.starred,
      recurrence: parsed.recurrence,
      subtasks: subs,
      createdAt: item.updated ? new Date(item.updated).getTime() : Date.now(),
      updatedAt: item.updated ? new Date(item.updated).getTime() : Date.now()
    };
  });
};

interface GoogleTasksProps {
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

export default function GoogleTasks({ token: propToken, showConfirm }: GoogleTasksProps = {}) {
  // 1. Core State
  const [lists, setLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');

  // Live Token & API Sync state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Push Notifications state
  const [pushPermission, setPushPermission] = useState<string>(() => {
    try {
      return typeof Notification !== 'undefined' ? Notification.permission : 'default';
    } catch {
      return 'default';
    }
  });
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('drivedeck_notified_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // 2. UI Control State
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📋');
  const [showAddListForm, setShowAddListForm] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [editingListIcon, setEditingListIcon] = useState('📋');
  
  // Task Input UI state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskStarred, setNewTaskStarred] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'manual' | 'date' | 'starred'>('manual');
  
  // Detailed Edit Drawer/Modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailNotes, setDetailNotes] = useState('');
  const [detailDueDate, setDetailDueDate] = useState('');
  const [detailDueTime, setDetailDueTime] = useState('');
  const [detailStarred, setDetailStarred] = useState(false);
  const [detailRecurrence, setDetailRecurrence] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'none'>('none');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Toast notifications (In-app Alerts)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'info' | 'star' }>>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('drivedeck_tasks_sound');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Collapsed status for completed section
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  // Expanding subtasks state mapping: { [taskId]: boolean }
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  // Resolve active token (prop or sessionStorage)
  useEffect(() => {
    const resolved = propToken || sessionStorage.getItem('drive_access_token');
    setAuthToken(resolved);
  }, [propToken]);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'info' | 'star' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  // Sound synthesis chime
  const synthCompleteChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const masterVolume = ctx.createGain();
      masterVolume.gain.setValueAtTime(0.08, ctx.currentTime);
      masterVolume.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
      osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.18); // E6
      
      gain1.gain.setValueAtTime(0.8, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc1.connect(gain1);
      gain1.connect(masterVolume);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2093.00, ctx.currentTime); // C7 (Harmonic)
      
      gain2.gain.setValueAtTime(0.5, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc2.connect(gain2);
      gain2.connect(masterVolume);

      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (err) {
      console.warn('Could not play sound effect:', err);
    }
  };

  // Helper to persist tasks to storage
  const saveTasksToStorage = (updater: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('drivedeck_tasks_data', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving tasks to localStorage:', err);
      }
      return next;
    });
  };

  const saveListsToStorage = (updatedLists: TaskList[]) => {
    try {
      localStorage.setItem('drivedeck_task_lists', JSON.stringify(updatedLists));
    } catch (error) {
      console.error('Failed to store lists to localStorage:', error);
    }
  };

  // 3. Initial Load from LocalStorage for instant render, then live Google Tasks API fetch
  useEffect(() => {
    // 3a. Read cached lists & tasks first
    let cachedLists: TaskList[] = [];
    let cachedTasks: Task[] = [];
    try {
      const storedLists = localStorage.getItem('drivedeck_task_lists');
      if (storedLists) {
        cachedLists = JSON.parse(storedLists);
        setLists(cachedLists);
      }
      const storedTasks = localStorage.getItem('drivedeck_tasks_data');
      if (storedTasks) {
        cachedTasks = JSON.parse(storedTasks);
        setTasks(cachedTasks);
      }
      const lastActiveListId = localStorage.getItem('drivedeck_last_active_task_list');
      if (lastActiveListId && cachedLists.some(l => l.id === lastActiveListId)) {
        setActiveListId(lastActiveListId);
      } else if (cachedLists.length > 0) {
        setActiveListId(cachedLists[0].id);
      }
    } catch (e) {
      console.warn('Error reading cached tasks:', e);
    }

    // 3b. If no token, provide default offline seed if completely empty
    if (!authToken) {
      if (cachedLists.length === 0) {
        const seedLists: TaskList[] = [
          { id: 'list-default', name: '☑️ Meine Aufgaben', icon: '☑️', createdAt: Date.now() },
          { id: 'list-work', name: '💼 Arbeit & Fokus', icon: '💼', createdAt: Date.now() - 10000 },
          { id: 'list-private', name: '🏠 Privat', icon: '🏠', createdAt: Date.now() - 20000 }
        ];
        setLists(seedLists);
        saveListsToStorage(seedLists);
        setActiveListId('list-default');
      }
      setIsInitialLoading(false);
      return;
    }

    // 3c. If token exists, fetch live lists from Google Tasks API
    loadGoogleTasksData(authToken);
  }, [authToken]);

  // Main Google Tasks Fetch Function
  const loadGoogleTasksData = async (token: string) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const apiLists = await fetchGoogleTaskLists(token);
      
      if (!apiLists || apiLists.length === 0) {
        // Create initial default list on Google Tasks if user has none
        const defaultCreated = await createGoogleTaskList(token, '☑️ Meine Aufgaben');
        apiLists.push(defaultCreated);
      }

      const mappedLists: TaskList[] = apiLists.map(mapApiTaskListToLocal);
      setLists(mappedLists);
      saveListsToStorage(mappedLists);

      // Determine active list
      let targetListId = activeListId;
      const savedLastId = localStorage.getItem('drivedeck_last_active_task_list');
      if (savedLastId && mappedLists.some(l => l.id === savedLastId)) {
        targetListId = savedLastId;
      } else if (!mappedLists.some(l => l.id === targetListId)) {
        targetListId = mappedLists[0]?.id || '';
      }
      setActiveListId(targetListId);

      // Fetch tasks for all lists in parallel
      const allTasksPromises = mappedLists.map(async (l) => {
        try {
          const apiTasks = await fetchGoogleTasksInList(token, l.id, true, true);
          return mapApiTasksToLocal(apiTasks, l.id);
        } catch (err) {
          console.warn(`Could not load tasks for list ${l.id}:`, err);
          return [];
        }
      });

      const taskArrays = await Promise.all(allTasksPromises);
      const combinedTasks = taskArrays.flat();

      setTasks(combinedTasks);
      saveTasksToStorage(combinedTasks);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Google Tasks API error:', err);
      setSyncStatus('error');
      setSyncError(err?.message || 'Google Tasks konnte nicht geladen werden.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (authToken) {
      loadGoogleTasksData(authToken);
      showToast('Synchronisiere mit Google Tasks...', 'info');
    } else {
      showToast('Offline-Modus: Daten lokal gesichert.', 'info');
    }
  };

  // Notification Reminder Clock (checks due tasks every 15s)
  useEffect(() => {
    const checkDueReminders = () => {
      const now = new Date();
      const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      tasks.forEach(task => {
        if (task.completed || !task.dueDate || !task.dueTime) return;

        if (task.dueDate === dateStr && task.dueTime === timeStr) {
          if (notifiedTaskIds.includes(task.id)) return;

          setNotifiedTaskIds(prev => {
            const next = [...prev, task.id];
            try {
              localStorage.setItem('drivedeck_notified_tasks', JSON.stringify(next));
            } catch {}
            return next;
          });

          synthCompleteChime();

          const newToast = {
            id: 'reminder-' + Date.now() + '-' + task.id,
            message: `⏰ Fällig: "${task.title}"`,
            type: 'info' as const
          };
          setToasts(prev => [newToast, ...prev]);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification("Google Tasks Erinnerung! ⏰", {
                body: `Die Aufgabe "${task.title}" ist jetzt fällig.${task.notes ? '\n\nNotizen: ' + task.notes : ''}`,
                icon: '/favicon.ico'
              });
            } catch (err) {
              console.error('Browser notice failure:', err);
            }
          }
        }
      });
    };

    checkDueReminders();
    const clockInterval = setInterval(checkDueReminders, 15000);
    return () => clearInterval(clockInterval);
  }, [tasks, notifiedTaskIds, soundEnabled]);

  // Request notification permission flow
  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Browser-Push-Benachrichtigungen werden von diesem Browser nicht unterstützt.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        showToast('🔔 Push-Benachrichtigungen erfolgreich aktiviert!', 'success');
        try {
          new Notification("Aktiviert! 🔔", {
            body: "Du wirst ab jetzt pünktlich an fällige Google Tasks erinnert.",
            icon: '/favicon.ico'
          });
        } catch {}
        synthCompleteChime();
      } else {
        showToast('❌ Blockiert! Bitte erlaube Benachrichtigungen im Browser.', 'info');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  // Toggle sound chime setting
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('drivedeck_tasks_sound', String(next));
    } catch {}
    if (next) synthCompleteChime();
    showToast(next ? 'Signalton aktiviert 🔔' : 'Signalton stummgeschaltet 🔕', 'info');
  };

  // Format dates for display
  const formatHumanDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(d);
      target.setHours(0,0,0,0);
      const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let dateLabel = '';
      if (diffDays === 0) dateLabel = 'Heute';
      else if (diffDays === 1) dateLabel = 'Morgen';
      else if (diffDays === -1) dateLabel = 'Gestern';
      else dateLabel = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      return timeStr ? `${dateLabel}, ${timeStr} Uhr` : dateLabel;
    } catch {
      return dateStr;
    }
  };

  // 4. List Operations (Create, Update, Delete) with Google Tasks API
  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const titleWithIcon = `${newListIcon} ${newListName.trim()}`.trim();
    
    // Optimistic local state
    const tempId = 'list-' + Date.now();
    const optimisticList: TaskList = {
      id: tempId,
      name: titleWithIcon,
      icon: newListIcon,
      createdAt: Date.now()
    };
    
    const updated = [...lists, optimisticList];
    setLists(updated);
    saveListsToStorage(updated);
    setActiveListId(tempId);
    setNewListName('');
    setNewListIcon('📋');
    setShowAddListForm(false);
    showToast(`Neue Liste "${newListName.trim()}" wird erstellt...`, 'info');

    // Call Google Tasks API if token available
    if (authToken) {
      try {
        setSyncStatus('syncing');
        const apiCreated = await createGoogleTaskList(authToken, titleWithIcon);
        // Replace temp list ID with Google ID
        setLists(prev => prev.map(l => l.id === tempId ? mapApiTaskListToLocal(apiCreated) : l));
        setActiveListId(apiCreated.id);
        saveListsToStorage(lists.map(l => l.id === tempId ? mapApiTaskListToLocal(apiCreated) : l));
        setSyncStatus('synced');
        showToast(`Liste "${newListName.trim()}" in Google Tasks angelegt! ✅`, 'success');
      } catch (err: any) {
        console.error('Error creating Google Task list:', err);
        setSyncStatus('error');
        showToast('Fehler beim Erstellen auf Google Tasks.', 'info');
      }
    }
  };

  const handleUpdateList = async () => {
    if (!editingListId || !editingListName.trim()) return;
    const titleWithIcon = `${editingListIcon} ${editingListName.trim()}`.trim();
    
    const targetId = editingListId;
    const updated = lists.map(l => l.id === targetId ? { ...l, name: titleWithIcon, icon: editingListIcon } : l);
    setLists(updated);
    saveListsToStorage(updated);
    setEditingListId(null);
    setEditingListName('');
    showToast('Liste wird aktualisiert...', 'info');

    if (authToken && !targetId.startsWith('list-default')) {
      try {
        setSyncStatus('syncing');
        await updateGoogleTaskList(authToken, targetId, titleWithIcon);
        setSyncStatus('synced');
        showToast('Liste in Google Tasks aktualisiert! ✅', 'success');
      } catch (err) {
        console.error('Error updating Google Task list:', err);
        setSyncStatus('error');
      }
    }
  };

  const handleDeleteList = (id: string, name: string) => {
    if (lists.length <= 1) {
      showToast('Du musst mindestens eine Aufgabenliste behalten.', 'info');
      return;
    }

    const performDelete = async () => {
      const remainingLists = lists.filter(l => l.id !== id);
      setLists(remainingLists);
      saveListsToStorage(remainingLists);

      // Remove associated tasks locally
      saveTasksToStorage(prev => prev.filter(t => t.listId !== id));

      if (activeListId === id) {
        setActiveListId(remainingLists[0].id);
      }
      showToast(`Liste "${name}" gelöscht.`, 'info');

      if (authToken && !id.startsWith('list-default')) {
        try {
          setSyncStatus('syncing');
          await deleteGoogleTaskList(authToken, id);
          setSyncStatus('synced');
        } catch (err) {
          console.error('Error deleting Google Task list:', err);
          setSyncStatus('error');
        }
      }
    };

    const msg = `Möchtest du die Liste "${name}" und alle darin enthaltenen Aufgaben wirklich unwiderruflich löschen?`;
    if (showConfirm) {
      showConfirm('Liste löschen', msg, performDelete, 'Löschen', 'Abbrechen');
    } else if (window.confirm(msg)) {
      performDelete();
    }
  };

  // 5. Task Operations (Add, Toggle, Delete, Save Details) with Google Tasks API
  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const title = newTaskTitle.trim();
    const tempId = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const notesPayload = serializeGoogleTaskNotes('', newTaskStarred, undefined, newTaskDueTime);

    const newTask: Task = {
      id: tempId,
      listId: activeListId,
      title,
      notes: '',
      completed: false,
      dueDate: newTaskDueDate || undefined,
      dueTime: newTaskDueTime || undefined,
      starred: newTaskStarred,
      subtasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Optimistic local add
    saveTasksToStorage(prev => [newTask, ...prev]);
    showToast(`"${newTask.title}" hinzugefügt.`, newTask.starred ? 'star' : 'success');

    // Clear form
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskDueTime('');
    setNewTaskStarred(false);

    // Call Google Tasks API
    if (authToken && activeListId) {
      try {
        setSyncStatus('syncing');
        const dueRfc = newTaskDueDate ? new Date(`${newTaskDueDate}T00:00:00.000Z`).toISOString() : undefined;
        const apiTask = await insertGoogleTask(authToken, activeListId, {
          title,
          notes: notesPayload || undefined,
          due: dueRfc,
          status: 'needsAction'
        });

        // Replace optimistic task with API task
        saveTasksToStorage(prev => prev.map(t => t.id === tempId ? {
          ...t,
          id: apiTask.id,
          updatedAt: apiTask.updated ? new Date(apiTask.updated).getTime() : Date.now()
        } : t));

        setSyncStatus('synced');
      } catch (err) {
        console.error('Error creating Google Task:', err);
        setSyncStatus('error');
      }
    }
  };

  // Toggle task completion
  const handleToggleTaskCompleted = async (id: string, currentStatus: boolean) => {
    const completed = !currentStatus;
    if (completed) synthCompleteChime();

    // Find current task
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    // Recurrence handling
    let toastMsg = completed ? 'Aufgabe als erledigt markiert! 👍' : 'Aufgabe wieder geöffnet.';
    
    saveTasksToStorage(prev => {
      if (completed && taskToToggle.recurrence) {
        const nextDate = getNextOccurrence(taskToToggle.dueDate || '', taskToToggle.recurrence);
        
        const completedClone: Task = {
          ...taskToToggle,
          id: `${taskToToggle.id}-done-${Date.now()}`,
          completed: true,
          completedAt: Date.now(),
          updatedAt: Date.now()
        };

        const advancedOriginal: Task = {
          ...taskToToggle,
          dueDate: nextDate,
          completed: false,
          completedAt: undefined,
          updatedAt: Date.now()
        };

        toastMsg = `Termin erledigt! Nächste Fälligkeit automatisch am ${formatHumanDate(nextDate, taskToToggle.dueTime)} geplant. 🔄`;
        return prev.map(t => t.id === id ? advancedOriginal : t).concat(completedClone);
      }

      return prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed,
            completedAt: completed ? Date.now() : undefined,
            updatedAt: Date.now()
          };
        }
        return t;
      });
    });

    showToast(toastMsg, 'success');

    // Sync with Google Tasks API
    if (authToken && !id.includes('-done-')) {
      try {
        setSyncStatus('syncing');
        await updateGoogleTask(authToken, taskToToggle.listId, id, {
          status: completed ? 'completed' : 'needsAction',
          completed: completed ? new Date().toISOString() : null
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error updating task completion in Google Tasks:', err);
        setSyncStatus('error');
      }
    }
  };

  // Recurrence computation helper
  const getNextOccurrence = (dateStr: string, recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    if (recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (recurrence === 'yearly') d.setFullYear(d.getFullYear() + 1);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleRepeatOrScheduleNext = (task: Task) => {
    const recurrence = task.recurrence || 'daily';
    const currentDueDate = task.dueDate || new Date().toISOString().split('T')[0];
    const nextDate = getNextOccurrence(currentDueDate, recurrence);

    saveTasksToStorage(prev => {
      const isClone = task.id.includes('-done-');
      const targetId = isClone ? task.id.split('-done-')[0] : task.id;
      const originalExists = prev.some(t => t.id === targetId);

      if (originalExists) {
        return prev.map(t => {
          if (t.id === targetId) {
            return {
              ...t,
              completed: false,
              completedAt: undefined,
              dueDate: nextDate,
              recurrence: task.recurrence || 'daily',
              updatedAt: Date.now()
            };
          }
          return t;
        });
      } else {
        const revived: Task = {
          ...task,
          id: targetId,
          completed: false,
          completedAt: undefined,
          dueDate: nextDate,
          recurrence: task.recurrence || 'daily',
          updatedAt: Date.now()
        };
        return isClone ? [revived, ...prev] : prev.map(t => t.id === task.id ? revived : t);
      }
    });

    synthCompleteChime();
    showToast(`"${task.title}" auf nächsten Termin (${formatHumanDate(nextDate, task.dueTime)}) gesetzt! 🔄`, 'success');
  };

  // Toggle star priority
  const handleToggleTaskStar = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nowStarred = !task.starred;

    saveTasksToStorage(prev => prev.map(t => t.id === id ? { ...t, starred: nowStarred, updatedAt: Date.now() } : t));
    showToast(nowStarred ? 'Zur Merkliste hinzugefügt ⭐' : 'Stern entfernt', 'star');

    if (authToken && !id.includes('-done-')) {
      try {
        const notesPayload = serializeGoogleTaskNotes(task.notes, nowStarred, task.recurrence, task.dueTime);
        await updateGoogleTask(authToken, task.listId, id, { notes: notesPayload });
      } catch (err) {
        console.error('Error updating task star status:', err);
      }
    }
  };

  // Delete task
  const handleDeleteTask = (id: string, title: string) => {
    const performDelete = async () => {
      const taskToDelete = tasks.find(t => t.id === id);
      saveTasksToStorage(prev => prev.filter(t => t.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
      }
      showToast('Aufgabe endgültig gelöscht.', 'info');

      if (authToken && taskToDelete && !id.includes('-done-') && !id.startsWith('task-')) {
        try {
          setSyncStatus('syncing');
          await deleteGoogleTask(authToken, taskToDelete.listId, id);
          setSyncStatus('synced');
        } catch (err) {
          console.error('Error deleting task on Google Tasks:', err);
          setSyncStatus('error');
        }
      }
    };

    const msg = `"${title}" wirklich endgültig löschen?`;
    if (showConfirm) {
      showConfirm('Aufgabe löschen', msg, performDelete, 'Löschen', 'Abbrechen');
    } else if (window.confirm(msg)) {
      performDelete();
    }
  };

  // Clear all completed tasks in current list
  const handleClearCompleted = async () => {
    const completedInList = tasks.filter(t => t.listId === activeListId && t.completed);
    if (completedInList.length === 0) {
      showToast('Keine erledigten Aufgaben zum Bereinigen vorhanden.', 'info');
      return;
    }

    const performClear = async () => {
      saveTasksToStorage(prev => prev.filter(t => !(t.listId === activeListId && t.completed)));
      showToast(`${completedInList.length} erledigte Aufgaben bereinigt! 🧹`, 'info');

      if (authToken && !activeListId.startsWith('list-default')) {
        try {
          setSyncStatus('syncing');
          await clearCompletedGoogleTasks(authToken, activeListId);
          setSyncStatus('synced');
        } catch (err) {
          console.error('Error clearing completed tasks on Google Tasks:', err);
          setSyncStatus('error');
        }
      }
    };

    if (showConfirm) {
      showConfirm(
        'Erledigte Aufgaben bereinigen',
        `Möchtest du alle ${completedInList.length} erledigten Aufgaben in dieser Liste endgültig aus Google Tasks entfernen?`,
        performClear,
        'Bereinigen',
        'Abbrechen'
      );
    } else {
      performClear();
    }
  };

  // Expand subtasks
  const toggleSubtaskExpand = (taskId: string) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Select task for detail editor
  const handleSelectTaskForDetails = (task: Task) => {
    setSelectedTaskId(task.id);
    setDetailTitle(task.title);
    setDetailNotes(task.notes || '');
    setDetailDueDate(task.dueDate || '');
    setDetailDueTime(task.dueTime || '');
    setDetailStarred(task.starred);
    setDetailRecurrence(task.recurrence || 'none');
  };

  // Save task details
  const handleSaveTaskDetails = async () => {
    if (!selectedTaskId) return;
    const targetTask = tasks.find(t => t.id === selectedTaskId);
    if (!targetTask) return;

    const newTitle = detailTitle.trim() || targetTask.title;
    const recurrenceVal = detailRecurrence !== 'none' ? detailRecurrence : undefined;

    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === selectedTaskId) {
        return {
          ...t,
          title: newTitle,
          notes: detailNotes,
          dueDate: detailDueDate || undefined,
          dueTime: detailDueTime || undefined,
          starred: detailStarred,
          recurrence: recurrenceVal,
          updatedAt: Date.now()
        };
      }
      return t;
    }));
    showToast('Änderungen gespeichert.', 'info');

    if (authToken && !selectedTaskId.includes('-done-') && !selectedTaskId.startsWith('task-')) {
      try {
        setSyncStatus('syncing');
        const notesPayload = serializeGoogleTaskNotes(detailNotes, detailStarred, recurrenceVal, detailDueTime || undefined);
        const dueRfc = detailDueDate ? new Date(`${detailDueDate}T00:00:00.000Z`).toISOString() : null;

        await updateGoogleTask(authToken, targetTask.listId, selectedTaskId, {
          title: newTitle,
          notes: notesPayload,
          due: dueRfc
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error updating task details on Google Tasks:', err);
        setSyncStatus('error');
      }
    }
  };

  // Subtask Management (Google Tasks parent/child hierarchy)
  const handleAddSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTaskId) return;

    const parentTask = tasks.find(t => t.id === selectedTaskId);
    if (!parentTask) return;

    const tempSubId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const newSub: SubTask = {
      id: tempSubId,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: Date.now()
    };

    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === selectedTaskId) {
        return {
          ...t,
          subtasks: [...t.subtasks, newSub],
          updatedAt: Date.now()
        };
      }
      return t;
    }));

    setNewSubtaskTitle('');
    showToast('Teilaufgabe hinzugefügt.', 'success');

    // Create subtask on Google Tasks via parent param
    if (authToken && !selectedTaskId.startsWith('task-') && !selectedTaskId.includes('-done-')) {
      try {
        const apiSub = await insertGoogleTask(authToken, parentTask.listId, {
          title: newSub.title,
          parent: selectedTaskId,
          status: 'needsAction'
        });

        // Update subtask ID with Google ID
        saveTasksToStorage(prev => prev.map(t => {
          if (t.id === selectedTaskId) {
            return {
              ...t,
              subtasks: t.subtasks.map(s => s.id === tempSubId ? { ...s, id: apiSub.id } : s)
            };
          }
          return t;
        }));
      } catch (err) {
        console.error('Error creating subtask on Google Tasks:', err);
      }
    }
  };

  const handleToggleSubtask = async (taskId: string, subId: string) => {
    const parent = tasks.find(t => t.id === taskId);
    if (!parent) return;

    let nextCompleted = false;
    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map(sub => {
          if (sub.id === subId) {
            nextCompleted = !sub.completed;
            if (nextCompleted) synthCompleteChime();
            return { ...sub, completed: nextCompleted };
          }
          return sub;
        });
        return { ...t, subtasks: updatedSubs, updatedAt: Date.now() };
      }
      return t;
    }));

    if (authToken && !subId.startsWith('sub-')) {
      try {
        await updateGoogleTask(authToken, parent.listId, subId, {
          status: nextCompleted ? 'completed' : 'needsAction'
        });
      } catch (err) {
        console.error('Error updating subtask on Google Tasks:', err);
      }
    }
  };

  const handleDeleteSubtask = async (taskId: string, subId: string) => {
    const parent = tasks.find(t => t.id === taskId);
    if (!parent) return;

    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.filter(sub => sub.id !== subId),
          updatedAt: Date.now()
        };
      }
      return t;
    }));

    if (authToken && !subId.startsWith('sub-')) {
      try {
        await deleteGoogleTask(authToken, parent.listId, subId);
      } catch (err) {
        console.error('Error deleting subtask on Google Tasks:', err);
      }
    }
  };

  // Active list item
  const activeList = useMemo(() => {
    return lists.find(l => l.id === activeListId) || lists[0];
  }, [lists, activeListId]);

  // Tasks in active list
  const activeTasks = useMemo(() => {
    if (!activeList) return [];
    return tasks.filter(t => t.listId === activeList.id && !t.completed);
  }, [tasks, activeList]);

  const completedTasks = useMemo(() => {
    if (!activeList) return [];
    return tasks.filter(t => t.listId === activeList.id && t.completed);
  }, [tasks, activeList]);

  // Filter tasks based on search
  const filteredActiveTasks = useMemo(() => {
    if (!searchQuery.trim()) return activeTasks;
    const q = searchQuery.toLowerCase();
    return activeTasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [activeTasks, searchQuery]);

  // Sort tasks
  const sortedActiveTasks = useMemo(() => {
    const arr = [...filteredActiveTasks];
    if (sortBy === 'starred') {
      return arr.sort((a, b) => {
        if (a.starred === b.starred) return b.createdAt - a.createdAt;
        return a.starred ? -1 : 1;
      });
    }
    if (sortBy === 'date') {
      return arr.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }
    // Manual / newest first
    return arr.sort((a, b) => b.createdAt - a.createdAt);
  }, [filteredActiveTasks, sortBy]);

  const sortedCompletedTasks = useMemo(() => {
    return [...completedTasks].sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));
  }, [completedTasks]);

  const activeDetailTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white">
      
      {/* 1. Left Sidebar: Google Task Lists */}
      <div className="w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between h-full select-none">
        <div className="p-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-2">
              <span className="text-base">☑️</span>
              <span className="text-xs font-extrabold text-slate-800 tracking-tight">Google Tasks</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Push notification bell */}
              <button
                onClick={requestPushPermission}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  pushPermission === 'granted' 
                    ? 'text-sky-600 hover:bg-sky-100/50' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                }`}
                title={pushPermission === 'granted' ? 'Push-Erinnerungen aktiv' : 'Push-Benachrichtigungen aktivieren'}
              >
                <Bell className={`w-3.5 h-3.5 ${pushPermission === 'granted' ? 'fill-sky-500' : ''}`} />
              </button>

              {/* Sound chime toggle */}
              <button
                onClick={toggleSound}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  soundEnabled ? 'text-sky-600 hover:bg-sky-100/50' : 'text-slate-400 hover:bg-slate-200/50'
                }`}
                title={soundEnabled ? 'Signalton aktiv' : 'Signalton stumm'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Manual refresh button */}
              <button
                onClick={handleManualRefresh}
                disabled={syncStatus === 'syncing'}
                className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                title="Google Tasks jetzt synchronisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-sky-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Task Lists Navigation items */}
          <div className="space-y-1">
            {lists.map(list => {
              const details = getListDetails(list);
              const isActive = list.id === activeListId;
              const count = tasks.filter(t => t.listId === list.id && !t.completed).length;

              return (
                <div key={list.id} className="relative group/list">
                  {editingListId === list.id ? (
                    <div className="p-2 bg-white rounded-lg border border-sky-300 shadow-xs space-y-2">
                      <div className="flex items-center space-x-1.5">
                        <select
                          value={editingListIcon}
                          onChange={e => setEditingListIcon(e.target.value)}
                          className="text-base bg-slate-100 rounded px-1 py-0.5 border border-slate-200 cursor-pointer"
                        >
                          {PRESET_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <input
                          type="text"
                          value={editingListName}
                          onChange={e => setEditingListName(e.target.value)}
                          className="flex-1 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          placeholder="Listenname..."
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleUpdateList();
                            if (e.key === 'Escape') setEditingListId(null);
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => setEditingListId(null)}
                          className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={handleUpdateList}
                          className="px-2.5 py-0.5 text-[10px] bg-sky-600 hover:bg-sky-500 text-white rounded font-bold cursor-pointer"
                        >
                          Speichern
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setActiveListId(list.id);
                        try {
                          localStorage.setItem('drivedeck_last_active_task_list', list.id);
                        } catch {}
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? 'bg-sky-500/10 text-sky-800 font-bold border border-sky-400/20 shadow-3xs'
                          : 'text-slate-650 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-sm shrink-0">{details.icon}</span>
                        <span className="truncate">{details.name}</span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                        {count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-sky-200 text-sky-900' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        )}

                        {/* List actions on hover */}
                        <div className="opacity-0 group-hover/list:opacity-100 flex items-center transition-opacity ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingListId(list.id);
                              setEditingListName(details.name);
                              setEditingListIcon(details.icon);
                            }}
                            className="p-0.5 hover:text-sky-600 text-slate-400 rounded"
                            title="Liste umbenennen"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {lists.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id, details.name);
                              }}
                              className="p-0.5 hover:text-red-600 text-slate-400 rounded"
                              title="Liste löschen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New List Button & Form */}
          {showAddListForm ? (
            <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center space-x-1.5">
                <select
                  value={newListIcon}
                  onChange={e => setNewListIcon(e.target.value)}
                  className="text-base bg-slate-50 border border-slate-200 rounded px-1 py-0.5 cursor-pointer"
                >
                  {PRESET_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Listenname..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateList();
                    if (e.key === 'Escape') setShowAddListForm(false);
                  }}
                />
              </div>
              <div className="flex justify-end space-x-1.5">
                <button
                  onClick={() => setShowAddListForm(false)}
                  className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={!newListName.trim()}
                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 rounded shadow-3xs cursor-pointer"
                >
                  Erstellen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddListForm(true)}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-sky-600 hover:bg-sky-50/40 rounded-lg cursor-pointer border border-dashed border-slate-200/80 hover:border-sky-200 transition-all text-left mt-2"
            >
              <FolderPlus className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-sky-500" />
              <span>Neue Liste anlegen</span>
            </button>
          )}
        </div>

        {/* Integration Sync Footer */}
        <div className="h-[45px] px-3 bg-slate-50/70 border-t border-slate-200 text-[10px] select-none flex items-center justify-between shrink-0">
          {authToken ? (
            <div className="flex items-center gap-1.5 font-bold text-slate-650">
              {syncStatus === 'syncing' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] text-amber-700">Google Tasks synchronisiert...</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] text-red-600">Google Tasks Fehler</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-700">Google Tasks aktiv ✅</span>
                </>
              )}
            </div>
          ) : (
            <div className="text-slate-500 font-sans leading-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="text-[9.5px]">Offline (Lokal gespeichert)</span>
            </div>
          )}

          {authToken && (
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-sky-600 p-1 rounded"
              title="Google Tasks / Kalender öffnen"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* 2. Main Tasks View Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white h-full relative">
        
        {/* Header Toolbar */}
        <div className="border-b border-slate-150 px-4 py-3 select-none flex flex-wrap items-center justify-between gap-3.5 bg-slate-50/40">
          <div className="flex items-center space-x-2 min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-none truncate max-w-[240px]">
              {activeList?.name || '☑️ Aufgaben'}
            </h2>
            <span className="text-[10px] bg-sky-50 font-bold border border-sky-200/50 text-sky-600 px-1.5 py-0.5 rounded-full select-none leading-none">
              {activeTasks.length} offen
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Aufgaben durchsuchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs select-text bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400/85 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent transition-all w-36 sm:w-48"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1.5 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center space-x-1 border border-slate-200 rounded-md bg-white px-2 py-1 shadow-3xs cursor-pointer hover:bg-slate-50 transition-colors">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-[11px] font-semibold text-slate-600 bg-transparent border-none outline-none cursor-pointer pr-1"
              >
                <option value="manual">Aktuellste zuerst</option>
                <option value="date">Nach Datum</option>
                <option value="starred">Favoriten oben</option>
              </select>
            </div>

            {/* Clear completed button */}
            {completedTasks.length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-[11px] font-bold text-slate-500 hover:text-red-600 border border-slate-200 rounded-md bg-white px-2 py-1 shadow-3xs hover:bg-red-50 transition-colors cursor-pointer"
                title="Erledigte Aufgaben aus dieser Liste bereinigen"
              >
                Erledigte leeren
              </button>
            )}
          </div>
        </div>

        {/* Quick Add inline input bar */}
        <div className="p-3 border-b border-slate-100 bg-white shrink-0 select-none">
          <form onSubmit={handleAddTask} className="flex gap-2 items-center">
            <div className="flex-1 relative flex items-center">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Neue Google Task hinzufügen... (Enter drücken)"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full pl-9 pr-24 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white select-text transition-all"
              />
              
              <div className="absolute right-2 flex items-center space-x-1 select-none">
                {/* Star Button */}
                <button
                  type="button"
                  onClick={() => setNewTaskStarred(!newTaskStarred)}
                  className={`p-1 rounded-md transition-colors ${newTaskStarred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-350 hover:text-slate-500'}`}
                  title={newTaskStarred ? 'Mit Stern priorisiert' : 'Als Favorit markieren'}
                >
                  <Star className={`w-3.5 h-3.5 ${newTaskStarred ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Due Time Picker */}
                <div className="relative flex items-center">
                  <input
                    type="time"
                    value={newTaskDueTime}
                    onChange={e => setNewTaskDueTime(e.target.value)}
                    className="w-6 h-6 opacity-0 absolute cursor-pointer z-10"
                    title="Uhrzeit für Erinnerung festlegen"
                  />
                  <div className={`p-1 rounded-md border text-slate-455 flex items-center justify-center ${newTaskDueTime ? 'bg-sky-50 text-sky-600 border-sky-100' : 'border-transparent hover:bg-slate-100'}`}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Due Date Picker */}
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="w-6 h-6 opacity-0 absolute cursor-pointer z-10"
                    title="Fälligkeitsdatum hinzufügen"
                  />
                  <div className={`p-1 rounded-md border text-slate-455 flex items-center justify-center ${newTaskDueDate ? 'bg-sky-50 text-sky-600 border-sky-100' : 'border-transparent hover:bg-slate-100'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition-colors cursor-pointer shadow-3xs hover:-translate-y-0.5 duration-150"
            >
              Hinzufügen
            </button>
          </form>

          {newTaskDueDate && (
            <div className="mt-1.5 ml-2 flex items-center space-x-1.5 select-none animate-in slide-in-from-left-2 duration-150">
              <span className="text-[10px] font-bold text-sky-750 bg-sky-50 px-2 py-0.5 border border-sky-100 rounded-md flex items-center gap-1">
                Fälligkeit: {formatHumanDate(newTaskDueDate, newTaskDueTime)}
                <button 
                  onClick={() => {
                    setNewTaskDueDate('');
                    setNewTaskDueTime('');
                  }} 
                  className="hover:text-red-600 font-extrabold text-[9px] pl-1.5"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Tasks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Active Tasks Grid */}
          <div>
            {isInitialLoading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 text-sky-500 animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold">Lade Google Tasks...</p>
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 text-sky-400/50 mx-auto mb-2" />
                <p className="text-xs font-medium">Alle erledigt oder keine Aufgaben in dieser Liste.</p>
                <p className="text-[10px] text-slate-300 mt-1">Erstelle oben einfach eine neue Aufgabe!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedActiveTasks.map(task => {
                  const subtaskCount = task.subtasks.length;
                  const completedSubs = task.subtasks.filter(sub => sub.completed).length;
                  const isExpanded = !!expandedSubtasks[task.id];

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleSelectTaskForDetails(task)}
                      className={`group/task border rounded-xl p-3 bg-white transition-all duration-200 cursor-pointer text-left hover:shadow-xs ${
                        selectedTaskId === task.id
                          ? 'border-sky-300 ring-1 ring-sky-300 bg-sky-50/5'
                          : 'border-slate-150 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Custom Completion Check Badge */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskCompleted(task.id, task.completed);
                          }}
                          className="w-5.5 h-5.5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 cursor-pointer bg-white group-hover/task:border-sky-400 hover:scale-105 active:scale-95 transition-all mt-0.5 shadow-3xs"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 opacity-0 group-hover/task:opacity-40 transition-opacity"></div>
                        </div>

                        {/* Title & Notes Panel */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 leading-tight group-hover/task:text-slate-900 transition-colors truncate">
                            {task.title}
                          </p>
                          
                          {task.notes && (
                            <p className="text-[10.5px] text-slate-450 leading-relaxed mt-1 select-none line-clamp-1 truncate font-medium">
                              {task.notes}
                            </p>
                          )}

                          {/* Task Badges & Subtask status */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-sky-750 bg-sky-100/40 px-1.5 py-0.5 border border-sky-100/50 rounded-md">
                                <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                                {formatHumanDate(task.dueDate, task.dueTime)}
                              </span>
                            )}

                            {task.recurrence && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-100/40 px-1.5 py-0.5 border border-emerald-100/50 rounded-md">
                                <Repeat className="w-3 h-3 text-emerald-500 shrink-0" />
                                {task.recurrence === 'daily' ? 'Täglich' :
                                 task.recurrence === 'weekly' ? 'Wöchentlich' :
                                 task.recurrence === 'monthly' ? 'Monatlich' :
                                 task.recurrence === 'yearly' ? 'Jährlich' : ''}
                              </span>
                            )}

                            {subtaskCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                <ListTodo className="w-3 h-3 text-slate-400 shrink-0" />
                                {completedSubs}/{subtaskCount} Subtasks
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Star / Favourite Option & Delete Button */}
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaskStar(task.id);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                            title="Stern / Priorität"
                          >
                            <Star
                              className={`w-4.5 h-4.5 ${
                                task.starred 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-300 opacity-25 group-hover/task:opacity-100 hover:text-slate-500 hover:scale-110 active:scale-95 transition-all'
                              }`}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id, task.title);
                            }}
                            className="p-1 text-slate-300 opacity-0 group-hover/task:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                            title="Aufgabe löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subtasks inline preview when expanded */}
                      {subtaskCount > 0 && (
                        <div className="mt-2 text-left" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSubtaskExpand(task.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-sky-600 p-1 bg-slate-50 border border-slate-100 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span>Teilaufgaben ({subtaskCount - completedSubs} offen)</span>
                          </button>

                          {isExpanded && (
                            <div className="ml-4 pl-2.5 border-l border-slate-100 mt-2 space-y-1.5 animate-in fade-in duration-200">
                              {task.subtasks.map(sub => (
                                <div 
                                  key={sub.id} 
                                  className="flex items-center gap-2 py-0.5 hover:bg-slate-50/50 rounded pr-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={sub.completed}
                                    onChange={() => handleToggleSubtask(task.id, sub.id)}
                                    className="w-3.5 h-3.5 rounded text-sky-500 border-slate-300 focus:ring-sky-400 cursor-pointer"
                                  />
                                  <span className={`text-[10.5px] leading-tight flex-1 ${sub.completed ? 'line-through text-slate-400' : 'text-slate-650'}`}>
                                    {sub.title}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                    className="p-0.5 hover:bg-white text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Tasks section */}
          {sortedCompletedTasks.length > 0 && (
            <div className="pt-3 border-t border-slate-100 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCompletedCollapsed(!completedCollapsed)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold py-1 px-2 hover:bg-slate-100 rounded-md transition-all select-none cursor-pointer"
                >
                  {completedCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>Abgeschlossen ({sortedCompletedTasks.length})</span>
                </button>

                <button
                  onClick={handleClearCompleted}
                  className="text-[10px] text-slate-400 hover:text-red-600 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Bereinigen
                </button>
              </div>

              {!completedCollapsed && (
                <div className="mt-2.5 space-y-2 pl-1 animate-in fade-in duration-200">
                  {sortedCompletedTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleSelectTaskForDetails(task)}
                      className="group/task flex items-center justify-between border border-slate-100/60 rounded-xl p-2.5 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 cursor-pointer text-left transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checked button */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskCompleted(task.id, task.completed);
                          }}
                          className="w-5.2 h-5.2 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 cursor-pointer hover:bg-sky-600 transition-all shadow-3xs"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-400 line-through truncate leading-normal">
                            {task.title}
                          </p>
                          {task.completedAt && (
                            <p className="text-[9.5px] text-slate-350 mt-0.5 leading-none">
                              Beendet: {new Date(task.completedAt).toLocaleDateString('de-DE')} um {new Date(task.completedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Repeat / Schedule next period button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRepeatOrScheduleNext(task);
                        }}
                        className="p-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 font-bold text-[9px] flex items-center gap-1 transition-all cursor-pointer mr-2 shrink-0 border border-emerald-100"
                        title={task.recurrence ? 'Nächsten Termin für diese wiederkehrende Aufgabe planen' : 'Diese Aufgabe erneut in die Liste eintragen'}
                      >
                        <Repeat className="w-2.8 h-2.8 text-emerald-600 shrink-0" />
                        <span>{task.recurrence ? 'Nächster Termin' : 'Einplanen'}</span>
                      </button>

                      {/* Trash bin delete permanently */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id, task.title);
                        }}
                        className="opacity-0 group-hover/task:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-all cursor-pointer"
                        title="Aufgabe endgültig löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Slide-In Side Drawer for Edit details (Right Sidebar style matching authentic Google Tasks) */}
      {selectedTaskId && activeDetailTask && (
        <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col justify-between h-full shadow-md z-15 animate-in slide-in-from-right duration-250 select-none">
          
          {/* Drawer Toolbar */}
          <div className="p-3.5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 select-none">
              <Edit3 className="w-4 h-4 text-sky-500" />
              Aufgabendetails
            </span>
            <button
              onClick={() => {
                handleSaveTaskDetails();
                setSelectedTaskId(null);
              }}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all duration-200 cursor-pointer"
              title="Details schließen & speichern"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Scroll body content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left select-none">
            {/* Title editing */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Aufgabenname
              </label>
              <input
                type="text"
                value={detailTitle}
                onChange={e => setDetailTitle(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-400 bg-slate-50/40 select-text"
                placeholder="Name eingeben..."
              />
            </div>

            {/* Notes detailed input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                Beschreibung & Notizen
              </label>
              <textarea
                value={detailNotes}
                onChange={e => setDetailNotes(e.target.value)}
                className="w-full text-xs text-slate-650 border border-slate-200 rounded-lg p-2.5 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400 bg-slate-50/40 select-text"
                placeholder="Füge Notizen oder nützliche Arbeitslinks hinzu..."
              />
            </div>

            {/* Star & Due Date row */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              {/* Due date picker */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Fälligkeit & Zeit
                </label>
                <input
                  type="date"
                  value={detailDueDate}
                  onChange={e => setDetailDueDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer text-slate-700 bg-slate-50/30"
                />
                <input
                  type="time"
                  value={detailDueTime}
                  onChange={e => setDetailDueTime(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer text-slate-700 bg-slate-50/30 mt-1"
                />
              </div>

              {/* Star favour toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500" /> Priorität
                </label>
                <button
                  type="button"
                  onClick={() => setDetailStarred(!detailStarred)}
                  className={`w-full text-xs font-semibold p-2 border rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer h-[78px] ${
                    detailStarred
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'border-slate-200 text-slate-450 hover:bg-slate-50'
                  }`}
                >
                  <Star className={`w-4 h-4 ${detailStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  <span>{detailStarred ? 'Priorisiert' : 'Keine'}</span>
                </button>
              </div>
            </div>

            {/* Wiederholung option */}
            <div className="space-y-1 pb-3 border-b border-slate-100 animate-in fade-in duration-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 leading-none select-none">
                <Repeat className="w-3.2 h-3.2 text-emerald-600 animate-pulse shrink-0" />
                <span>Wiederkehrende Aufgabe</span>
              </label>
              <div className="relative mt-1">
                <select
                  value={detailRecurrence}
                  onChange={e => setDetailRecurrence(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/45 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer appearance-none text-slate-705 font-bold"
                >
                  <option value="none">Keine Wiederholung (Einmalig)</option>
                  <option value="daily">🔄 Täglich wiederholen</option>
                  <option value="weekly">🔄 Wöchentlich wiederholen</option>
                  <option value="monthly">🔄 Monatlich wiederholen</option>
                  <option value="yearly">🔄 Jährlich wiederholen</option>
                </select>
              </div>
            </div>

            {/* Hierarchical Subtasks section */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ListTodo className="w-3 h-3 text-sky-500" />
                  Teilaufgaben
                </span>
                <span className="text-[9px] font-semibold text-slate-400">
                  {activeDetailTask.subtasks.filter(s => s.completed).length}/{activeDetailTask.subtasks.length}
                </span>
              </label>

              {/* Add subtask input */}
              <form onSubmit={handleAddSubtask} className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="Unteraufgabe eingeben..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 bg-slate-50/30 select-text"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="p-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white rounded-lg shadow-3xs cursor-pointer"
                  title="Unteraufgabe anlegen"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Subtask elements item lists */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2">
                {activeDetailTask.subtasks.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic py-1">Noch keine Teilaufgaben erfasst.</p>
                ) : (
                  activeDetailTask.subtasks.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded border border-slate-100 hover:border-slate-200 bg-slate-50/20"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(activeDetailTask.id, sub.id)}
                          className="w-3.5 h-3.5 text-sky-500 rounded border-slate-350 focus:ring-sky-400 cursor-pointer"
                        />
                        <span className={`text-[10.5px] truncate leading-tight flex-1 ${sub.completed ? 'line-through text-slate-400' : 'text-slate-650'}`}>
                          {sub.title}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteSubtask(activeDetailTask.id, sub.id)}
                        className="p-0.5 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Unteraufgabe löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Drawer actions at bottom */}
          <div className="p-3 border-t border-slate-150 flex items-center justify-between bg-slate-50/50">
            <button
              onClick={() => {
                handleDeleteTask(activeDetailTask.id, activeDetailTask.title);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-red-650 hover:bg-red-50 rounded-lg hover:text-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Löschen
            </button>
            
            <button
              onClick={() => {
                handleSaveTaskDetails();
                setSelectedTaskId(null);
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-3xs cursor-pointer transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Floating Interactive Toast notifications container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none select-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold text-white shadow-md border animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 select-none ${
              t.type === 'success' 
                ? 'bg-sky-600 border-sky-500' 
                : t.type === 'star'
                ? 'bg-amber-500 border-amber-400'
                : 'bg-slate-700 border-slate-600'
            }`}
          >
            {t.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 stroke-[3]" />
            ) : t.type === 'star' ? (
              <Star className="w-4 h-4 shrink-0 fill-white" />
            ) : (
              <Bell className="w-4 h-4 shrink-0 animate-bounce" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
