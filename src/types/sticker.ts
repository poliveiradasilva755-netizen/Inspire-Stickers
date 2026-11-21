export type StickerCategoryName =
  | 'Pilates & Estilo de vida'
  | 'Academia & Treino'
  | 'Motivação'
  | 'Amor-próprio'
  | 'Fé e esperança'
  | 'Igreja'
  | 'Disciplina e foco'
  | 'Autocuidado'
  | 'Energia positiva'
  | 'Gratidão'
  | 'Sucesso'
  | 'Frases impactantes'
  | 'Natal'
  | 'Ano Novo 2027';

export type FilterCategory = 'Todos' | StickerCategoryName | 'Favoritos';

export type StickerStylePreset =
  | 'editorial-serif'
  | 'italic-signature'
  | 'minimal-sans'
  | 'stamp-circle'
  | 'arch-frame'
  | 'ticket-label'
  | 'checklist-card'
  | 'polaroid-frame'
  | 'ribbon-note'
  | 'botanical-accent'
  | 'sparkle-title'
  | 'date-mark'
  | 'uploaded-png';

export type AccentSymbol =
  | 'none'
  | 'sparkle'
  | 'sun'
  | 'coffee'
  | 'heart'
  | 'leaf'
  | 'arrow'
  | 'check'
  | 'clock'
  | 'bow'
  | 'cross'
  | 'tree'
  | 'firework';

export interface StickerItem {
  id: string;
  name: string;
  category: StickerCategoryName;
  tags: string[];
  preset: StickerStylePreset;
  primaryText: string;
  secondaryText?: string;
  tertiaryText?: string;
  accentSymbol?: AccentSymbol;
  imageDataUrl?: string;
  featured?: boolean;
  isCustom?: boolean;
  createdAt: string;
  copyCount?: number;
}

export interface InkColorOption {
  id: string;
  label: string;
  hex: string;
  isLight: boolean;
}

export type CanvasBackdropMode = 'dark' | 'light' | 'checker';

export interface StickerRenderOptions {
  color: string;
  withShadow?: boolean;
  tintUploaded?: boolean;
  overridePrimary?: string;
  overrideSecondary?: string;
}

export interface CategoryMeta {
  name: StickerCategoryName;
  emoji: string;
  tileBg: string;
  accentColor: string;
  tagline: string;
}

export const CATEGORY_LIST: CategoryMeta[] = [
  {
    name: 'Pilates & Estilo de vida',
    emoji: '🧘‍♀️',
    tileBg: '#BFEFD9',
    accentColor: '#2E7D5E',
    tagline: 'Equilíbrio, postura e rotina leve',
  },
  {
    name: 'Academia & Treino',
    emoji: '🏋️‍♀️',
    tileBg: '#FFD9C2',
    accentColor: '#B85C32',
    tagline: 'Endorfina, constância e superação',
  },
  {
    name: 'Motivação',
    emoji: '✨',
    tileBg: '#FFEBA8',
    accentColor: '#9C7316',
    tagline: 'Impulso diário para seus objetivos',
  },
  {
    name: 'Amor-próprio',
    emoji: '💖',
    tileBg: '#FFC0D3',
    accentColor: '#B54067',
    tagline: 'Autoestima, carinho e respeito próprio',
  },
  {
    name: 'Fé e esperança',
    emoji: '🙏',
    tileBg: '#D9C9FF',
    accentColor: '#6649A8',
    tagline: 'Confiança, paz e propósito',
  },
  {
    name: 'Igreja',
    emoji: '⛪',
    tileBg: '#D6E4FF',
    accentColor: '#3B5EA8',
    tagline: 'Culto, célula, louvor e comunhão',
  },
  {
    name: 'Disciplina e foco',
    emoji: '💪',
    tileBg: '#C4F1DC',
    accentColor: '#2C7A5B',
    tagline: 'Hábitos fortes e mente centrada',
  },
  {
    name: 'Autocuidado',
    emoji: '🌸',
    tileBg: '#FFD6E3',
    accentColor: '#B34D6E',
    tagline: 'Pausas gentis, skincare e descanso',
  },
  {
    name: 'Energia positiva',
    emoji: '☀️',
    tileBg: '#FFF0B5',
    accentColor: '#A37714',
    tagline: 'Leveza, luz e boas vibrações',
  },
  {
    name: 'Gratidão',
    emoji: '🌈',
    tileBg: '#C7E4FF',
    accentColor: '#2D6BA3',
    tagline: 'Reconhecer as bênçãos de cada dia',
  },
  {
    name: 'Sucesso',
    emoji: '💼',
    tileBg: '#DBD4FF',
    accentColor: '#5647A6',
    tagline: 'Carreira, visão e conquistas',
  },
  {
    name: 'Frases impactantes',
    emoji: '🔥',
    tileBg: '#FFD2DC',
    accentColor: '#BA405A',
    tagline: 'Mensagens marcantes para seus Stories',
  },
  {
    name: 'Natal',
    emoji: '🎄',
    tileBg: '#C9EED6',
    accentColor: '#26734D',
    tagline: 'Magia, ceia, família e luzes de Natal',
  },
  {
    name: 'Ano Novo 2027',
    emoji: '🥂',
    tileBg: '#FDE8B8',
    accentColor: '#A36F1A',
    tagline: 'Virada, metas, brilho e novos começos em 2027',
  },
];

export const STICKER_CATEGORIES: StickerCategoryName[] = CATEGORY_LIST.map((c) => c.name);

export const PRESET_LABELS: Record<StickerStylePreset, string> = {
  'editorial-serif': 'Editorial Serif',
  'italic-signature': 'Assinatura Itálica',
  'minimal-sans': 'Minimal Sans',
  'stamp-circle': 'Selo Circular',
  'arch-frame': 'Arco Editorial',
  'ticket-label': 'Etiqueta Minimal',
  'checklist-card': 'Checklist Stories',
  'polaroid-frame': 'Moldura Polaroid',
  'ribbon-note': 'Fita Adesiva',
  'botanical-accent': 'Botânico Fino',
  'sparkle-title': 'Brilho Editorial',
  'date-mark': 'Dia da Semana',
  'uploaded-png': 'PNG Enviado',
};

export const INK_COLORS: InkColorOption[] = [
  { id: 'white', label: 'Branco', hex: '#FFFFFF', isLight: true },
  { id: 'espresso', label: 'Espresso', hex: '#2E2326', isLight: false },
  { id: 'rose', label: 'Rosa Inspire', hex: '#C46583', isLight: false },
  { id: 'blush', label: 'Blush Suave', hex: '#F3CBD7', isLight: true },
  { id: 'sand', label: 'Areia', hex: '#EAE0D5', isLight: true },
  { id: 'champagne', label: 'Dourado', hex: '#D4B475', isLight: true },
  { id: 'lavender', label: 'Lavanda', hex: '#C5B3F2', isLight: true },
  { id: 'olive', label: 'Oliva', hex: '#6F7D63', isLight: false },
];
