import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Derive the Wikimedia Commons file page (carrying author + license)
// from an upload.wikimedia.org thumb/original URL, for CC attribution.
export function wikimediaFilePage(url: string): string | null {
  const m = url.match(
    /upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[^/]+\/[^/]+\/([^/]+)/
  );
  return m ? `https://commons.wikimedia.org/wiki/File:${m[1]}` : null;
}
