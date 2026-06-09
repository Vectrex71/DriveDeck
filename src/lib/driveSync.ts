/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspacePage, StickyNoteData, ProjectAlbum, KeepNoteData, Task, TaskList } from '../types';

export function logSyncError(scope: string, err: any) {
  const is401 = err?.message?.includes('401') || err?.toString()?.includes('401');
  if (is401) {
    console.warn(`[DriveSync] ${scope}: Token expired or unauthorized (401). Gracious handling active.`, err);
  } else {
    console.error(`[DriveSync] ${scope}:`, err);
  }
}

interface DriveFileLocator {
  id: string;
  name: string;
}

/**
 * Searches for the 'drivedeck_pages.json' inside Google Drive's hidden appDataFolder.
 */
async function locateSyncFile(token: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'drivedeck_pages.json' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)&pageSize=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to locate sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    logSyncError('Error locating sync file', err);
    throw err;
  }
}

/**
 * Downloads pages content using the file ID from Google Drive.
 */
async function downloadSyncFile(token: string, fileId: string): Promise<WorkspacePage[]> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[DriveSync] Error downloading sync file:', err);
    return [];
  }
}

/**
 * Creates the sync file in the appDataFolder.
 */
async function createSyncFile(token: string, pages: WorkspacePage[]): Promise<string> {
  try {
    const metadata = {
      name: 'drivedeck_pages.json',
      parents: ['appDataFolder']
    };
    
    const boundary = 'drivedeck_sync_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(pages)}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      throw new Error(`Failed to create sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('[DriveSync] Error creating sync file:', err);
    throw err;
  }
}

/**
 * Updates the existing sync file in Google Drive.
 */
async function updateSyncFile(token: string, fileId: string, pages: WorkspacePage[]): Promise<void> {
  try {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pages)
    });

    if (!res.ok) {
      throw new Error(`Failed to update sync file. HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[DriveSync] Error updating sync file:', err);
    throw err;
  }
}

export interface SyncStats {
  pages: WorkspacePage[];
  localUpdated: boolean;
  driveUpdated: boolean;
}

/**
 * Compares and merges local pages with remote pages.
 * Chooses the page with the latest 'updatedAt' timestamp if conflict occurs.
 */
export function mergePages(local: WorkspacePage[], remote: WorkspacePage[]): SyncStats {
  const localMap = new Map(local.map(p => [p.id, p]));
  const remoteMap = new Map(remote.map(p => [p.id, p]));
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
  
  const merged: WorkspacePage[] = [];
  let localUpdated = false;
  let driveUpdated = false;

  for (const id of allIds) {
    const locPage = localMap.get(id);
    const remPage = remoteMap.get(id);

    if (locPage && remPage) {
      if (locPage.updatedAt > remPage.updatedAt) {
        merged.push(locPage);
        driveUpdated = true; // Local is newer
      } else if (remPage.updatedAt > locPage.updatedAt) {
        merged.push(remPage);
        localUpdated = true; // Remote is newer
      } else {
        merged.push(locPage); // Equal
      }
    } else if (locPage) {
      merged.push(locPage);
      driveUpdated = true; // Only on local
    } else if (remPage) {
      merged.push(remPage);
      localUpdated = true; // Only on remote
    }
  }

  // Sort by updatedAt descending so matching is aligned
  merged.sort((a, b) => b.createdAt - a.createdAt);

  return { pages: merged, localUpdated, driveUpdated };
}

/**
 * Master Sync routine:
 * 1. Checks if sync file exists on Drive.
 * 2. If it does not exist: creates it with current local files.
 * 3. If it exists: downloads remote file, matches/merges with local indexedDB database,
 *    and uploads the merged version to Drive + updates local if needed.
 * If forceOverwriteDrive is true, sync is bypassed and local pages are written directly to Drive.
 */
export async function executeDriveSync(
  token: string, 
  localPages: WorkspacePage[], 
  forceOverwriteDrive: boolean = false
): Promise<SyncStats> {
  try {
    const fileId = await locateSyncFile(token);
    
    if (!fileId) {
      console.log('[DriveSync] No sync file found on Drive. Creating new one...');
      const newFileId = await createSyncFile(token, localPages);
      return {
        pages: localPages,
        localUpdated: false,
        driveUpdated: true
      };
    }

    if (forceOverwriteDrive) {
      console.log('[DriveSync] Forcing overwrite of remote pages on Google Drive...');
      await updateSyncFile(token, fileId, localPages);
      return {
        pages: localPages,
        localUpdated: false,
        driveUpdated: true
      };
    }

    console.log('[DriveSync] Sync file found. Downloading remote pages...');
    const remotePages = await downloadSyncFile(token, fileId);
    
    const stats = mergePages(localPages, remotePages);
    
    if (stats.driveUpdated) {
      console.log('[DriveSync] Local changes/new pages discovered. Updating Google Drive pages...');
      await updateSyncFile(token, fileId, stats.pages);
    } else {
      console.log('[DriveSync] Google Drive and local states are fully in-sync.');
    }

    return stats;
  } catch (err) {
    logSyncError('Synchronization failed', err);
    throw err;
  }
}

/**
 * Searches for the 'drivedeck_sticky_notes.json' inside Google Drive's hidden appDataFolder.
 */
async function locateStickyNotesSyncFile(token: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'drivedeck_sticky_notes.json' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)&pageSize=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to locate sticky notes sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('[DriveSync] Error locating sticky notes sync file:', err);
    throw err;
  }
}

/**
 * Downloads sticky notes content using the file ID from Google Drive.
 */
async function downloadStickyNotesSyncFile(token: string, fileId: string): Promise<StickyNoteData[]> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download sticky notes sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[DriveSync] Error downloading sticky notes sync file:', err);
    return [];
  }
}

/**
 * Creates the sticky notes sync file in the appDataFolder.
 */
async function createStickyNotesSyncFile(token: string, notes: StickyNoteData[]): Promise<string> {
  try {
    const metadata = {
      name: 'drivedeck_sticky_notes.json',
      parents: ['appDataFolder']
    };
    
    const boundary = 'drivedeck_sync_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(notes)}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      throw new Error(`Failed to create sticky notes sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('[DriveSync] Error creating sticky notes sync file:', err);
    throw err;
  }
}

/**
 * Updates the existing sticky notes sync file in Google Drive.
 */
async function updateStickyNotesSyncFile(token: string, fileId: string, notes: StickyNoteData[]): Promise<void> {
  try {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notes)
    });

    if (!res.ok) {
      throw new Error(`Failed to update sticky notes sync file. HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[DriveSync] Error updating sticky notes sync file:', err);
    throw err;
  }
}

/**
 * Merges local and remote sticky notes by comparing updatedAt.
 */
export function mergeStickyNotes(local: StickyNoteData[], remote: StickyNoteData[]): {
  notes: StickyNoteData[];
  localUpdated: boolean;
  driveUpdated: boolean;
} {
  const localMap = new Map(local.map(n => [n.id, n]));
  const remoteMap = new Map(remote.map(n => [n.id, n]));
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  const merged: StickyNoteData[] = [];
  let localUpdated = false;
  let driveUpdated = false;

  for (const id of allIds) {
    const locNote = localMap.get(id);
    const remNote = remoteMap.get(id);

    if (locNote && remNote) {
      if (locNote.updatedAt > remNote.updatedAt) {
        merged.push(locNote);
        driveUpdated = true;
      } else if (remNote.updatedAt > locNote.updatedAt) {
        merged.push(remNote);
        localUpdated = true;
      } else {
        merged.push(locNote);
      }
    } else if (locNote) {
      merged.push(locNote);
      driveUpdated = true;
    } else if (remNote) {
      merged.push(remNote);
      localUpdated = true;
    }
  }

  // Preserves position / sorting order
  merged.sort((a, b) => {
    const posA = a.position !== undefined ? a.position : Number.MAX_SAFE_INTEGER;
    const posB = b.position !== undefined ? b.position : Number.MAX_SAFE_INTEGER;
    if (posA !== posB) {
      return posA - posB;
    }
    return b.updatedAt - a.updatedAt;
  });

  return { notes: merged, localUpdated, driveUpdated };
}

/**
 * Drives/Synchronizes sticky notes list from Drive's appDataFolder.
 */
export async function executeStickyNotesSync(
  token: string,
  localNotes: StickyNoteData[],
  forceOverwriteDrive: boolean = false
): Promise<{ notes: StickyNoteData[]; localUpdated: boolean; driveUpdated: boolean; }> {
  try {
    const fileId = await locateStickyNotesSyncFile(token);

    if (!fileId) {
      console.log('[DriveSync] No sticky notes sync file on Drive. Creating new template...');
      const newFileId = await createStickyNotesSyncFile(token, localNotes);
      return {
        notes: localNotes,
        localUpdated: false,
        driveUpdated: true
      };
    }

    if (forceOverwriteDrive) {
      console.log('[DriveSync] Forcing overwrite of sticky notes on Google Drive...');
      await updateStickyNotesSyncFile(token, fileId, localNotes);
      return {
        notes: localNotes,
        localUpdated: false,
        driveUpdated: true
      };
    }

    console.log('[DriveSync] Sticky notes sync file found. Downloading from Drive...');
    const remoteNotes = await downloadStickyNotesSyncFile(token, fileId);
    
    const stats = mergeStickyNotes(localNotes, remoteNotes);

    if (stats.driveUpdated) {
      console.log('[DriveSync] Sticky notes updated on Drive with newer local version...');
      await updateStickyNotesSyncFile(token, fileId, stats.notes);
    }

    return stats;
  } catch (err) {
    console.error('[DriveSync] Synchronization of sticky notes failed:', err);
    throw err;
  }
}

/**
 * Searches for 'drivedeck_albums.json' inside Google Drive's hidden appDataFolder.
 */
async function locateAlbumsSyncFile(token: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'drivedeck_albums.json' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)&pageSize=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to locate albums sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('[DriveSync] Error locating albums sync file:', err);
    throw err;
  }
}

/**
 * Downloads albums content using the file ID from Google Drive.
 */
async function downloadAlbumsSyncFile(token: string, fileId: string): Promise<ProjectAlbum[]> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download albums sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[DriveSync] Error downloading albums sync file:', err);
    return [];
  }
}

/**
 * Creates the albums sync file in the appDataFolder.
 */
async function createAlbumsSyncFile(token: string, albums: ProjectAlbum[]): Promise<string> {
  try {
    const metadata = {
      name: 'drivedeck_albums.json',
      parents: ['appDataFolder']
    };
    
    const boundary = 'drivedeck_sync_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(albums)}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      throw new Error(`Failed to create albums sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('[DriveSync] Error creating albums sync file:', err);
    throw err;
  }
}

/**
 * Updates the existing albums sync file in Google Drive.
 */
async function updateAlbumsSyncFile(token: string, fileId: string, albums: ProjectAlbum[]): Promise<void> {
  try {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(albums)
    });

    if (!res.ok) {
      throw new Error(`Failed to update albums sync file. HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[DriveSync] Error updating albums sync file:', err);
    throw err;
  }
}

/**
 * Merges local and remote albums by comparing id.
 */
export function mergeAlbums(local: ProjectAlbum[], remote: ProjectAlbum[]): {
  albums: ProjectAlbum[];
  localUpdated: boolean;
  driveUpdated: boolean;
} {
  const localMap = new Map(local.map(a => [a.id, a]));
  const remoteMap = new Map(remote.map(a => [a.id, a]));
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  const merged: ProjectAlbum[] = [];
  let localUpdated = false;
  let driveUpdated = false;

  for (const id of allIds) {
    const locAlbum = localMap.get(id);
    const remAlbum = remoteMap.get(id);

    if (locAlbum && remAlbum) {
      merged.push(locAlbum);
    } else if (locAlbum) {
      merged.push(locAlbum);
      driveUpdated = true; // Only on local
    } else if (remAlbum) {
      merged.push(remAlbum);
      localUpdated = true; // Only on remote
    }
  }

  // Ensure at least one defaults project exists if list is empty
  if (merged.length === 0) {
    merged.unshift({
      id: 'welcome-project',
      name: 'Willkommen',
      createdAt: Date.now()
    });
    driveUpdated = true;
  }

  // Sort by position (if set) or fallback to createdAt ascending
  merged.sort((a, b) => {
    const posA = a.position !== undefined ? a.position : a.createdAt;
    const posB = b.position !== undefined ? b.position : b.createdAt;
    return posA - posB;
  });

  return { albums: merged, localUpdated, driveUpdated };
}

/**
 * Drives/Synchronizes project albums list from Drive's appDataFolder.
 */
export async function executeAlbumsSync(
  token: string,
  localAlbums: ProjectAlbum[],
  forceOverwriteDrive: boolean = false
): Promise<{ albums: ProjectAlbum[]; localUpdated: boolean; driveUpdated: boolean; }> {
  try {
    const fileId = await locateAlbumsSyncFile(token);

    if (!fileId) {
      console.log('[DriveSync] No albums sync file on Drive. Creating new template...');
      const newFileId = await createAlbumsSyncFile(token, localAlbums);
      return {
        albums: localAlbums,
        localUpdated: false,
        driveUpdated: true
      };
    }

    if (forceOverwriteDrive) {
      console.log('[DriveSync] Forcing overwrite of albums on Google Drive...');
      await updateAlbumsSyncFile(token, fileId, localAlbums);
      return {
        albums: localAlbums,
        localUpdated: false,
        driveUpdated: true
      };
    }

    console.log('[DriveSync] Albums sync file found. Downloading from Drive...');
    const remoteAlbums = await downloadAlbumsSyncFile(token, fileId);
    
    const stats = mergeAlbums(localAlbums, remoteAlbums);

    if (stats.driveUpdated) {
      console.log('[DriveSync] Albums updated on Drive with newer local version...');
      await updateAlbumsSyncFile(token, fileId, stats.albums);
    }

    return stats;
  } catch (err) {
    console.error('[DriveSync] Synchronization of albums failed:', err);
    throw err;
  }
}

/**
 * Searches for 'drivedeck_keep_notes.json' inside Google Drive's hidden appDataFolder.
 */
async function locateKeepNotesSyncFile(token: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'drivedeck_keep_notes.json' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)&pageSize=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to locate keep notes sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('[DriveSync] Error locating keep notes sync file:', err);
    throw err;
  }
}

/**
 * Downloads keep notes from Google Drive appDataFolder.
 */
async function downloadKeepNotesSyncFile(token: string, fileId: string): Promise<KeepNoteData[]> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download keep notes sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[DriveSync] Error downloading keep notes sync file:', err);
    return [];
  }
}

/**
 * Creates the keep notes sync file in the appDataFolder.
 */
async function createKeepNotesSyncFile(token: string, notes: KeepNoteData[]): Promise<string> {
  try {
    const metadata = {
      name: 'drivedeck_keep_notes.json',
      parents: ['appDataFolder']
    };
    
    const boundary = 'drivedeck_sync_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(notes)}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      throw new Error(`Failed to create keep notes sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('[DriveSync] Error creating keep notes sync file:', err);
    throw err;
  }
}

/**
 * Updates the existing keep notes sync file in Google Drive.
 */
async function updateKeepNotesSyncFile(token: string, fileId: string, notes: KeepNoteData[]): Promise<void> {
  try {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notes)
    });

    if (!res.ok) {
      throw new Error(`Failed to update keep notes sync file. HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[DriveSync] Error updating keep notes sync file:', err);
    throw err;
  }
}

/**
 * Merges local and remote keep notes by comparing timestamps.
 */
export function mergeKeepNotes(local: KeepNoteData[], remote: KeepNoteData[]): {
  notes: KeepNoteData[];
  localUpdated: boolean;
  driveUpdated: boolean;
} {
  const localMap = new Map(local.map(n => [n.id, n]));
  const remoteMap = new Map(remote.map(n => [n.id, n]));
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  const merged: KeepNoteData[] = [];
  let localUpdated = false;
  let driveUpdated = false;

  for (const id of allIds) {
    const locNote = localMap.get(id);
    const remNote = remoteMap.get(id);

    if (locNote && remNote) {
      if (locNote.updatedAt > remNote.updatedAt) {
        merged.push(locNote);
        driveUpdated = true;
      } else if (remNote.updatedAt > locNote.updatedAt) {
        merged.push(remNote);
        localUpdated = true;
      } else {
        merged.push(locNote);
      }
    } else if (locNote) {
      merged.push(locNote);
      driveUpdated = true;
    } else if (remNote) {
      merged.push(remNote);
      localUpdated = true;
    }
  }

  // Sort: pinned first, then by updatedAt descending
  merged.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  return { notes: merged, localUpdated, driveUpdated };
}

/**
 * Synchronizes Keep notes with Google Drive appDataFolder.
 */
export async function executeKeepNotesSync(
  token: string,
  localNotes: KeepNoteData[],
  forceOverwriteDrive: boolean = false
): Promise<{ notes: KeepNoteData[]; localUpdated: boolean; driveUpdated: boolean; }> {
  try {
    const fileId = await locateKeepNotesSyncFile(token);

    if (!fileId) {
      console.log('[DriveSync] No keep notes sync file on Drive. Creating new file...');
      const newFileId = await createKeepNotesSyncFile(token, localNotes);
      return {
        notes: localNotes,
        localUpdated: false,
        driveUpdated: true
      };
    }

    if (forceOverwriteDrive) {
      console.log('[DriveSync] Forcing override of keep notes on Google Drive...');
      await updateKeepNotesSyncFile(token, fileId, localNotes);
      return {
        notes: localNotes,
        localUpdated: false,
        driveUpdated: true
      };
    }

    console.log('[DriveSync] Keep notes sync file found. Downloading from Drive...');
    const remoteNotes = await downloadKeepNotesSyncFile(token, fileId);
    
    const stats = mergeKeepNotes(localNotes, remoteNotes);

    if (stats.driveUpdated) {
      console.log('[DriveSync] Keep notes updated on Drive with newer local version...');
      await updateKeepNotesSyncFile(token, fileId, stats.notes);
    }

    return stats;
  } catch (err) {
    console.error('[DriveSync] Synchronization of keep notes failed:', err);
    throw err;
  }
}

/**
 * Searches for 'drivedeck_tasks_and_lists.json' inside Google Drive's hidden appDataFolder.
 */
async function locateTasksSyncFile(token: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'drivedeck_tasks_and_lists.json' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)&pageSize=1`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to locate tasks sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('[DriveSync] Error locating tasks sync file:', err);
    throw err;
  }
}

/**
 * Downloads tasks and lists from Google Drive appDataFolder.
 */
async function downloadTasksSyncFile(token: string, fileId: string): Promise<{ lists: TaskList[]; tasks: Task[] }> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download tasks sync file. HTTP ${res.status}`);
    }

    const data = await res.json();
    return data && typeof data === 'object' && Array.isArray(data.lists) && Array.isArray(data.tasks) 
      ? data 
      : { lists: [], tasks: [] };
  } catch (err) {
    console.error('[DriveSync] Error downloading tasks sync file:', err);
    return { lists: [], tasks: [] };
  }
}

/**
 * Creates the tasks sync file in the appDataFolder.
 */
async function createTasksSyncFile(token: string, data: { lists: TaskList[]; tasks: Task[] }): Promise<string> {
  try {
    const metadata = {
      name: 'drivedeck_tasks_and_lists.json',
      parents: ['appDataFolder']
    };
    
    const boundary = 'drivedeck_sync_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(data)}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      throw new Error(`Failed to create tasks sync file. HTTP ${res.status}`);
    }

    const resJson = await res.json();
    return resJson.id;
  } catch (err) {
    console.error('[DriveSync] Error creating tasks sync file:', err);
    throw err;
  }
}

/**
 * Updates the existing tasks sync file in Google Drive.
 */
async function updateTasksSyncFile(token: string, fileId: string, data: { lists: TaskList[]; tasks: Task[] }): Promise<void> {
  try {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      throw new Error(`Failed to update tasks sync file. HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[DriveSync] Error updating tasks sync file:', err);
    throw err;
  }
}

/**
 * Merges local and remote tasks/lists by comparing updated timestamps.
 */
export function mergeTasksAndLists(
  localLists: TaskList[],
  localTasks: Task[],
  remoteLists: TaskList[],
  remoteTasks: Task[]
): {
  lists: TaskList[];
  tasks: Task[];
  localUpdated: boolean;
  driveUpdated: boolean;
} {
  let localUpdated = false;
  let driveUpdated = false;

  // Merge lists
  const localListsMap = new Map(localLists.map(l => [l.id, l]));
  const remoteListsMap = new Map(remoteLists.map(l => [l.id, l]));
  const allListIds = new Set([...localListsMap.keys(), ...remoteListsMap.keys()]);
  const mergedLists: TaskList[] = [];

  for (const id of allListIds) {
    const locList = localListsMap.get(id);
    const remList = remoteListsMap.get(id);

    if (locList && remList) {
      if (locList.createdAt > remList.createdAt) {
        mergedLists.push(locList);
        driveUpdated = true;
      } else {
        mergedLists.push(remList);
        if (locList.name !== remList.name) {
          localUpdated = true;
        }
      }
    } else if (locList) {
      mergedLists.push(locList);
      driveUpdated = true;
    } else if (remList) {
      mergedLists.push(remList);
      localUpdated = true;
    }
  }

  // Merge tasks
  const localTasksMap = new Map(localTasks.map(t => [t.id, t]));
  const remoteTasksMap = new Map(remoteTasks.map(t => [t.id, t]));
  const allTaskIds = new Set([...localTasksMap.keys(), ...remoteTasksMap.keys()]);
  const mergedTasks: Task[] = [];

  for (const id of allTaskIds) {
    const locTask = localTasksMap.get(id);
    const remTask = remoteTasksMap.get(id);

    if (locTask && remTask) {
      if (locTask.updatedAt > remTask.updatedAt) {
        mergedTasks.push(locTask);
        driveUpdated = true;
      } else if (remTask.updatedAt > locTask.updatedAt) {
        mergedTasks.push(remTask);
        localUpdated = true;
      } else {
        mergedTasks.push(locTask);
      }
    } else if (locTask) {
      mergedTasks.push(locTask);
      driveUpdated = true;
    } else if (remTask) {
      mergedTasks.push(remTask);
      localUpdated = true;
    }
  }

  return {
    lists: mergedLists,
    tasks: mergedTasks,
    localUpdated,
    driveUpdated
  };
}

/**
 * Synchronizes Task lists and Tasks with Google Drive appDataFolder.
 */
export async function executeTasksSync(
  token: string,
  localLists: TaskList[],
  localTasks: Task[],
  forceOverwriteDrive: boolean = false
): Promise<{ lists: TaskList[]; tasks: Task[]; localUpdated: boolean; driveUpdated: boolean }> {
  try {
    const fileId = await locateTasksSyncFile(token);

    if (!fileId) {
      console.log('[DriveSync] No tasks sync file on Drive. Creating new file...');
      const newFileId = await createTasksSyncFile(token, { lists: localLists, tasks: localTasks });
      return {
        lists: localLists,
        tasks: localTasks,
        localUpdated: false,
        driveUpdated: true
      };
    }

    if (forceOverwriteDrive) {
      console.log('[DriveSync] Forcing overwrite of tasks on Google Drive...');
      await updateTasksSyncFile(token, fileId, { lists: localLists, tasks: localTasks });
      return {
        lists: localLists,
        tasks: localTasks,
        localUpdated: false,
        driveUpdated: true
      };
    }

    console.log('[DriveSync] Tasks sync file found. Downloading from Drive...');
    const remoteData = await downloadTasksSyncFile(token, fileId);
    
    const stats = mergeTasksAndLists(localLists, localTasks, remoteData.lists || [], remoteData.tasks || []);

    if (stats.driveUpdated) {
      console.log('[DriveSync] Tasks updated on Drive with newer local version...');
      await updateTasksSyncFile(token, fileId, { lists: stats.lists, tasks: stats.tasks });
    }

    return stats;
  } catch (err) {
    console.error('[DriveSync] Synchronization of tasks failed:', err);
    throw err;
  }
}

/**
 * Resolves or creates a folder on regular Google Drive named "DriveDeck".
 * Returns the folder's ID.
 */
export async function getOrCreateShareFolder(token: string): Promise<string> {
  try {
    const q = encodeURIComponent("name = 'DriveDeck' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Name not found, create the folder
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'DriveDeck',
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create "DriveDeck" folder: ${createRes.status} - ${errorText}`);
    }

    const folderData = await createRes.json();
    return folderData.id;
  } catch (err) {
    console.error('[DriveSync] getOrCreateShareFolder failed, falling back to root:', err);
    return 'root';
  }
}

/**
 * Sets public read/write permission on a Google Drive file ("anyone with link can read/write").
 */
export async function setFilePublicPermission(token: string, fileId: string, role: 'reader' | 'writer' = 'reader'): Promise<void> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role,
        type: 'anyone'
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to set permissions: ${res.status} - ${errorText}`);
    }
  } catch (err) {
    console.error('[DriveSync] error setting public permission on file:', err);
    throw err;
  }
}

/**
 * Creates a public sharing file for a WorkspacePage on regular Google Drive and shares it.
 */
export async function sharePageOnDrive(token: string, page: WorkspacePage, role: 'reader' | 'writer' = 'reader'): Promise<{ fileId: string }> {
  try {
    const folderId = await getOrCreateShareFolder(token);
    const metadata = {
      name: `drivedeck_share_p_${page.id}.json`,
      description: `Shared page "${page.title}" from DriveDeck.`,
      mimeType: 'application/json',
      parents: [folderId]
    };

    const boundary = 'drivedeck_share_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify({ type: 'page', page })}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create share file on Drive. HTTP ${res.status} - ${errText}`);
    }

    const data = await res.json();
    const fileId = data.id;

    // Set permission so anyone with link can view/edit
    await setFilePublicPermission(token, fileId, role);

    return { fileId };
  } catch (err) {
    console.error('[DriveSync] sharePageOnDrive failed:', err);
    throw err;
  }
}

/**
 * Creates a public sharing file for a Project Album (Folder) and its pages on regular Google Drive.
 */
export async function shareAlbumOnDrive(token: string, album: ProjectAlbum, pages: WorkspacePage[], role: 'reader' | 'writer' = 'reader'): Promise<{ fileId: string }> {
  try {
    const folderId = await getOrCreateShareFolder(token);
    const albumPages = pages.filter(p => p.albumId === album.id);
    const metadata = {
      name: `drivedeck_share_a_${album.id}.json`,
      description: `Shared album "${album.name}" from DriveDeck with ${albumPages.length} active page(s).`,
      mimeType: 'application/json',
      parents: [folderId]
    };

    const boundary = 'drivedeck_share_boundary';
    const body = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify({ type: 'album', album, pages: albumPages })}\r\n` +
      `--${boundary}--`;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create album share file on Drive. HTTP ${res.status} - ${errText}`);
    }

    const data = await res.json();
    const fileId = data.id;

    // Set permission so anyone with link can view/edit
    await setFilePublicPermission(token, fileId, role);

    return { fileId };
  } catch (err) {
    console.error('[DriveSync] shareAlbumOnDrive failed:', err);
    throw err;
  }
}

/**
 * Downloads shared page or album data by its fileId.
 */
export async function downloadSharedFile(token: string, fileId: string): Promise<any> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to download shared file. HTTP ${res.status} - ${errText}`);
    }

    return await res.json();
  } catch (err) {
    console.error('[DriveSync] Error downloading shared file:', err);
    throw err;
  }
}

