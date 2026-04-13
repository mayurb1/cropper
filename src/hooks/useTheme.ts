import { useEffect, useMemo, useState } from "react";
import type { ImageEditorTheme } from "../types";
import { LIGHT_VARS, DARK_VARS } from "../constants/theme";

export function useTheme(theme: ImageEditorTheme) {
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | null>(
    theme === "auto" ? null : theme
  );

  useEffect(() => {
    if (theme !== "auto") {
      setResolvedTheme(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setResolvedTheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const themeVars = useMemo(
    () => (resolvedTheme === "dark" ? DARK_VARS : LIGHT_VARS),
    [resolvedTheme]
  );

  return {
    resolvedTheme: resolvedTheme ?? "light",
    themeVars,
  };
}
