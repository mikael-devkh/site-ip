import React from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const linkBase = "px-3 py-1.5 rounded-md transition-colors";
const linkActive = "bg-primary text-primary-foreground shadow-glow";
const linkIdle =
  "text-muted hover:text-foreground hover:bg-wt-green-50/60 dark:hover:bg-wt-green-900/20";

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo-wt.png"
            alt="WT"
            className="h-8 w-8 rounded-sm shadow-glow hidden sm:block"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="sm:hidden inline-flex h-8 w-8 items-center justify-center rounded-sm bg-wt-green-600 text-white font-bold shadow-glow">
            WT
          </div>
          <span className="font-semibold text-foreground">WT Serviços de Tecnologia</span>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink to="/rat" className={({isActive}) => `${linkBase} ${isActive?linkActive:linkIdle}`}>RAT</NavLink>
          <NavLink to="/ips" className={({isActive}) => `${linkBase} ${isActive?linkActive:linkIdle}`}>IPs</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
