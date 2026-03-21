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
  const role = session?.user ? (session.user as { role: string }).role : null;
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  function closeSheet() { setClosing(true); setTimeout(() => { setOpen(false); setClosing(false); }, 250); }
  function openSheet() { setOpen(true); setClosing(false); }

  useEffect(() => { if (open) closeSheet(); setUserMenuOpen(false); setLangOpen(false); }, [pathname]);
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
      <header className="fixed top-0 inset-x-0 py-2 z-50 border-b border-white/[0.04] bg-[#0A0A0A]/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 group">
            <LogoIcon size={64} />
            <span className="text-lg font-bold tracking-tight">
              Naya<span className="text-[var(--accent)]">Ghar</span>
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
                  className={`relative flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    active ? "text-white bg-white/[0.08]" : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-[15px] h-[15px]" />
                  {label}
                </Link>
              );
            })}

            <div className="w-px h-5 bg-white/[0.06] mx-2" />

            {session ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 h-9 px-2 pr-2.5 rounded-full transition-all duration-200 ${
                    userMenuOpen ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-[11px] font-bold text-white">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-white/30 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[#141414] rounded-xl border border-white/[0.06] shadow-warm-3 overflow-hidden animate-scale-in z-50">
                    <div className="px-4 py-3 border-b border-white/[0.04]">
                      <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                      <p className="text-[12px] text-white/25 capitalize mt-0.5">{role} account</p>
                    </div>
                    <div className="py-1.5">
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all">
                        <LayoutDashboard className="w-4 h-4" />{"Dashboard"}
                      </Link>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all">
                        <Settings className="w-4 h-4" />{"Account Settings"}
                      </Link>
                    </div>
                    <div className="border-t border-white/[0.04] py-1.5">
                      <button onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all">
                        <LogOut className="w-4 h-4" />{"Sign Out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                  isActivePath(pathname, "/login") ? "bg-[var(--accent)] text-white" : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                }`}
              >
                <User className="w-[15px] h-[15px]" />
                {"Landlord Login"}
              </Link>
            )}

            {/* Language dropdown */}
            <div ref={langRef} className="relative ml-1 notranslate">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  langOpen ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-base leading-none">{currentFlag}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#141414] rounded-xl border border-white/[0.06] shadow-warm-3 overflow-hidden animate-scale-in z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-left transition-colors ${
                        lang === l.code ? "text-[var(--accent)] bg-[var(--accent)]/[0.08]" : "text-white/50 hover:bg-white/[0.04] hover:text-white"
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
            {/* Mobile language flag */}
            <button
              onClick={() => setLang(lang === "en" ? "ne" : "en")}
              className="notranslate w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/[0.04] transition-colors text-base"
              translate="no"
              data-notranslate=""
            >
              <span className="notranslate" translate="no">{currentFlag}</span>
            </button>
            <button onClick={openSheet} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/[0.04] transition-colors">
              <Menu className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${closing ? "opacity-0" : "animate-fade-in"}`} onClick={closeSheet} />
          <div className={`absolute top-0 right-0 h-full w-[300px] max-w-[85vw] bg-[#111] border-l border-white/[0.04] flex flex-col shadow-warm-4 transition-transform duration-250 ease-out ${closing ? "translate-x-full" : "animate-slide-in-right"}`}>

            <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.04]">
              <Link href="/" className="flex items-center gap-2" onClick={closeSheet}>
                <LogoIcon size={30} />
                <span className="text-base font-bold">Naya<span className="text-[var(--accent)]">Ghar</span></span>
              </Link>
              <button onClick={closeSheet} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.04]">
                <X className="w-4 h-4 text-white/50" />
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
                    className={`flex items-center justify-between h-12 px-3 rounded-xl text-sm font-medium transition-all ${
                      active ? "text-white bg-white/[0.08]" : "text-white/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-[18px] h-[18px]" />
                      {label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10" />
                  </Link>
                );
              })}

              {!session && (
                <>
                  <div className="h-px bg-white/[0.04] my-2 mx-3" />
                  <Link href="/login" onClick={closeSheet} className="flex items-center justify-between h-12 px-3 rounded-xl text-sm font-medium text-white/40 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3"><User className="w-[18px] h-[18px]" />{"Landlord Login"}</div>
                    <ChevronRight className="w-4 h-4 text-white/10" />
                  </Link>
                </>
              )}

              {/* Language */}
              <div className="notranslate">
                <div className="h-px bg-white/[0.04] my-2 mx-3" />
                <p className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white/15">Language</p>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium w-full transition-all ${
                      lang === l.code ? "text-white bg-white/[0.06]" : "text-white/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-base">{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>

            {session && (
              <div className="border-t border-white/[0.04] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center text-sm font-bold text-[var(--accent)]">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                    <p className="text-[11px] text-white/20 capitalize">{role}</p>
                  </div>
                </div>
                <Link href="/dashboard" onClick={closeSheet} className="flex items-center gap-3 w-full h-10 px-3 rounded-xl text-sm text-white/40 hover:bg-white/[0.04] transition-all mb-2">
                  <Settings className="w-4 h-4" />{"Account Settings"}
                </Link>
                <button
                  onClick={() => { closeSheet(); setTimeout(() => signOut({ callbackUrl: "/" }), 300); }}
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 border border-red-500/[0.08] hover:bg-red-500/[0.06] transition-all"
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
