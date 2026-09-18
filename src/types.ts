/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'code'
  | 'google-drive'
  | 'kanban';

export interface CalendarSource {
  id: string;
  color: string;
  name?: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string; // Color key: sky, emerald, amber, rose, purple, slate
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  tags?: string[];
  checklists?: { id: string; text: string; completed: boolean }[];
  assignee?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  cards: KanbanCard[];
}

export interface KanbanBoardData {
  id: string;
  title: string;
  description?: string;
  columns: KanbanColumn[];
  createdAt: number;
  updatedAt: number;
}

export interface BlockProperty {
  checked?: boolean;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  embedUrl?: string;
  language?: string;
  isVoiceRecorder?: boolean;
  calendars?: CalendarSource[];
  orientation?: 'portrait' | 'landscape';
  kanbanBoard?: KanbanBoardData;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: BlockProperty;
}

export interface WorkspacePage {
  id: string;
  title: string;
  icon: string; // Emoji character or Lucide icon string
  coverUrl?: string; // Optional cover banner URL
  createdAt: number;
  updatedAt: number;
  blocks: Block[];
  albumId?: string; // Optional ID linking this page to a Project Album
  isSubscription?: boolean; // If true, this page is downloaded as a read-only subscription
}

export interface ProjectAlbum {
  id: string;
  name: string;
  createdAt: number;
  position?: number;
  pinned?: boolean;
  color?: string;
  icon?: string;
  isSubscription?: boolean; // If true, this project folder is a read-only subscription
}

export interface StickyAttachment {
  id: string;
  type: 'drive' | 'link' | 'image';
  title: string;
  url: string;
  mimeType?: string;
  fileId?: string;
}

export interface StickyNoteData {
  id: string;
  title: string;
  content: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange' | 'gray';
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  position?: number; // Custom drag-and-drop order ranking
  tags?: string[];
  attachments?: StickyAttachment[];
}

export interface KeepChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KeepNoteData {
  id: string;
  title: string;
  content: string;
  color?: string; // Tailwind class, e.g., 'bg-amber-100/70 border-amber-200'
  isPinned?: boolean;
  isChecklist?: boolean;
  checklistItems?: KeepChecklistItem[];
  updatedAt: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  notes: string;
  completed: boolean;
  completedAt?: number;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  starred: boolean;
  subtasks: SubTask[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskList {
  id: string;
  name: string;
  icon?: string;
  createdAt: number;
}

export const ADMIN_EMAILS: string[] = ['hj.wuethrich@gmail.com'];

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalized);
}


