import { useEffect, useRef } from 'react';
import { StickerItem, StickerRenderOptions } from '../types/sticker';
import { renderStickerToCanvas } from '../utils/stickerCanvas';

interface StickerPreviewCanvasProps {
  sticker: StickerItem;
  options: StickerRenderOptions;
  resolution?: number;
  className?: string;
}

export function StickerPreviewCanvas({
  sticker,
  options,
  resolution = 540,
  className = 'w-full h-full object-contain',
}: StickerPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderStickerToCanvas(canvas, sticker, options, resolution).catch(() => {
      // Ignore canceled/stale renders
    });

    const handleFontsLoaded = () => {
      if (active && canvasRef.current) {
        renderStickerToCanvas(canvasRef.current, sticker, options, resolution).catch(() => {});
      }
    };

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(handleFontsLoaded);
    }

    return () => {
      active = false;
    };
  }, [
    sticker,
    options.color,
    options.withShadow,
    options.tintUploaded,
    options.overridePrimary,
    options.overrideSecondary,
    resolution,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={resolution}
      height={resolution}
      aria-label={`Prévia do sticker ${sticker.name}`}
      className={className}
    />
  );
}
