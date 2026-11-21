import { AccentSymbol, StickerItem, StickerRenderOptions } from '../types/sticker';

const EXPORT_SIZE = 1080;

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize: number,
  fontTemplate: (size: number) => string
): number {
  let size = baseSize;
  while (size > minSize) {
    ctx.font = fontTemplate(size);
    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 4;
  }
  return minSize;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  letterSpacing: number
) {
  if (!text) return;
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((sum, w) => sum + w, 0) + letterSpacing * Math.max(0, chars.length - 1);

  let cursorX = centerX - totalWidth / 2;
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, y);
    cursorX += widths[i] + letterSpacing;
  }
  ctx.textAlign = 'center';
}

function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  stepAngle: number
) {
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const angle = startAngle + i * stepAngle;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
}

function drawSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: AccentSymbol | undefined,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  if (!symbol || symbol === 'none') return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.055);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size / 2;

  switch (symbol) {
    case 'sparkle': {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'sun': {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
        ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
        ctx.stroke();
      }
      break;
    }
    case 'coffee': {
      // Minimalist cup
      ctx.beginPath();
      ctx.moveTo(-r * 0.62, -r * 0.12);
      ctx.lineTo(r * 0.45, -r * 0.12);
      ctx.lineTo(r * 0.34, r * 0.62);
      ctx.quadraticCurveTo(-r * 0.08, r * 0.78, -r * 0.51, r * 0.62);
      ctx.closePath();
      ctx.stroke();
      // Handle
      ctx.beginPath();
      ctx.arc(r * 0.48, r * 0.16, r * 0.24, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      // Delicate steam
      ctx.beginPath();
      ctx.moveTo(-r * 0.22, -r * 0.34);
      ctx.quadraticCurveTo(-r * 0.34, -r * 0.54, -r * 0.18, -r * 0.74);
      ctx.moveTo(r * 0.08, -r * 0.34);
      ctx.quadraticCurveTo(-r * 0.04, -r * 0.54, r * 0.12, -r * 0.74);
      ctx.stroke();
      break;
    }
    case 'heart': {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.68);
      ctx.bezierCurveTo(-r * 0.98, r * 0.12, -r * 0.95, -r * 0.72, 0, -r * 0.22);
      ctx.bezierCurveTo(r * 0.95, -r * 0.72, r * 0.98, r * 0.12, 0, r * 0.68);
      ctx.stroke();
      break;
    }
    case 'leaf': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.78, r * 0.52);
      ctx.quadraticCurveTo(-r * 0.08, -r * 0.08, r * 0.78, -r * 0.58);
      ctx.stroke();
      // Leaf pair 1
      ctx.beginPath();
      ctx.moveTo(-r * 0.24, r * 0.1);
      ctx.quadraticCurveTo(-r * 0.48, -r * 0.48, r * 0.08, -r * 0.38);
      ctx.quadraticCurveTo(r * 0.04, -r * 0.02, -r * 0.24, r * 0.1);
      ctx.stroke();
      // Leaf pair 2
      ctx.beginPath();
      ctx.moveTo(r * 0.14, -r * 0.18);
      ctx.quadraticCurveTo(r * 0.66, -r * 0.06, r * 0.38, r * 0.4);
      ctx.quadraticCurveTo(r * 0.04, r * 0.2, r * 0.14, -r * 0.18);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, 0);
      ctx.lineTo(r * 0.75, 0);
      ctx.moveTo(r * 0.28, -r * 0.44);
      ctx.lineTo(r * 0.78, 0);
      ctx.lineTo(r * 0.28, r * 0.44);
      ctx.stroke();
      break;
    }
    case 'check': {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.36, r * 0.02);
      ctx.lineTo(-r * 0.08, r * 0.3);
      ctx.lineTo(r * 0.42, -r * 0.28);
      ctx.stroke();
      break;
    }
    case 'clock': {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.46);
      ctx.lineTo(0, 0);
      ctx.lineTo(r * 0.34, r * 0.2);
      ctx.stroke();
      break;
    }
    case 'bow': {
      // Minimalist coquette ribbon bow
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r * 0.85, -r * 0.62, -r * 0.95, r * 0.32, 0, r * 0.05);
      ctx.bezierCurveTo(r * 0.95, r * 0.32, r * 0.85, -r * 0.62, 0, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.06, r * 0.06);
      ctx.quadraticCurveTo(-r * 0.32, r * 0.52, -r * 0.56, r * 0.84);
      ctx.moveTo(r * 0.06, r * 0.06);
      ctx.quadraticCurveTo(r * 0.32, r * 0.52, r * 0.56, r * 0.84);
      ctx.stroke();
      break;
    }
    case 'cross': {
      // Minimalist fine-line cross
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.88);
      ctx.lineTo(0, r * 0.88);
      ctx.moveTo(-r * 0.56, -r * 0.24);
      ctx.lineTo(r * 0.56, -r * 0.24);
      ctx.stroke();
      break;
    }
    case 'tree': {
      // Minimalist Christmas pine tree with star top
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.72);
      ctx.lineTo(-r * 0.48, -r * 0.12);
      ctx.lineTo(-r * 0.2, -r * 0.12);
      ctx.lineTo(-r * 0.68, r * 0.48);
      ctx.lineTo(r * 0.68, r * 0.48);
      ctx.lineTo(r * 0.2, -r * 0.12);
      ctx.lineTo(r * 0.48, -r * 0.12);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, r * 0.48);
      ctx.lineTo(0, r * 0.86);
      ctx.stroke();
      // Tiny star above tree
      ctx.beginPath();
      ctx.arc(0, -r * 0.86, Math.max(2.5, r * 0.09), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'firework': {
      // Editorial radiating celebration burst
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const inner = i % 2 === 0 ? r * 0.28 : r * 0.48;
        const outer = i % 2 === 0 ? r * 0.96 : r * 0.72;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2.5, r * 0.1), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function renderStickerToCanvas(
  canvas: HTMLCanvasElement,
  sticker: StickerItem,
  options: StickerRenderOptions,
  targetSize = EXPORT_SIZE
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font readiness check fails
    }
  }

  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, targetSize, targetSize);

  const scale = targetSize / EXPORT_SIZE;
  ctx.save();
  ctx.scale(scale, scale);

  const color = options.color || '#FFFFFF';
  const primary = (options.overridePrimary ?? sticker.primaryText ?? '').trim();
  const secondary = (options.overrideSecondary ?? sticker.secondaryText ?? '').trim();

  if (options.withShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
  }

  if (sticker.preset === 'uploaded-png' && sticker.imageDataUrl) {
    try {
      const img = await loadImage(sticker.imageDataUrl);
      const pad = 90;
      const maxDim = EXPORT_SIZE - pad * 2;
      const ratio = Math.min(maxDim / img.width, maxDim / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const x = (EXPORT_SIZE - drawW) / 2;
      const y = (EXPORT_SIZE - drawH) / 2;

      if (options.tintUploaded) {
        const offscreen = document.createElement('canvas');
        offscreen.width = EXPORT_SIZE;
        offscreen.height = EXPORT_SIZE;
        const octx = offscreen.getContext('2d');
        if (octx) {
          octx.drawImage(img, x, y, drawW, drawH);
          octx.globalCompositeOperation = 'source-in';
          octx.fillStyle = color;
          octx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
          ctx.drawImage(offscreen, 0, 0);
        }
      } else {
        ctx.drawImage(img, x, y, drawW, drawH);
      }
    } catch {
      // Fallback text if custom image cannot load
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 64px "Playfair Display", Georgia, serif';
      ctx.fillText(primary || sticker.name, 540, 540);
    }
    ctx.restore();
    return;
  }

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = 540;
  const cy = 540;

  switch (sticker.preset) {
    case 'editorial-serif': {
      drawSymbol(ctx, sticker.accentSymbol, cx, 355, 86, color);

      const fontSize = fitText(
        ctx,
        primary,
        880,
        132,
        54,
        (s) => `500 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `500 ${fontSize}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 520);

      // Hairline divider with subtle center diamond
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(270, 618);
      ctx.lineTo(495, 618);
      ctx.moveTo(585, 618);
      ctx.lineTo(810, 618);
      ctx.stroke();

      drawSymbol(ctx, 'sparkle', cx, 618, 22, color);

      if (secondary) {
        ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 682, 11);
      }
      break;
    }

    case 'italic-signature': {
      const fontSize = fitText(
        ctx,
        primary,
        880,
        142,
        56,
        (s) => `italic 500 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `italic 500 ${fontSize}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 505);

      // Flowing calligraphic underline flourish
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(210, 612);
      ctx.bezierCurveTo(380, 582, 690, 582, 870, 604);
      ctx.stroke();

      if (sticker.accentSymbol && sticker.accentSymbol !== 'none') {
        drawSymbol(ctx, sticker.accentSymbol, 845, 395, 68, color);
      }
      drawSymbol(ctx, 'sparkle', 230, 415, 34, color);

      if (secondary) {
        ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 678, 12);
      }
      break;
    }

    case 'minimal-sans': {
      // Corner minimalist crop marks
      ctx.lineWidth = 3;
      const bLeft = 175;
      const bRight = 905;
      const bTop = 370;
      const bBot = 700;
      const corner = 42;

      ctx.beginPath();
      ctx.moveTo(bLeft, bTop + corner);
      ctx.lineTo(bLeft, bTop);
      ctx.lineTo(bLeft + corner, bTop);

      ctx.moveTo(bRight - corner, bTop);
      ctx.lineTo(bRight, bTop);
      ctx.lineTo(bRight, bTop + corner);

      ctx.moveTo(bLeft, bBot - corner);
      ctx.lineTo(bLeft, bBot);
      ctx.lineTo(bLeft + corner, bBot);

      ctx.moveTo(bRight - corner, bBot);
      ctx.lineTo(bRight, bBot);
      ctx.lineTo(bRight, bBot - corner);
      ctx.stroke();

      const fontSize = fitText(
        ctx,
        primary,
        660,
        88,
        44,
        (s) => `600 ${s}px "Plus Jakarta Sans", sans-serif`
      );
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(primary, cx, 495);

      if (secondary) {
        ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 578, 10);
      }

      if (sticker.accentSymbol && sticker.accentSymbol !== 'none') {
        drawSymbol(ctx, sticker.accentSymbol, cx, 646, 46, color);
      }
      break;
    }

    case 'stamp-circle': {
      // Concentric refined rings
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 350, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 250, 0, Math.PI * 2);
      ctx.stroke();

      // Circular ring text
      const ringText = (secondary || 'INSPIRE STICKERS • EDIÇÃO EDITORIAL • ').toUpperCase();
      const repeated = ringText.length < 28 ? `${ringText} ${ringText}` : ringText;
      ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
      const step = (Math.PI * 2) / repeated.length;
      drawCurvedText(ctx, repeated, cx, cy, 298, -Math.PI / 2, step);

      // Center emblem + main title
      drawSymbol(ctx, sticker.accentSymbol || 'sparkle', cx, 468, 72, color);

      const words = primary.split(' ');
      if (words.length >= 2 && primary.length > 10) {
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        const s1 = fitText(
          ctx,
          line1,
          390,
          56,
          32,
          (s) => `600 ${s}px "Playfair Display", Georgia, serif`
        );
        ctx.font = `600 ${s1}px "Playfair Display", Georgia, serif`;
        ctx.fillText(line1, cx, 558);
        ctx.fillText(line2, cx, 622);
      } else {
        const s1 = fitText(
          ctx,
          primary,
          390,
          62,
          34,
          (s) => `600 ${s}px "Playfair Display", Georgia, serif`
        );
        ctx.font = `600 ${s1}px "Playfair Display", Georgia, serif`;
        ctx.fillText(primary, cx, 580);
      }
      break;
    }

    case 'arch-frame': {
      // Architectural minimalist arch
      const left = 215;
      const right = 865;
      const bottom = 835;
      const archCenterY = 475;
      const archR = (right - left) / 2;

      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(left, archCenterY);
      ctx.arc(cx, archCenterY, archR, Math.PI, 0, false);
      ctx.lineTo(right, bottom);
      ctx.closePath();
      ctx.stroke();

      // Inner delicate hairline arch
      const inset = 22;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left + inset, bottom - inset);
      ctx.lineTo(left + inset, archCenterY);
      ctx.arc(cx, archCenterY, archR - inset, Math.PI, 0, false);
      ctx.lineTo(right - inset, bottom - inset);
      ctx.closePath();
      ctx.stroke();

      drawSymbol(ctx, sticker.accentSymbol || 'sparkle', cx, 355, 76, color);

      const words = primary.split(' ');
      if (primary.length > 14 && words.length >= 2) {
        const mid = Math.ceil(words.length / 2);
        const l1 = words.slice(0, mid).join(' ');
        const l2 = words.slice(mid).join(' ');
        const size = fitText(
          ctx,
          l1.length > l2.length ? l1 : l2,
          520,
          84,
          44,
          (s) => `italic 500 ${s}px "Playfair Display", Georgia, serif`
        );
        ctx.font = `italic 500 ${size}px "Playfair Display", Georgia, serif`;
        ctx.fillText(l1, cx, 515);
        ctx.fillText(l2, cx, 608);
      } else {
        const size = fitText(
          ctx,
          primary,
          530,
          92,
          46,
          (s) => `italic 500 ${s}px "Playfair Display", Georgia, serif`
        );
        ctx.font = `italic 500 ${size}px "Playfair Display", Georgia, serif`;
        ctx.fillText(primary, cx, 550);
      }

      if (secondary) {
        ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 728, 10);
      }
      break;
    }

    case 'ticket-label': {
      // Minimalist notched ticket outline
      const x = 130;
      const y = 365;
      const w = 820;
      const h = 350;
      const notch = 38;

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h / 2 - notch);
      ctx.arc(x + w, y + h / 2, notch, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + h / 2 + notch);
      ctx.arc(x, y + h / 2, notch, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      ctx.stroke();

      // Perforation dashed line inside right side
      ctx.save();
      ctx.setLineDash([8, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w - 165, y + 26);
      ctx.lineTo(x + w - 165, y + h - 26);
      ctx.stroke();
      ctx.restore();

      const textCenterX = x + (w - 165) / 2;
      const size = fitText(
        ctx,
        primary.toUpperCase(),
        560,
        74,
        36,
        (s) => `700 ${s}px "Plus Jakarta Sans", sans-serif`
      );
      ctx.font = `700 ${size}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(primary.toUpperCase(), textCenterX, cy - 30);

      if (secondary) {
        ctx.font = '500 26px "JetBrains Mono", monospace';
        drawSpacedText(ctx, secondary.toUpperCase(), textCenterX, cy + 56, 6);
      }

      drawSymbol(ctx, sticker.accentSymbol || 'arrow', x + w - 82, cy, 62, color);
      break;
    }

    case 'checklist-card': {
      // Minimalist editorial checklist for Stories
      const left = 195;
      const width = 690;

      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(left, 235, width, 610, 32);
      ctx.stroke();

      const titleSize = fitText(
        ctx,
        primary,
        580,
        74,
        42,
        (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `italic 600 ${titleSize}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 338);

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left + 58, 405);
      ctx.lineTo(left + width - 58, 405);
      ctx.stroke();

      const rawItems = secondary
        ? secondary.split('|').map((s) => s.trim()).filter(Boolean)
        : ['Café pronto', 'Foco total', 'Gratidão'];
      const items = rawItems.slice(0, 3);

      items.forEach((item, idx) => {
        const rowY = 500 + idx * 116;
        // Minimal checkbox circle
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(left + 92, rowY, 24, 0, Math.PI * 2);
        ctx.stroke();

        // Checkmark inside first two items (authentic Stories check-in look)
        if (idx < 2) {
          ctx.beginPath();
          ctx.moveTo(left + 81, rowY + 1);
          ctx.lineTo(left + 90, rowY + 10);
          ctx.lineTo(left + 106, rowY - 9);
          ctx.stroke();
        }

        ctx.textAlign = 'left';
        ctx.font = '500 42px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(item, left + 146, rowY + 2);
        ctx.textAlign = 'center';
      });
      break;
    }

    case 'polaroid-frame': {
      // Instant film frame with transparent photo window!
      const frameX = 165;
      const frameY = 125;
      const frameW = 750;
      const frameH = 830;
      const border = 46;
      const bottomBand = 195;

      // Draw frame with transparent interior using even-odd fill rule
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, frameH, 12);
      ctx.rect(
        frameX + border,
        frameY + border,
        frameW - border * 2,
        frameH - border - bottomBand
      );
      ctx.fill('evenodd');

      // Subtle inner edge
      ctx.lineWidth = 2;
      ctx.strokeRect(
        frameX + border,
        frameY + border,
        frameW - border * 2,
        frameH - border - bottomBand
      );

      // Contrasting caption on the bottom polaroid chin
      const normalizedInk = color.toLowerCase();
      const isDarkInk =
        normalizedInk === '#141416' ||
        normalizedInk === '#000000' ||
        normalizedInk === '#2e2326';
      ctx.fillStyle = isDarkInk ? '#FFFFFF' : '#2E2326';
      const capSize = fitText(
        ctx,
        primary,
        620,
        62,
        34,
        (s) => `italic 500 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `italic 500 ${capSize}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, frameY + frameH - bottomBand / 2 - 12);

      if (secondary) {
        ctx.font = '500 24px "JetBrains Mono", monospace';
        drawSpacedText(ctx, secondary, cx, frameY + frameH - 42, 6);
      }
      break;
    }

    case 'ribbon-note': {
      // Minimalist masking tape strip with subtle angled torn edges
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(155, 425);
      ctx.lineTo(925, 415);
      ctx.lineTo(902, 470);
      ctx.lineTo(930, 540);
      ctx.lineTo(905, 608);
      ctx.lineTo(925, 665);
      ctx.lineTo(155, 675);
      ctx.lineTo(178, 610);
      ctx.lineTo(150, 540);
      ctx.lineTo(178, 475);
      ctx.closePath();
      ctx.stroke();

      // Subtle translucent wash inside the tape
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fill();
      ctx.restore();

      const size = fitText(
        ctx,
        primary,
        680,
        92,
        44,
        (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `italic 600 ${size}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 522);

      if (secondary) {
        ctx.font = '500 25px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 602, 10);
      }

      if (sticker.accentSymbol && sticker.accentSymbol !== 'none') {
        drawSymbol(ctx, sticker.accentSymbol, cx, 338, 64, color);
      }
      break;
    }

    case 'botanical-accent': {
      // Delicate olive sprig crown above text
      ctx.save();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(310, 410);
      ctx.quadraticCurveTo(540, 325, 770, 410);
      ctx.stroke();

      const leaves = [
        { x: 375, y: 382, a: -0.65 },
        { x: 445, y: 365, a: -0.45 },
        { x: 540, y: 356, a: 0 },
        { x: 635, y: 365, a: 0.45 },
        { x: 705, y: 382, a: 0.65 },
      ];
      leaves.forEach((lf) => {
        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-18, -28, 0, -52);
        ctx.quadraticCurveTo(18, -28, 0, 0);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      const size = fitText(
        ctx,
        primary,
        860,
        124,
        52,
        (s) => `500 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `500 ${size}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 535);

      if (secondary) {
        ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 642, 12);
      }
      break;
    }

    case 'sparkle-title': {
      drawSymbol(ctx, 'sparkle', 240, 378, 56, color);
      drawSymbol(ctx, 'sparkle', 835, 405, 74, color);
      drawSymbol(ctx, 'sparkle', 782, 650, 36, color);

      const size = fitText(
        ctx,
        primary,
        840,
        146,
        58,
        (s) => `600 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `600 ${size}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 512);

      if (secondary) {
        ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 636, 13);
      }

      if (sticker.accentSymbol === 'arrow') {
        drawSymbol(ctx, 'arrow', cx, 718, 64, color);
      }
      break;
    }

    case 'date-mark': {
      // Minimalist day of the week block with S T Q Q S S D indicator
      const activeIdx = Math.min(6, Math.max(0, Number(sticker.tertiaryText ?? 0)));
      const letters = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
      const startX = 270;
      const gap = 90;

      ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
      letters.forEach((ltr, i) => {
        const x = startX + i * gap;
        if (i === activeIdx) {
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, 385, 30, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.save();
        ctx.globalAlpha = i === activeIdx ? 1 : 0.48;
        ctx.fillText(ltr, x, 387);
        ctx.restore();
      });

      const size = fitText(
        ctx,
        primary,
        860,
        134,
        56,
        (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`
      );
      ctx.font = `italic 600 ${size}px "Playfair Display", Georgia, serif`;
      ctx.fillText(primary, cx, 540);

      if (secondary) {
        ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
        drawSpacedText(ctx, secondary.toUpperCase(), cx, 654, 12);
      }
      break;
    }
  }

  ctx.restore();
}

export async function generateStickerPngBlob(
  sticker: StickerItem,
  options: StickerRenderOptions
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderStickerToCanvas(canvas, sticker, options, EXPORT_SIZE);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Falha ao gerar PNG transparente'));
        }
      },
      'image/png',
      1
    );
  });
}

export function slugifyFilename(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'sticker'
  );
}

export async function downloadStickerPng(
  sticker: StickerItem,
  options: StickerRenderOptions
): Promise<void> {
  const blob = await generateStickerPngBlob(sticker, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyFilename(options.overridePrimary || sticker.name)}-inspire-stickers.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function copyStickerPng(
  sticker: StickerItem,
  options: StickerRenderOptions
): Promise<'copied' | 'fallback-download'> {
  // Pass Promise<Blob> directly inside ClipboardItem so Safari/iOS keeps user gesture alive
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === 'function' &&
    typeof window !== 'undefined' &&
    'ClipboardItem' in window
  ) {
    try {
      const blobPromise = generateStickerPngBlob(sticker, options);
      const item = new ClipboardItem({ 'image/png': blobPromise });
      await navigator.clipboard.write([item]);
      return 'copied';
    } catch {
      // Fallback for older browsers or iframe permission restrictions
      try {
        const blob = await generateStickerPngBlob(sticker, options);
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        return 'copied';
      } catch {
        await downloadStickerPng(sticker, options);
        return 'fallback-download';
      }
    }
  }

  await downloadStickerPng(sticker, options);
  return 'fallback-download';
}
