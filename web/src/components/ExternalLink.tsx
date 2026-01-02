import { sdk } from "@farcaster/miniapp-sdk";
import { useFarcaster } from "@/context";

/**
 * ExternalLink component that handles links in Farcaster mini app context.
 * Uses sdk.actions.openUrl() for proper deep linking in Farcaster.
 */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { isInMiniApp } = useFarcaster();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept clicks in Farcaster mini app context
    if (!isInMiniApp) {
      return;
    }

    e.preventDefault();

    try {
      await sdk.actions.openUrl(href);
    } catch {
      // Fallback if SDK fails
      window.open(href, "_blank", "noreferrer noopener");
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
