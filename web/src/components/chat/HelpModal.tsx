import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";

interface HelpItem {
  command: string;
  description: string;
}

interface ModalPosition {
  bottom: number;
  right: number;
}

const HELP_ITEMS: HelpItem[] = [
  { command: "/list", description: "List all channels" },
  { command: "/join", description: "Join a channel" },
  { command: "/part", description: "Leave channel" },
  { command: "/create", description: "Create channel" },
  { command: "/who", description: "List users" },
  { command: "/whois", description: "User info" },
  { command: "/whoami", description: "Your info" },
  { command: "/clear", description: "Clear screen" },
  { command: "/balance", description: "Check rewards" },
  { command: "/claim", description: "Claim rewards" },
  { command: "/mode", description: "Moderation" },
];

export function HelpModal({
  isOpen,
  onClose,
  onSelectCommand,
  anchorRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: string) => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [position, setPosition] = useState<ModalPosition | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset selection and calculate position when modal opens
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setSelectedIndex(0);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Calculate position in layout effect (after render, before paint)
  useLayoutEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8,
        right: window.innerWidth - rect.right,
      });
    } else if (!isOpen) {
      setPosition(null);
    }
  }, [isOpen, anchorRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : HELP_ITEMS.length - 1,
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < HELP_ITEMS.length - 1 ? prev + 1 : 0,
          );
          break;
        case "Enter":
          e.preventDefault();
          onSelectCommand(HELP_ITEMS[selectedIndex].command);
          onClose();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        default:
          // Number keys 0-9 for quick selection
          if (e.key >= "0" && e.key <= "9") {
            const index = parseInt(e.key);
            if (index < HELP_ITEMS.length) {
              e.preventDefault();
              onSelectCommand(HELP_ITEMS[index].command);
              onClose();
            }
          }
          break;
      }
    },
    [isOpen, selectedIndex, onSelectCommand, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalStyle: React.CSSProperties | undefined = position
    ? { position: "fixed", bottom: position.bottom, right: position.right }
    : undefined;

  return (
    <div className="fixed inset-0 z-50" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        style={modalStyle}
        className={`bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg shadow-2xl max-w-[360px] w-full font-mono overflow-hidden ${
          !position
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-tertiary)]">
          <span className="text-[var(--color-content)] text-[0.85rem]">
            Select Command
          </span>
          <span className="text-[var(--text-dim)] text-[0.7rem]">
            ↑↓ move · ↵ select
          </span>
        </div>

        {/* Command list */}
        <div className="py-2">
          {HELP_ITEMS.map((item, index) => {
            const isSelected = index === selectedIndex;

            return (
              <div
                key={item.command}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--primary)] text-[var(--bg-primary)]"
                    : "hover:bg-[var(--bg-tertiary)]"
                }`}
                onClick={() => {
                  onSelectCommand(item.command);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span
                  className={`text-[0.8rem] w-[1.8rem] shrink-0 ${
                    isSelected
                      ? "text-[var(--bg-primary)]"
                      : "text-[var(--text-dim)]"
                  }`}
                >
                  [{index}]
                </span>
                <span
                  className={`text-[0.9rem] font-bold shrink-0 ${
                    isSelected
                      ? "text-[var(--bg-primary)]"
                      : "text-[var(--primary)]"
                  }`}
                >
                  {item.command}
                </span>
                <span
                  className={`text-[0.8rem] ${
                    isSelected
                      ? "text-[var(--bg-primary)] opacity-80"
                      : "text-[var(--text-dim)]"
                  }`}
                >
                  {item.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
