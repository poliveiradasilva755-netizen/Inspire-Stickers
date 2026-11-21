import { useMemo, useState } from 'react';
import { BookmarkPlus, Check, Copy, Download } from 'lucide-react';
import {
  AccentSymbol,
  INK_COLORS,
  PRESET_LABELS,
  STICKER_CATEGORIES,
  StickerCategoryName,
  StickerItem,
  StickerStylePreset,
} from '../types/sticker';
import { StickerPreviewCanvas } from './StickerPreviewCanvas';

interface StickerStudioSectionProps {
  onCopy: (
    sticker: StickerItem,
    options: { color: string; withShadow: boolean }
  ) => Promise<void>;
  onDownload: (
    sticker: StickerItem,
    options: { color: string; withShadow: boolean }
  ) => Promise<void>;
  onSaveToCatalog: (sticker: StickerItem) => void;
}

const STUDIO_PRESETS: Exclude<StickerStylePreset, 'uploaded-png'>[] = [
  'italic-signature',
  'editorial-serif',
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

const SYMBOL_OPTIONS: { id: AccentSymbol; label: string }[] = [
  { id: 'sparkle', label: 'Brilho' },
  { id: 'sun', label: 'Sol' },
  { id: 'coffee', label: 'Café' },
  { id: 'heart', label: 'Coração' },
  { id: 'leaf', label: 'Folha' },
  { id: 'bow', label: 'Laço' },
  { id: 'cross', label: 'Cruz' },
  { id: 'tree', label: 'Pinheiro Natal' },
  { id: 'firework', label: 'Fogos 2027' },
  { id: 'arrow', label: 'Seta' },
  { id: 'check', label: 'Check' },
  { id: 'clock', label: 'Relógio' },
  { id: 'none', label: 'Sem ícone' },
];

export function StickerStudioSection({
  onCopy,
  onDownload,
  onSaveToCatalog,
}: StickerStudioSectionProps) {
  const [preset, setPreset] =
    useState<Exclude<StickerStylePreset, 'uploaded-png'>>('italic-signature');
  const [primaryText, setPrimaryText] = useState('pilates & paz');
  const [secondaryText, setSecondaryText] = useState('ROTINA LEVE');
  const [symbol, setSymbol] = useState<AccentSymbol>('bow');
  const [color, setColor] = useState('#FFFFFF');
  const [withShadow, setWithShadow] = useState(false);
  const [category, setCategory] = useState<StickerCategoryName>('Pilates & Estilo de vida');
  const [tagsInput, setTagsInput] = useState('pilates, rotina, personalizado');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const previewSticker = useMemo<StickerItem>(
    () => ({
      id: 'studio-draft',
      name: primaryText.trim() || 'Sticker personalizado',
      category,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      preset,
      primaryText: primaryText.trim() || 'seu texto aqui',
      secondaryText: secondaryText.trim(),
      tertiaryText: '4',
      accentSymbol: symbol,
      isCustom: true,
      createdAt: new Date().toISOString().slice(0, 10),
    }),
    [preset, primaryText, secondaryText, symbol, category, tagsInput]
  );

  const isDarkPreview = color.toLowerCase() !== '#2e2326';

  const handleCopy = async () => {
    await onCopy(previewSticker, { color, withShadow });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const cleanTitle = primaryText.trim() || 'Meu Sticker';
    onSaveToCatalog({
      ...previewSticker,
      id: `custom-${Date.now()}`,
      name: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      copyCount: 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <section
      id="estudio"
      className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-14 md:py-18 border-t border-[#F2E3E6]"
    >
      <div className="max-w-2xl mb-9">
        <p className="text-xs font-medium text-[#B35B77] tracking-wide">
          Estúdio criativo
        </p>
        <h2 className="mt-1.5 font-display text-3xl md:text-4xl font-semibold text-[#2E2326] tracking-tight [text-wrap:balance]">
          Crie seu próprio sticker personalizado
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-[#735E65] leading-relaxed">
          Escreva sua frase, escolha o estilo editorial e copie em PNG transparente na hora ou salve na sua categoria favorita.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <div
            className={`relative flex-1 min-h-[340px] rounded-3xl border border-[#F0DFE2] p-8 flex items-center justify-center overflow-hidden transition-colors shadow-[0_8px_24px_-12px_rgba(180,100,126,0.16)] ${
              isDarkPreview ? 'bg-checker-dark' : 'bg-checker-light'
            }`}
          >
            <div className="w-full max-w-[320px] aspect-square">
              <StickerPreviewCanvas
                sticker={previewSticker}
                options={{ color, withShadow }}
                resolution={640}
              />
            </div>
            <span
              className={`absolute bottom-4 right-4 font-mono text-[11px] tabular-nums ${
                isDarkPreview ? 'text-white/55' : 'text-[#5A474D]/55'
              }`}
            >
              1080 × 1080 px · fundo transparente
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#F0DFE2] p-6 md:p-8 flex flex-col justify-between gap-6 shadow-[0_8px_24px_-12px_rgba(180,100,126,0.12)]">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2E2326] mb-2">
                Estilo do sticker
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STUDIO_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPreset(p);
                      if (p === 'checklist-card' && !secondaryText.includes('|')) {
                        setSecondaryText('Pilates|Água em dia|Gratidão');
                      } else if (p !== 'checklist-card' && secondaryText.includes('|')) {
                        setSecondaryText('ROTINA LEVE');
                      }
                    }}
                    className={`min-h-[40px] px-3 py-2 text-xs font-medium rounded-xl border text-left transition-colors whitespace-nowrap truncate cursor-pointer ${
                      preset === p
                        ? 'border-[#C46583] bg-[#C46583] text-white'
                        : 'border-[#F0DFE2] bg-[#FFF9F8] text-[#5A474D] hover:border-[#DDA6B7]'
                    }`}
                  >
                    {PRESET_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                  Texto principal
                </label>
                <input
                  type="text"
                  value={primaryText}
                  onChange={(e) => setPrimaryText(e.target.value)}
                  maxLength={34}
                  placeholder="Ex: pilates & paz"
                  className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                  {preset === 'checklist-card'
                    ? 'Itens do checklist (separe com |)'
                    : 'Subtítulo ou detalhe'}
                </label>
                <input
                  type="text"
                  value={secondaryText}
                  onChange={(e) => setSecondaryText(e.target.value)}
                  maxLength={60}
                  placeholder={
                    preset === 'checklist-card'
                      ? 'Item 1|Item 2|Item 3'
                      : 'Ex: ROTINA LEVE'
                  }
                  className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3.5 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                  Elemento
                </label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value as AccentSymbol)}
                  className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                >
                  {SYMBOL_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#735E65] mb-1.5">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StickerCategoryName)}
                  className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
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
                  Tags de busca
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="rotina, paz"
                  className="w-full h-11 rounded-xl border border-[#ECDADF] bg-[#FFF9F8] px-3 text-sm text-[#2E2326] focus:border-[#C46583] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {INK_COLORS.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => setColor(swatch.hex)}
                    title={swatch.label}
                    aria-label={`Cor ${swatch.label}`}
                    className={`h-8 w-8 rounded-full border cursor-pointer transition-transform ${
                      color.toLowerCase() === swatch.hex.toLowerCase()
                        ? 'ring-2 ring-[#C46583] ring-offset-2 scale-105 border-black/20'
                        : 'border-black/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label="Cor personalizada"
                  className="h-8 w-8 cursor-pointer rounded-lg border border-[#ECDADF] bg-white p-0.5"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#735E65] cursor-pointer">
                <input
                  type="checkbox"
                  checked={withShadow}
                  onChange={(e) => setWithShadow(e.target.checked)}
                  className="h-4 w-4 accent-[#C46583]"
                />
                <span>Sombra suave</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#F4E7EA]">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#C46583] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#AE516F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Sticker'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDownload(previewSticker, { color, withShadow })}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECDADF] bg-white px-4 py-2.5 text-sm font-medium text-[#2E2326] hover:bg-[#FFF5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Baixar PNG</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECDADF] bg-white px-4 py-2.5 text-sm font-medium text-[#2E2326] hover:bg-[#FFF5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {saved ? (
                <Check className="h-4 w-4 text-emerald-700" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
              <span>{saved ? 'Salvo no catálogo' : 'Salvar na biblioteca'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
