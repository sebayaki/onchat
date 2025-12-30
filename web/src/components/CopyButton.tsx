import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/Icons";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  iconClassName?: string;
  title?: string;
  onCopySuccess?: () => void;
}

export default function CopyButton({
  textToCopy,
  className = "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded cursor-pointer",
  iconClassName = "text-[var(--primary)]",
  title = "Copy",
  onCopySuccess,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (onCopySuccess) {
        onCopySuccess();
      }
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <button onClick={handleCopy} className={className} title={title}>
      {copied ? (
        <CheckIcon size={18} className={iconClassName} />
      ) : (
        <CopyIcon size={18} className={iconClassName} />
      )}
    </button>
  );
}
