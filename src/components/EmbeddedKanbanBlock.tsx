/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Kanban,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Calendar,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  Edit2
} from 'lucide-react';
import { Block, KanbanBoardData, KanbanColumn, KanbanCard } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface EmbeddedKanbanBlockProps {
  block: Block;
  onUpdateBlock: (updated: Block) => void;
  isReadOnly?: boolean;
}

const DEFAULT_EMBEDDED_BOARD_DE: KanbanBoardData = {
  id: 'embedded-board-de',
  title: 'Projekt-Board',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  columns: [
    {
      id: 'emb-col-1',
      title: 'Zu erledigen',
      color: 'amber',
      cards: [
        {
          id: 'emb-card-1',
          title: 'Erste Aufgabe formulieren',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
    },
    {
      id: 'emb-col-2',
      title: 'In Arbeit',
      color: 'sky',
      cards: []
    },
    {
      id: 'emb-col-3',
      title: 'Erledigt',
      color: 'emerald',
      cards: []
    }
  ]
};

const DEFAULT_EMBEDDED_BOARD_EN: KanbanBoardData = {
  id: 'embedded-board-en',
  title: 'Project Board',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  columns: [
    {
      id: 'emb-col-1',
      title: 'To Do',
      color: 'amber',
      cards: [
        {
          id: 'emb-card-1',
          title: 'Draft first milestone task',
          priority: 'medium',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
    },
    {
      id: 'emb-col-2',
      title: 'In Progress',
      color: 'sky',
      cards: []
    },
    {
      id: 'emb-col-3',
      title: 'Done',
      color: 'emerald',
      cards: []
    }
  ]
};

function getLocalizedEmbeddedBoard(rawBoard: KanbanBoardData | undefined, lang: string): KanbanBoardData {
  const isDe = lang === 'de';
  if (!rawBoard) {
    return isDe ? DEFAULT_EMBEDDED_BOARD_DE : DEFAULT_EMBEDDED_BOARD_EN;
  }

  const isDemo = 
    rawBoard.id === 'embedded-board-de' || 
    rawBoard.id === 'embedded-board-en' || 
    rawBoard.title === 'Projekt-Board' || 
    rawBoard.title === 'Project Board';

  if (!isDemo) return rawBoard;

  const colTranslations: Record<string, { de: string; en: string }> = {
    'Zu erledigen': { de: 'Zu erledigen', en: 'To Do' },
    'To Do': { de: 'Zu erledigen', en: 'To Do' },
    'In Arbeit': { de: 'In Arbeit', en: 'In Progress' },
    'In Progress': { de: 'In Arbeit', en: 'In Progress' },
    'Erledigt': { de: 'Erledigt', en: 'Done' },
    'Done': { de: 'Erledigt', en: 'Done' }
  };

  const cardTranslations: Record<string, { de: string; en: string }> = {
    'Erste Aufgabe formulieren': { de: 'Erste Aufgabe formulieren', en: 'Draft first milestone task' },
    'Draft first milestone task': { de: 'Erste Aufgabe formulieren', en: 'Draft first milestone task' }
  };

  return {
    ...rawBoard,
    title: isDe ? 'Projekt-Board' : 'Project Board',
    columns: rawBoard.columns.map(col => ({
      ...col,
      title: colTranslations[col.title]?.[isDe ? 'de' : 'en'] || col.title,
      cards: col.cards.map(c => ({
        ...c,
        title: cardTranslations[c.title]?.[isDe ? 'de' : 'en'] || c.title
      }))
    }))
  };
}

export default function EmbeddedKanbanBlock({
  block,
  onUpdateBlock,
  isReadOnly = false
}: EmbeddedKanbanBlockProps) {
  const { language } = useLanguage();

  const board: KanbanBoardData = useMemo(() => {
    return getLocalizedEmbeddedBoard(block.properties?.kanbanBoard, language);
  }, [block.properties?.kanbanBoard, language]);

  const [activeCardModal, setActiveCardModal] = useState<{ card: KanbanCard; columnId: string } | null>(null);
  const [quickAddColId, setQuickAddColId] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; colId: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // New Column prompt
  const [showNewCol, setShowNewCol] = useState(false);
  const [newColName, setNewColName] = useState('');

  const updateBoard = (updatedBoard: KanbanBoardData) => {
    onUpdateBlock({
      ...block,
      properties: {
        ...block.properties,
        kanbanBoard: {
          ...updatedBoard,
          updatedAt: Date.now()
        }
      }
    });
  };

  // Add Card to column
  const handleAddCard = (colId: string) => {
    if (!quickAddText.trim() || isReadOnly) return;

    const newCard: KanbanCard = {
      id: `emb-card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: quickAddText.trim(),
      priority: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newCols = board.columns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          cards: [...col.cards, newCard]
        };
      }
      return col;
    });

    updateBoard({ ...board, columns: newCols });
    setQuickAddText('');
    setQuickAddColId(null);
  };

  // Drag and Drop
  const handleDragStart = (cardId: string, colId: string) => {
    if (isReadOnly) return;
    setDraggedCard({ cardId, colId });
  };

  const handleDrop = (targetColId: string) => {
    setDragOverCol(null);
    if (!draggedCard || isReadOnly) return;

    const { cardId, colId: srcColId } = draggedCard;
    if (srcColId === targetColId) {
      setDraggedCard(null);
      return;
    }

    let movingCard: KanbanCard | null = null;
    const strippedCols = board.columns.map(col => {
      if (col.id === srcColId) {
        const found = col.cards.find(c => c.id === cardId);
        if (found) movingCard = found;
        return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
      }
      return col;
    });

    if (movingCard) {
      const finalCols = strippedCols.map(col => {
        if (col.id === targetColId && movingCard) {
          return {
            ...col,
            cards: [...col.cards, { ...movingCard, updatedAt: Date.now() }]
          };
        }
        return col;
      });
      updateBoard({ ...board, columns: finalCols });
    }

    setDraggedCard(null);
  };

  // Delete Card
  const handleDeleteCard = (cardId: string, colId: string) => {
    if (isReadOnly) return;
    const newCols = board.columns.map(col => {
      if (col.id === colId) {
        return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
      }
      return col;
    });
    updateBoard({ ...board, columns: newCols });
    setActiveCardModal(null);
  };

  // Add Column
  const handleAddColumn = () => {
    if (!newColName.trim() || isReadOnly) return;
    const newCol: KanbanColumn = {
      id: `emb-col-${Date.now()}`,
      title: newColName.trim(),
      color: 'slate',
      cards: []
    };
    updateBoard({ ...board, columns: [...board.columns, newCol] });
    setNewColName('');
    setShowNewCol(false);
  };

  // Delete Column
  const handleDeleteColumn = (colId: string) => {
    if (isReadOnly) return;
    updateBoard({
      ...board,
      columns: board.columns.filter(col => col.id !== colId)
    });
  };

  // Move card left / right quickly
  const handleShiftCard = (card: KanbanCard, currentColId: string, direction: 'left' | 'right') => {
    if (isReadOnly) return;
    const currentIdx = board.columns.findIndex(c => c.id === currentColId);
    if (currentIdx === -1) return;

    const targetIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= board.columns.length) return;

    const targetCol = board.columns[targetIdx];

    const newCols = board.columns.map((col, idx) => {
      if (idx === currentIdx) {
        return { ...col, cards: col.cards.filter(c => c.id !== card.id) };
      }
      if (idx === targetIdx) {
        return { ...col, cards: [...col.cards, { ...card, updatedAt: Date.now() }] };
      }
      return col;
    });

    updateBoard({ ...board, columns: newCols });
  };

  return (
    <div className="w-full my-3 p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl select-none font-sans">
      {/* Embedded Board Top Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Kanban className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-slate-800">
            {board.title || (language === 'de' ? 'Projekt-Board' : 'Project Board')}
          </span>
          <span className="text-[11px] text-slate-400">
            ({board.columns.reduce((acc, c) => acc + c.cards.length, 0)} {language === 'de' ? 'Karten' : 'cards'})
          </span>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setShowNewCol(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-white hover:bg-sky-50 px-2 py-1 rounded border border-slate-200/80 shadow-4xs transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{language === 'de' ? 'Spalte' : 'Column'}</span>
          </button>
        )}
      </div>

      {/* Columns Horizontal Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 items-start">
        {board.columns.map((col, colIdx) => {
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.id);
              }}
              onDrop={() => handleDrop(col.id)}
              className={`w-64 shrink-0 bg-white border rounded-lg flex flex-col shadow-4xs transition-all ${
                isOver ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20' : 'border-slate-200/90'
              }`}
            >
              {/* Column Header */}
              <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 rounded-t-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs text-slate-800 truncate">
                    {col.title}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.2 rounded-full border border-slate-200/60">
                    {col.cards.length}
                  </span>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAddColId(col.id);
                        setQuickAddText('');
                      }}
                      className="p-1 text-slate-400 hover:text-sky-600 rounded"
                      title={language === 'de' ? 'Karte hinzufügen' : 'Add card'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {board.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(col.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title={language === 'de' ? 'Spalte löschen' : 'Delete column'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Add Form in Column */}
              {quickAddColId === col.id && !isReadOnly && (
                <div className="p-2 bg-slate-50 border-b border-slate-100 space-y-1.5">
                  <input
                    type="text"
                    placeholder={language === 'de' ? 'Aufgabe eingeben...' : 'New task...'}
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCard(col.id)}
                    autoFocus
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickAddColId(null)}
                      className="px-2 py-0.5 text-[10px] text-slate-500"
                    >
                      {language === 'de' ? 'Abbrechen' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCard(col.id)}
                      className="px-2 py-0.5 text-[10px] font-semibold text-white bg-sky-600 rounded"
                    >
                      {language === 'de' ? 'OK' : 'OK'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cards Listing */}
              <div className="p-2 space-y-1.5 min-h-[50px]">
                {col.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable={!isReadOnly}
                    onDragStart={() => handleDragStart(card.id, col.id)}
                    onClick={() => setActiveCardModal({ card, columnId: col.id })}
                    className="p-2 rounded bg-white border border-slate-200/80 shadow-4xs hover:border-slate-300 transition-all cursor-pointer group relative"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-800 leading-snug">
                        {card.title}
                      </span>
                    </div>

                    {card.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {card.description}
                      </p>
                    )}

                    {/* Quick Move Arrows on hover */}
                    {!isReadOnly && (
                      <div className="flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {colIdx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftCard(card, col.id, 'left');
                            }}
                            className="p-0.5 text-slate-400 hover:text-sky-600 rounded hover:bg-slate-50"
                            title={language === 'de' ? 'Nach links' : 'Move left'}
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                        {colIdx < board.columns.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftCard(card, col.id, 'right');
                            }}
                            className="p-0.5 text-slate-400 hover:text-sky-600 rounded hover:bg-slate-50"
                            title={language === 'de' ? 'Nach rechts' : 'Move right'}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add Column prompt */}
        {showNewCol && !isReadOnly && (
          <div className="w-56 shrink-0 bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-sm">
            <h5 className="text-xs font-bold text-slate-700">
              {language === 'de' ? 'Neue Spalte' : 'New column'}
            </h5>
            <input
              type="text"
              placeholder={language === 'de' ? 'Spaltenname...' : 'Column name...'}
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              autoFocus
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-sky-500"
            />
            <div className="flex justify-end gap-1 pt-1">
              <button
                type="button"
                onClick={() => setShowNewCol(false)}
                className="px-2 py-1 text-xs text-slate-500"
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 rounded"
              >
                {language === 'de' ? 'Erstellen' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Card Details View / Edit Modal */}
      {activeCardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800">
                {language === 'de' ? 'Aufgabe bearbeiten' : 'Edit task'}
              </h4>
              <button
                type="button"
                onClick={() => setActiveCardModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {language === 'de' ? 'Titel' : 'Title'}
              </label>
              <input
                type="text"
                value={activeCardModal.card.title}
                onChange={(e) => {
                  const updatedCard = { ...activeCardModal.card, title: e.target.value };
                  setActiveCardModal({ ...activeCardModal, card: updatedCard });
                }}
                disabled={isReadOnly}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {language === 'de' ? 'Details' : 'Details'}
              </label>
              <textarea
                rows={2}
                value={activeCardModal.card.description || ''}
                onChange={(e) => {
                  const updatedCard = { ...activeCardModal.card, description: e.target.value };
                  setActiveCardModal({ ...activeCardModal, card: updatedCard });
                }}
                disabled={isReadOnly}
                className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleDeleteCard(activeCardModal.card.id, activeCardModal.columnId)}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{language === 'de' ? 'Löschen' : 'Delete'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isReadOnly) {
                    const newCols = board.columns.map(col => {
                      if (col.id === activeCardModal.columnId) {
                        return {
                          ...col,
                          cards: col.cards.map(c => (c.id === activeCardModal.card.id ? activeCardModal.card : c))
                        };
                      }
                      return col;
                    });
                    updateBoard({ ...board, columns: newCols });
                  }
                  setActiveCardModal(null);
                }}
                className="ml-auto px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded shadow-3xs"
              >
                {language === 'de' ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
