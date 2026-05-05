"use client";

import { useState, useCallback, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useDebounce } from "@/hooks";
import { StaggerList, StaggerItem } from "@/components/motion/ScrollReveal";

/**
 * 搜索页面
 * 
 * 注意：免责声明检查已移至 DisclaimerGate 组件，此处不再重复检查
 */
export default function SearchPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  return (
    <div>
      <h1 className="text-2xl font-sans font-bold text-ink mb-6">{t.search_title}</h1>

      <div className="mb-8">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-lighter" />
          <input
            type="text"
            placeholder={t.search_placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) { setResults([]); setSearched(false); }
            }}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-paper text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
            autoFocus
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (<div key={i} className="skeleton h-24 w-full" />))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-lighter font-sans">
            {t.search_no_results_prefix}{query}{t.search_no_results_suffix}
          </p>
        </div>
      ) : results.length > 0 ? (
        <div>
          <p className="text-sm font-sans text-ink-lighter mb-4">
            {t.search_results_count_prefix}{results.length}{t.search_results_count_suffix}
          </p>
          <StaggerList stagger={0.06}>
            {results.map((post) => (
              <StaggerItem key={post.id}>
                <PostCard post={post} />
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      ) : (
        <div className="text-center py-16">
          <SearchIcon size={40} className="mx-auto text-ink-lighter/30 mb-4" />
          <p className="text-ink-lighter font-sans text-sm">{t.search_input_hint}</p>
        </div>
      )}
    </div>
  );
}
