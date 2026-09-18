/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReminderNotificationEvent {
  id: string;
  source: 'task' | 'kanban';
  title: string;
  subtitle?: string;
  boardId?: string;
  targetId: string;
  timestamp: number;
}

/**
 * Check if the current browser environment supports the Notifications API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retrieve the current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch {
    return 'default';
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationSound();
      showSystemNotification('DriveDeck Benachrichtigungen aktiv! 🔔', {
        body: 'Du wirst nun zuverlässig an fällige Aufgaben und Kanban-Termine erinnert.',
        icon: '/favicon.png'
      });
    }
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'default';
  }
}

/**
 * Play a crystal chime using Web Audio API synthesis
 */
export function playNotificationSound(): void {
  try {
    const soundSetting = localStorage.getItem('drivedeck_tasks_sound');
    if (soundSetting === 'false') return;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const masterVolume = ctx.createGain();
    masterVolume.gain.setValueAtTime(0.12, ctx.currentTime);
    masterVolume.connect(ctx.destination);

    // C6 Note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.50, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(1.0, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc1.connect(gain1);
    gain1.connect(masterVolume);

    // Harmonic C7 Note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2093.00, ctx.currentTime);
    gain2.gain.setValueAtTime(0.5, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc2.connect(gain2);
    gain2.connect(masterVolume);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio synthesis failed:', e);
  }
}

/**
 * Display an OS/Browser notification if permission is granted
 */
export function showSystemNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error showing system notification:', error);
    return null;
  }
}

/**
 * Dispatches an in-app toast event for cross-component alert displays
 */
export function emitInAppReminder(event: ReminderNotificationEvent): void {
  try {
    const customEvent = new CustomEvent('drivedeck-reminder', { detail: event });
    window.dispatchEvent(customEvent);
  } catch (e) {
    console.error('Error dispatching reminder event:', e);
  }
}

/**
 * Check if a reminder has already been notified
 */
function isAlreadyNotified(id: string, stamp: string): boolean {
  try {
    const key = `drivedeck_notified_${id}_${stamp}`;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function markAsNotified(id: string, stamp: string): void {
  try {
    const key = `drivedeck_notified_${id}_${stamp}`;
    localStorage.setItem(key, 'true');

    // Also update legacy list for backward compatibility
    const legacy = localStorage.getItem('drivedeck_notified_tasks');
    const list: string[] = legacy ? JSON.parse(legacy) : [];
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem('drivedeck_notified_tasks', JSON.stringify(list));
    }
  } catch (e) {
    console.error('Error recording notified task:', e);
  }
}

/**
 * Core reminder checker: scans tasks and kanban boards for due items
 */
export function checkAllDueReminders(isEnglish: boolean = false): void {
  if (typeof window === 'undefined') return;

  const now = new Date();
  const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // 1. Check Google Tasks / DriveTasks
  try {
    const rawTasks = localStorage.getItem('drivedeck_tasks_data');
    if (rawTasks) {
      const tasks = JSON.parse(rawTasks);
      if (Array.isArray(tasks)) {
        tasks.forEach((task: any) => {
          if (task.completed || !task.dueDate) return;

          // Check if due today
          const isDateMatch = task.dueDate === dateStr;
          // If task has time, check exact minute. If no time, check at 09:00 or current time
          const isTimeMatch = task.dueTime ? task.dueTime === timeStr : timeStr === '09:00';

          if (isDateMatch && isTimeMatch) {
            const stamp = task.dueTime || 'default';
            if (isAlreadyNotified(task.id, stamp)) return;

            markAsNotified(task.id, stamp);
            playNotificationSound();

            const title = isEnglish ? `⏰ Task Due: "${task.title}"` : `⏰ Aufgabe fällig: "${task.title}"`;
            const body = task.notes 
              ? (isEnglish ? `Note: ${task.notes}` : `Notiz: ${task.notes}`)
              : (isEnglish ? 'This task has reached its scheduled due date and time.' : 'Diese Aufgabe ist jetzt fällig.');

            showSystemNotification(title, { body });

            emitInAppReminder({
              id: task.id,
              source: 'task',
              title: task.title,
              subtitle: task.notes,
              targetId: task.id,
              timestamp: Date.now()
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Error checking task reminders:', err);
  }

  // 2. Check Kanban Boards & Cards
  try {
    const rawBoards = localStorage.getItem('drivedeck_kanban_boards');
    if (rawBoards) {
      const boards = JSON.parse(rawBoards);
      if (Array.isArray(boards)) {
        boards.forEach((board: any) => {
          if (!board.columns || !Array.isArray(board.columns)) return;

          board.columns.forEach((column: any) => {
            // Skip done / completed columns
            const colTitle = (column.title || '').toLowerCase().trim();
            if (
              colTitle.includes('erledigt') || 
              colTitle.includes('done') || 
              colTitle.includes('abgeschlossen') || 
              colTitle.includes('complete')
            ) {
              return;
            }

            if (!column.cards || !Array.isArray(column.cards)) return;

            column.cards.forEach((card: any) => {
              if (!card.dueDate) return;

              const isDateMatch = card.dueDate === dateStr;
              const isTimeMatch = card.dueTime ? card.dueTime === timeStr : timeStr === '09:00';

              if (isDateMatch && isTimeMatch) {
                const stamp = card.dueTime || 'default';
                if (isAlreadyNotified(card.id, stamp)) return;

                markAsNotified(card.id, stamp);
                playNotificationSound();

                const title = isEnglish ? `📋 Kanban Task Due: "${card.title}"` : `📋 Kanban-Aufgabe fällig: "${card.title}"`;
                const body = card.description 
                  ? (isEnglish ? `Board: ${board.title}\n${card.description}` : `Board: ${board.title}\n${card.description}`)
                  : (isEnglish ? `Card in board "${board.title}" is due now.` : `Karte im Board "${board.title}" ist jetzt fällig.`);

                showSystemNotification(title, { body });

                emitInAppReminder({
                  id: card.id,
                  source: 'kanban',
                  title: card.title,
                  subtitle: `${board.title} • ${column.title}`,
                  boardId: board.id,
                  targetId: card.id,
                  timestamp: Date.now()
                });
              }
            });
          });
        });
      }
    }
  } catch (err) {
    console.error('Error checking kanban reminders:', err);
  }
}
