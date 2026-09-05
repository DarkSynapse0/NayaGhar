"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Menu, X, Plus, LayoutDashboard, LogOut, User, ChevronRight, Users, Home, Settings, ChevronDown } from "lucide-react";
import { LogoIcon } from "./Logo";
import { useLanguage, LANGUAGES } from "@/hooks/useLanguage";

function isActivePath(pathname: string, href: string) {
  if (href === "/search") return pathname.startsWith("/search");
  if (href === "/listing/new") return pathname === "/listing/new";
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  if (href === "/login") return pathname === "/login" || pathname === "/register";
  return pathname === href;
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { lang, setLang, currentFlag } = useLanguage();
  const role = session?.user?.role ?? null;
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  function closeSheet() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 250);
  }

  function openSheet() {
    setOpen(true);
    setClosing(false);
  }

  useEffect(() => {
    if (open) closeSheet();
    setUserMenuOpen(false);
    setLangOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems = [
    ...(session ? [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }] : []),
    { href: "/search", icon: Search, label: "Search" },
    ...(role === "landlord" ? [{ href: "/listing/new", icon: Plus, label: "List Property" }] : []),
    { href: "/community", icon: Users, label: "Community" },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 group">
            <LogoIcon size={40} />
            <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">
              Naya<span className="text-[var(--brick)]">Ghar</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 h-9 px-3.5 rounded-[var(--radius)] text-[13px] font-semibold transition-colors duration-150 ${
                    active ? "text-[var(--ink)] bg-[var(--paper-2)]" : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]"
                  }`}
                >
                  <Icon className="w-[15px] h-[15px]" />
                  {label}
                </Link>
              );
            })}

            <div className="w-px h-5 bg-[var(--line)] mx-2" />

            {session ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 h-9 px-2 pr-2.5 rounded-[var(--radius)] transition-colors duration-150 ${
                    userMenuOpen ? "bg-[var(--paper-2)]" : "hover:bg-[var(--paper-2)]"
                  }`}
                >
                  <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--brick)] flex items-center justify-center text-[11px] font-bold text-[var(--panel)]">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-[var(--ink-3)] transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[var(--panel)] rounded-[var(--radius)] border border-[var(--line-strong)] shadow-warm-3 overflow-hidden animate-scale-in z-50">
                    <div className="px-4 py-3 border-b border-[var(--line)]">
                      <p className="text-sm font-semibold text-[var(--ink)] truncate">{session.user?.name}</p>
                      <p className="label text-[var(--ink-3)] mt-1">{role} account</p>
                    </div>
                    <div className="py-1.5">
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors">
                        <LayoutDashboard className="w-4 h-4" />{"Dashboard"}
                      </Link>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors">
                        <Settings className="w-4 h-4" />{"Account Settings"}
                      </Link>
                    </div>
                    <div className="border-t border-[var(--line)] py-1.5">
                      <button onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[var(--danger)] hover:bg-[var(--danger-wash)] transition-colors">
                        <LogOut className="w-4 h-4" />{"Sign Out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 h-9 px-4 rounded-[var(--radius)] font-display text-[13px] font-bold transition-colors duration-150 ${
                  isActivePath(pathname, "/login") ? "bg-[var(--brick-ink)] text-[var(--panel)]" : "bg-[var(--brick)] text-[var(--panel)] hover:bg-[var(--brick-ink)]"
                }`}
              >
                <User className="w-[15px] h-[15px]" />
                {"Sign In"}
              </Link>
            )}

            {/* Language dropdown */}
            <div ref={langRef} className="relative ml-1 notranslate">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius)] text-[13px] font-medium transition-colors duration-150 ${
                  langOpen ? "bg-[var(--paper-2)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]"
                }`}
              >
                <span className="text-base leading-none">{currentFlag}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[var(--panel)] rounded-[var(--radius)] border border-[var(--line-strong)] shadow-warm-3 overflow-hidden animate-scale-in z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left transition-colors ${
                        lang === l.code ? "text-[var(--brick)] bg-[var(--brick-wash)]" : "text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-1 md:hidden" translate="no">
            <button
              type="button"
              aria-label="Switch language"
              onClick={() => setLang(lang === "en" ? "ne" : "en")}
              className="notranslate w-11 h-11 rounded-[var(--radius)] flex items-center justify-center hover:bg-[var(--paper-2)] transition-colors text-lg"
              translate="no"
              data-notranslate=""
            >
              <span className="notranslate" translate="no">{currentFlag}</span>
            </button>
            <button type="button" aria-label="Open menu" onClick={openSheet} className="w-11 h-11 rounded-[var(--radius)] flex items-center justify-center hover:bg-[var(--paper-2)] transition-colors">
              <Menu className="w-6 h-6 text-[var(--ink)]" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className={`absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm transition-opacity duration-250 ${closing ? "opacity-0" : "animate-fade-in"}`} onClick={closeSheet} />
          <div className={`absolute top-0 right-0 h-full w-[300px] max-w-[85vw] bg-[var(--panel)] border-l border-[var(--line)] flex flex-col shadow-warm-4 transition-transform duration-250 ease-out ${closing ? "translate-x-full" : "animate-slide-in-right"}`}>

            <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--line)]">
              <Link href="/" className="flex items-center gap-2" onClick={closeSheet}>
                <LogoIcon size={46} />
                <span className="font-display text-xl font-extrabold text-[var(--ink)]">Naya<span className="text-[var(--brick)]">Ghar</span></span>
              </Link>
              <button type="button" aria-label="Close menu" onClick={closeSheet} className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center hover:bg-[var(--paper-2)]">
                <X className="w-4 h-4 text-[var(--ink-2)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain py-3 px-3">
              {[
                { href: "/", icon: Home, label: "Home" },
                ...navItems,
              ].map(({ href, icon: Icon, label }) => {
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeSheet}
                    className={`flex items-center justify-between h-12 px-3 rounded-[var(--radius)] text-sm font-semibold transition-colors ${
                      active ? "text-[var(--ink)] bg-[var(--paper-2)]" : "text-[var(--ink-2)] hover:bg-[var(--paper-2)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-[18px] h-[18px]" />
                      {label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
                  </Link>
                );
              })}

              {!session && (
                <>
                  <div className="h-px bg-[var(--line)] my-2 mx-3" />
                  <Link href="/login" onClick={closeSheet} className="flex items-center justify-center gap-2 h-12 mx-1 rounded-[var(--radius)] font-display text-sm font-bold bg-[var(--brick)] text-[var(--panel)] hover:bg-[var(--brick-ink)] transition-colors">
                    <User className="w-[18px] h-[18px]" />{"Sign In"}
                  </Link>
                </>
              )}

              {/* Language */}
              <div className="notranslate">
                <div className="h-px bg-[var(--line)] my-2 mx-3" />
                <p className="label px-3 py-2 text-[var(--ink-3)]">Language</p>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`flex items-center gap-3 h-12 px-3 rounded-[var(--radius)] text-sm font-semibold w-full transition-colors ${
                      lang === l.code ? "text-[var(--brick)] bg-[var(--brick-wash)]" : "text-[var(--ink-2)] hover:bg-[var(--paper-2)]"
                    }`}
                  >
                    <span className="text-base">{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>

            {session && (
              <div className="border-t border-[var(--line)] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--brick)] flex items-center justify-center text-sm font-bold text-[var(--panel)]">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-[var(--ink)]">{session.user?.name}</p>
                    <p className="label text-[var(--ink-3)] mt-0.5">{role}</p>
                  </div>
                </div>
                <button
                  onClick={() => { closeSheet(); setTimeout(() => signOut({ callbackUrl: "/" }), 300); }}
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-[var(--radius)] text-sm font-semibold text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger-wash)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />{"Sign Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
