import { useEffect, useState } from 'react';
import { Check, Copy, Download, Heart, RotateCcw, X } from 'lucide-react';
import { INK_COLORS, PRESET_LABELS, StickerItem } from '../types/sticker';
import { StickerPreviewCanvas } from './StickerPreviewCanvas';

interface StickerModalProps {
  sticker: StickerItem | null;
  initialColor: string;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onSelectTag?: (tag: string) => void;
  onCopy: (
    sticker: StickerItem,
    options: {
      color: string;
      withShadow: boolean;
      tintUploaded?: boolean;
      overridePrimary?: string;
      overrideSecondary?: string;
    }
  ) => Promise<void>;
  onDownload: (
    sticker: StickerItem,
    options: {
      color: string;
      withShadow: boolean;
      tintUploaded?: boolean;
      overridePrimary?: string;
      overrideSecondary?: string;
    }
  ) => Promise<void>;
}

type StoryBackdrop = 'plum-dark' | 'blush-light' | 'warm-sand' | 'checker';

const STORY_BACKDROPS: { id: StoryBackdrop; label: string; className: string }[] = [
  {
    id: 'plum-dark',
    label: 'Estúdio escuro',
    className: 'bg-gradient-to-b from-[#33272D] via-[#251C21] to-[#191316]',
  },
  {
    id: 'blush-light',
    label: 'Blush suave',
    className: 'bg-gradient-to-br from-[#FCEEF2] via-[#F5DCE4] to-[#E6C3CF]',
  },
  {
    id: 'warm-sand',
    label: 'Areia natural',
    className: 'bg-gradient-to-b from-[#E5DAD0] via-[#CFC0B4] to-[#AE9D90]',
  },
  {
    id: 'checker',
    label: 'Grade PNG',
    className: 'bg-checker-dark',
  },
];

export function StickerModal({
  sticker,
  initialColor,
  isFavorite,
  onClose,
  onToggleFavorite,
  onSelectTag,
  onCopy,
  onDownload,
}: StickerModalProps) {
  const [color, setColor] = useState(initialColor);
  const [withShadow, setWithShadow] = useState(false);
  const [tintUploaded, setTintUploaded] = useState(false);
  const [backdrop, setBackdrop] = useState<StoryBackdrop>('plum-dark');
  const [scale, setScale] = useState(86);
  const [primaryOverride, setPrimaryOverride] = useState('');
  const [secondaryOverride, setSecondaryOverride] = useState('');
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sticker) return;
    setColor(initialColor);
    setPrimaryOverride(sticker.primaryText);
    setSecondaryOverride(sticker.secondaryText || '');
    setWithShadow(false);
    setTintUploaded(false);
    setScale(86);
    setCopiedLocal(false);
    const low = initialColor.toLowerCase();
    setBackdrop(low === '#2e2326' || low === '#141416' ? 'blush-light' : 'plum-dark');
  }, [sticker, initialColor]);

  useEffect(() => {
    if (!sticker) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sticker, onClose]);

  if (!sticker) return null;

  const isUploaded = sticker.preset === 'uploaded-png';
  const hasEdits =
    !isUploaded &&
    (primaryOverride !== sticker.primaryText ||
      secondaryOverride !== (sticker.secondaryText || ''));

  const renderOptions = {
    color,
    withShadow,
    tintUploaded,
    overridePrimary: isUploaded ? undefined : primaryOverride,
    overrideSecondary: isUploaded ? undefined : secondaryOverride,
  };

  const handleCopyClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onCopy(sticker, renderOptions);
      setCopiedLocal(true);
      setTimeout(() => setCopiedLocal(false), 2200);
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDownload(sticker, renderOptions);
    } finally {
      setBusy(false);
    }
  };

  const activeBackdrop =
    STORY_BACKDROPS.find((b) => b.id === backdrop) || STORY_BACKDROPS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241A1E]/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticker-modal-title"
      onClick={onClose}
    >
      <div
        className="relative grid w-full max-w-4xl max-h-[92vh] overflow-y-auto grid-cols-1 md:grid-cols-12 rounded-3xl bg-white border border-[#F0DFE2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar prévia"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#7C676E] hover:bg-[#FCF2F4] hover:text-[#2E2326] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left: 9:16 Story Canvas Stage */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#FFF6F4] p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#F2E3E6]">
          <div className="w-full max-w-[260px]">
            <div
              className={`relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-black/10 shadow-lg flex flex-col justify-between p-4 ${activeBackdrop.className}`}
            >
              <div className="space-y-2.5">
                <div className="h-0.5 w-full rounded-full bg-white/40 overflow-hidden">
                  <div className="h-full w-2/3 bg-white/90" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/85">
                  <span className="font-medium tracking-tight drop-shadow-xs">
                    seu.perfil
                  </span>
                  <span className="font-mono text-[10px] opacity-85">agora</span>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <div
                  style={{ transform: `scale(${scale / 100})` }}
                  className="w-full aspect-square transition-transform duration-150 ease-out"
                >
                  <StickerPreviewCanvas
                    sticker={sticker}
                    options={renderOptions}
                    resolution={640}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-80">
                <div className="h-7 flex-1 rounded-full border border-white/40 px-3 flex items-center text-[10px] text-white/80">
                  Enviar mensagem...
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {STORY_BACKDROPS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackdrop(bg.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    backdrop === bg.id
                      ? 'bg-[#C46583] text-white'
                      : 'text-[#735E65] hover:bg-[#F5E4E8] hover:text-[#2E2326]'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Controls & Export */}
        <div className="md:col-span-7 flex flex-col justify-between p-6 md:p-8 gap-6">
          <div className="space-y-5 pr-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A747B]">
                <span>{sticker.category}</span>
                <span aria-hidden="true">·</span>
                <span>{PRESET_LABELS[sticker.preset]}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">1080 × 1080 PNG</span>
              </div>
              <h2
                id="sticker-modal-title"
                className="mt-1.5 font-display text-2xl md:text-3xl font-semibold text-[#2E2326] tracking-tight"
              >
                {sticker.name}
              </h2>

              {sticker.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9C7D87]">
                  {sticker.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (onSelectTag) {
                          onSelectTag(tag);
                          onClose();
                        }
                      }}
                      className="hover:text-[#C46583] hover:underline transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ink color selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#2E2326]">
                  Cor do sticker
                </label>
                <span className="font-mono text-xs text-[#8A747B] uppercase tabular-nums">
                  {color}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {INK_COLORS.map((swatch) => {
                  const selected = color.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => {
                        setColor(swatch.hex);
                        if (isUploaded) setTintUploaded(true);
                        if (swatch.hex === '#2E2326' && backdrop === 'plum-dark') {
                          setBackdrop('blush-light');
                        } else if (swatch.hex === '#FFFFFF' && backdrop === 'blush-light') {
                          setBackdrop('plum-dark');
                        }
                      }}
                      title={swatch.label}
                      aria-label={`Cor ${swatch.label}`}
                      className={`h-9 w-9 rounded-full border transition-transform cursor-pointer flex items-center justify-center ${
                        selected
                          ? 'ring-2 ring-[#C46583] ring-offset-2 scale-105 border-black/20'
                          : 'border-black/15 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
                <label
                  title="Escolher cor personalizada"
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[#ECDADF] px-2.5 text-xs font-medium text-[#5A474D] hover:border-[#C46583] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      if (isUploaded) setTintUploaded(true);
                    }}
                    className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span>Personalizada</span>
                </label>
              </div>
            </div>

            {!isUploaded ? (
              <div className="space-y-3 pt-1 border-t border-[#F4E7EA]">
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-medium text-[#2E2326]">
                    Personalizar texto (opcional)
                  </span>
                  {hasEdits && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrimaryOverride(sticker.primaryText);
                        setSecondaryOverride(sticker.secondaryText || '');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#8A747B] hover:text-[#2E2326] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#8A747B] mb-1">
                      Texto principal
                    </label>
                    <input
                      type="text"
                      value={primaryOverride}
                      onChange={(e) => setPrimaryOverride(e.target.value)}
                      maxLength={36}
                      className="w-full h-10 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8A747B] mb-1">
                      {sticker.preset === 'checklist-card'
                        ? 'Itens (separados por |)'
                        : 'Subtítulo'}
                    </label>
                    <input
                      type="text"
                      value={secondaryOverride}
                      onChange={(e) => setSecondaryOverride(e.target.value)}
                      maxLength={60}
                      className="w-full h-10 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#F4E7EA]">
                <label className="inline-flex items-center gap-2.5 text-sm text-[#5A474D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tintUploaded}
                    onChange={(e) => setTintUploaded(e.target.checked)}
                    className="h-4 w-4 rounded border-[#DFC7CE] accent-[#C46583]"
                  />
                  <span>Aplicar cor selecionada sobre o PNG enviado</span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#F4E7EA]">
              <label className="inline-flex items-center gap-2.5 text-sm text-[#5A474D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={withShadow}
                  onChange={(e) => setWithShadow(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DFC7CE] accent-[#C46583]"
                />
                <span>Sombra suave para fotos claras</span>
              </label>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[#8A747B]">Escala</span>
                <input
                  type="range"
                  min={55}
                  max={115}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  aria-label="Escala na prévia do Story"
                  className="w-24 accent-[#C46583]"
                />
                <span className="font-mono text-xs text-[#8A747B] w-9 text-right tabular-nums">
                  {scale}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#F4E7EA]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyClick}
                disabled={busy}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#C46583] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#AE516F] active:scale-[0.99] transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {copiedLocal ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copiado para colar</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Sticker</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={busy}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECDADF] bg-white px-4 py-2.5 text-sm font-medium text-[#2E2326] hover:bg-[#FFF5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                <span>Baixar PNG</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(sticker.id)}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                className={`min-h-[44px] w-11 inline-flex items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isFavorite
                    ? 'border-[#F0B4C6] bg-[#FFF0F5] text-[#DF4F7A]'
                    : 'border-[#ECDADF] bg-white text-[#8A747B] hover:text-[#2E2326]'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <p className="text-xs text-[#8A747B] leading-relaxed">
              No Instagram Stories, abra a ferramenta de texto (<strong className="font-medium text-[#2E2326]">Aa</strong>), toque na tela e selecione <strong className="font-medium text-[#2E2326]">Colar</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
