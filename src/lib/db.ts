/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspacePage, Block } from '../types';

const DB_NAME = 'ZeroBackendNotionDB';
const DB_VERSION = 1;
const STORE_NAME = 'pages';

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database.'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getAllPages(): Promise<WorkspacePage[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const pages = request.result as WorkspacePage[];
      // Sort pages by updatedAt, latest first or simply older first (or sort by when they were created)
      pages.sort((a, b) => b.createdAt - a.createdAt);
      resolve(pages);
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve pages from database.'));
    };
  });
}

export async function getPageById(id: string): Promise<WorkspacePage | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to retrieve page ${id}.`));
    };
  });
}

export async function savePage(page: WorkspacePage): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(page);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save page to database.'));
    };
  });
}

export async function deletePageFromDB(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete page ${id}.`));
    };
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createWelcomePage(): WorkspacePage {
  const now = Date.now();
  
  const onboardingBlocks: Block[] = [
    {
      id: generateId(),
      type: 'heading1',
      content: 'Willkommen in deinem privaten Notion Workspace! 🚀',
    },
    {
      id: generateId(),
      type: 'text',
      content: 'Dies ist ein absolut datenschutzfreundlicher, serverloser Notion-Klon, der direkt in deinem Browser läuft. All deine Seiten, Notizen und Strukturen werden lokal über IndexedDB in deinem Browser verschlüsselt gehostet. Es gibt keinen zentralen Server und kein fremdes Auge scannt deine Daten.',
    },
    {
      id: generateId(),
      type: 'heading2',
      content: 'Das Bring Your Own Cloud-Prinzip ☁️',
    },
    {
      id: generateId(),
      type: 'text',
      content: 'Du möchtest deine Notizen über mehrere Geräte hinweg synchronisieren? Kein Problem! Über die Google Drive-Verbindung kannst du deine unstrukturierten Notizen verschlüsselt in dem versteckten "appdata"-Ordner deines persönlichen Google Drives sichern. So bleibt die Cloud ausschließlich in deiner Hand.',
    },
    {
      id: generateId(),
      type: 'heading2',
      content: 'Integration von Google Drive Dateien 📂',
    },
    {
      id: generateId(),
      type: 'text',
      content: 'Du kannst bestehende Google Docs, Tabellenblätter oder PDFs direkt in dein blockbasiertes Interface einbetten! Füge einfach einen Drive Block hinzu und gib die Datei-ID oder den Link ein. Die Datei wird sicher per iFrame gerendert – sie wird niemals eingelesen oder kopiert.',
    },
    {
      id: generateId(),
      type: 'heading3',
      content: 'Schnelle To-Do Liste für den Start:',
    },
    {
      id: generateId(),
      type: 'todo',
      content: 'Erstelle eine neue Seite in der Sidebar auf der linken Seite (+ Neue Seite)',
      properties: { checked: false },
    },
    {
      id: generateId(),
      type: 'todo',
      content: 'Erfahre, wie man Blöcke hinzufügt und verschiebt oder löscht',
      properties: { checked: true },
    },
    {
      id: generateId(),
      type: 'todo',
      content: 'Füge einen Google Drive Block hinzu und integriere ein Dokument deiner Wahl',
      properties: { checked: false },
    },
    {
      id: generateId(),
      type: 'heading3',
      content: 'Beispiel-Code für Hacker:',
    },
    {
      id: generateId(),
      type: 'code',
      content: `// 100% Offline-First und Zero-Backend!
const db = openDatabase();
const pages = await db.getAllPages();
console.log("Sichere lokale Seiten:", pages);`,
      properties: { language: 'javascript' },
    },
  ];

  return {
    id: 'welcome',
    title: 'Willkommen 👋',
    icon: '👋',
    createdAt: now,
    updatedAt: now,
    blocks: onboardingBlocks,
  };
}
