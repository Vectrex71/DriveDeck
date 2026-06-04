/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspacePage } from '../types';

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
    console.error('[DriveSync] Error locating sync file:', err);
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
    console.error('[DriveSync] Synchronization failed:', err);
    throw err;
  }
}
