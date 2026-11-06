"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Pin,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckSquare,
  Search,
  Palette,
  X,
  FileText,
  Lock,
  Unlock,
  Key,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Maximize2,
  Minimize2,
  Edit3,
} from "lucide-react";
import { KeepNote, KeepNoteChecklistItem } from "@/types/dashboard";
import {
  isEncryptedPayload,
  encryptPayload,
  decryptPayload,
  createPassphraseVerification,
  verifyPassphrase,
} from "@/lib/crypto";

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

type DecryptedPayload = {
  text: string;
  checklist?: KeepNoteChecklistItem[];
};

type NotesViewProps = {
  notes: KeepNote[];
  onAddNote: (note: Omit<KeepNote, "id" | "updatedAt">) => void;
  onUpdateNote: (id: string, updates: Partial<KeepNote>) => void;
  onDeleteNote: (id: string) => void;
};

// Markdown & rich text token parser
function parseInline(text: string): React.ReactNode {
  const tokenRegex = /(\*\*[^*]+\*\*|<u>[\s\S]*?<\/u>|~~[^~]+~~|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("<u>") && part.endsWith("</u>") && part.length >= 7) {
      return (
        <span
          key={index}
          className="underline decoration-current underline-offset-2 font-medium"
        >
          {part.slice(3, -4)}
        </span>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={index} className="line-through opacity-70">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-ink/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[11px] text-[#b91c1c] font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// Full Markdown & codeblock preview component
function FormattedContent({ text, isCompact = false }: { text: string; isCompact?: boolean }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        const codeText = codeBlockLines.join("\n");
        elements.push(
          <div
            key={`cb-${i}`}
            className="my-2 rounded-xl bg-[#1e232a] p-3 text-white font-mono text-[11px] overflow-x-auto shadow-sm border border-black/20"
          >
            <pre className="whitespace-pre">{codeText}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className={`${isCompact ? "text-[13px]" : "text-[16px]"} font-bold text-ink mt-2 mb-1`}>
          {parseInline(line.slice(2))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className={`${isCompact ? "text-[12px]" : "text-[14px]"} font-bold text-ink mt-1.5 mb-1`}>
          {parseInline(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-forest/50 pl-2.5 my-1 text-muted italic text-[11px] bg-black/[0.02] py-0.5"
        >
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-1.5 my-0.5 text-[12px]">
          <span className="text-forest mt-0.5">•</span>
          <span className="flex-1">{parseInline(line.slice(2))}</span>
        </div>
      );
      continue;
    }
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-1.5 my-0.5 text-[12px]">
          <span className="font-semibold text-muted text-[11px] min-w-[16px]">{numMatch[1]}.</span>
          <span className="flex-1">{parseInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    elements.push(
      <p key={i} className="my-0.5 text-[12px] leading-relaxed text-[#404c43]">
        {parseInline(line)}
      </p>
    );
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div
        key="cb-end"
        className="my-2 rounded-xl bg-[#1e232a] p-3 text-white font-mono text-[11px] overflow-x-auto shadow-sm border border-black/20"
      >
        <pre className="whitespace-pre">{codeBlockLines.join("\n")}</pre>
      </div>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

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
  const [composeEncrypted, setComposeEncrypted] = useState(false);
  const [composeChecklist, setComposeChecklist] = useState<KeepNoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePaletteNoteId, setActivePaletteNoteId] = useState<string | null>(null);

  // Vault Security State
  const [vaultVerifier, setVaultVerifier] = useState<{ hash: string; salt: string } | null>(null);
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, DecryptedPayload>>({});

  // Vault Modals
  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  // PIN Inputs
  const [pinInput, setPinInput] = useState("");
  const [pinConfirmInput, setPinConfirmInput] = useState("");
  const [oldPinInput, setOldPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinText, setShowPinText] = useState(false);

  // Edit modal state
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [editDecryptedContent, setEditDecryptedContent] = useState("");
  const [editDecryptedChecklist, setEditDecryptedChecklist] = useState<KeepNoteChecklistItem[]>([]);
  const [editIsEncrypted, setEditIsEncrypted] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Textarea Refs for Rich Text Insertion
  const composeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Formatting Insertion Helper
  const applyFormatting = (
    textarea: HTMLTextAreaElement | null,
    format: "bold" | "italic" | "underline" | "strike" | "code" | "codeblock" | "h1" | "h2" | "bullet" | "number" | "quote",
    currentValue: string,
    setValue: (val: string) => void
  ) => {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentValue.slice(start, end);

    let replacement = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        replacement = `**${selected || "bold text"}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case "italic":
        replacement = `*${selected || "italic text"}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case "underline":
        replacement = `<u>${selected || "underlined text"}</u>`;
        cursorOffset = selected ? replacement.length : 3;
        break;
      case "strike":
        replacement = `~~${selected || "strikethrough"}~~`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case "code":
        replacement = `\`${selected || "code"}\``;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case "codeblock":
        replacement = selected
          ? `\`\`\`\n${selected}\n\`\`\``
          : `\`\`\`bash\n# commands or code\n\`\`\``;
        cursorOffset = replacement.length;
        break;
      case "h1":
        replacement = `# ${selected || "Heading 1"}`;
        cursorOffset = replacement.length;
        break;
      case "h2":
        replacement = `## ${selected || "Heading 2"}`;
        cursorOffset = replacement.length;
        break;
      case "bullet":
        replacement = selected
          ? selected.split("\n").map((l) => `- ${l}`).join("\n")
          : `- List item`;
        cursorOffset = replacement.length;
        break;
      case "number":
        replacement = selected
          ? selected.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n")
          : `1. List item`;
        cursorOffset = replacement.length;
        break;
      case "quote":
        replacement = selected
          ? selected.split("\n").map((l) => `> ${l}`).join("\n")
          : `> Quote`;
        cursorOffset = replacement.length;
        break;
    }

    const nextValue = currentValue.slice(0, start) + replacement + currentValue.slice(end);
    setValue(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  // Keyboard shortcut handler for rich formatting
  const handleEditorKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    setValue: (val: string) => void
  ) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        applyFormatting(textarea, "bold", currentValue, setValue);
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        applyFormatting(textarea, "italic", currentValue, setValue);
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        applyFormatting(textarea, "underline", currentValue, setValue);
      }
    }
  };

  // Load vault configuration from localStorage
  useEffect(() => {
    try {
      const storedVerifier = localStorage.getItem("routino_vault_verifier");
      if (storedVerifier) {
        setVaultVerifier(JSON.parse(storedVerifier));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Decrypt notes in-memory when session PIN is unlocked or notes update
  const decryptAllNotes = useCallback(async (pin: string, noteList: KeepNote[]) => {
    const nextCache: Record<string, DecryptedPayload> = {};
    for (const note of noteList) {
      if (note.isEncrypted || isEncryptedPayload(note.content)) {
        try {
          const decryptedString = await decryptPayload(note.content, pin);
          try {
            const parsed = JSON.parse(decryptedString);
            if (typeof parsed === "object" && parsed !== null && "text" in parsed) {
              nextCache[note.id] = {
                text: parsed.text || "",
                checklist: parsed.checklist || note.checklist,
              };
              continue;
            }
          } catch {
            // Plaintext fallback
          }
          nextCache[note.id] = { text: decryptedString, checklist: note.checklist };
        } catch {
          // If decryption fails, ignore
        }
      }
    }
    setDecryptedCache(nextCache);
  }, []);

  useEffect(() => {
    if (sessionPin) {
      void decryptAllNotes(sessionPin, notes);
    }
  }, [sessionPin, notes, decryptAllNotes]);

  // Master PIN Setup Handler
  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!pinInput || pinInput.length < 4) {
      setPinError("PIN must be at least 4 characters.");
      return;
    }
    if (pinInput !== pinConfirmInput) {
      setPinError("PINs do not match.");
      return;
    }

    try {
      const verifier = await createPassphraseVerification(pinInput);
      localStorage.setItem("routino_vault_verifier", JSON.stringify(verifier));
      setVaultVerifier(verifier);
      setSessionPin(pinInput);
      setShowSetupPinModal(false);
      setPinInput("");
      setPinConfirmInput("");
      setComposeEncrypted(true);
      await decryptAllNotes(pinInput, notes);
    } catch {
      setPinError("Failed to initialize security vault. Please try again.");
    }
  };

  // Unlock Vault Handler
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!vaultVerifier) return;

    try {
      const isValid = await verifyPassphrase(pinInput, vaultVerifier.salt, vaultVerifier.hash);
      if (!isValid) {
        setPinError("Incorrect master PIN. Please try again.");
        return;
      }

      setSessionPin(pinInput);
      setShowUnlockModal(false);
      setPinInput("");
      await decryptAllNotes(pinInput, notes);
    } catch {
      setPinError("Verification error. Please try again.");
    }
  };

  // Lock Vault
  const handleLockVault = () => {
    setSessionPin(null);
    setDecryptedCache({});
    setComposeEncrypted(false);
  };

  // Change Master PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!vaultVerifier) return;

    try {
      const isValid = await verifyPassphrase(oldPinInput, vaultVerifier.salt, vaultVerifier.hash);
      if (!isValid) {
        setPinError("Current PIN is incorrect.");
        return;
      }
      if (!pinInput || pinInput.length < 4) {
        setPinError("New PIN must be at least 4 characters.");
        return;
      }
      if (pinInput !== pinConfirmInput) {
        setPinError("New PINs do not match.");
        return;
      }

      for (const note of notes) {
        if (note.isEncrypted || isEncryptedPayload(note.content)) {
          const cached = decryptedCache[note.id];
          if (cached) {
            const bundle = JSON.stringify({
              text: cached.text,
              checklist: cached.checklist,
            });
            const reEncrypted = await encryptPayload(bundle, pinInput);
            onUpdateNote(note.id, { content: reEncrypted });
          }
        }
      }

      const verifier = await createPassphraseVerification(pinInput);
      localStorage.setItem("routino_vault_verifier", JSON.stringify(verifier));
      setVaultVerifier(verifier);
      setSessionPin(pinInput);
      setShowChangePinModal(false);
      setOldPinInput("");
      setPinInput("");
      setPinConfirmInput("");
      await decryptAllNotes(pinInput, notes);
    } catch {
      setPinError("Failed to update PIN.");
    }
  };

  // Add checklist item to composer
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

  // Save new note with optional zero-knowledge encryption
  const handleSaveCompose = async () => {
    if (!composeTitle.trim() && !composeContent.trim() && composeChecklist.length === 0) {
      setIsComposing(false);
      return;
    }

    let finalContent = composeContent.trim();
    let finalChecklist: KeepNoteChecklistItem[] | undefined =
      composeChecklist.length > 0 ? composeChecklist : undefined;

    if (composeEncrypted) {
      if (!sessionPin) {
        setShowUnlockModal(true);
        return;
      }

      const payloadString = JSON.stringify({
        text: finalContent,
        checklist: finalChecklist,
      });

      finalContent = await encryptPayload(payloadString, sessionPin);
      finalChecklist = undefined;
    }

    onAddNote({
      title: composeTitle.trim(),
      content: finalContent,
      color: composeColor,
      pinned: composePinned,
      isEncrypted: composeEncrypted,
      checklist: finalChecklist,
    });

    setComposeTitle("");
    setComposeContent("");
    setComposeColor("default");
    setComposePinned(false);
    setComposeChecklist([]);
    setIsComposing(false);
  };

  // Copy note text to clipboard
  const handleCopyNote = (note: KeepNote) => {
    let textToCopy = note.content;
    let checklistToCopy = note.checklist;

    if (note.isEncrypted && sessionPin && decryptedCache[note.id]) {
      textToCopy = decryptedCache[note.id].text;
      checklistToCopy = decryptedCache[note.id].checklist;
    }

    const text = [
      note.title,
      textToCopy,
      checklistToCopy?.map((c) => `[${c.done ? "x" : " "}] ${c.text}`).join("\n"),
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Toggle checklist item
  const toggleChecklistItem = async (noteId: string, itemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    if (note.isEncrypted) {
      if (!sessionPin || !decryptedCache[noteId]) {
        setShowUnlockModal(true);
        return;
      }
      const cached = decryptedCache[noteId];
      const updatedChecklist = cached.checklist?.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );

      const bundle = JSON.stringify({
        text: cached.text,
        checklist: updatedChecklist,
      });
      const reEncrypted = await encryptPayload(bundle, sessionPin);

      setDecryptedCache((prev) => ({
        ...prev,
        [noteId]: { ...cached, checklist: updatedChecklist },
      }));

      onUpdateNote(noteId, { content: reEncrypted });
    } else if (note.checklist) {
      const nextChecklist = note.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      onUpdateNote(noteId, { checklist: nextChecklist });
    }
  };

  // Open note for editing
  const handleOpenEdit = (note: KeepNote) => {
    if (note.isEncrypted && !sessionPin) {
      setShowUnlockModal(true);
      return;
    }

    setEditingNote(note);
    setEditIsEncrypted(Boolean(note.isEncrypted));
    setActiveTab("edit");

    if (note.isEncrypted && decryptedCache[note.id]) {
      setEditDecryptedContent(decryptedCache[note.id].text);
      setEditDecryptedChecklist(decryptedCache[note.id].checklist || []);
    } else {
      setEditDecryptedContent(note.content);
      setEditDecryptedChecklist(note.checklist || []);
    }
  };

  // Save changes from Edit Modal
  const handleSaveEdit = async () => {
    if (!editingNote) return;

    let finalContent = editDecryptedContent.trim();
    let finalChecklist: KeepNoteChecklistItem[] | undefined =
      editDecryptedChecklist.length > 0 ? editDecryptedChecklist : undefined;

    if (editIsEncrypted) {
      if (!sessionPin) {
        setShowUnlockModal(true);
        return;
      }
      const payloadString = JSON.stringify({
        text: finalContent,
        checklist: finalChecklist,
      });
      finalContent = await encryptPayload(payloadString, sessionPin);
      finalChecklist = undefined;

      setDecryptedCache((prev) => ({
        ...prev,
        [editingNote.id]: {
          text: editDecryptedContent.trim(),
          checklist: editDecryptedChecklist,
        },
      }));
    }

    onUpdateNote(editingNote.id, {
      title: editingNote.title.trim(),
      content: finalContent,
      color: editingNote.color,
      pinned: editingNote.pinned,
      isEncrypted: editIsEncrypted,
      checklist: finalChecklist,
    });

    setEditingNote(null);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchTitle = n.title.toLowerCase().includes(q);

    let matchContent = false;
    let matchChecklist = false;

    if (n.isEncrypted) {
      if (sessionPin && decryptedCache[n.id]) {
        matchContent = decryptedCache[n.id].text.toLowerCase().includes(q);
        matchChecklist = Boolean(
          decryptedCache[n.id].checklist?.some((c) => c.text.toLowerCase().includes(q))
        );
      }
    } else {
      matchContent = n.content.toLowerCase().includes(q);
      matchChecklist = Boolean(n.checklist?.some((c) => c.text.toLowerCase().includes(q)));
    }

    return matchTitle || matchContent || matchChecklist;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const otherNotes = filteredNotes.filter((n) => !n.pinned);

  // Render Rich Text Toolbar
  const renderFormattingToolbar = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    currentValue: string,
    setValue: (val: string) => void
  ) => (
    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-black/[0.04] p-1 border border-black/5">
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "bold", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Bold (Ctrl+B)"
      >
        <Bold size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "italic", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Italic (Ctrl+I)"
      >
        <Italic size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "underline", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "strike", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Strikethrough"
      >
        <Strikethrough size={13} />
      </button>

      <span className="h-3.5 w-px bg-black/15 mx-0.5" />

      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "code", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Inline Code"
      >
        <Code size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "codeblock", currentValue, setValue)}
        className="rounded px-1.5 py-1 text-[11px] font-mono text-[#404c43] hover:bg-black/10 transition"
        title="Code Block"
      >
        {"{ }"}
      </button>

      <span className="h-3.5 w-px bg-black/15 mx-0.5" />

      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "h1", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Heading 1"
      >
        <Heading1 size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "h2", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Heading 2"
      >
        <Heading2 size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "bullet", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Bullet List"
      >
        <List size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "number", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Numbered List"
      >
        <ListOrdered size={13} />
      </button>
      <button
        type="button"
        onClick={() => applyFormatting(textareaRef.current, "quote", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Quote Block"
      >
        <Quote size={13} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header with Security Vault Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-ink">Important Notes & Scratchpad</h2>
            <span className="rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-bold text-forest">
              {notes.length} Notes
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">
            Rich markdown notes with bold, underline, code blocks & zero-knowledge AES-256 encryption.
          </p>
        </div>

        {/* Security Controls + Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!vaultVerifier ? (
            <button
              onClick={() => {
                setPinError(null);
                setShowSetupPinModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#d1d7cc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5a685e] hover:border-forest hover:text-forest transition shadow-sm"
              title="Set a master PIN to enable client-side AES-256 encryption"
            >
              <Shield size={13} className="text-forest" />
              <span>Enable Zero-Knowledge Vault</span>
            </button>
          ) : sessionPin ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-[11px] font-semibold text-[#166534] shadow-sm">
              <ShieldCheck size={14} className="text-[#16a34a]" />
              <span>Vault Unlocked</span>
              <button
                onClick={handleLockVault}
                className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#b91c1c] hover:bg-[#fee2e2] transition"
                title="Lock vault immediately"
              >
                Lock
              </button>
              <button
                onClick={() => {
                  setPinError(null);
                  setShowChangePinModal(true);
                }}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#166534] hover:bg-[#dcfce7] transition"
                title="Change master PIN"
              >
                PIN
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setPinError(null);
                setShowUnlockModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#fed7aa] bg-[#fffaf5] px-3 py-1.5 text-[11px] font-semibold text-[#9a3412] hover:bg-[#ffedd5] transition shadow-sm"
              title="Click to unlock encrypted notes with your master PIN"
            >
              <Lock size={13} className="text-[#c2410c]" />
              <span>Vault Locked · Unlock</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes & secrets..."
              className="w-full rounded-xl border border-line bg-white pl-9 pr-3.5 py-1.5 text-[12px] text-ink outline-none focus:border-forest transition"
            />
          </div>
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
              <span className="text-[13px] font-medium">Take a note, code snippet, or password...</span>
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!vaultVerifier) {
                      setShowSetupPinModal(true);
                    } else if (!sessionPin) {
                      setShowUnlockModal(true);
                    } else {
                      setComposeEncrypted(true);
                    }
                    setIsComposing(true);
                  }}
                  className="rounded-lg p-1.5 hover:bg-[#f1f3ed] hover:text-forest transition"
                  title="Encrypted secret note"
                >
                  <Lock size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Title & Pin & Encrypt Toggle */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Title (e.g. Git Config, Server Credentials)"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-muted/60"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!composeEncrypted) {
                        if (!vaultVerifier) {
                          setShowSetupPinModal(true);
                          return;
                        }
                        if (!sessionPin) {
                          setShowUnlockModal(true);
                          return;
                        }
                        setComposeEncrypted(true);
                      } else {
                        setComposeEncrypted(false);
                      }
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] font-semibold flex items-center gap-1 transition ${
                      composeEncrypted
                        ? "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]"
                        : "text-muted hover:bg-black/5 hover:text-ink"
                    }`}
                    title={composeEncrypted ? "AES-256 Client-Side Encryption Enabled" : "Enable AES-256 Encryption"}
                  >
                    {composeEncrypted ? <Lock size={12} className="text-[#059669]" /> : <Unlock size={12} />}
                    <span className="hidden sm:inline">{composeEncrypted ? "Encrypted" : "Encrypt"}</span>
                  </button>

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
              </div>

              {/* Formatting Toolbar */}
              {renderFormattingToolbar(composeTextareaRef, composeContent, setComposeContent)}

              {/* Note Content Textarea */}
              <textarea
                ref={composeTextareaRef}
                placeholder={composeEncrypted ? "Enter sensitive secrets (encrypted with AES-256-GCM)..." : "Take a note (supports **bold**, <u>underline</u>, `code`, and markdown)..."}
                rows={4}
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                onKeyDown={(e) => handleEditorKeyDown(e, composeTextareaRef.current, composeContent, setComposeContent)}
                className="w-full resize-none bg-transparent text-[12px] text-ink outline-none placeholder:text-muted/60 font-mono leading-relaxed"
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
                      setComposeEncrypted(false);
                    }}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCompose}
                    className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition flex items-center gap-1.5"
                  >
                    {composeEncrypted && <Lock size={12} />}
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
              {searchQuery ? "No notes found matching your search" : "No notes yet. Capture your first thought or encrypted secret above!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherNotes.map((note) => renderNoteCard(note))}
          </div>
        )}
      </div>

      {/* Render Expanded Note Card Modal */}
      {renderNoteCardModal()}

      {/* Setup Master PIN Modal */}
      {showSetupPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#ecfdf5] text-[#059669]">
                  <ShieldCheck size={16} />
                </span>
                <h3 className="text-[14px] font-bold text-ink">Set Master Vault PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupPinModal(false)}
                className="text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSetupPin} className="mt-4 space-y-3">
              <p className="text-[11px] text-muted leading-relaxed">
                Choose a master PIN or passphrase. All encrypted notes will be protected on your device using <strong>AES-256-GCM</strong>. Your raw PIN is never stored or sent to any server.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-[#404c43] mb-1">
                  Master PIN / Passphrase (min 4 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPinText ? "text" : "password"}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter secret PIN"
                    className="w-full rounded-xl border border-line bg-[#fafbf8] px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition pr-9"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    {showPinText ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#404c43] mb-1">
                  Confirm Master PIN
                </label>
                <input
                  type={showPinText ? "text" : "password"}
                  value={pinConfirmInput}
                  onChange={(e) => setPinConfirmInput(e.target.value)}
                  placeholder="Re-enter secret PIN"
                  className="w-full rounded-xl border border-line bg-[#fafbf8] px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#fef2f2] p-2 text-[11px] font-medium text-[#b91c1c]">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetupPinModal(false)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition"
                >
                  Save & Enable Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlock Vault Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#fff7ed] text-[#c2410c]">
                  <Lock size={15} />
                </span>
                <h3 className="text-[14px] font-bold text-ink">Unlock Security Vault</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUnlockVault} className="mt-4 space-y-3">
              <p className="text-[11px] text-muted leading-relaxed">
                Enter your master PIN to view and edit your encrypted notes.
              </p>

              <div className="relative">
                <input
                  type={showPinText ? "text" : "password"}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Master PIN"
                  className="w-full rounded-xl border border-line bg-[#fafbf8] px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPinText ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {pinError && (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#fef2f2] p-2 text-[11px] font-medium text-[#b91c1c]">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition"
                >
                  Unlock Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Master PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f0fdf4] text-[#166534]">
                  <Key size={15} />
                </span>
                <h3 className="text-[14px] font-bold text-ink">Change Master PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                className="text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePin} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#404c43] mb-1">
                  Current Master PIN
                </label>
                <input
                  type="password"
                  value={oldPinInput}
                  onChange={(e) => setOldPinInput(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full rounded-xl border border-line bg-[#fafbf8] px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#404c43] mb-1">
                  New Master PIN
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter new PIN"
                  className="w-full rounded-xl border border-line bg-[#fafbf8] px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#404c43] mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  value={pinConfirmInput}
                  onChange={(e) => setPinConfirmInput(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="w-full rounded-xl border border-line bg-[#fafbf8] px-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#fef2f2] p-2 text-[11px] font-medium text-[#b91c1c]">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8b1116] transition"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderNoteCard(note: KeepNote) {
    const colorTheme = NOTE_COLORS[note.color || "default"];
    const isNoteEncrypted = Boolean(note.isEncrypted || isEncryptedPayload(note.content));
    const isDecrypted = isNoteEncrypted && Boolean(sessionPin) && Boolean(decryptedCache[note.id]);

    const displayContent = isNoteEncrypted
      ? isDecrypted
        ? decryptedCache[note.id].text
        : null
      : note.content;

    const displayChecklist = isNoteEncrypted
      ? isDecrypted
        ? decryptedCache[note.id].checklist
        : null
      : note.checklist;

    return (
      <div
        key={note.id}
        onClick={() => handleOpenEdit(note)}
        className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${colorTheme.bg} ${colorTheme.border}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {isNoteEncrypted && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                    isDecrypted
                      ? "bg-[#dcfce7] text-[#15803d]"
                      : "bg-[#fed7aa] text-[#9a3412]"
                  }`}
                  title={isDecrypted ? "Zero-Knowledge AES-256 Decrypted in Browser" : "Encrypted (PIN Required)"}
                >
                  {isDecrypted ? <Unlock size={10} /> : <Lock size={10} />}
                  <span>{isDecrypted ? "AES-256" : "LOCKED"}</span>
                </span>
              )}
              {note.title && (
                <h3 className={`text-[13px] font-semibold truncate ${colorTheme.text}`}>
                  {note.title}
                </h3>
              )}
            </div>

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

          {/* Locked View when encrypted and vault is locked */}
          {isNoteEncrypted && !isDecrypted ? (
            <div className="mt-3.5 rounded-xl border border-dashed border-[#fed7aa] bg-[#fffaf5] p-3 text-center">
              <Lock size={18} className="mx-auto text-[#c2410c] mb-1" />
              <p className="text-[11px] font-semibold text-[#9a3412]">Encrypted with AES-256</p>
              <p className="mt-0.5 text-[9px] text-[#b45309] font-mono tracking-widest">
                ••••••••••••••••••••••
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUnlockModal(true);
                }}
                className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[#ea580c] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-[#c2410c] transition"
              >
                <Key size={11} /> Unlock with PIN
              </button>
            </div>
          ) : (
            <>
              {/* Formatted body content with bold, underline, lists, and codeblocks */}
              {displayContent && (
                <div className="mt-2 line-clamp-6 text-[#404c43]">
                  <FormattedContent text={displayContent} isCompact={true} />
                </div>
              )}

              {/* Checklist preview */}
              {displayChecklist && displayChecklist.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-black/5 pt-2">
                  {displayChecklist.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleChecklistItem(note.id, item.id);
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
                  {displayChecklist.length > 5 && (
                    <p className="text-[10px] text-muted">
                      +{displayChecklist.length - 5} more items
                    </p>
                  )}
                </div>
              )}
            </>
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

  // Expanded Rich Modal Preview & Editor
  function renderNoteCardModal() {
    if (!editingNote) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-150">
        <div
          className={`relative w-full rounded-3xl border shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isModalExpanded
              ? "max-w-[96vw] h-[94vh]"
              : "max-w-2xl sm:max-w-3xl xl:max-w-4xl max-h-[92vh] min-h-[520px] sm:min-h-[580px]"
          } ${NOTE_COLORS[editingNote.color || "default"].bg} ${
            NOTE_COLORS[editingNote.color || "default"].border
          }`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-7 pt-5 pb-3 border-b border-black/10 shrink-0">
            <input
              type="text"
              placeholder="Title"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              className="w-full bg-transparent text-[17px] sm:text-[19px] font-bold text-ink outline-none placeholder:text-muted/60 pr-4"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Tab Selector: Edit vs Preview */}
              <div className="flex items-center rounded-xl bg-black/5 p-0.5 border border-black/5 mr-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    activeTab === "edit"
                      ? "bg-white text-ink shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <Edit3 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    activeTab === "preview"
                      ? "bg-white text-ink shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>

              {/* Encryption Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!editIsEncrypted) {
                    if (!vaultVerifier) {
                      setShowSetupPinModal(true);
                      return;
                    }
                    if (!sessionPin) {
                      setShowUnlockModal(true);
                      return;
                    }
                    setEditIsEncrypted(true);
                  } else {
                    setEditIsEncrypted(false);
                  }
                }}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold flex items-center gap-1 transition ${
                  editIsEncrypted
                    ? "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]"
                    : "text-muted hover:bg-black/5 hover:text-ink"
                }`}
                title="Toggle AES-256 client-side encryption"
              >
                {editIsEncrypted ? <Lock size={12} className="text-[#059669]" /> : <Unlock size={12} />}
                <span className="hidden sm:inline">{editIsEncrypted ? "AES-256" : "Encrypt"}</span>
              </button>

              {/* Pin note */}
              <button
                type="button"
                onClick={() =>
                  setEditingNote({ ...editingNote, pinned: !editingNote.pinned })
                }
                className={`p-1.5 rounded-lg transition ${
                  editingNote.pinned ? "text-forest bg-[#fdf2f2]" : "text-muted hover:bg-black/5"
                }`}
                title={editingNote.pinned ? "Unpin note" : "Pin note"}
              >
                <Pin size={16} className={editingNote.pinned ? "fill-forest" : ""} />
              </button>

              {/* Expand / Minimize Modal */}
              <button
                type="button"
                onClick={() => setIsModalExpanded(!isModalExpanded)}
                className="p-1.5 rounded-lg text-muted hover:bg-black/5 hover:text-ink transition"
                title={isModalExpanded ? "Exit fullscreen" : "Expand preview"}
              >
                {isModalExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 flex flex-col sidebar-scroll">
            {activeTab === "edit" ? (
              <>
                {/* Rich formatting toolbar */}
                <div className="mb-3 shrink-0">
                  {renderFormattingToolbar(editTextareaRef, editDecryptedContent, setEditDecryptedContent)}
                </div>

                {/* Edit Textarea */}
                <textarea
                  ref={editTextareaRef}
                  value={editDecryptedContent}
                  onChange={(e) => setEditDecryptedContent(e.target.value)}
                  onKeyDown={(e) => handleEditorKeyDown(e, editTextareaRef.current, editDecryptedContent, setEditDecryptedContent)}
                  placeholder="Note text, commands, or secrets (use **bold**, <u>underline</u>, or toolbar above)..."
                  className="flex-1 w-full bg-transparent text-[13px] sm:text-[14px] text-ink outline-none resize-none leading-relaxed font-mono min-h-[260px] sm:min-h-[320px]"
                />
              </>
            ) : (
              /* Live Rendered Markdown & Rich Text Preview */
              <div className="flex-1 rounded-2xl bg-white/70 p-5 border border-black/5 overflow-y-auto sidebar-scroll min-h-[300px]">
                <h1 className="text-[18px] font-bold text-ink mb-3 pb-2 border-b border-black/5">
                  {editingNote.title || "Untitled Note"}
                </h1>
                {editDecryptedContent ? (
                  <FormattedContent text={editDecryptedContent} isCompact={false} />
                ) : (
                  <p className="text-muted italic text-[12px]">No body text written yet.</p>
                )}
              </div>
            )}

            {/* Checklist */}
            {editDecryptedChecklist.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-black/10 pt-3 shrink-0">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Checklist Items ({editDecryptedChecklist.filter((c) => c.done).length}/{editDecryptedChecklist.length})
                </p>
                {editDecryptedChecklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-[13px]">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {
                        const next = editDecryptedChecklist.map((c) =>
                          c.id === item.id ? { ...c, done: !c.done } : c
                        );
                        setEditDecryptedChecklist(next);
                      }}
                      className="rounded border-[#cbd5cc] text-forest focus:ring-forest h-4 w-4"
                    />
                    <span className={item.done ? "line-through text-muted" : "text-ink"}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-7 py-3.5 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-black/[0.02]">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
              {(Object.keys(NOTE_COLORS) as Array<NonNullable<KeepNote["color"]>>).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setEditingNote({ ...editingNote, color: col })}
                  title={NOTE_COLORS[col].name}
                  className={`h-5 w-5 rounded-full border transition-all ${
                    NOTE_COLORS[col].bg
                  } ${NOTE_COLORS[col].border} ${
                    editingNote.color === col ? "scale-125 ring-2 ring-forest/40" : "hover:scale-110"
                  }`}
                />
              ))}
            </div>

            {/* Cancel & Save Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="rounded-xl px-4 py-2 text-[12px] font-medium text-muted hover:bg-black/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-xl bg-forest px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition flex items-center gap-1.5"
              >
                {editIsEncrypted && <Lock size={13} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
