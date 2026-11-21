import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  ImagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AccentSymbol,
  PRESET_LABELS,
  STICKER_CATEGORIES,
  StickerCategoryName,
  StickerItem,
  StickerStylePreset,
} from '../types/sticker';
import { StickerPreviewCanvas } from './StickerPreviewCanvas';

interface AdminPanelProps {
  stickers: StickerItem[];
  onAddSticker: (sticker: StickerItem) => void;
  onUpdateSticker: (sticker: StickerItem) => void;
  onDeleteSticker: (id: string) => void;
  onImportStickers: (stickers: StickerItem[]) => void;
  onResetDefaults: () => void;
  onBackToSite: () => void;
  onNotify: (message: string) => void;
}

type AdminTab = 'add' | 'manage' | 'backup';
type AddMode = 'upload' | 'typographic';

const TYPO_PRESETS: Exclude<StickerStylePreset, 'uploaded-png'>[] = [
  'editorial-serif',
  'italic-signature',
  'minimal-sans',
  'stamp-circle',
  'arch-frame',
  'ticket-label',
  'checklist-card',
  'polaroid-frame',
  'ribbon-note',
  'botanical-accent',
  'sparkle-title',
  'date-mark',
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function AdminPanel({
  stickers,
  onAddSticker,
  onUpdateSticker,
  onDeleteSticker,
  onImportStickers,
  onResetDefaults,
  onBackToSite,
  onNotify,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('add');
  const [addMode, setAddMode] = useState<AddMode>('upload');

  // Upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] =
    useState<StickerCategoryName>('Pilates & Estilo de vida');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importJsonRef = useRef<HTMLInputElement | null>(null);

  // Typographic creator state
  const [typoName, setTypoName] = useState('');
  const [typoCategory, setTypoCategory] = useState<StickerCategoryName>('Motivação');
  const [typoPreset, setTypoPreset] =
    useState<Exclude<StickerStylePreset, 'uploaded-png'>>('editorial-serif');
  const [typoPrimary, setTypoPrimary] = useState('sua melhor fase');
  const [typoSecondary, setTypoSecondary] = useState('COMEÇA AGORA');
  const [typoSymbol, setTypoSymbol] = useState<AccentSymbol>('sparkle');
  const [typoTags, setTypoTags] = useState('motivação, fase, inspiração');
  const [typoFeatured, setTypoFeatured] = useState(false);

  // Manage state
  const [manageQuery, setManageQuery] = useState('');
  const [manageCategory, setManageCategory] = useState<'Todas' | StickerCategoryName>('Todas');
  const [visibleManageCount, setVisibleManageCount] = useState(40);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<StickerCategoryName>('Motivação');
  const [editPrimary, setEditPrimary] = useState('');
  const [editTags, setEditTags] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const customCount = stickers.filter((s) => s.isCustom).length;
    const totalCopies = stickers.reduce((acc, s) => acc + (s.copyCount || 0), 0);
    const categoriesActive = new Set(stickers.map((s) => s.category)).size;
    return { total: stickers.length, customCount, totalCopies, categoriesActive };
  }, [stickers]);

  const filteredManage = useMemo(() => {
    const q = normalizeText(manageQuery.trim());
    return stickers.filter((s) => {
      if (manageCategory !== 'Todas' && s.category !== manageCategory) return false;
      if (!q) return true;
      return (
        normalizeText(s.name).includes(q) ||
        normalizeText(s.category).includes(q) ||
        normalizeText(s.primaryText).includes(q) ||
        s.tags.some((t) => normalizeText(t).includes(q))
      );
    });
  }, [stickers, manageQuery, manageCategory]);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotify('Envie um arquivo PNG, SVG ou WebP válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadDataUrl(reader.result);
        if (!uploadName) {
          const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
          setUploadName(clean.charAt(0).toUpperCase() + clean.slice(1));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleSaveUploaded = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDataUrl) {
      onNotify('Selecione uma imagem PNG ou SVG primeiro.');
      return;
    }
    const title = uploadName.trim() || 'Novo Sticker PNG';
    const tags = uploadTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const item: StickerItem = {
      id: `png-${Date.now()}`,
      name: title,
      category: uploadCategory,
      tags: tags.length ? tags : [uploadCategory.toLowerCase(), 'png'],
      preset: 'uploaded-png',
      primaryText: title,
      imageDataUrl: uploadDataUrl,
      featured: uploadFeatured,
      isCustom: true,
      createdAt: new Date().toISOString().slice(0, 10),
      copyCount: 0,
    };

    onAddSticker(item);
    setUploadName('');
    setUploadTags('');
    setUploadDataUrl(null);
    setUploadFeatured(false);
    onNotify(`"${title}" adicionado ao catálogo.`);
  };

  const handleSaveTypographic = (e: React.FormEvent) => {
    e.preventDefault();
    const primary = typoPrimary.trim();
    if (!primary) {
      onNotify('Digite o texto principal do sticker.');
      return;
    }
    const title = typoName.trim() || primary.charAt(0).toUpperCase() + primary.slice(1);
    const tags = typoTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const item: StickerItem = {
      id: `typo-${Date.now()}`,
      name: title,
      category: typoCategory,
      tags: tags.length ? tags : [typoCategory.toLowerCase()],
      preset: typoPreset,
      primaryText: primary,
      secondaryText: typoSecondary.trim(),
      tertiaryText: '0',
      accentSymbol: typoSymbol,
      featured: typoFeatured,
      isCustom: true,
      createdAt: new Date().toISOString().slice(0, 10),
      copyCount: 0,
    };

    onAddSticker(item);
    setTypoName('');
    setTypoPrimary('');
    setTypoSecondary('');
    setTypoFeatured(false);
    onNotify(`"${title}" adicionado à biblioteca.`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(stickers, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspire-stickers-catalogo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('Backup do catálogo exportado em JSON.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          onNotify('Arquivo JSON inválido.');
          return;
        }
        onImportStickers(parsed as StickerItem[]);
        onNotify(`${parsed.length} stickers importados com sucesso.`);
      } catch {
        onNotify('Não foi possível ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEdit = (item: StickerItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrimary(item.primaryText);
    setEditTags(item.tags.join(', '));
  };

  const commitEdit = (item: StickerItem) => {
    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onUpdateSticker({
      ...item,
      name: editName.trim() || item.name,
      category: editCategory,
      primaryText:
        item.preset === 'uploaded-png'
          ? item.primaryText
          : editPrimary.trim() || item.primaryText,
      tags: parsedTags.length ? parsedTags : item.tags,
    });
    setEditingId(null);
    onNotify('Sticker atualizado.');
  };

  const draftTypoSticker: StickerItem = {
    id: 'admin-draft',
    name: typoName || 'Prévia',
    category: typoCategory,
    tags: [],
    preset: typoPreset,
    primaryText: typoPrimary || 'seu texto',
    secondaryText: typoSecondary,
    tertiaryText: '0',
    accentSymbol: typoSymbol,
    createdAt: '',
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[#F2E3E6]">
        <div>
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#735E65] hover:text-[#2E2326] transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o catálogo</span>
          </button>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#2E2326] tracking-tight">
            Gerenciar Biblioteca
          </h1>
          <p className="mt-1.5 text-sm text-[#735E65]">
            Adicione novos stickers PNG, crie novas artes tipográficas e organize suas categorias e tags.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F6E8EC]">
          {(
            [
              { id: 'add', label: 'Adicionar Sticker' },
              { id: 'manage', label: 'Gerenciar Catálogo' },
              { id: 'backup', label: 'Backup do Conteúdo' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#2E2326] shadow-xs'
                  : 'text-[#735E65] hover:text-[#2E2326]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-[#F2E3E6]">
        <div className="rounded-2xl bg-white border border-[#F0DFE2] p-4">
          <div className="text-xs text-[#8A747B]">Total no catálogo</div>
          <div className="mt-1 font-mono text-2xl font-medium text-[#2E2326] tabular-nums">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F0DFE2] p-4">
          <div className="text-xs text-[#8A747B]">Criados por você</div>
          <div className="mt-1 font-mono text-2xl font-medium text-[#2E2326] tabular-nums">
            {stats.customCount}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F0DFE2] p-4">
          <div className="text-xs text-[#8A747B]">Categorias ativas</div>
          <div className="mt-1 font-mono text-2xl font-medium text-[#2E2326] tabular-nums">
            {stats.categoriesActive}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F0DFE2] p-4">
          <div className="text-xs text-[#8A747B]">Cópias registradas</div>
          <div className="mt-1 font-mono text-2xl font-medium text-[#2E2326] tabular-nums">
            {stats.totalCopies.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* TAB 1: ADD STICKER */}
      {activeTab === 'add' && (
        <div className="pt-8 space-y-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddMode('upload')}
              className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                addMode === 'upload'
                  ? 'border-[#C46583] bg-[#C46583] text-white'
                  : 'border-[#ECDADF] bg-white text-[#5A474D] hover:border-[#C46583]'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Enviar PNG / SVG</span>
            </button>
            <button
              type="button"
              onClick={() => setAddMode('typographic')}
              className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                addMode === 'typographic'
                  ? 'border-[#C46583] bg-[#C46583] text-white'
                  : 'border-[#ECDADF] bg-white text-[#5A474D] hover:border-[#C46583]'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Criar Sticker Tipográfico</span>
            </button>
          </div>

          {addMode === 'upload' ? (
            <form
              onSubmit={handleSaveUploaded}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-5">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors overflow-hidden ${
                    isDragging
                      ? 'border-[#C46583] bg-[#FFF0F4]'
                      : uploadDataUrl
                        ? 'border-[#ECDADF] bg-checker-dark'
                        : 'border-[#E6CCD3] bg-white hover:border-[#C46583]'
                  }`}
                >
                  {uploadDataUrl ? (
                    <img
                      src={uploadDataUrl}
                      alt="Prévia do PNG enviado"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="space-y-3 max-w-xs">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F5] text-[#C46583]">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2E2326]">
                          Arraste seu PNG transparente aqui
                        </p>
                        <p className="mt-1 text-xs text-[#8A747B]">
                          Ou clique para selecionar do computador ou celular (PNG, SVG, WebP)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFile(f);
                  }}
                  className="hidden"
                />
                {uploadDataUrl && (
                  <button
                    type="button"
                    onClick={() => setUploadDataUrl(null)}
                    className="mt-3 text-xs font-medium text-[#8A747B] hover:text-[#2E2326] cursor-pointer"
                  >
                    Trocar arquivo selecionado
                  </button>
                )}
              </div>

              <div className="lg:col-span-7 rounded-3xl bg-white border border-[#F0DFE2] p-6 md:p-8 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                    Nome do sticker
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Ex: Bom dia caligrafia"
                    className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) =>
                        setUploadCategory(e.target.value as StickerCategoryName)
                      }
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    >
                      {STICKER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Tags de busca (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="pilates, rotina, leveza"
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2.5 text-sm text-[#5A474D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadFeatured}
                    onChange={(e) => setUploadFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#C46583]"
                  />
                  <span>Exibir em destaque no catálogo</span>
                </label>

                <div className="pt-3 border-t border-[#F4E7EA]">
                  <button
                    type="submit"
                    className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#C46583] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#AE516F] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar sticker ao catálogo</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleSaveTypographic}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-5">
                <div className="aspect-square w-full rounded-3xl border border-[#F0DFE2] bg-checker-dark p-6 flex items-center justify-center">
                  <StickerPreviewCanvas
                    sticker={draftTypoSticker}
                    options={{ color: '#FFFFFF', withShadow: false }}
                    resolution={540}
                  />
                </div>
              </div>

              <div className="lg:col-span-7 rounded-3xl bg-white border border-[#F0DFE2] p-6 md:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Nome no catálogo
                    </label>
                    <input
                      type="text"
                      value={typoName}
                      onChange={(e) => setTypoName(e.target.value)}
                      placeholder="Ex: Sua melhor fase"
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={typoCategory}
                      onChange={(e) =>
                        setTypoCategory(e.target.value as StickerCategoryName)
                      }
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    >
                      {STICKER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Estilo visual
                    </label>
                    <select
                      value={typoPreset}
                      onChange={(e) =>
                        setTypoPreset(
                          e.target.value as Exclude<StickerStylePreset, 'uploaded-png'>
                        )
                      }
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    >
                      {TYPO_PRESETS.map((p) => (
                        <option key={p} value={p}>
                          {PRESET_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Símbolo
                    </label>
                    <select
                      value={typoSymbol}
                      onChange={(e) => setTypoSymbol(e.target.value as AccentSymbol)}
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    >
                      <option value="sparkle">Brilho</option>
                      <option value="sun">Sol</option>
                      <option value="coffee">Café</option>
                      <option value="heart">Coração</option>
                      <option value="leaf">Folha</option>
                      <option value="bow">Laço</option>
                      <option value="cross">Cruz</option>
                      <option value="tree">Pinheiro Natal</option>
                      <option value="firework">Fogos 2027</option>
                      <option value="arrow">Seta</option>
                      <option value="check">Check</option>
                      <option value="clock">Relógio</option>
                      <option value="none">Nenhum</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Texto principal
                    </label>
                    <input
                      type="text"
                      required
                      value={typoPrimary}
                      onChange={(e) => setTypoPrimary(e.target.value)}
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={typoSecondary}
                      onChange={(e) => setTypoSecondary(e.target.value)}
                      className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                    Tags de busca
                  </label>
                  <input
                    type="text"
                    value={typoTags}
                    onChange={(e) => setTypoTags(e.target.value)}
                    className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                  />
                </div>

                <label className="inline-flex items-center gap-2.5 text-sm text-[#5A474D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typoFeatured}
                    onChange={(e) => setTypoFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#C46583]"
                  />
                  <span>Destacar no início do catálogo</span>
                </label>

                <div className="pt-3 border-t border-[#F4E7EA]">
                  <button
                    type="submit"
                    className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#C46583] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#AE516F] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Salvar sticker na biblioteca</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE CATALOG */}
      {activeTab === 'manage' && (
        <div className="pt-8 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C7D87]" />
              <input
                type="text"
                value={manageQuery}
                onChange={(e) => {
                  setManageQuery(e.target.value);
                  setVisibleManageCount(40);
                }}
                placeholder="Filtrar stickers por nome, texto ou tag..."
                className="w-full h-11 rounded-xl border border-[#ECDADF] bg-white pl-10 pr-4 text-sm text-[#2E2326] focus:border-[#C46583] focus:outline-none"
              />
            </div>

            <select
              value={manageCategory}
              onChange={(e) => {
                setManageCategory(e.target.value as 'Todas' | StickerCategoryName);
                setVisibleManageCount(40);
              }}
              className="h-11 rounded-xl border border-[#ECDADF] bg-white px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:outline-none"
            >
              <option value="Todas">Todas as categorias</option>
              {STICKER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-3xl bg-white border border-[#F0DFE2] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F4E7EA] bg-[#FFF9F8] text-xs font-medium text-[#8A747B]">
                    <th className="py-3.5 px-4">Sticker</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Estilo</th>
                    <th className="py-3.5 px-4 text-right">Cópias</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6ECEE] text-sm">
                  {filteredManage.slice(0, visibleManageCount).map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-[#FFF9F8] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 shrink-0 rounded-xl bg-[#241D20] p-1 flex items-center justify-center overflow-hidden">
                              <StickerPreviewCanvas
                                sticker={item}
                                options={{ color: '#FFFFFF' }}
                                resolution={160}
                              />
                            </div>
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-8 rounded-lg border border-[#C46583] px-2 text-sm text-[#2E2326]"
                                />
                                {item.preset !== 'uploaded-png' && (
                                  <input
                                    type="text"
                                    value={editPrimary}
                                    onChange={(e) => setEditPrimary(e.target.value)}
                                    placeholder="Texto no sticker"
                                    className="h-8 rounded-lg border border-[#ECDADF] px-2 text-xs text-[#5A474D]"
                                  />
                                )}
                                <input
                                  type="text"
                                  value={editTags}
                                  onChange={(e) => setEditTags(e.target.value)}
                                  placeholder="Tags separadas por vírgula"
                                  className="h-8 rounded-lg border border-[#ECDADF] px-2 text-xs text-[#5A474D]"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-[#2E2326]">{item.name}</div>
                                <div className="text-xs text-[#8A747B]">
                                  {item.tags.slice(0, 4).map((t) => `#${t}`).join(' · ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#5A474D]">
                          {isEditing ? (
                            <select
                              value={editCategory}
                              onChange={(e) =>
                                setEditCategory(e.target.value as StickerCategoryName)
                              }
                              className="h-8 rounded-lg border border-[#ECDADF] px-2 text-xs"
                            >
                              {STICKER_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          ) : (
                            item.category
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#8A747B]">
                          {PRESET_LABELS[item.preset]}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-[#735E65] tabular-nums">
                          {item.copyCount || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => commitEdit(item)}
                                className="h-9 px-3 rounded-lg bg-[#C46583] text-xs font-medium text-white cursor-pointer"
                              >
                                Salvar
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateSticker({
                                      ...item,
                                      featured: !item.featured,
                                    })
                                  }
                                  title={
                                    item.featured
                                      ? 'Remover destaque'
                                      : 'Destacar no catálogo'
                                  }
                                  className={`h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                    item.featured
                                      ? 'text-amber-600 bg-amber-50'
                                      : 'text-[#9C7D87] hover:bg-[#FFF0F4] hover:text-[#2E2326]'
                                  }`}
                                >
                                  <Star
                                    className={`h-4 w-4 ${item.featured ? 'fill-current' : ''}`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  title="Editar sticker"
                                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#735E65] hover:bg-[#FFF0F4] hover:text-[#2E2326] transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteSticker(item.id)}
                                  title="Excluir sticker"
                                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#9C7D87] hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredManage.length > visibleManageCount && (
              <div className="p-4 border-t border-[#F4E7EA] text-center">
                <button
                  type="button"
                  onClick={() => setVisibleManageCount((c) => c + 40)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#ECDADF] text-xs font-medium text-[#5A474D] hover:bg-[#FFF5F7] cursor-pointer"
                >
                  Mostrar mais ({filteredManage.length - visibleManageCount} restantes)
                </button>
              </div>
            )}

            {filteredManage.length === 0 && (
              <div className="p-10 text-center text-sm text-[#8A747B]">
                Nenhum sticker encontrado com esse filtro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT BACKUP ONLY (no publishing/deploy guide) */}
      {activeTab === 'backup' && (
        <div className="pt-8 max-w-2xl">
          <div className="rounded-3xl bg-white border border-[#F0DFE2] p-6 md:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#2E2326]">
                Backup da biblioteca de stickers
              </h2>
              <p className="mt-2 text-sm text-[#735E65] leading-relaxed">
                Todos os stickers novos e edições ficam salvos automaticamente neste dispositivo. Use as opções abaixo para exportar ou importar sua coleção em arquivo JSON.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#C46583] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#AE516F] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Exportar catálogo (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => importJsonRef.current?.click()}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#ECDADF] bg-white px-5 py-2.5 text-sm font-medium text-[#2E2326] hover:bg-[#FFF5F7] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Importar (.json)</span>
              </button>
              <input
                ref={importJsonRef}
                type="file"
                accept="application/json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>

            <div className="pt-5 border-t border-[#F4E7EA] space-y-3">
              <div className="text-sm font-medium text-[#2E2326]">
                Restaurar coleção original
              </div>
              <p className="text-xs text-[#8A747B] leading-relaxed">
                Restaura os 2.000 stickers originais distribuídos nas 14 categorias do Inspire Stickers.
              </p>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-[#ECDADF] px-4 py-2 text-xs font-medium text-[#735E65] hover:border-red-300 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restaurar coleção padrão</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaults();
                      setConfirmReset(false);
                      onNotify('Catálogo restaurado para a coleção padrão.');
                    }}
                    className="min-h-[40px] rounded-xl bg-red-700 px-4 py-2 text-xs font-medium text-white hover:bg-red-800 cursor-pointer"
                  >
                    Confirmar restauração
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[40px] rounded-xl border border-[#ECDADF] px-3.5 py-2 text-xs font-medium text-[#735E65] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
