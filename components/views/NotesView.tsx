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
  Image as ImageIcon,
  GripVertical,
  Flag,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { KeepNote, KeepNoteChecklistItem, KeepNotePriority } from "@/types/dashboard";
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

const PRIORITY_BADGES: Record<
  KeepNotePriority,
  { label: string; bg: string; text: string; border: string }
> = {
  high: {
    label: "High Priority",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    border: "border-[#fca5a5]",
  },
  medium: {
    label: "Medium",
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fcd34d]",
  },
  low: {
    label: "Low Priority",
    bg: "bg-[#ecfdf5]",
    text: "text-[#065f46]",
    border: "border-[#a7f3d0]",
  },
  none: {
    label: "Normal",
    bg: "bg-black/5",
    text: "text-muted",
    border: "border-transparent",
  },
};

type DecryptedPayload = {
  text: string;
  checklist?: KeepNoteChecklistItem[];
  imageUrl?: string;
};

type NotesViewProps = {
  notes: KeepNote[];
  onAddNote: (note: Omit<KeepNote, "id" | "updatedAt">) => void;
  onUpdateNote: (id: string, updates: Partial<KeepNote>) => void;
  onDeleteNote: (id: string) => void;
  onReorderNotes?: (reorderedNotes: KeepNote[]) => void;
};

// Client-side image compression helper to keep storage lightweight
function compressImageFile(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  onReorderNotes,
}: NotesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | KeepNotePriority>("all");
  const [sortBy, setSortBy] = useState<"custom" | "priority" | "newest">("custom");

  // Drag and Drop State
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  // Composer State
  const [isComposing, setIsComposing] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeColor, setComposeColor] = useState<NonNullable<KeepNote["color"]>>("default");
  const [composePinned, setComposePinned] = useState(false);
  const [composePriority, setComposePriority] = useState<KeepNotePriority>("none");
  const [composeImageUrl, setComposeImageUrl] = useState<string | null>(null);
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
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editPriority, setEditPriority] = useState<KeepNotePriority>("none");
  const [editIsEncrypted, setEditIsEncrypted] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Auto-save State & Refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadOfNote = useRef(true);

  // File Input Refs
  const composeFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const composeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Formatting Insertion Helper with scroll & cursor preservation
  const applyFormatting = (
    textarea: HTMLTextAreaElement | null,
    format: "bold" | "italic" | "underline" | "strike" | "code" | "codeblock" | "h1" | "h2" | "bullet" | "number" | "quote",
    currentValue: string,
    setValue: (val: string) => void
  ) => {
    if (!textarea) return;

    // 1. Capture exact current scroll positions before any DOM / state change
    const savedTextareaScrollTop = textarea.scrollTop;
    const scrollContainer = textarea.closest(".overflow-y-auto") as HTMLElement | null;
    const savedContainerScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    const savedWindowScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = currentValue.slice(start, end);

    let replacement = "";
    let newStart = start;
    let newEnd = start;

    switch (format) {
      case "bold":
        if (selected) {
          replacement = `**${selected}**`;
          newStart = start;
          newEnd = start + replacement.length;
        } else {
          replacement = `****`;
          newStart = start + 2;
          newEnd = start + 2;
        }
        break;
      case "italic":
        if (selected) {
          replacement = `*${selected}*`;
          newStart = start;
          newEnd = start + replacement.length;
        } else {
          replacement = `**`;
          newStart = start + 1;
          newEnd = start + 1;
        }
        break;
      case "underline":
        if (selected) {
          replacement = `<u>${selected}</u>`;
          newStart = start;
          newEnd = start + replacement.length;
        } else {
          replacement = `<u></u>`;
          newStart = start + 3;
          newEnd = start + 3;
        }
        break;
      case "strike":
        if (selected) {
          replacement = `~~${selected}~~`;
          newStart = start;
          newEnd = start + replacement.length;
        } else {
          replacement = `~~~~`;
          newStart = start + 2;
          newEnd = start + 2;
        }
        break;
      case "code":
        if (selected) {
          replacement = `\`${selected}\``;
          newStart = start;
          newEnd = start + replacement.length;
        } else {
          replacement = `\`\``;
          newStart = start + 1;
          newEnd = start + 1;
        }
        break;
      case "codeblock":
        if (selected) {
          replacement = `\`\`\`\n${selected}\n\`\`\``;
          newStart = start;
          newEnd = start + replacement.length;
        } else {
          replacement = `\`\`\`\n\n\`\`\``;
          newStart = start + 4;
          newEnd = start + 4;
        }
        break;
      case "h1":
        replacement = `# ${selected}`;
        newStart = start + replacement.length;
        newEnd = start + replacement.length;
        break;
      case "h2":
        replacement = `## ${selected}`;
        newStart = start + replacement.length;
        newEnd = start + replacement.length;
        break;
      case "bullet":
        if (selected) {
          replacement = selected.split("\n").map((l) => `- ${l}`).join("\n");
        } else {
          replacement = `- `;
        }
        newStart = start + replacement.length;
        newEnd = start + replacement.length;
        break;
      case "number":
        if (selected) {
          replacement = selected.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n");
        } else {
          replacement = `1. `;
        }
        newStart = start + replacement.length;
        newEnd = start + replacement.length;
        break;
      case "quote":
        if (selected) {
          replacement = selected.split("\n").map((l) => `> ${l}`).join("\n");
        } else {
          replacement = `> `;
        }
        newStart = start + replacement.length;
        newEnd = start + replacement.length;
        break;
    }

    const nextValue = currentValue.slice(0, start) + replacement + currentValue.slice(end);
    setValue(nextValue);

    // Multi-pass position & scroll locking helper
    const lockPositions = () => {
      if (!textarea) return;
      try {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(newStart, newEnd);
        textarea.scrollTop = savedTextareaScrollTop;
      } catch {}
      if (scrollContainer) {
        scrollContainer.scrollTop = savedContainerScrollTop;
      }
      if (typeof window !== "undefined" && window.scrollY !== savedWindowScrollY) {
        window.scrollTo({ top: savedWindowScrollY, behavior: "instant" });
      }
    };

    // 1. Immediate lock
    lockPositions();

    // 2. Next animation frame
    requestAnimationFrame(() => {
      lockPositions();
      // 3. Post-render timeouts to catch any browser layout reflows
      setTimeout(lockPositions, 10);
      setTimeout(lockPositions, 40);
    });
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

  // Image upload handler
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageFile(file);
      setImage(compressedDataUrl);
    } catch {
      alert("Failed to process image file. Please try another image.");
    }
    e.target.value = "";
  };

  // Drag & Drop Reordering Handler
  const handleDropReorder = (sourceId: string | null, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;

    const currentNotes = [...notes];
    const sourceIndex = currentNotes.findIndex((n) => n.id === sourceId);
    const targetIndex = currentNotes.findIndex((n) => n.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedNote] = currentNotes.splice(sourceIndex, 1);
    currentNotes.splice(targetIndex, 0, movedNote);

    onReorderNotes?.(currentNotes);
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
                imageUrl: parsed.imageUrl || note.imageUrl,
              };
              continue;
            }
          } catch {
            // Plaintext fallback
          }
          nextCache[note.id] = {
            text: decryptedString,
            checklist: note.checklist,
            imageUrl: note.imageUrl,
          };
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
              imageUrl: cached.imageUrl,
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
    if (
      !composeTitle.trim() &&
      !composeContent.trim() &&
      composeChecklist.length === 0 &&
      !composeImageUrl
    ) {
      setIsComposing(false);
      return;
    }

    let finalContent = composeContent.trim();
    let finalChecklist: KeepNoteChecklistItem[] | undefined =
      composeChecklist.length > 0 ? composeChecklist : undefined;
    let finalImageUrl = composeImageUrl || undefined;

    if (composeEncrypted) {
      if (!sessionPin) {
        setShowUnlockModal(true);
        return;
      }

      const payloadString = JSON.stringify({
        text: finalContent,
        checklist: finalChecklist,
        imageUrl: finalImageUrl,
      });

      finalContent = await encryptPayload(payloadString, sessionPin);
      finalChecklist = undefined;
      finalImageUrl = undefined; // Safely protected inside encrypted envelope
    }

    onAddNote({
      title: composeTitle.trim(),
      content: finalContent,
      color: composeColor,
      pinned: composePinned,
      priority: composePriority !== "none" ? composePriority : undefined,
      imageUrl: finalImageUrl,
      isEncrypted: composeEncrypted,
      checklist: finalChecklist,
    });

    setComposeTitle("");
    setComposeContent("");
    setComposeColor("default");
    setComposePinned(false);
    setComposePriority("none");
    setComposeImageUrl(null);
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
        imageUrl: cached.imageUrl,
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

  // Open note for viewing / editing (defaults to preview mode)
  const handleOpenEdit = (note: KeepNote) => {
    if (note.isEncrypted && !sessionPin) {
      setShowUnlockModal(true);
      return;
    }

    isFirstLoadOfNote.current = true;
    setAutoSaveStatus("idle");
    setEditingNote(note);
    setEditIsEncrypted(Boolean(note.isEncrypted));
    setEditPriority(note.priority || "none");

    if (note.isEncrypted && decryptedCache[note.id]) {
      setEditDecryptedContent(decryptedCache[note.id].text);
      setEditDecryptedChecklist(decryptedCache[note.id].checklist || []);
      setEditImageUrl(decryptedCache[note.id].imageUrl || null);
    } else {
      setEditDecryptedContent(note.content);
      setEditDecryptedChecklist(note.checklist || []);
      setEditImageUrl(note.imageUrl || null);
    }

    // Default to Preview mode so user sees clean rendered view; switch to edit when needed
    setActiveTab("preview");
  };

  // Save changes and switch back to preview mode
  const handleSaveAndPreview = async () => {
    await saveCurrentNoteChanges(false);
    setActiveTab("preview");
  };

  // Ref to track latest editing values without stale closure delays
  const latestEditStateRef = useRef({
    note: editingNote,
    content: editDecryptedContent,
    checklist: editDecryptedChecklist,
    imageUrl: editImageUrl,
    priority: editPriority,
    isEncrypted: editIsEncrypted,
  });

  useEffect(() => {
    latestEditStateRef.current = {
      note: editingNote,
      content: editDecryptedContent,
      checklist: editDecryptedChecklist,
      imageUrl: editImageUrl,
      priority: editPriority,
      isEncrypted: editIsEncrypted,
    };
  }, [
    editingNote,
    editDecryptedContent,
    editDecryptedChecklist,
    editImageUrl,
    editPriority,
    editIsEncrypted,
  ]);

  // Core save function (optionally closes modal)
  const saveCurrentNoteChanges = async (closeModal = false) => {
    const { note, content, checklist, imageUrl, priority, isEncrypted } =
      latestEditStateRef.current;
    if (!note) return;

    let finalContent = content.trim();
    let finalChecklist: KeepNoteChecklistItem[] | undefined =
      checklist.length > 0 ? checklist : undefined;
    let finalImageUrl = imageUrl || undefined;

    if (isEncrypted) {
      if (!sessionPin) {
        if (closeModal) setShowUnlockModal(true);
        return;
      }
      try {
        const payloadString = JSON.stringify({
          text: finalContent,
          checklist: finalChecklist,
          imageUrl: finalImageUrl,
        });
        finalContent = await encryptPayload(payloadString, sessionPin);
        finalChecklist = undefined;
        finalImageUrl = undefined;

        setDecryptedCache((prev) => ({
          ...prev,
          [note.id]: {
            text: content.trim(),
            checklist,
            imageUrl: imageUrl || undefined,
          },
        }));
      } catch (err) {
        console.error("Auto-save encryption failed:", err);
        return;
      }
    }

    onUpdateNote(note.id, {
      title: note.title.trim(),
      content: finalContent,
      color: note.color,
      pinned: note.pinned,
      priority: priority !== "none" ? priority : undefined,
      imageUrl: finalImageUrl,
      isEncrypted,
      checklist: finalChecklist,
    });

    setAutoSaveStatus("saved");

    if (closeModal) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setEditingNote(null);
    }
  };

  // Continuous auto-save while typing (debounced at 600ms)
  useEffect(() => {
    if (!editingNote) {
      setAutoSaveStatus("idle");
      return;
    }

    // Skip auto-saving on initial note open
    if (isFirstLoadOfNote.current) {
      isFirstLoadOfNote.current = false;
      return;
    }

    setAutoSaveStatus("saving");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentNoteChanges(false);
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    editDecryptedContent,
    editingNote?.title,
    editingNote?.color,
    editingNote?.pinned,
    editPriority,
    editImageUrl,
    editDecryptedChecklist,
    editIsEncrypted,
  ]);

  // Save changes button handler
  const handleSaveEdit = async () => {
    await saveCurrentNoteChanges(true);
  };

  // Listen for Escape key to save and close modal
  useEffect(() => {
    if (!editingNote) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void saveCurrentNoteChanges(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingNote]);

  // Filter and sort notes
  let processedNotes = notes.filter((n) => {
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

    const matchesSearch = matchTitle || matchContent || matchChecklist;
    const matchesPriority =
      priorityFilter === "all" || (n.priority || "none") === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  // Sorting
  if (sortBy === "priority") {
    const rank: Record<KeepNotePriority, number> = { high: 3, medium: 2, low: 1, none: 0 };
    processedNotes = [...processedNotes].sort((a, b) => {
      const rA = rank[a.priority || "none"];
      const rB = rank[b.priority || "none"];
      return rB - rA;
    });
  } else if (sortBy === "newest") {
    processedNotes = [...processedNotes].sort(
      (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );
  }

  const pinnedNotes = processedNotes.filter((n) => n.pinned);
  const otherNotes = processedNotes.filter((n) => !n.pinned);

  // Render Rich Text Toolbar with focus preservation
  const renderFormattingToolbar = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    currentValue: string,
    setValue: (val: string) => void
  ) => (
    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-black/[0.04] p-1 border border-black/5">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "bold", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Bold (Ctrl+B / Cmd+B)"
      >
        <Bold size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "italic", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Italic (Ctrl+I / Cmd+I)"
      >
        <Italic size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "underline", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Underline (Ctrl+U / Cmd+U)"
      >
        <UnderlineIcon size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "strike", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Strikethrough"
      >
        <Strikethrough size={13} />
      </button>

      <span className="h-3.5 w-px bg-black/15 mx-0.5" />

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "code", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Inline Code"
      >
        <Code size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "codeblock", currentValue, setValue)}
        className="rounded px-1.5 py-1 text-[11px] font-mono text-[#404c43] hover:bg-black/10 transition"
        title="Code Block"
      >
        {"{ }"}
      </button>

      <span className="h-3.5 w-px bg-black/15 mx-0.5" />

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "h1", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Heading 1"
      >
        <Heading1 size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "h2", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Heading 2"
      >
        <Heading2 size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "bullet", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Bullet List"
      >
        <List size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormatting(textareaRef.current, "number", currentValue, setValue)}
        className="rounded p-1.5 text-[#404c43] hover:bg-black/10 transition"
        title="Numbered List"
      >
        <ListOrdered size={13} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
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
      {/* Hidden file inputs for image attachment */}
      <input
        ref={composeFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageFileChange(e, setComposeImageUrl)}
      />
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageFileChange(e, setEditImageUrl)}
      />

      {/* View Header with Filters and Security Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-ink">Important Notes & Scratchpad</h2>
            <span className="rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-bold text-forest">
              {notes.length} Notes
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">
            Drag to reorder, set priorities, attach images, and lock sensitive notes with a private PIN.
          </p>
        </div>

        {/* Security Controls & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-white border border-line px-2 py-1 text-[11px] shadow-2xs">
            <Filter size={12} className="text-muted" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | KeepNotePriority)}
              className="bg-transparent font-medium text-ink outline-none cursor-pointer text-[11px]"
            >
              <option value="all">All Priorities</option>
              <option value="high">🔴 High Priority</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
              <option value="none">Normal</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-white border border-line px-2 py-1 text-[11px] shadow-2xs">
            <ArrowUpDown size={12} className="text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "custom" | "priority" | "newest")}
              className="bg-transparent font-medium text-ink outline-none cursor-pointer text-[11px]"
            >
              <option value="custom">Drag Order</option>
              <option value="priority">Priority First</option>
              <option value="newest">Recently Updated</option>
            </select>
          </div>

          {/* Private Notes Security Control */}
          {!vaultVerifier ? (
            <button
              onClick={() => {
                setPinError(null);
                setShowSetupPinModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#d1d7cc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5a685e] hover:border-forest hover:text-forest transition shadow-sm cursor-pointer"
              title="Set a master PIN to lock sensitive notes"
            >
              <Shield size={13} className="text-forest" />
              <span>Set Master PIN</span>
            </button>
          ) : sessionPin ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-[11px] font-semibold text-[#166534] shadow-sm">
              <ShieldCheck size={14} className="text-[#16a34a]" />
              <span>Notes Unlocked</span>
              <button
                onClick={handleLockVault}
                className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#b91c1c] hover:bg-[#fee2e2] transition cursor-pointer"
                title="Lock notes immediately"
              >
                Lock
              </button>
              <button
                onClick={() => {
                  setPinError(null);
                  setShowChangePinModal(true);
                }}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#166534] hover:bg-[#dcfce7] transition cursor-pointer"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#fed7aa] bg-[#fffaf5] px-3 py-1.5 text-[11px] font-semibold text-[#9a3412] hover:bg-[#ffedd5] transition shadow-sm cursor-pointer"
              title="Click to unlock protected notes with your master PIN"
            >
              <Lock size={13} className="text-[#c2410c]" />
              <span>Notes Locked</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
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
              <span className="text-[13px] font-medium">Take a note, code snippet, image, or password...</span>
              <div className="flex items-center gap-2 text-muted">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposing(true);
                    composeFileInputRef.current?.click();
                  }}
                  className="rounded-lg p-1.5 hover:bg-[#f1f3ed] hover:text-ink transition"
                  title="Add image"
                >
                  <ImageIcon size={16} />
                </button>
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
                  className="rounded-lg p-1.5 hover:bg-[#f1f3ed] hover:text-forest transition cursor-pointer"
                  title="Lock with private PIN"
                >
                  <Lock size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Attached Image Preview */}
              {composeImageUrl && (
                <div className="relative rounded-xl overflow-hidden max-h-48 border border-black/10 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={composeImageUrl} alt="Attachment" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setComposeImageUrl(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Title & Pin & Lock Toggle & Priority */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Title (e.g. Git Config, Server Credentials)"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-muted/60"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {/* Priority selector */}
                  <select
                    value={composePriority}
                    onChange={(e) => setComposePriority(e.target.value as KeepNotePriority)}
                    className="rounded-lg border border-black/10 bg-black/[0.03] px-2 py-1 text-[10px] font-semibold text-ink outline-none cursor-pointer"
                    title="Set Note Priority"
                  >
                    <option value="none">Priority: Normal</option>
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </select>

                  {/* Lock note toggle */}
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
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      composeEncrypted
                        ? "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]"
                        : "text-muted hover:bg-black/5 hover:text-ink"
                    }`}
                    title={composeEncrypted ? "Protected by Master PIN" : "Lock note with Master PIN"}
                  >
                    {composeEncrypted ? <Lock size={12} className="text-[#059669]" /> : <Unlock size={12} />}
                    <span>{composeEncrypted ? "Protected" : "Lock"}</span>
                  </button>

                  {/* Pin note */}
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
                placeholder={composeEncrypted ? "Write private note (protected by your master PIN)..." : "Take a note (supports **bold**, <u>underline</u>, `code`, and markdown)..."}
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

              {/* Bottom bar: color palette, add image, & close */}
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

                  <button
                    type="button"
                    onClick={() => composeFileInputRef.current?.click()}
                    className="ml-1 rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition"
                    title="Attach image"
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposing(false);
                      setComposeTitle("");
                      setComposeContent("");
                      setComposeChecklist([]);
                      setComposeImageUrl(null);
                      setComposePriority("none");
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
            <Pin size={11} className="fill-muted" /> Pinned Notes ({pinnedNotes.length})
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
            Other Notes ({otherNotes.length})
          </div>
        )}
        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto text-muted/40 mb-2" />
            <p className="text-[13px] font-medium text-muted">
              {searchQuery ? "No notes found matching your search" : "No notes yet. Capture your first thought, image, or secret above!"}
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
                Choose a master PIN to protect your private notes. Your notes stay encrypted on your device and can only be opened with this PIN.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-[#404c43] mb-1">
                  Master PIN (min 4 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPinText ? "text" : "password"}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter private PIN"
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
                  placeholder="Re-enter private PIN"
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
                  Save Master PIN
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
                <h3 className="text-[14px] font-bold text-ink">Unlock Private Notes</h3>
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
                Enter your master PIN to view and edit your locked notes.
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

  // Individual Note Card with Drag Handle & Image & Priority Badges
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

    const displayImage = isNoteEncrypted
      ? isDecrypted
        ? decryptedCache[note.id].imageUrl
        : null
      : note.imageUrl;

    const priorityInfo = note.priority && note.priority !== "none" ? PRIORITY_BADGES[note.priority] : null;
    const isDraggingThis = draggedNoteId === note.id;
    const isDragOverThis = dragOverNoteId === note.id;

    return (
      <div
        key={note.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", note.id);
          setDraggedNoteId(note.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverNoteId !== note.id) setDragOverNoteId(note.id);
        }}
        onDragLeave={() => {
          if (dragOverNoteId === note.id) setDragOverNoteId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleDropReorder(draggedNoteId, note.id);
          setDraggedNoteId(null);
          setDragOverNoteId(null);
        }}
        onDragEnd={() => {
          setDraggedNoteId(null);
          setDragOverNoteId(null);
        }}
        onClick={() => handleOpenEdit(note)}
        className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
          colorTheme.bg
        } ${colorTheme.border} ${isDraggingThis ? "opacity-40 scale-95" : ""} ${
          isDragOverThis ? "ring-2 ring-forest scale-[1.02]" : ""
        }`}
      >
        {/* Attached Image Thumbnail */}
        {displayImage && (
          <div className="-mx-4 -mt-4 mb-3 overflow-hidden border-b border-black/5 bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={note.title || "Note image"}
              className="h-36 sm:h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div>
          {/* Header with Drag Handle, Priority Badge, Title, and Pin */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {/* Drag Handle */}
              <span
                className="opacity-0 group-hover:opacity-100 text-muted/60 hover:text-ink cursor-grab active:cursor-grabbing p-0.5 transition"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical size={13} />
              </span>

              {/* Priority Badge */}
              {priorityInfo && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
                >
                  <Flag size={9} />
                  <span>{priorityInfo.label}</span>
                </span>
              )}

              {/* Protection Pill */}
              {isNoteEncrypted && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                    isDecrypted
                      ? "bg-[#dcfce7] text-[#15803d]"
                      : "bg-[#fed7aa] text-[#9a3412]"
                  }`}
                  title={isDecrypted ? "Protected Note (Unlocked)" : "Locked Note (PIN required)"}
                >
                  {isDecrypted ? <Unlock size={10} /> : <Lock size={10} />}
                  <span>{isDecrypted ? "Unlocked" : "Locked"}</span>
                </span>
              )}

              {/* Title */}
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
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition ml-auto shrink-0 ${
                note.pinned
                  ? "!opacity-100 text-forest bg-[#fdf2f2]"
                  : "text-muted hover:text-ink hover:bg-black/5"
              }`}
              title={note.pinned ? "Unpin note" : "Pin note"}
            >
              <Pin size={13} className={note.pinned ? "fill-forest" : ""} />
            </button>
          </div>

          {/* Locked View when note is locked */}
          {isNoteEncrypted && !isDecrypted ? (
            <div className="mt-3.5 rounded-xl border border-dashed border-[#fed7aa] bg-[#fffaf5] p-3.5 text-center">
              <Lock size={18} className="mx-auto text-[#c2410c] mb-1.5" />
              <p className="text-[12px] font-semibold text-[#9a3412]">Locked Note</p>
              <p className="mt-0.5 text-[10px] text-[#b45309]">
                Enter your PIN to view
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUnlockModal(true);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#ea580c] px-3 py-1.5 text-[10.5px] font-semibold text-white shadow-sm hover:bg-[#c2410c] transition cursor-pointer"
              >
                <Key size={11} /> Unlock Note
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

  // Expanded Rich Modal Preview & Editor with continuous auto-save
  function renderNoteCardModal() {
    if (!editingNote) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-150"
        onClick={() => saveCurrentNoteChanges(true)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
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
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {/* Auto-save Status Indicator */}
              <div className="flex items-center mr-1">
                {autoSaveStatus === "saving" && (
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/20 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                    <span>Saving...</span>
                  </span>
                )}
                {autoSaveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-[#1d5b27] bg-[#2e6930]/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#2e6930]/20">
                    <Check size={11} className="stroke-[2.5]" />
                    <span>Saved</span>
                  </span>
                )}
                {autoSaveStatus === "idle" && (
                  <span className="text-muted/60 text-[11px] px-1 font-medium hidden sm:inline">
                    Auto-saved
                  </span>
                )}
              </div>

              {/* Priority Selector */}
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as KeepNotePriority)}
                className="rounded-lg border border-black/10 bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-ink outline-none cursor-pointer"
                title="Change Priority"
              >
                <option value="none">Normal</option>
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

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

              {/* Attach Image button */}
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-muted hover:bg-black/5 hover:text-ink transition"
                title="Attach or replace image"
              >
                <ImageIcon size={16} />
              </button>

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
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  editIsEncrypted
                    ? "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]"
                    : "text-muted hover:bg-black/5 hover:text-ink"
                }`}
                title={editIsEncrypted ? "Protected by Master PIN" : "Lock note with Master PIN"}
              >
                {editIsEncrypted ? <Lock size={12} className="text-[#059669]" /> : <Unlock size={12} />}
                <span className="hidden sm:inline">{editIsEncrypted ? "Protected" : "Lock Note"}</span>
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

              {/* Close & Save X */}
              <button
                type="button"
                onClick={() => saveCurrentNoteChanges(true)}
                className="p-1.5 rounded-lg text-muted hover:bg-black/5 hover:text-ink transition"
                title="Save and close (Esc)"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 flex flex-col sidebar-scroll">
            {/* Attached Image in Edit Modal */}
            {editImageUrl && (
              <div className="relative mb-3 rounded-2xl overflow-hidden border border-black/10 shrink-0 group max-h-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editImageUrl}
                  alt="Attached illustration"
                  className="w-full h-48 sm:h-56 object-cover"
                />
                {activeTab === "edit" && (
                  <button
                    type="button"
                    onClick={() => setEditImageUrl(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition"
                    title="Remove image"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            )}

            {activeTab === "edit" ? (
              <>
                {/* Rich formatting toolbar - sticky at top with matching note bg so it is always accessible and prevents scroll jumping */}
                <div className={`sticky -top-4 z-20 mb-3 shrink-0 pt-2 pb-1.5 ${NOTE_COLORS[editingNote.color || "default"].bg}`}>
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
              <div
                onClick={() => setActiveTab("edit")}
                className="flex-1 rounded-2xl bg-white/75 p-5 sm:p-6 border border-black/5 overflow-y-auto sidebar-scroll min-h-[300px] cursor-pointer hover:border-black/15 transition group relative"
                title="Click anywhere to edit"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5">
                  <h1 className="text-[19px] sm:text-[21px] font-bold text-ink">
                    {editingNote.title || "Untitled Note"}
                  </h1>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("edit");
                    }}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-semibold text-forest bg-forest/10 px-2.5 py-1 rounded-lg transition"
                  >
                    <Edit3 size={12} />
                    <span>Click to edit</span>
                  </button>
                </div>
                {editDecryptedContent ? (
                  <FormattedContent text={editDecryptedContent} isCompact={false} />
                ) : (
                  <p className="text-muted italic text-[12px]">No body text written yet. Click to start typing...</p>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveCurrentNoteChanges(true)}
                className="rounded-xl px-4 py-2 text-[12px] font-medium text-muted hover:bg-black/5 hover:text-ink transition"
              >
                Close
              </button>
              {activeTab === "edit" ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveAndPreview}
                    className="rounded-xl border border-black/15 bg-white/80 px-4 py-2 text-[12px] font-semibold text-ink shadow-xs hover:bg-white transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Eye size={13} />
                    <span>Save & Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveCurrentNoteChanges(true)}
                    className="rounded-xl bg-forest px-5 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {editIsEncrypted && <Lock size={13} />}
                    <span>Done</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className="rounded-xl bg-forest px-5 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#8b1116] transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Edit3 size={13} />
                  <span>Edit Note</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
