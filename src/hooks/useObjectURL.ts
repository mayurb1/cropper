import { useEffect, useRef, useState } from "react";

/**
 * Single source of truth for image URL: from prop `file`, prop `src`, or `uploadedFile` (from Upload button).
 * Creates one object URL at a time and revokes it when switching to a new file or on unmount.
 */
export function useObjectURL(
  file: File | null | undefined,
  src: string | null | undefined,
  uploadedFile: File | null
) {
  const [baseURL, setBaseURL] = useState<string | null>(src ?? null);
  const objectURLRef = useRef<string | null>(null);

  useEffect(() => {
    const revokeCurrent = () => {
      if (objectURLRef.current) {
        URL.revokeObjectURL(objectURLRef.current);
        objectURLRef.current = null;
      }
    };

    if (file != null) {
      revokeCurrent();
      const url = URL.createObjectURL(file);
      objectURLRef.current = url;
      setBaseURL(url);
      return () => revokeCurrent();
    }

    if (uploadedFile != null) {
      revokeCurrent();
      const url = URL.createObjectURL(uploadedFile);
      objectURLRef.current = url;
      setBaseURL(url);
      return () => {
        revokeCurrent();
      };
    }

    revokeCurrent();
    setBaseURL(src ?? null);
  }, [file, src, uploadedFile]);

  return { baseURL, setBaseURL };
}
