"use client";

import { useState } from "react";
import {
  Pin,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckSquare,
  Search,
  Sparkles,
  Palette,
  X,
  FileText,
} from "lucide-react";
import { KeepNote, KeepNoteChecklistItem } from "@/types/dashboard";

const NOTE_COLORS: Record<
  NonNullable<KeepNote["color"]>,
  { bg: string; border: string; text: string; name: string }
> = {
  default: {
    bg: "bg-white",
    border: "border-[#e5e9e2]",
    text: "text-ink",
    name: "Default",
  },
  yellow: {
    bg: "bg-[#fef9c3]",
    border: "border-[#fde047]",
    text: "text-[#713f12]",
    name: "Lemon",
  },
  green: {
    bg: "bg-[#dcfce7]",
    border: "border-[#86efac]",
    text: "text-[#14532d]",
    name: "Mint",
  },
  blue: {
    bg: "bg-[#e0f2fe]",
    border: "border-[#7dd3fc]",
    text: "text-[#0c4a6e]",
    name: "Sky",
  },
  peach: {
    bg: "bg-[#ffedd5]",
    border: "border-[#fed7aa]",
    text: "text-[#7c2d12]",
    name: "Peach",
  },
  purple: {
    bg: "bg-[#f3e8ff]",
    border: "border-[#d8b4fe]",
    text: "text-[#581c87]",
    name: "Lavender",
  },
};

type NotesViewProps = {
  notes: KeepNote[];
  onAddNote: (note: Omit<KeepNote, "id" | "updatedAt">) => void;
  onUpdateNote: (id: string, updates: Partial<KeepNote>) => void;
  onDeleteNote: (id: string) => void;
};

export function NotesView({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: NotesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeColor, setComposeColor] = useState<NonNullable<KeepNote["color"]>>("default");
  const [composePinned, setComposePinned] = useState(false);
  const [composeChecklist, setComposeChecklist] = useState<KeepNoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePaletteNoteId, setActivePaletteNoteId] = useState<string | null>(null);

  // Edit modal state
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setComposeChecklist((prev) => [
      ...prev,
      {
        id: "chk-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        text: newChecklistText.trim(),
        done: false,
      },
    ]);
    setNewChecklistText("");
  };

  const handleSaveCompose = () => {
    if (!composeTitle.trim() && !composeContent.trim() && composeChecklist.length === 0) {
      setIsComposing(false);
      return;
    }

    onAddNote({
      title: composeTitle.trim(),
      content: composeContent.trim(),
      color: composeColor,
      pinned: composePinned,
      checklist: composeChecklist.length > 0 ? composeChecklist : undefined,
    });

    setComposeTitle("");
    setComposeContent("");
    setComposeColor("default");
    setComposePinned(false);
    setComposeChecklist([]);
    setIsComposing(false);
  };

  const handleCopyNote = (note: KeepNote) => {
    const text = [
      note.title,
      note.content,
      note.checklist?.map((c) => `[${c.done ? "x" : " "}] ${c.text}`).join("\n"),
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const toggleChecklistItem = (noteId: string, itemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !note.checklist) return;

    const nextChecklist = note.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    onUpdateNote(noteId, { checklist: nextChecklist });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchTitle = n.title.toLowerCase().includes(q);
    const matchContent = n.content.toLowerCase().includes(q);
    const matchChecklist = n.checklist?.some((c) => c.text.toLowerCase().includes(q));
    return matchTitle || matchContent || matchChecklist;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const otherNotes = filteredNotes.filter((n) => !n.pinned);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-ink">Important Notes & Scratchpad</h2>
            <span className="rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-bold text-forest">
              {notes.length} Notes
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">
            Quick notes, thoughts, and Keep-style checklists saved across all devices.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes & lists..."
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
          />
        </div>
      </div>

      {/* Google Keep-style Quick Note Composer */}
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border transition-all duration-200 shadow-sm ${
            isComposing
              ? `${NOTE_COLORS[composeColor].bg} ${NOTE_COLORS[composeColor].border} shadow-md`
              : "bg-white border-line hover:border-[#cbd5cc]"
          }`}
        >
          {!isComposing ? (
            <div
              onClick={() => setIsComposing(true)}
              className="flex items-center justify-between px-4 py-3 cursor-text text-muted hover:text-ink transition"
            >
              <span className="text-[13px] font-medium">Take a note or checklist...</span>
              <div className="flex items-center gap-2 text-muted">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposing(true);
                  }}
                  className="rounded-lg p-1.5 hover:bg-[#f1f3ed] hover:text-ink transition"
                  title="New checklist"
                >
                  <CheckSquare size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Title & Pin */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-muted/60"
                />
                <button
                  type="button"
                  onClick={() => setComposePinned(!composePinned)}
                  className={`rounded-lg p-1.5 transition ${
                    composePinned
                      ? "text-forest bg-[#fdf2f2]"
                      : "text-muted hover:bg-black/5 hover:text-ink"
                  }`}
                  title={composePinned ? "Unpin note" : "Pin note"}
                >
                  <Pin size={16} className={composePinned ? "fill-forest" : ""} />
                </button>
              </div>

              {/* Note Content */}
              <textarea
                placeholder="Take a note..."
                rows={3}
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                className="w-full resize-none bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/60"
              />

              {/* Checklist items */}
              {composeChecklist.length > 0 && (
                <div className="space-y-1.5 border-t border-black/5 pt-2">
                  {composeChecklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-[12px]">
                      <span className="text-muted">☐</span>
                      <span className="flex-1 text-ink">{item.text}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setComposeChecklist((prev) => prev.filter((c) => c.id !== item.id))
                        }
                        className="text-muted hover:text-[#c05746]"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add checklist item row */}
              <div className="flex items-center gap-2">
                <Plus size={13} className="text-muted" />
                <input
                  type="text"
                  placeholder="Add list item (press Enter)..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-muted/60"
                />
              </div>

              {/* Bottom bar: color palette & close */}
              <div className="flex items-center justify-between border-t border-black/5 pt-3">
                <div className="flex items-center gap-1.5">
                  {(Object.keys(NOTE_COLORS) as Array<NonNullable<KeepNote["color"]>>).map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setComposeColor(col)}
                      title={NOTE_COLORS[col].name}
                      className={`h-5 w-5 rounded-full border transition-all ${
                        NOTE_COLORS[col].bg
                      } ${NOTE_COLORS[col].border} ${
                        composeColor === col ? "scale-125 ring-2 ring-forest/40" : "hover:scale-110"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposing(false);
                      setComposeTitle("");
                      setComposeContent("");
                      setComposeChecklist([]);
                    }}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCompose}
                    className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
            <Pin size={11} className="fill-muted" /> Pinned Notes
          </div>
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pinnedNotes.map((note) => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* Other Notes Section */}
      <div>
        {pinnedNotes.length > 0 && otherNotes.length > 0 && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
            Other Notes
          </div>
        )}
        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto text-muted/40 mb-2" />
            <p className="text-[13px] font-medium text-muted">
              {searchQuery ? "No notes found matching your search" : "No notes yet. Capture your first thought above!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherNotes.map((note) => renderNoteCard(note))}
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div
            className={`relative w-full max-w-lg rounded-2xl border p-5 shadow-2xl max-h-[90vh] overflow-y-auto ${
              NOTE_COLORS[editingNote.color || "default"].bg
            } ${NOTE_COLORS[editingNote.color || "default"].border}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <input
                type="text"
                placeholder="Title"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full bg-transparent text-[16px] font-semibold text-ink outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setEditingNote({ ...editingNote, pinned: !editingNote.pinned })
                }
                className={`p-1.5 rounded-lg transition ${
                  editingNote.pinned ? "text-forest bg-[#fdf2f2]" : "text-muted hover:bg-black/5"
                }`}
              >
                <Pin size={16} className={editingNote.pinned ? "fill-forest" : ""} />
              </button>
            </div>

            <textarea
              rows={6}
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              placeholder="Note text..."
              className="mt-3 w-full bg-transparent text-[13px] text-ink outline-none resize-none leading-relaxed"
            />

            {/* Checklist */}
            {editingNote.checklist && editingNote.checklist.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
                {editingNote.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-[12px]">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {
                        const next = editingNote.checklist!.map((c) =>
                          c.id === item.id ? { ...c, done: !c.done } : c
                        );
                        setEditingNote({ ...editingNote, checklist: next });
                      }}
                      className="rounded border-[#cbd5cc] text-forest focus:ring-forest"
                    />
                    <span className={item.done ? "line-through text-muted" : "text-ink"}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Modal action bar */}
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
              <div className="flex items-center gap-1.5">
                {(Object.keys(NOTE_COLORS) as Array<NonNullable<KeepNote["color"]>>).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setEditingNote({ ...editingNote, color: col })}
                    className={`h-5 w-5 rounded-full border transition-all ${
                      NOTE_COLORS[col].bg
                    } ${NOTE_COLORS[col].border} ${
                      editingNote.color === col ? "scale-125 ring-2 ring-forest/40" : "hover:scale-110"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNote(editingNote.id, {
                      title: editingNote.title,
                      content: editingNote.content,
                      color: editingNote.color,
                      pinned: editingNote.pinned,
                      checklist: editingNote.checklist,
                    });
                    setEditingNote(null);
                  }}
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderNoteCard(note: KeepNote) {
    const colorTheme = NOTE_COLORS[note.color || "default"];

    return (
      <div
        key={note.id}
        onClick={() => setEditingNote(note)}
        className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${colorTheme.bg} ${colorTheme.border}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            {note.title && (
              <h3 className={`text-[13px] font-semibold line-clamp-2 ${colorTheme.text}`}>
                {note.title}
              </h3>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateNote(note.id, { pinned: !note.pinned });
              }}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition ml-auto ${
                note.pinned
                  ? "!opacity-100 text-forest bg-[#fdf2f2]"
                  : "text-muted hover:text-ink hover:bg-black/5"
              }`}
              title={note.pinned ? "Unpin note" : "Pin note"}
            >
              <Pin size={13} className={note.pinned ? "fill-forest" : ""} />
            </button>
          </div>

          {/* Body content */}
          {note.content && (
            <p className="mt-2 text-[12px] leading-relaxed text-[#404c43] line-clamp-6 whitespace-pre-wrap">
              {note.content}
            </p>
          )}

          {/* Checklist preview */}
          {note.checklist && note.checklist.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-black/5 pt-2">
              {note.checklist.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChecklistItem(note.id, item.id);
                  }}
                  className="flex items-center gap-2 text-[11px] cursor-pointer hover:opacity-80 transition"
                >
                  <span
                    className={`grid h-3.5 w-3.5 place-items-center rounded border text-[9px] ${
                      item.done
                        ? "bg-forest border-forest text-white"
                        : "border-[#cbd5cc] bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={item.done ? "line-through text-muted" : "text-ink"}>
                    {item.text}
                  </span>
                </div>
              ))}
              {note.checklist.length > 5 && (
                <p className="text-[10px] text-muted">
                  +{note.checklist.length - 5} more items
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action icons footer */}
        <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePaletteNoteId(activePaletteNoteId === note.id ? null : note.id);
              }}
              className="p-1 rounded text-muted hover:text-ink hover:bg-black/5 transition"
              title="Change color"
            >
              <Palette size={13} />
            </button>
            {activePaletteNoteId === note.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 bottom-7 z-20 flex items-center gap-1 rounded-xl border border-line bg-white p-1.5 shadow-lg animate-in fade-in"
              >
                {(Object.keys(NOTE_COLORS) as Array<NonNullable<KeepNote["color"]>>).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      onUpdateNote(note.id, { color: col });
                      setActivePaletteNoteId(null);
                    }}
                    className={`h-4 w-4 rounded-full border ${NOTE_COLORS[col].bg} ${NOTE_COLORS[col].border}`}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyNote(note);
              }}
              className="p-1 rounded text-muted hover:text-ink hover:bg-black/5 transition"
              title="Copy to clipboard"
            >
              {copiedId === note.id ? <Check size={13} className="text-forest" /> : <Copy size={13} />}
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id);
            }}
            className="p-1 rounded text-muted hover:text-[#c05746] hover:bg-[#fef2f2] transition"
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }
}
