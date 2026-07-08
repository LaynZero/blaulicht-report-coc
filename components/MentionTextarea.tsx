"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, endAt, getDocs, limit, orderBy, query, startAt } from "firebase/firestore";
import { db } from "@/app/firebase";
import type { AppUser } from "@/lib/types";

type MentionTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function getMentionSearch(value: string) {
  const match = value.match(/(^|\s)@([a-zA-Z0-9_.]{1,20})$/);
  return match?.[2]?.toLowerCase() ?? "";
}

function replaceCurrentMention(value: string, username: string) {
  return value.replace(/(^|\s)@([a-zA-Z0-9_.]{1,20})$/, `$1@${username} `);
}

export default function MentionTextarea({ value, onChange, rows = 4, placeholder, className = "", disabled }: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const mentionSearch = useMemo(() => getMentionSearch(value), [value]);

  useEffect(() => {
    let cancelled = false;
    async function loadSuggestions() {
      if (mentionSearch.length < 1) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "users"),
            orderBy("username"),
            startAt(mentionSearch),
            endAt(`${mentionSearch}\uf8ff`),
            limit(6),
          ),
        );
        if (!cancelled) setSuggestions(snap.docs.map((item) => item.data() as AppUser));
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = window.setTimeout(loadSuggestions, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mentionSearch]);

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
      />

      {mentionSearch && (suggestions.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
          {loading && suggestions.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Suche Nutzer...</p>}
          {suggestions.map((appUser) => (
            <button
              key={appUser.uid}
              type="button"
              onClick={() => {
                onChange(replaceCurrentMention(value, appUser.username));
                setSuggestions([]);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-900"
            >
              {appUser.avatarDataUrl ? (
                <img src={appUser.avatarDataUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                  {appUser.displayName?.slice(0, 1).toUpperCase() || "@"}
                </div>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-white">{appUser.displayName}</span>
                <span className="block truncate text-xs text-blue-300">@{appUser.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
