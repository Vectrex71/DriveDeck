/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GoogleApiTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
}

export interface GoogleApiTask {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
  parent?: string;
  position?: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 timestamp (e.g. 2026-09-15T00:00:00.000Z)
  completed?: string; // RFC 3339 timestamp
  deleted?: boolean;
  hidden?: boolean;
}

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

/**
 * List all task lists for the authenticated user
 */
export async function fetchGoogleTaskLists(token: string): Promise<GoogleApiTaskList[]> {
  const res = await fetch(`${TASKS_API_BASE}/users/@me/lists?maxResults=100`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Tasks API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new task list
 */
export async function createGoogleTaskList(token: string, title: string): Promise<GoogleApiTaskList> {
  const res = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to create task list (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Update a task list's title
 */
export async function updateGoogleTaskList(token: string, taskListId: string, title: string): Promise<GoogleApiTaskList> {
  const res = await fetch(`${TASKS_API_BASE}/users/@me/lists/${encodeURIComponent(taskListId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to update task list (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Delete a task list
 */
export async function deleteGoogleTaskList(token: string, taskListId: string): Promise<void> {
  const res = await fetch(`${TASKS_API_BASE}/users/@me/lists/${encodeURIComponent(taskListId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to delete task list (${res.status}): ${errText}`);
  }
}

/**
 * Fetch all tasks in a task list (including completed and hidden)
 */
export async function fetchGoogleTasksInList(
  token: string, 
  taskListId: string, 
  showCompleted: boolean = true, 
  showHidden: boolean = true
): Promise<GoogleApiTask[]> {
  const params = new URLSearchParams({
    maxResults: '100',
    showCompleted: showCompleted ? 'true' : 'false',
    showHidden: showHidden ? 'true' : 'false'
  });

  const res = await fetch(`${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to fetch tasks for list ${taskListId} (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Insert a new task into a list
 */
export async function insertGoogleTask(
  token: string,
  taskListId: string,
  taskData: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
    status?: 'needsAction' | 'completed';
    parent?: string;
  }
): Promise<GoogleApiTask> {
  const res = await fetch(`${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to create task (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Update an existing task
 */
export async function updateGoogleTask(
  token: string,
  taskListId: string,
  taskId: string,
  taskData: {
    title?: string;
    notes?: string;
    due?: string | null; // RFC 3339 or null to clear
    status?: 'needsAction' | 'completed';
    completed?: string | null;
  }
): Promise<GoogleApiTask> {
  const bodyPayload: any = {};
  if (taskData.title !== undefined) bodyPayload.title = taskData.title;
  if (taskData.notes !== undefined) bodyPayload.notes = taskData.notes;
  if (taskData.due !== undefined) bodyPayload.due = taskData.due;
  if (taskData.status !== undefined) bodyPayload.status = taskData.status;
  if (taskData.completed !== undefined) bodyPayload.completed = taskData.completed;

  const res = await fetch(`${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to update task (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Delete a task
 */
export async function deleteGoogleTask(token: string, taskListId: string, taskId: string): Promise<void> {
  const res = await fetch(`${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to delete task (${res.status}): ${errText}`);
  }
}

/**
 * Clear all completed tasks in a task list
 */
export async function clearCompletedGoogleTasks(token: string, taskListId: string): Promise<void> {
  const res = await fetch(`${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to clear completed tasks (${res.status}): ${errText}`);
  }
}
