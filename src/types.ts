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
  | 'google-drive';

export interface BlockProperty {
  checked?: boolean;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  embedUrl?: string;
  language?: string;
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
}
