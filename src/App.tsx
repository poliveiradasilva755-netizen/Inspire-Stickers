import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  Heart,
  Menu,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { DEFAULT_STICKERS } from './data/defaultStickers';
import {
  CATEGORY_LIST,
  CanvasBackdropMode,
  FilterCategory,
  INK_COLORS,
  StickerCategoryName,
  StickerItem,
  StickerRenderOptions,
} from './types/sticker';
import { copyStickerPng, downloadStickerPng } from './utils/stickerCanvas';
import { StickerPreviewCanvas } from './components/StickerPreviewCanvas';
import { StickerModal } from './components/StickerModal';
import { StickerStudioSection } from './components/StickerStudioSection';
import { AdminPanel } from './components/AdminPanel';

const STORAGE_DELTA_KEY = 'inspire_stickers_delta_v3';
const STORAGE_FAVORITES_KEY = 'inspire_stickers_favorites_v3';
const PAGE_SIZE = 24;

const POPULAR_THEMATIC_TAGS = [
  'igreja',
  'natal',
  '2027',
  'ano novo',
  'pilates',
  'treino',
  'motivação',
  'autoestima',
  'fé',
  'foco',
  'skincare',
  'gratidão',
  'negócios',
  'café',
];

interface CatalogDelta {
  added: StickerItem[];
  updated: Record<string, StickerItem>;
  deleted: string[];
  replaced?: StickerItem[] | null;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function loadDelta(): CatalogDelta {
  try {
    const raw = localStorage.getItem(STORAGE_DELTA_KEY);
    if (!raw) return { added: [], updated: {}, deleted: [], replaced: null };
    const parsed = JSON.parse(raw) as Partial<CatalogDelta>;
    return {
      added: Array.isArray(parsed.added) ? parsed.added : [],
      updated: parsed.updated && typeof parsed.updated === 'object' ? parsed.updated : {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      replaced: Array.isArray(parsed.replaced) ? parsed.replaced : null,
    };
  } catch {
    return { added: [], updated: {}, deleted: [], replaced: null };
  }
}

function loadStoredStickers(): StickerItem[] {
  const delta = loadDelta();
  if (delta.replaced && delta.replaced.length > 0) {
    return delta.replaced;
  }
  const deletedSet = new Set(delta.deleted);
  const base = DEFAULT_STICKERS.filter((item) => !deletedSet.has(item.id)).map(
    (item) => delta.updated[item.id] || item
  );
  return [...delta.added, ...base];
}

function saveStickersDelta(stickers: StickerItem[]) {
  try {
    const defaultMap = new Map(DEFAULT_STICKERS.map((s) => [s.id, s]));
    const currentIds = new Set(stickers.map((s) => s.id));
    const added: StickerItem[] = [];
    const updated: Record<string, StickerItem> = {};

    for (const item of stickers) {
      const orig = defaultMap.get(item.id);
      if (!orig) {
        added.push(item);
      } else if (
        item.name !== orig.name ||
        item.category !== orig.category ||
        item.primaryText !== orig.primaryText ||
        item.secondaryText !== orig.secondaryText ||
        Boolean(item.featured) !== Boolean(orig.featured) ||
        (item.copyCount || 0) !== (orig.copyCount || 0) ||
        item.tags.join('|') !== orig.tags.join('|')
      ) {
        updated[item.id] = item;
      }
    }

    const deleted = DEFAULT_STICKERS.filter((s) => !currentIds.has(s.id)).map((s) => s.id);
    const delta: CatalogDelta = { added, updated, deleted, replaced: null };
    localStorage.setItem(STORAGE_DELTA_KEY, JSON.stringify(delta));
  } catch {
    // Ignore storage quota errors
  }
}

function loadStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
    if (!raw) {
      // Seed 3 initial favorites so the favorites button is immediately meaningful
      return DEFAULT_STICKERS.slice(0, 3).map((s) => s.id);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function isInitialAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname === '/admin' ||
    window.location.hash === '#/admin' ||
    window.location.hash === '#admin'
  );
}

export default function App() {
  const [stickers, setStickers] = useState<StickerItem[]>(loadStoredStickers);
  const [favorites, setFavorites] = useState<string[]>(loadStoredFavorites);
  const [isAdminView, setIsAdminView] = useState<boolean>(isInitialAdminRoute);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Catalog filters & preview settings
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalColor, setGlobalColor] = useState<string>('#FFFFFF');
  const [backdropMode, setBackdropMode] = useState<CanvasBackdropMode>('dark');
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'recent'>('featured');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Interactive modal & feedback
  const [activeSticker, setActiveSticker] = useState<StickerItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Persist only changes over the 2,000-sticker base library
  useEffect(() => {
    saveStickersDelta(stickers);
  }, [stickers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    const onPopState = () => {
      setIsAdminView(isInitialAdminRoute());
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, searchQuery, sortBy]);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ message, id });
    window.setTimeout(() => {
      setToast((curr) => (curr && curr.id === id ? null : curr));
    }, 2800);
  }, []);

  const navigateAdmin = useCallback((open: boolean) => {
    setIsAdminView(open);
    setDrawerOpen(false);
    try {
      if (open) {
        window.history.pushState(null, '', '#/admin');
      } else {
        window.history.pushState(
          null,
          '',
          window.location.pathname === '/admin' ? '/' : '#'
        );
      }
    } catch {
      // Ignore restricted history API contexts
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const incrementCopyCount = useCallback((id: string) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, copyCount: (s.copyCount || 0) + 1 } : s))
    );
  }, []);

  const handleCopySticker = useCallback(
    async (sticker: StickerItem, options: StickerRenderOptions) => {
      try {
        const result = await copyStickerPng(sticker, options);
        if (sticker.id !== 'studio-draft') {
          incrementCopyCount(sticker.id);
          setCopiedId(sticker.id);
          window.setTimeout(() => {
            setCopiedId((curr) => (curr === sticker.id ? null : curr));
          }, 1900);
        }
        if (result === 'copied') {
          showToast('Sticker copiado! Agora é só colar nos Stories.');
        } else {
          showToast('PNG transparente baixado — pronto para usar nos Stories.');
        }
      } catch {
        showToast('Não foi possível copiar o sticker neste navegador.');
      }
    },
    [incrementCopyCount, showToast]
  );

  const handleDownloadSticker = useCallback(
    async (sticker: StickerItem, options: StickerRenderOptions) => {
      try {
        await downloadStickerPng(sticker, options);
        showToast(`"${sticker.name}" salvo em PNG transparente.`);
      } catch {
        showToast('Erro ao gerar o arquivo PNG.');
      }
    },
    [showToast]
  );

  const handleColorSelect = (hex: string) => {
    setGlobalColor(hex);
    const chosen = INK_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
    if (chosen) {
      if (!chosen.isLight && backdropMode === 'dark' && hex.toLowerCase() === '#2e2326') {
        setBackdropMode('light');
      } else if (chosen.isLight && backdropMode === 'light') {
        setBackdropMode('dark');
      }
    }
  };

  const handleAddSticker = (item: StickerItem) => {
    setStickers((prev) => [item, ...prev]);
  };

  const handleUpdateSticker = (updated: StickerItem) => {
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    setFavorites((prev) => prev.filter((f) => f !== id));
    showToast('Sticker removido do catálogo.');
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stickers.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [stickers]);

  // Tag-aware, diacritic-insensitive search across tags, name, category, primaryText & secondaryText
  const filteredStickers = useMemo(() => {
    const rawQuery = searchQuery.trim().replace(/^#+/, '');
    const normalizedQuery = normalizeText(rawQuery);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    const list = stickers.filter((sticker) => {
      if (selectedCategory === 'Favoritos') {
        if (!favorites.includes(sticker.id)) return false;
      } else if (selectedCategory !== 'Todos') {
        if (sticker.category !== selectedCategory) return false;
      }

      if (terms.length === 0) return true;

      const normalizedTags = (sticker.tags || []).map((tag) => normalizeText(tag));
      const normalizedName = normalizeText(sticker.name);
      const normalizedCategory = normalizeText(sticker.category);
      const normalizedPrimary = normalizeText(sticker.primaryText);
      const normalizedSecondary = normalizeText(sticker.secondaryText || '');

      return terms.every(
        (term) =>
          normalizedTags.some((tag) => tag.includes(term)) ||
          normalizedName.includes(term) ||
          normalizedCategory.includes(term) ||
          normalizedPrimary.includes(term) ||
          normalizedSecondary.includes(term)
      );
    });

    if (sortBy === 'popular') {
      return [...list].sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
    }
    if (sortBy === 'recent') {
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [stickers, favorites, selectedCategory, searchQuery, sortBy]);

  const displayedStickers = useMemo(
    () => filteredStickers.slice(0, visibleCount),
    [filteredStickers, visibleCount]
  );

  const stageBgClass =
    backdropMode === 'dark'
      ? 'bg-[#241D20]'
      : backdropMode === 'light'
        ? 'bg-[#FBF3F2]'
        : 'bg-checker-dark';

  const jumpToSection = (sectionId: string, categoryOverride?: FilterCategory) => {
    setDrawerOpen(false);
    if (isAdminView) {
      navigateAdmin(false);
    }
    if (categoryOverride) {
      setSelectedCategory(categoryOverride);
    }
    window.setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 45);
  };

  const handleSelectCategoryCard = (category: StickerCategoryName) => {
    setSelectedCategory((prev) => (prev === category ? 'Todos' : category));
    window.setTimeout(() => {
      const el = document.getElementById('stickers-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSelectTag = (tag: string) => {
    setSelectedCategory('Todos');
    setSearchQuery(tag);
    setSearchOpen(true);
    window.setTimeout(() => {
      const el = document.getElementById('stickers-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const openSearch = () => {
    if (isAdminView) {
      navigateAdmin(false);
    }
    setSearchOpen(true);
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  return (
    <div className="min-h-screen flex flex-col bg-inspire-canvas text-[#2E2326]">
      {/* Luminous Top Bar inspired by reference screenshot */}
      <header className="sticky top-0 z-40 border-b border-[#F3E4E7] bg-[#FFF9F7]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Menu + Iconic Brand Lockup */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu de categorias"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0DFE2] bg-white text-[#2E2326] shadow-[0_2px_8px_rgba(196,101,131,0.08)] hover:border-[#DDA6B7] transition-colors cursor-pointer shrink-0"
            >
              <Menu className="h-4 w-4" />
            </button>

            <a
              href="#categorias"
              onClick={(e) => {
                e.preventDefault();
                if (isAdminView) navigateAdmin(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#F7C2D5] via-[#CBB6F7] to-[#FAD3B8] shadow-[0_3px_10px_rgba(196,101,131,0.22)] shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5 text-white fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 2.5C12.3 7.6 16.4 11.7 21.5 12C16.4 12.3 12.3 16.4 12 21.5C11.7 16.4 7.6 12.3 2.5 12C7.6 11.7 11.7 7.6 12 2.5Z" />
                </svg>
              </span>
              <span className="font-display text-xl sm:text-[22px] tracking-tight leading-none">
                <span className="font-bold text-[#2E2326]">Inspire</span>{' '}
                <span className="italic font-medium text-[#C46583]">Stickers</span>
              </span>
            </a>
          </div>

          {/* Zone 2: Clean single-line desktop nav links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#735E65]"
          >
            <a
              href="#categorias"
              onClick={(e) => {
                e.preventDefault();
                jumpToSection('categorias');
              }}
              className="hover:text-[#2E2326] transition-colors whitespace-nowrap shrink-0"
            >
              Categorias
            </a>
            <a
              href="#stickers-grid"
              onClick={(e) => {
                e.preventDefault();
                jumpToSection('stickers-grid', 'Todos');
              }}
              className="hover:text-[#2E2326] transition-colors whitespace-nowrap shrink-0"
            >
              Stickers
            </a>
            <a
              href="#estudio"
              onClick={(e) => {
                e.preventDefault();
                jumpToSection('estudio');
              }}
              className="hover:text-[#2E2326] transition-colors whitespace-nowrap shrink-0"
            >
              Estúdio
            </a>
            <a
              href="#como-usar"
              onClick={(e) => {
                e.preventDefault();
                jumpToSection('como-usar');
              }}
              className="hover:text-[#2E2326] transition-colors whitespace-nowrap shrink-0"
            >
              Como Usar
            </a>
          </nav>

          {/* Zone 3: Quick Search + Favorites Counter */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Buscar stickers ou tags"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0DFE2] bg-white text-[#2E2326] shadow-[0_2px_8px_rgba(196,101,131,0.08)] hover:border-[#DDA6B7] transition-colors cursor-pointer shrink-0"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => jumpToSection('stickers-grid', 'Favoritos')}
              aria-label={`Ver favoritos (${favorites.length})`}
              className={`h-10 inline-flex items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold shadow-[0_2px_8px_rgba(196,101,131,0.08)] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'Favoritos' && !isAdminView
                  ? 'border-[#E69AB2] bg-[#FFF0F5] text-[#C46583]'
                  : 'border-[#F0DFE2] bg-white text-[#2E2326] hover:border-[#DDA6B7]'
              }`}
            >
              <Heart className="h-4 w-4 text-[#E15882] fill-[#E15882]" />
              <span className="font-mono text-xs tabular-nums">{favorites.length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation & Admin Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-[#241A1E]/40 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="w-80 max-w-[85vw] h-full bg-[#FFF9F7] border-r border-[#F0DFE2] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#F2E3E6]">
                <span className="font-display text-xl tracking-tight">
                  <span className="font-bold text-[#2E2326]">Inspire</span>{' '}
                  <span className="italic font-medium text-[#C46583]">Stickers</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#735E65] hover:bg-[#F7E7EB] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="px-2 pb-1 text-xs font-medium text-[#9C7D87]">Navegação</p>
                <button
                  type="button"
                  onClick={() => jumpToSection('categorias', 'Todos')}
                  className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#2E2326] hover:bg-white transition-colors cursor-pointer"
                >
                  <span>Todas as Categorias</span>
                  <span className="font-mono text-xs text-[#8A747B] tabular-nums">
                    {stickers.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('stickers-grid', 'Favoritos')}
                  className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#2E2326] hover:bg-white transition-colors cursor-pointer"
                >
                  <span>Meus Favoritos</span>
                  <span className="font-mono text-xs text-[#C46583] tabular-nums">
                    {favorites.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('estudio')}
                  className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#2E2326] hover:bg-white transition-colors cursor-pointer"
                >
                  <span>Estúdio Criativo</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('como-usar')}
                  className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#2E2326] hover:bg-white transition-colors cursor-pointer"
                >
                  <span>Como Usar nos Stories</span>
                </button>
              </div>

              <div className="space-y-1">
                <p className="px-2 pb-1 text-xs font-medium text-[#9C7D87]">Categorias</p>
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      if (isAdminView) navigateAdmin(false);
                      handleSelectCategoryCard(cat.name);
                    }}
                    className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
                      selectedCategory === cat.name && !isAdminView
                        ? 'bg-white font-semibold text-[#C46583] border border-[#F0CCD7]'
                        : 'text-[#5A474D] hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md text-xs shrink-0"
                        style={{ backgroundColor: cat.tileBg }}
                      >
                        {cat.emoji}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono text-xs text-[#9C7D87] tabular-nums ml-2">
                      {categoryCounts[cat.name] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-[#F2E3E6]">
              <button
                type="button"
                onClick={() => navigateAdmin(!isAdminView)}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E2326] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#423338] transition-colors cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                <span>{isAdminView ? 'Voltar ao Catálogo' : 'Painel Admin (/admin)'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {isAdminView ? (
        <div className="flex-1">
          <AdminPanel
            stickers={stickers}
            onAddSticker={handleAddSticker}
            onUpdateSticker={handleUpdateSticker}
            onDeleteSticker={handleDeleteSticker}
            onImportStickers={(imported) => setStickers(imported)}
            onResetDefaults={() => setStickers(DEFAULT_STICKERS)}
            onBackToSite={() => navigateAdmin(false)}
            onNotify={showToast}
          />
        </div>
      ) : (
        <main className="flex-1">
          {/* Categories Section — Primary Visual Focal Point Matching Screenshot */}
          <section
            id="categorias"
            className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-7 pb-10 md:pt-10 md:pb-12"
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2E2326] tracking-tight">
                  Categorias
                </h1>
                <Sparkles
                  aria-hidden="true"
                  className="h-5 w-5 text-[#E5B84B] shrink-0"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setSearchQuery('');
                  jumpToSection('stickers-grid', 'Todos');
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#C46583] hover:text-[#A54A67] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Ver todas</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 11 Pastel-Icon Category Cards Grid (exact layout rhythm from screenshot) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {CATEGORY_LIST.map((cat) => {
                const count = categoryCounts[cat.name] || 0;
                const isSelected = selectedCategory === cat.name;

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleSelectCategoryCard(cat.name)}
                    className={`group flex items-center gap-3 sm:gap-3.5 rounded-2xl bg-white p-3.5 sm:p-4 text-left transition-all duration-150 cursor-pointer hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border border-[#DF9AB0] ring-2 ring-[#F8DCE6] shadow-[0_8px_22px_-10px_rgba(196,101,131,0.32)]'
                        : 'border border-[#F2E4E6] shadow-[0_6px_18px_-12px_rgba(180,100,126,0.18)] hover:border-[#E6C4CE]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0 transition-transform duration-150 group-hover:scale-105"
                      style={{ backgroundColor: cat.tileBg }}
                    >
                      {cat.emoji}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] sm:text-[15px] font-semibold text-[#2E2326] truncate leading-snug">
                        {cat.name}
                      </div>
                      <div className="mt-0.5 text-xs text-[#8A747B] font-mono tabular-nums">
                        {count} {count === 1 ? 'sticker' : 'stickers'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Main Stickers Discovery & Gallery Section */}
          <section
            id="stickers-grid"
            className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-6 pb-16 border-t border-[#F2E3E6]"
          >
            {/* Header + Tag-Aware Search Bar */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#9C7D87]">
                    <span>PNG 1080 × 1080 transparente</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {filteredStickers.length}{' '}
                      {filteredStickers.length === 1 ? 'sticker' : 'stickers'}
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl md:text-3xl font-semibold text-[#2E2326] tracking-tight">
                    {selectedCategory === 'Todos'
                      ? searchQuery.trim()
                        ? `Resultados para "${searchQuery.trim()}"`
                        : 'Todos os Stickers'
                      : selectedCategory === 'Favoritos'
                        ? 'Seus Stickers Favoritos'
                        : selectedCategory}
                  </h2>
                </div>

                {/* Search Input supporting text & thematic tags */}
                <div className="relative w-full md:w-96">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C7D87]" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Buscar por frase ou tag (ex: pilates, fé, foco, café)..."
                    aria-label="Buscar stickers por frase ou tag"
                    className={`w-full h-11 rounded-2xl border bg-white pl-10 pr-9 text-sm text-[#2E2326] placeholder:text-[#A58D95] focus:border-[#C46583] focus:outline-none transition-colors ${
                      searchOpen ? 'border-[#E3B2C1]' : 'border-[#EFE0E3]'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpar busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-[#8A747B] hover:bg-[#FFF0F4] hover:text-[#2E2326] cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Thematic Tag Quick-Discovery Bar */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-xs font-medium text-[#9C7D87] whitespace-nowrap shrink-0">
                  Explorar tags:
                </span>
                {POPULAR_THEMATIC_TAGS.map((tag) => {
                  const active =
                    normalizeText(searchQuery.trim().replace(/^#+/, '')) ===
                    normalizeText(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (active) {
                          setSearchQuery('');
                        } else {
                          setSelectedCategory('Todos');
                          setSearchQuery(tag);
                        }
                      }}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#C46583] text-white'
                          : 'bg-white border border-[#F0DFE2] text-[#735E65] hover:border-[#DDA6B7] hover:text-[#2E2326]'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>

              {/* Ink Color & Backdrop Controls Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-2xl bg-white border border-[#F0DFE2]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-[#8A747B] whitespace-nowrap">
                    Cor dos stickers
                  </span>
                  <div className="flex items-center gap-2">
                    {INK_COLORS.map((swatch) => {
                      const active =
                        globalColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => handleColorSelect(swatch.hex)}
                          title={swatch.label}
                          aria-label={`Cor ${swatch.label}`}
                          className={`h-7 w-7 rounded-full border cursor-pointer transition-transform ${
                            active
                              ? 'ring-2 ring-[#C46583] ring-offset-2 scale-105 border-black/20'
                              : 'border-black/15 hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        />
                      );
                    })}
                    <input
                      type="color"
                      value={globalColor}
                      onChange={(e) => setGlobalColor(e.target.value)}
                      title="Cor personalizada"
                      aria-label="Escolher cor personalizada"
                      className="h-7 w-7 cursor-pointer rounded-lg border border-[#ECDADF] bg-white p-0.5"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF0F2]">
                    {(
                      [
                        { id: 'dark', label: 'Escuro' },
                        { id: 'light', label: 'Claro' },
                        { id: 'checker', label: 'Grade PNG' },
                      ] as { id: CanvasBackdropMode; label: string }[]
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setBackdropMode(mode.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          backdropMode === mode.id
                            ? 'bg-white text-[#2E2326] shadow-xs'
                            : 'text-[#8A747B] hover:text-[#2E2326]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#9C7D87]" />
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'featured' | 'popular' | 'recent')
                      }
                      aria-label="Ordenar stickers"
                      className="h-8 bg-transparent text-xs font-medium text-[#5A474D] focus:outline-none cursor-pointer"
                    >
                      <option value="featured">Destaques</option>
                      <option value="popular">Mais copiados</option>
                      <option value="recent">Mais recentes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filter Reset Strip */}
            {(selectedCategory !== 'Todos' || searchQuery.trim() !== '') && (
              <div className="mb-5 flex items-center justify-between text-xs text-[#8A747B]">
                <span>
                  Mostrando {displayedStickers.length} de {filteredStickers.length} stickers
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Todos');
                    setSearchQuery('');
                  }}
                  className="font-medium text-[#C46583] hover:underline cursor-pointer"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Sticker Grid */}
            {displayedStickers.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {displayedStickers.map((sticker) => {
                    const isFav = favorites.includes(sticker.id);
                    const isCopied = copiedId === sticker.id;
                    const cardRenderOptions: StickerRenderOptions = {
                      color: globalColor,
                      withShadow: false,
                      tintUploaded: false,
                    };

                    return (
                      <article
                        key={sticker.id}
                        className="group flex flex-col rounded-2xl bg-white border border-[#F2E4E6] overflow-hidden shadow-[0_6px_18px_-12px_rgba(180,100,126,0.16)] transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#E3BBC8]"
                      >
                        {/* Sticker Visual Stage */}
                        <div className={`relative aspect-square w-full ${stageBgClass} p-4 sm:p-5`}>
                          <button
                            type="button"
                            onClick={() => setActiveSticker(sticker)}
                            aria-label={`Abrir prévia no Story de ${sticker.name}`}
                            className="w-full h-full flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-xl"
                          >
                            <StickerPreviewCanvas
                              sticker={sticker}
                              options={cardRenderOptions}
                              resolution={420}
                              className="w-full h-full object-contain transition-transform duration-150 group-hover:scale-[1.03]"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(sticker.id)}
                            aria-label={
                              isFav
                                ? `Remover ${sticker.name} dos favoritos`
                                : `Favoritar ${sticker.name}`
                            }
                            className={`absolute top-2.5 right-2.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors cursor-pointer ${
                              isFav
                                ? 'text-[#DF4F7A] bg-white/95 shadow-xs'
                                : backdropMode === 'light'
                                  ? 'text-[#735E65] hover:bg-black/5 hover:text-[#2E2326]'
                                  : 'text-white/70 hover:bg-white/12 hover:text-white'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Unboxed Metadata + Actions */}
                        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#9C7D87] truncate">
                              <span className="truncate">{sticker.category}</span>
                              {sticker.tags[0] && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="truncate">#{sticker.tags[0]}</span>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveSticker(sticker)}
                              className="mt-1 block w-full text-left text-sm sm:text-[15px] font-semibold text-[#2E2326] truncate hover:text-[#C46583] transition-colors cursor-pointer"
                            >
                              {sticker.name}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopySticker(sticker, cardRenderOptions)}
                              className={`flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-[#C46583] text-white hover:bg-[#AE516F]'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSticker(sticker, cardRenderOptions)}
                              title="Baixar PNG com fundo transparente"
                              aria-label={`Baixar ${sticker.name} em PNG`}
                              className="min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl border border-[#ECDADF] bg-white px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2E2326] hover:bg-[#FFF5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">PNG</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Load More Pagination */}
                {filteredStickers.length > visibleCount && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="min-h-[44px] inline-flex items-center gap-2 rounded-2xl border border-[#E6C4CE] bg-white px-6 py-2.5 text-sm font-semibold text-[#2E2326] hover:bg-[#FFF3F6] hover:border-[#C46583] transition-colors cursor-pointer"
                    >
                      <span>Carregar mais stickers</span>
                      <span className="font-mono text-xs text-[#8A747B] tabular-nums">
                        ({filteredStickers.length - visibleCount} restantes)
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-[#F0DFE2] bg-white py-16 px-6 text-center">
                <p className="font-display text-xl font-semibold text-[#2E2326]">
                  {selectedCategory === 'Favoritos'
                    ? 'Você ainda não favoritou nenhum sticker'
                    : 'Nenhum sticker encontrado'}
                </p>
                <p className="mt-2 text-sm text-[#8A747B] max-w-md mx-auto">
                  {selectedCategory === 'Favoritos'
                    ? 'Toque no ícone de coração nos seus stickers preferidos para salvá-los aqui.'
                    : 'Tente buscar por outra palavra ou tag temática, ou crie seu próprio sticker no Estúdio abaixo.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Todos');
                    setSearchQuery('');
                  }}
                  className="mt-5 min-h-[42px] inline-flex items-center rounded-xl bg-[#C46583] px-5 py-2 text-xs font-semibold text-white hover:bg-[#AE516F] cursor-pointer"
                >
                  Ver todos os stickers
                </button>
              </div>
            )}
          </section>

          {/* Creative Studio Section */}
          <StickerStudioSection
            onCopy={handleCopySticker}
            onDownload={handleDownloadSticker}
            onSaveToCatalog={(newSticker) => {
              handleAddSticker(newSticker);
              showToast(`"${newSticker.name}" salvo na categoria ${newSticker.category}.`);
            }}
          />

          {/* How to Use Section */}
          <section
            id="como-usar"
            className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-14 md:py-18 border-t border-[#F2E3E6]"
          >
            <div className="max-w-xl mb-10">
              <p className="text-xs font-medium text-[#B35B77] tracking-wide">
                Guia rápido
              </p>
              <h2 className="mt-1.5 font-display text-3xl md:text-4xl font-semibold text-[#2E2326] tracking-tight [text-wrap:balance]">
                Como colar nos Stories em segundos
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-white border border-[#F0DFE2] p-6 space-y-2">
                <h3 className="text-base font-semibold text-[#2E2326]">
                  01. Escolha a categoria e a cor
                </h3>
                <p className="text-sm text-[#735E65] leading-relaxed">
                  Explore as 14 categorias ou busque por tags temáticas. Toque no sticker para testar na prévia 9:16 e personalizar a cor.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#F0DFE2] p-6 space-y-2">
                <h3 className="text-base font-semibold text-[#2E2326]">
                  02. Copie com um toque
                </h3>
                <p className="text-sm text-[#735E65] leading-relaxed">
                  Toque em Copiar para levar o sticker em PNG com fundo transparente para sua área de transferência, ou baixe na galeria.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#F0DFE2] p-6 space-y-2">
                <h3 className="text-base font-semibold text-[#2E2326]">
                  03. Cole direto nos Stories
                </h3>
                <p className="text-sm text-[#735E65] leading-relaxed">
                  Abra o Instagram Stories, toque na ferramenta Texto (Aa), toque sobre a foto e selecione Colar.
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Quiet Harmonious Footer */}
      <footer className="border-t border-[#F2E3E6] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-[#8A747B]">
          <span className="font-display text-lg tracking-tight">
            <span className="font-bold text-[#2E2326]">Inspire</span>{' '}
            <span className="italic font-medium text-[#C46583]">Stickers</span>
          </span>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => jumpToSection('categorias')}
              className="hover:text-[#2E2326] transition-colors cursor-pointer"
            >
              Categorias
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('estudio')}
              className="hover:text-[#2E2326] transition-colors cursor-pointer"
            >
              Estúdio
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('como-usar')}
              className="hover:text-[#2E2326] transition-colors cursor-pointer"
            >
              Como Usar
            </button>
            <button
              type="button"
              onClick={() => navigateAdmin(true)}
              className="inline-flex items-center gap-1.5 hover:text-[#2E2326] transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-[#C46583]" />
              <span>Admin</span>
            </button>
          </div>

          <span>© {new Date().getFullYear()} Inspire Stickers</span>
        </div>
      </footer>

      {/* Story Preview & Customizer Modal */}
      <StickerModal
        sticker={activeSticker}
        initialColor={globalColor}
        isFavorite={activeSticker ? favorites.includes(activeSticker.id) : false}
        onClose={() => setActiveSticker(null)}
        onToggleFavorite={handleToggleFavorite}
        onSelectTag={handleSelectTag}
        onCopy={handleCopySticker}
        onDownload={handleDownloadSticker}
      />

      {/* Crisp Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2.5 rounded-2xl bg-[#2E2326] px-4 py-3 text-xs sm:text-sm font-medium text-white shadow-xl border border-white/10"
        >
          <Check className="h-4 w-4 text-[#F3A8C1] shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
