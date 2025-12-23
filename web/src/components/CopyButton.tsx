"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import CopyIcon from "@/assets/icons/copy.svg";
import CheckIcon from "@/assets/icons/check.svg";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  iconClassName?: string;
  title?: string;
  copyIcon?: StaticImageData;
  checkIcon?: StaticImageData;
  onCopySuccess?: () => void;
}

export default function CopyButton({
  textToCopy,
  className = "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded cursor-pointer",
  iconClassName = "h-4.5 w-auto",
  title = "Copy",
  copyIcon = CopyIcon,
  checkIcon = CheckIcon,
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
        <Image src={checkIcon} alt="Copied" className={iconClassName} />
      ) : (
        <Image src={copyIcon} alt="Copy" className={iconClassName} />
      )}
    </button>
  );
}
