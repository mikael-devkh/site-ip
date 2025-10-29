import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((v) => !v)}
      className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-wt-green-50/60 dark:hover:bg-wt-green-900/20 transition-colors"
      title="Alternar tema"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
