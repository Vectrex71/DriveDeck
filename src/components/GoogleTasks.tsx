/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Play,
  Repeat
} from 'lucide-react';

import { Task, TaskList, SubTask } from '../types';
import { executeTasksSync } from '../lib/driveSync';

// Preset emojis for custom task lists
const PRESET_EMOJIS = [
  // Arbeit, Lernen & Fokus
  '📋', '☑️', '💼', '📝', '📑', '📊', '📂', '📁', '💻', '🖥️', '✉️', '📞', '🗓️', '📅', '📌', '🔍', '💡', '🧠', '🎓', '📚', '✏️', '🏫', '🔬', '📐',
  
  // Ziele, Prioritäten & Finanzen
  '🎯', '🌟', '🚀', '🔥', '⚡', '🏆', '👑', '🥇', '📈', '📉', '💰', '💶', '💵', '💳', '💎', '🔑', '🔒', '🔓', '🛡️',
  
  // Haus, Familie & Alltag
  '🏠', '🏡', '🛋️', '🛌', '🧹', '🧼', '🧺', '🔧', '🔨', '🛠️', '🚗', '🛵', '🚲', '🛒', '🛍️', '📦', '📬', '🪴', '🌱', '🌸', '🐾', '🐶', '🐱',
  
  // Hobbys, Kreativität & Freizeit
  '🎨', '🎵', '🎸', '🎹', '📷', '🎬', '🎮', '🧩', '🧶', '🧵', '🎭', '🎪', '🎲', '🎳', '🎯', '🛹', 
  
  // Gesundheit, Sport & Wellness
  '🧘', '🏋️', '🏃', '🚴', '🏊', '🧗', '🏄', '🏌️', '⚽', '🏀', '🍎', '🥦', '🍕', '☕', '🥤', '🍷', '🍺', '🧴', '🛀', '💤',
  
  // Reisen & Abenteuer
  '✈️', '⛵', '🗺️', '🧭', '⛰️', '🏕️', '⛺', '🎒', '🧳', '🌴', '🏖️', '🌍', '🗼', '🏰',
  
  // Symbole & Stimmungen
  '💬', '📣', '🎉', '🎁', '🎈', '❤️', '🍀', '✨', '🌈', '☀️', '🌙', '⭐', '🔔', '📢', '⏱️', '⌛'
];

// Helper to extract any leading emoji or symbol from text
const extractLeadingEmoji = (text: string): { emoji: string; cleanText: string } => {
  // Matches typical emojis at the start of string
  const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F191}-\u{1F251}☑️]+)\s*/u;
  const match = text.match(emojiRegex);
  if (match) {
    const emoji = match[1];
    const cleanText = text.slice(match[0].length);
    return { emoji, cleanText };
  }
  
  // Custom check for known emoji prefixes
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
    // If we have an icon, remove duplicates from start of name
    const extracted = extractLeadingEmoji(name);
    if (extracted.emoji === icon) {
      name = extracted.cleanText;
    }
  }
  
  return { icon, name };
};

interface GoogleTasksProps {
  showConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText?: string,
    cancelText?: string,
    isAlert?: boolean
  ) => void;
}

export default function GoogleTasks({ showConfirm }: GoogleTasksProps = {}) {
  // 1. Core State
  const [lists, setLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');

  // Google Drive Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const skipSyncRef = useRef<boolean>(false);

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

  // 3. Load from LocalStorage
  useEffect(() => {
    let initialLists: TaskList[] = [];
    let initialTasks: Task[] = [];
    try {
      // Load Lists
      const storedLists = localStorage.getItem('drivedeck_task_lists');
      if (storedLists) {
        initialLists = JSON.parse(storedLists);
      } else {
        // Seed lists
        initialLists = [
          { id: 'list-default', name: '☑️ Meine Aufgaben', createdAt: Date.now() },
          { id: 'list-work', name: '💼 Arbeit & Kanzlei', createdAt: Date.now() - 10000 },
          { id: 'list-private', name: '🏠 Privat', createdAt: Date.now() - 20000 }
        ];
        localStorage.setItem('drivedeck_task_lists', JSON.stringify(initialLists));
      }
      setLists(initialLists);

      // Set active list
      const lastActiveListId = localStorage.getItem('drivedeck_last_active_task_list');
      if (lastActiveListId && initialLists.some(l => l.id === lastActiveListId)) {
        setActiveListId(lastActiveListId);
      } else if (initialLists.length > 0) {
        setActiveListId(initialLists[0].id);
      }

      // Load tasks
      const storedTasks = localStorage.getItem('drivedeck_tasks_data');
      if (storedTasks) {
        initialTasks = JSON.parse(storedTasks);
        let updated = false;
        initialTasks = initialTasks.map((t: Task) => {
          if (t.title && t.title.includes('Google Tasks')) {
            updated = true;
            return {
              ...t,
              title: t.title.replace('Google Tasks', 'DriveTasks')
            };
          }
          return t;
        });
        if (updated) {
          try {
            localStorage.setItem('drivedeck_tasks_data', JSON.stringify(initialTasks));
          } catch {}
        }
        setTasks(initialTasks);
      } else {
        // Seed tasks
        initialTasks = [
          {
            id: 'task-1',
            listId: 'list-default',
            title: 'Willkommen bei DriveTasks! 🎉',
            notes: 'Dieser Bereich ist dein voll ausgestattetes Werkzeug für deine To-Do-Listen im Browser.',
            completed: false,
            starred: true,
            subtasks: [
              { id: 'sub-1', title: 'Erstelle eigene Listen links im Panel', completed: false, createdAt: Date.now() },
              { id: 'sub-2', title: 'Nutze Fälligkeitsdaten & Notizen für Fokus', completed: true, createdAt: Date.now() - 5000 }
            ],
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          {
            id: 'task-2',
            listId: 'list-default',
            title: 'Bündele wichtige Notizen & Details',
            notes: 'Klicke auf eine Aufgabe, um den eleganten Detail-Editor auf der rechten Seite zu öffnen! Dort kannst du zusätzliche Notizen erfassen und Teilaufgaben steuern.',
            completed: false,
            dueDate: new Date().toISOString().split('T')[0],
            starred: false,
            subtasks: [],
            createdAt: Date.now() - 20000,
            updatedAt: Date.now() - 20000
          },
          {
            id: 'task-3',
            listId: 'list-default',
            title: 'Höre den Erledigt-Sound 🛎️',
            notes: 'Erledige eine Aufgabe durch Klicken auf den Kreis links. Ein feiner, synthetischer Chime-Sound ertönt zur mentalen Belohnung!',
            completed: true,
            completedAt: Date.now(),
            starred: false,
            subtasks: [],
            createdAt: Date.now() - 50000,
            updatedAt: Date.now() - 50000
          }
        ];
        setTasks(initialTasks);
        localStorage.setItem('drivedeck_tasks_data', JSON.stringify(initialTasks));
      }
    } catch (e) {
      console.error('Failed to load DriveTasks state:', e);
    }

    // Google Drive Pull-Sync
    const token = sessionStorage.getItem('drive_access_token');
    if (token) {
      setDriveToken(token);
      setSyncStatus('syncing');
      executeTasksSync(token, initialLists, initialTasks)
        .then((stats) => {
          if (stats.localUpdated || stats.driveUpdated) {
            skipSyncRef.current = true;
            if (stats.lists.length > 0) {
              setLists(stats.lists);
              localStorage.setItem('drivedeck_task_lists', JSON.stringify(stats.lists));
              
              if (!stats.lists.some(l => l.id === activeListId)) {
                setActiveListId(stats.lists[0].id);
              }
            }
            setTasks(stats.tasks);
            localStorage.setItem('drivedeck_tasks_data', JSON.stringify(stats.tasks));
          }
          setSyncStatus('synced');
        })
        .catch((err) => {
          console.error('[DriveSync] Initial Tasks pull sync failed:', err);
          setSyncStatus('error');
        });
    }
  }, []);

  // Debounced cloud synchronization trigger
  useEffect(() => {
    if (!driveToken) return;
    
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setSyncStatus('syncing');
      executeTasksSync(driveToken, lists, tasks)
        .then((stats) => {
          if (stats.localUpdated) {
            skipSyncRef.current = true;
            if (stats.lists.length > 0) {
              setLists(stats.lists);
              localStorage.setItem('drivedeck_task_lists', JSON.stringify(stats.lists));
            }
            setTasks(stats.tasks);
            localStorage.setItem('drivedeck_tasks_data', JSON.stringify(stats.tasks));
          }
          setSyncStatus('synced');
        })
        .catch((err) => {
          console.error('[DriveSync] Auto tasks sync failed:', err);
          setSyncStatus('error');
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [lists, tasks, driveToken]);

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
        const newToast = {
          id: 'push-success-' + Date.now(),
          message: '🔔 Push-Benachrichtigungen erfolgreich aktiviert!',
          type: 'success' as const
        };
        setToasts(prev => [newToast, ...prev]);

        new Notification("Aktiviert! 🔔", {
          body: "Du wirst ab jetzt pünktlich an fällige Aufgaben erinnert.",
          icon: '/favicon.ico'
        });

        synthCompleteChime();
      } else {
        const newToast = {
          id: 'push-denied-' + Date.now(),
          message: '❌ Blockiert! Bitte erlaube Benachrichtigungen im Browser.',
          type: 'info' as const
        };
        setToasts(prev => [newToast, ...prev]);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  // Run a reminder clock to check for due tasks
  useEffect(() => {
    const checkDueReminders = () => {
      const now = new Date();
      // Year-Month-Day formatted matching task date format
      const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      tasks.forEach(task => {
        if (task.completed || !task.dueDate || !task.dueTime) return;

        // Compare date and time strings directly
        if (task.dueDate === dateStr && task.dueTime === timeStr) {
          if (notifiedTaskIds.includes(task.id)) return;

          setNotifiedTaskIds(prev => {
            const next = [...prev, task.id];
            try {
              localStorage.setItem('drivedeck_notified_tasks', JSON.stringify(next));
            } catch {}
            return next;
          });

          // Play rewarding Bell synthesis
          synthCompleteChime();

          // Push immediate in-app alarm Toast
          const newToast = {
            id: 'reminder-' + Date.now() + '-' + task.id,
            message: `⏰ Fällig: "${task.title}"`,
            type: 'info' as const
          };
          setToasts(prev => [newToast, ...prev]);

          // Browser system push notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification("DriveTasks Erinnerung! ⏰", {
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
    const clockInterval = setInterval(checkDueReminders, 15000); // Check every 15s for extra precision
    return () => clearInterval(clockInterval);
  }, [tasks, notifiedTaskIds, soundEnabled]);

  // Save changes to localStorage helper
  const saveListsToStorage = (updatedLists: TaskList[]) => {
    try {
      localStorage.setItem('drivedeck_task_lists', JSON.stringify(updatedLists));
    } catch (error) {
      console.error('Failed storing task lists:', error);
    }
  };

  const saveTasksToStorage = (updatedTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prev => {
      const next = typeof updatedTasks === 'function' ? updatedTasks(prev) : updatedTasks;
      try {
        localStorage.setItem('drivedeck_tasks_data', JSON.stringify(next));
      } catch (error) {
        console.error('Failed storing tasks data:', error);
      }
      return next;
    });
  };

  useEffect(() => {
    if (activeListId) {
      try {
        localStorage.setItem('drivedeck_last_active_task_list', activeListId);
      } catch {}
    }
  }, [activeListId]);

  useEffect(() => {
    try {
      localStorage.setItem('drivedeck_tasks_sound', String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // 4. Notification / Alert system (Audio synthesis)
  const synthCompleteChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const masterVolume = ctx.createGain();
      masterVolume.gain.setValueAtTime(0.12, ctx.currentTime);
      masterVolume.connect(ctx.destination);

      // Crystalline bell frequency tone #1 (base)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6 Note
      osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12); // Sweep to E6
      
      gain1.gain.setValueAtTime(1.0, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc1.connect(gain1);
      gain1.connect(masterVolume);

      // Higher harmonic bell tone #2 (overtone)
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

  const showToast = (message: string, type: 'success' | 'info' | 'star' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  // 5. Actions: List Management
  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newListId = 'list-' + Math.random().toString(36).substr(2, 9);
    const newList: TaskList = {
      id: newListId,
      name: newListName.trim(),
      icon: newListIcon,
      createdAt: Date.now()
    };
    const updated = [...lists, newList];
    setLists(updated);
    saveListsToStorage(updated);
    setActiveListId(newListId);
    setNewListName('');
    setNewListIcon('📋');
    setShowAddListForm(false);
    showToast(`Neue Liste "${newList.name}" erstellt.`, 'success');
  };

  const handleUpdateList = () => {
    if (!editingListId || !editingListName.trim()) return;
    const updated = lists.map(l => l.id === editingListId ? { ...l, name: editingListName.trim(), icon: editingListIcon } : l);
    setLists(updated);
    saveListsToStorage(updated);
    showToast('Liste erfolgreich aktualisiert.', 'info');
    setEditingListId(null);
    setEditingListName('');
  };

  const handleDeleteList = (id: string, name: string) => {
    if (lists.length <= 1) {
      showToast('Du musst mindestens eine Aufgabenliste behalten.', 'info');
      return;
    }

    const performDelete = () => {
      const remainingLists = lists.filter(l => l.id !== id);
      setLists(remainingLists);
      saveListsToStorage(remainingLists);

      // Filter out all associated tasks
      saveTasksToStorage(prev => prev.filter(t => t.listId !== id));

      // Choose active fallback
      if (activeListId === id) {
        setActiveListId(remainingLists[0].id);
      }
      showToast(`Liste "${name}" gelöscht.`, 'info');
    };

    const msg = `Möchtest du die Liste "${name}" und alle darin enthaltenen Aufgaben wirklich unwiderruflich löschen?`;
    if (showConfirm) {
      showConfirm(
        'Liste löschen',
        msg,
        performDelete,
        'Löschen',
        'Abbrechen'
      );
    } else if (window.confirm(msg)) {
      performDelete();
    }
  };

  // 6. Actions: Task Management
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      listId: activeListId,
      title: newTaskTitle.trim(),
      notes: '',
      completed: false,
      dueDate: newTaskDueDate || undefined,
      dueTime: newTaskDueTime || undefined,
      starred: newTaskStarred,
      subtasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    saveTasksToStorage(prev => [newTask, ...prev]);
    showToast(`"${newTask.title}" hinzugefügt.`, newTask.starred ? 'star' : 'success');
    
    // Clear input
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskDueTime('');
    setNewTaskStarred(false);
  };

  const getNextOccurrence = (dateStr: string, recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
    if (!dateStr) {
      const now = new Date();
      dateStr = now.toISOString().split('T')[0];
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
    
    if (recurrence === 'daily') {
      d.setDate(d.getDate() + 1);
    } else if (recurrence === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (recurrence === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else if (recurrence === 'yearly') {
      d.setFullYear(d.getFullYear() + 1);
    }
    
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
        if (isClone) {
          return [revived, ...prev];
        } else {
          return prev.map(t => t.id === task.id ? revived : t);
        }
      }
    });

    synthCompleteChime();
    showToast(`"${task.title}" auf nächsten Termin (${formatHumanDate(nextDate, task.dueTime)}) gesetzt! 🔄`, 'success');
  };

  const handleToggleTaskCompleted = (id: string, currentStatus: boolean) => {
    let playedChime = false;
    let toastMsg = 'Aufgabe als erledigt markiert! 👍';

    saveTasksToStorage(prev => {
      const taskToToggle = prev.find(t => t.id === id);
      if (!taskToToggle) return prev;

      const completed = !currentStatus;
      if (completed && !playedChime) {
        synthCompleteChime();
        playedChime = true;
      }

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

    if (!currentStatus) {
      showToast(toastMsg, 'success');
    }
  };

  const handleToggleTaskStar = (id: string) => {
    let nowStarred = false;
    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === id) {
        nowStarred = !t.starred;
        return { ...t, starred: nowStarred, updatedAt: Date.now() };
      }
      return t;
    }));
    showToast(nowStarred ? 'Zur Merkliste hinzugefügt ⭐' : 'Stern entfernt', 'star');
  };

  const handleDeleteTask = (id: string, title: string) => {
    const performDelete = () => {
      saveTasksToStorage(prev => prev.filter(t => t.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
      }
      showToast('Aufgabe endgültig gelöscht.', 'info');
    };

    const msg = `"${title}" wirklich endgültig löschen?`;
    if (showConfirm) {
      showConfirm(
        'Aufgabe löschen',
        msg,
        performDelete,
        'Löschen',
        'Abbrechen'
      );
    } else if (window.confirm(msg)) {
      performDelete();
    }
  };

  // 7. Expand/Collapse subtask trees
  const toggleSubtaskExpand = (taskId: string) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // 8. Edit Details Panel (Slide Out)
  const handleSelectTaskForDetails = (task: Task) => {
    setSelectedTaskId(task.id);
    setDetailTitle(task.title);
    setDetailNotes(task.notes || '');
    setDetailDueDate(task.dueDate || '');
    setDetailDueTime(task.dueTime || '');
    setDetailStarred(task.starred);
    setDetailRecurrence(task.recurrence || 'none');
  };

  const handleSaveTaskDetails = () => {
    if (!selectedTaskId) return;
    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === selectedTaskId) {
        return {
          ...t,
          title: detailTitle.trim() || t.title,
          notes: detailNotes,
          dueDate: detailDueDate || undefined,
          dueTime: detailDueTime || undefined,
          starred: detailStarred,
          recurrence: detailRecurrence !== 'none' ? detailRecurrence : undefined,
          updatedAt: Date.now()
        };
      }
      return t;
    }));
    showToast('Änderungen gespeichert.', 'info');
  };

  // Subtask additions inside details card
  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTaskId) return;

    const newSub: SubTask = {
      id: 'sub-' + Math.random().toString(36).substr(2, 9),
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
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    saveTasksToStorage(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map(sub => {
          if (sub.id === subId) {
            const completed = !sub.completed;
            if (completed) synthCompleteChime();
            return { ...sub, completed };
          }
          return sub;
        });
        return {
          ...t,
          subtasks: updatedSubs,
          updatedAt: Date.now()
        };
      }
      return t;
    }));
  };

  const handleDeleteSubtask = (taskId: string, subId: string) => {
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
    showToast('Teilaufgabe gelöscht.', 'info');
  };

  // 9. Sorting & Filtering
  const activeList = lists.find(l => l.id === activeListId);
  
  // Format dates elegantly for humans
  const formatHumanDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      let formattedDate = '';
      const dCleanStr = d.toDateString();
      if (dCleanStr === today.toDateString()) {
        formattedDate = '📅 Heute';
      } else if (dCleanStr === tomorrow.toDateString()) {
        formattedDate = '📅 Morgen';
      } else {
        formattedDate = '📅 ' + d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      if (timeStr) {
        formattedDate += ` um ${timeStr} Uhr`;
      }
      return formattedDate;
    } catch {
      return dateStr + (timeStr ? ` um ${timeStr} Uhr` : '');
    }
  };

  // Tasks in currently loaded list
  const filteredListTasks = tasks.filter(t => {
    const matchesList = t.listId === activeListId;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesList && matchesSearch;
  });

  // Split into active & completed
  const activeTasks = filteredListTasks.filter(t => !t.completed);
  const completedTasks = filteredListTasks.filter(t => t.completed);

  // Apply sorting models on active tasks
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    if (sortBy === 'date') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      const valA = a.dueDate + (a.dueTime ? `T${a.dueTime}` : 'T00:00');
      const valB = b.dueDate + (b.dueTime ? `T${b.dueTime}` : 'T00:00');
      return valA.localeCompare(valB);
    }
    if (sortBy === 'starred') {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
    }
    // Default manual created-at sorter (newest first)
    return b.createdAt - a.createdAt;
  });

  const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
    return (b.completedAt || 0) - (a.completedAt || 0);
  });

  // Currently viewing task details object
  const activeDetailTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 font-sans select-none relative [content-visibility:auto]">
      
      {/* List Sidebar Panel */}
      <div className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex h-full select-none">
        
        {/* Sidebar Header & Identity */}
        <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sky-600 font-bold">
            <ListTodo className="w-5 h-5" />
            <span className="text-sm tracking-tight text-slate-800">Deine Aufgaben</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={requestPushPermission}
              className={`p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer ${pushPermission === 'granted' ? 'text-amber-550 bg-amber-50 hover:bg-amber-100/60 animate-bounce duration-1000' : 'text-slate-300 hover:text-slate-500'}`}
              title={
                pushPermission === 'granted' 
                  ? 'Push-Meldungen sind aktiv! 🔔' 
                  : pushPermission === 'denied'
                    ? 'Push-Meldungen sind im Browser blockiert ❌'
                    : 'Push-Meldungen aktivieren 🔔'
              }
            >
              <Bell className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title={soundEnabled ? 'Erlebnissounds stummschalten' : 'Sounds einschalten'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-500" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Task Lists Scroll View */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5">
          <h4 className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Eigene Listen
          </h4>

          {lists.map(list => {
            const isSelected = list.id === activeListId;
            const isEditing = editingListId === list.id;
            const taskCount = tasks.filter(t => t.listId === list.id && !t.completed).length;

            return (
              <div
                key={list.id}
                onClick={() => {
                  if (!isEditing) {
                    setActiveListId(list.id);
                    setSelectedTaskId(null); // Clear active edit drawer
                  }
                }}
                className={`group flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer border transition-all duration-150 ${
                  isSelected
                    ? 'bg-sky-50 border-sky-100 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 border-transparent'
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-1.5 w-full bg-slate-50/80 p-1.5 rounded-lg border border-sky-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-xs select-none shrink-0 bg-white p-1 rounded border border-slate-150 w-6 h-6 flex items-center justify-center">
                        {editingListIcon}
                      </span>
                      <input
                        type="text"
                        value={editingListName}
                        onChange={e => setEditingListName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateList()}
                        className="w-full text-[11px] py-1 px-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 font-medium text-slate-700"
                        autoFocus
                      />
                    </div>
                    
                    {/* Presets Grid */}
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider select-none">Symbol ändern:</span>
                      <div className="grid grid-cols-6 gap-2 p-1.5 bg-white border border-slate-150 rounded-md max-h-[160px] overflow-y-auto w-full custom-scrollbar">
                        {PRESET_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setEditingListIcon(emoji)}
                            className={`text-lg w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all cursor-pointer ${editingListIcon === emoji ? 'bg-sky-100 shadow-3xs scale-110 border border-sky-200' : 'border border-transparent'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 border-t border-slate-150 pt-1">
                      <button
                        onClick={() => setEditingListId(null)}
                        className="px-2 py-0.5 text-[9px] font-semibold text-slate-500 hover:text-slate-750 bg-slate-100 rounded cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleUpdateList}
                        className="px-2.5 py-0.5 text-[9px] font-bold text-white bg-sky-600 hover:bg-sky-500 rounded cursor-pointer shadow-3xs"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="mr-0.5 shrink-0 text-xs select-none w-5 h-5 flex items-center justify-center bg-white/60 group-hover:bg-white rounded border border-transparent group-hover:border-slate-100 shadow-3xs transition-all">
                      {getListDetails(list).icon}
                    </span>
                    <span className="truncate">{getListDetails(list).name}</span>
                  </div>
                )}

                {/* Counts and menu button */}
                {!isEditing && (
                  <div className="flex items-center space-x-1.5 shrink-0 opacity-100">
                    {taskCount > 0 && (
                      <span className="inline-flex items-center justify-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-150 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors">
                        {taskCount}
                      </span>
                    )}

                    {/* Controls */}
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingListId(list.id);
                          setEditingListName(getListDetails(list).name);
                          setEditingListIcon(getListDetails(list).icon);
                        }}
                        className="p-0.5 hover:text-sky-600 hover:bg-white rounded transition-colors"
                        title="Liste umbenennen & anpassen"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id, list.name);
                        }}
                        className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                        title="Liste löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add List Controls */}
          {showAddListForm ? (
            <div className="p-2 border border-slate-150 bg-white shadow-2xs rounded-lg mt-2 space-y-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-1.5">
                <span className="text-xs select-none shrink-0 bg-slate-50 p-1 rounded border border-slate-150 w-6 h-6 flex items-center justify-center">
                  {newListIcon}
                </span>
                <input
                  type="text"
                  placeholder="Name der Liste..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 font-medium text-slate-700"
                  autoFocus
                />
              </div>

              {/* Preset Emoji Picker Grid */}
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider select-none">Symbol / Icon wählen:</span>
                <div className="grid grid-cols-6 gap-2 p-1.5 bg-slate-50 border border-slate-150 rounded-lg max-h-[160px] overflow-y-auto custom-scrollbar">
                  {PRESET_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewListIcon(emoji)}
                      className={`text-lg w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all cursor-pointer ${newListIcon === emoji ? 'bg-white shadow-3xs scale-110 border border-sky-200' : 'border border-transparent'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                <button
                  onClick={() => setShowAddListForm(false)}
                  className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateList}
                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-500 rounded shadow-3xs cursor-pointer"
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

        {/* Integration Sync Note */}
        <div className="h-[45px] px-3 bg-slate-50/50 border-t border-notion-border text-[10px] select-none flex items-center shrink-0">
          {driveToken ? (
            <div className="flex items-center gap-1.5 font-bold text-slate-650">
              {syncStatus === 'syncing' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px]">Synchronisiere...</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-450" />
                  <span className="text-[10px] text-red-600">Sync-Fehler</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-650">Drive-Sync aktiv ✅</span>
                </>
              )}
            </div>
          ) : (
            <div className="text-slate-400 font-sans leading-none">
              <p className="text-[9.5px] font-medium leading-none">💡 Lokale Speicherung (privat &amp; verschlüsselt)</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Task List Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white h-full relative">
        
        {/* Header toolbar */}
        <div className="border-b border-slate-150 px-4 py-3 select-none flex flex-wrap items-center justify-between gap-3.5 bg-slate-50/40">
          <div className="flex items-center space-x-2 min-w-0">
            {/* List indicator badge for smaller sizes */}
            <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-none truncate max-w-[220px]">
              {activeList?.name || '☑️ Dashboard'}
            </h2>
            <span className="text-[10px] bg-sky-50 font-bold border border-sky-200/50 text-sky-600 px-1.5 py-0.5 rounded-full select-none leading-none">
              {activeTasks.length} offen
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Simple responsive Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Durchsuche Aufgaben..."
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
          </div>
        </div>

        {/* Quick Add inline input bar */}
        <div className="p-3 border-b border-slate-100 bg-white shrink-0 select-none">
          <form onSubmit={handleAddTask} className="flex gap-2 items-center">
            <div className="flex-1 relative flex items-center">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Neue Aufgabe hinzufügen... (Drücke Enter)"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9.5 pr-26 text-xs text-slate-800 placeholder-slate-400/90 focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-450 focus:border-transparent transition-all select-text"
              />
              
              {/* Star toggle in input */}
              <button
                type="button"
                onClick={() => setNewTaskStarred(!newTaskStarred)}
                className="absolute right-16.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200/50 rounded-md transition-all flex items-center justify-center cursor-pointer"
                title="Als wichtig markieren"
              >
                <Star 
                  className={`w-3.5 h-3.5 ${newTaskStarred ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400 hover:text-slate-600'}`} 
                />
              </button>

              {/* Quick Due Date & Time */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Due Time Picker */}
                <div className="relative flex items-center">
                  <input
                    type="time"
                    value={newTaskDueTime}
                    onChange={e => {
                      setNewTaskDueTime(e.target.value);
                      if (e.target.value && !newTaskDueDate) {
                        setNewTaskDueDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="w-6 h-6 opacity-0 absolute cursor-pointer z-10"
                    title="Uhrzeit hinzufügen"
                  />
                  <div className={`p-1 rounded-md border text-slate-450 flex items-center justify-center ${newTaskDueTime ? 'bg-sky-50 text-sky-600 border-sky-100' : 'border-transparent hover:bg-slate-100'}`}>
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
            {activeTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 text-sky-400/50 mx-auto mb-2" />
                <p className="text-xs font-medium">Alle erledigt oder keine Aufgaben in dieser Liste.</p>
                <p className="text-[10px] text-slate-300 mt-1">Leg gleich eine neue To-Do oben an!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedActiveTasks.map(task => {
                  const subtaskCount = task.subtasks.length;
                  const completedSubs = task.subtasks.filter(sub => sub.completed).length;
                  const isExpanded = !!expandedSubtasks[task.id];
                  const hasDetails = task.notes || task.dueDate || subtaskCount > 0;

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

                        {/* Star / Favourite Option */}
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaskStar(task.id);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Star
                              className={`w-4.5 h-4.5 ${
                                task.starred 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-300 opacity-25 group-hover/task:opacity-100 hover:text-slate-500 hover:scale-110 active:scale-95 transition-all'
                              }`}
                            />
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
              <button
                onClick={() => setCompletedCollapsed(!completedCollapsed)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold py-1 px-2 hover:bg-slate-100 rounded-md transition-all select-none"
              >
                {completedCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Abgeschlossen ({sortedCompletedTasks.length})</span>
              </button>

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

      {/* Slide-In Side Drawer for Edit details (Right Sidebar style matching authentic Google Tasks) */}
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
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-[10px] select-none">
                  ▼
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-sans leading-tight mt-1">
                Wenn aktiviert, wird beim Abhaken automatisch der nächste Termin in der Zukunft geplant (Täglich/Wöchentlich...) und ein erledigter Eintrag archiviert.
              </p>
            </div>

            {/* Subtasks listing */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5" />
                Teilaufgaben ({activeDetailTask.subtasks.filter(s => !s.completed).length} offen)
              </label>

              {/* Add inline subtask form */}
              <form onSubmit={handleAddSubtask} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Neue Teilaufgabe..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-450 bg-slate-50/30 select-text"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 disabled:opacity-40 text-sky-700 transition-colors cursor-pointer"
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
