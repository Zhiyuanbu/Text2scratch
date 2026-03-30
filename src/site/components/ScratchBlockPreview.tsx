import { useEffect, useRef } from "react";
import { renderScratchblocksToElement } from "../lib/scratchblocks";

interface ScratchBlockPreviewProps {
  code: string;
  className?: string;
  inline?: boolean;
  scale?: number;
}

export function ScratchBlockPreview({
  code,
  className = "",
  inline = false,
  scale = 1
}: ScratchBlockPreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    renderScratchblocksToElement(hostRef.current, code, { inline, scale });
  }, [code, inline, scale]);

  return <div ref={hostRef} className={`scratchblocks-preview ${className}`.trim()} />;
}

export { ScratchBlockPreview as ScratchblocksPreview };
