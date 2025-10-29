import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wt: {
          green: {
            50:"#f1f8ec",100:"#dff0d2",200:"#bfe4a7",300:"#9fd77b",400:"#86cd5e",
            500:"#6fbe43",600:"#59a835",700:"#4a8f2d",800:"#3b7326",900:"#2e5a1e"
          },
          graphite: {
            50:"#f7f7f7",100:"#eeeeee",200:"#e2e2e2",300:"#cfcfcf",400:"#a6a6a6",
            500:"#7a7a7a",600:"#5f5f5f",700:"#4a4a4a",800:"#363636",900:"#222222"
          },
          accent: { lime:"#b4e06a" }
        },
        /* mapeamento semântico (pega das CSS vars do tema) */
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        muted: "var(--color-muted)",
        card: "var(--color-card)",
        border: "var(--color-border)"
      },
      boxShadow: { glow: "var(--shadow-glow)" }
    }
  },
  plugins: []
} satisfies Config;
