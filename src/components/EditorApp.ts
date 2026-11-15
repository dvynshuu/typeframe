import { EditorStore, createInitialState } from '../lib/state';
import { themes } from '../lib/themes';
import { templates, presetSizes } from '../lib/templates';
import { fontFamilies, fontWeights } from '../lib/typography';
import { createRenderLoop } from '../hooks/use-render-loop';
import {
  applyPreviewLayout,
  computePreviewScale,
  formatDimensions,
} from '../lib/preview-scale';
import { ensureFontsForState, fontRequirementKey } from '../lib/fonts';
import { showToast } from '../utils/toast';
import {
  serializeState,
  deserializeState,
  saveStateToLocalStorage,
  loadStateFromLocalStorage,
} from '../utils/url-state';
import { debounce } from '../hooks/use-debounce';
import type {
  BackgroundType,
  BackgroundConfig,
  ExportFormat,
  PresetSize,
  TemplateId,
  ThemeId,
  TextMode,
} from '../types';

// Establish default initial state and hydrate from URL or localStorage
const defaultState = createInitialState();
let hydratedState = defaultState;
if (typeof window !== 'undefined') {
  if (window.location.search) {
    hydratedState = deserializeState(window.location.search, defaultState);
  } else {
    hydratedState = loadStateFromLocalStorage(defaultState);
  }
}

const store = new EditorStore(hydratedState);

let currentExportFormat: ExportFormat = 'png';

function applyToolPresetIfNeeded(root: HTMLElement): void {
  if (typeof window === 'undefined' || window.location.search || !root.dataset.toolSlug) {
    return;
  }
  const templateId = root.dataset.initialTemplate as TemplateId | undefined;
  const themeId = root.dataset.initialTheme as ThemeId | undefined;
  const textMode = root.dataset.initialMode as TextMode | undefined;
  const encodedText = root.dataset.initialText;
  const text = encodedText ? decodeURIComponent(encodedText) : undefined;

  const current = store.getState();
  const nextTemplateId = templateId || current.templateId;
  const nextThemeId = themeId || current.themeId;
  const nextTextMode = textMode || current.textMode;
  const nextText = text !== undefined ? text : current.text;

  const t = templates.find((item) => item.id === nextTemplateId) ?? templates[0];
  const th = themes.find((item) => item.id === nextThemeId) ?? themes[0];

  const presetSize: PresetSize = (t.width === 1080 && t.height === 1080)
    ? '1080x1080'
    : (t.width === 1080 && t.height === 1350)
    ? '1080x1350'
    : (t.width === 1080 && t.height === 1920)
    ? '1080x1920'
    : (t.width === 1920 && t.height === 1080)
    ? '1920x1080'
    : 'custom';

  store.setState({
    text: nextText,
    textMode: nextTextMode,
    templateId: nextTemplateId,
    themeId: nextThemeId,
    width: t.width,
    height: t.height,
    presetSize,
    typography: {
      ...current.typography,
      ...th.typography,
      ...t.defaultTypography,
      textColor: th.text,
    },
    background: structuredClone(th.background),
  });
}

export function initEditor(root: HTMLElement): () => void {
  applyToolPresetIfNeeded(root);

  const canvas = root.querySelector<HTMLCanvasElement>('#preview-canvas');
  const previewWrapper = root.querySelector<HTMLDivElement>('#preview-wrapper');
  const previewStage = root.querySelector<HTMLDivElement>('#preview-stage');
  const handlesLayer = root.querySelector<HTMLDivElement>('#handles-layer');
  const sizeLabel = root.querySelector<HTMLSpanElement>('#preview-size-label');

  const getPreviewScale = () => {
    const state = store.getState();
    return computePreviewScale(previewStage, state.width, state.height);
  };

  const syncPreviewChrome = (state: ReturnType<EditorStore['getState']>, scale: number) => {
    if (canvas && previewWrapper) {
      applyPreviewLayout(previewWrapper, canvas, state.width, state.height, scale);
    }
    if (sizeLabel) {
      sizeLabel.textContent = formatDimensions(state.width, state.height);
    }
    updateHandles(handlesLayer, previewWrapper, state);
  };

  const renderLoop = createRenderLoop(
    () => canvas,
    getPreviewScale,
    (state, scale) => syncPreviewChrome(state, scale)
  );

  // Synchronize state changes to localStorage (fast 300ms) and URL query (isolated 1000ms debounce)
  const syncStorage = debounce((state: ReturnType<EditorStore['getState']>) => {
    saveStateToLocalStorage(state);
  }, 300);

  const syncUrlHistory = debounce((state: ReturnType<EditorStore['getState']>) => {
    if (typeof window !== 'undefined') {
      try {
        const query = serializeState(state);
        const targetSearch = query ? `?${query}` : '';
        if (window.location.search !== targetSearch) {
          window.history.replaceState(null, '', targetSearch || window.location.pathname);
        }
      } catch {
        // Guard against Safari / WebKit SecurityError rate limit (100 calls per 30s)
      }
    }
  }, 1000);

  let lastImageUrl: string | undefined = hydratedState.background.imageUrl;
  let lastFontKey = '';

  const syncFonts = (state: ReturnType<EditorStore['getState']>) => {
    const key = fontRequirementKey(state);
    if (key === lastFontKey) return;
    lastFontKey = key;
    void ensureFontsForState(state).then(() => renderLoop.schedule(store.getState()));
  };

  const unsub = store.subscribe((state) => {
    renderLoop.schedule(state);
    syncForm(root, state);
    updateScreenReaderDescription(state);
    syncFonts(state);

    // Revoke old blob URL if background image has changed
    const currentImageUrl = state.background.imageUrl;
    if (lastImageUrl && lastImageUrl !== currentImageUrl && lastImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(lastImageUrl);
    }
    lastImageUrl = currentImageUrl;

    // Sync storage & URL history safely
    syncStorage(state);
    syncUrlHistory(state);
  });

  const resizeObserver = new ResizeObserver(() => {
    const state = store.getState();
    renderLoop.schedule(state);
  });
  if (previewStage) resizeObserver.observe(previewStage);

  const fontLoadedHandler = () => {
    const state = store.getState();
    renderLoop.schedule(state);
  };
  document.fonts.addEventListener('loadingdone', fontLoadedHandler);

  const unbindControls = bindControls(root);
  const unbindDragResize = bindDragResize(handlesLayer, previewWrapper);
  const unbindFormattingToolbar = bindFormattingToolbar(root);
  bindBackdropPresets(root);

  return () => {
    unsub();
    renderLoop.destroy();
    resizeObserver.disconnect();
    document.fonts.removeEventListener('loadingdone', fontLoadedHandler);
    unbindControls?.();
    unbindDragResize?.();
    unbindFormattingToolbar?.();

    // Revoke active blob URL on unmount to prevent leaks
    const finalState = store.getState();
    if (finalState.background.imageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(finalState.background.imageUrl);
    }
  };
}

function syncForm(root: HTMLElement, state: ReturnType<EditorStore['getState']>): void {
  const text = root.querySelector<HTMLTextAreaElement>('#text-input');
  if (text && text !== document.activeElement) text.value = state.text;

  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
    const active = btn.dataset.mode === state.textMode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  root.querySelectorAll<HTMLButtonElement>('[data-template]').forEach((btn) => {
    const active = btn.dataset.template === state.templateId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  root.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
    const active = btn.dataset.theme === state.themeId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  setVal(root, '#font-family', state.typography.fontFamily);
  setVal(root, '#font-weight', String(state.typography.fontWeight));
  setVal(root, '#font-size', String(state.typography.fontSize));
  setVal(root, '#line-height', String(state.typography.lineHeight));
  setVal(root, '#letter-spacing', String(state.typography.letterSpacing));
  setVal(root, '#text-align', state.typography.textAlign);
  const currentTheme = themes.find((t) => t.id === state.themeId);
  const color = state.typography.textColor || currentTheme?.text || '#ffffff';
  setVal(root, '#text-color', color);
  const indicator = root.querySelector<HTMLElement>('#text-color-indicator');
  if (indicator) indicator.style.backgroundColor = color;
  syncSliderLabels(root, state);
  syncAlignButtons(root, state.typography.textAlign);
  setVal(root, '#bg-type', state.background.type);
  setVal(root, '#solid-color', state.background.solidColor ?? '#0f0f12');
  setVal(root, '#export-format', currentExportFormat);
  setVal(root, '#export-scale', String(state.exportScale ?? 2));
  setVal(root, '#preset-size', state.presetSize);
  setVal(root, '#custom-width', String(state.customWidth));
  setVal(root, '#custom-height', String(state.customHeight));

  const mastheadCheck = root.querySelector<HTMLInputElement>('#show-masthead-toggle');
  if (mastheadCheck) mastheadCheck.checked = Boolean(state.showMasthead);

  // Studio Frames & Mockup Options
  const currentFrame = state.frameStyle ?? 'none';
  root.querySelectorAll<HTMLButtonElement>('[data-frame]').forEach((btn) => {
    const active = btn.dataset.frame === currentFrame;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  const frameOptionsGroup = root.querySelector<HTMLDivElement>('#frame-options-group');
  if (frameOptionsGroup) frameOptionsGroup.hidden = currentFrame === 'none';

  setVal(root, '#card-padding', String(state.cardPadding ?? 56));
  const cardPadVal = root.querySelector('#card-padding-val');
  if (cardPadVal) cardPadVal.textContent = `${state.cardPadding ?? 56}px`;

  setVal(root, '#card-radius', String(state.cardRadius ?? 16));
  const cardRadVal = root.querySelector('#card-radius-val');
  if (cardRadVal) cardRadVal.textContent = `${state.cardRadius ?? 16}px`;

  setVal(root, '#card-shadow', state.cardShadow ?? 'float');

  // Author Attribution
  const authorSigToggle = root.querySelector<HTMLInputElement>('#author-signature-toggle');
  if (authorSigToggle) authorSigToggle.checked = Boolean(state.author?.showSignature);

  const authorGroup = root.querySelector<HTMLDivElement>('#author-inputs-group');
  if (authorGroup) {
    authorGroup.hidden = !(state.author?.showSignature || currentFrame === 'tweet');
  }

  const authorNameInput = root.querySelector<HTMLInputElement>('#author-name');
  if (authorNameInput && authorNameInput !== document.activeElement) {
    authorNameInput.value = state.author?.name ?? 'Alex Rivera';
  }

  const authorHandleInput = root.querySelector<HTMLInputElement>('#author-handle');
  if (authorHandleInput && authorHandleInput !== document.activeElement) {
    authorHandleInput.value = state.author?.handle ?? '@arivera';
  }

  const authorVerifiedToggle = root.querySelector<HTMLInputElement>('#author-verified-toggle');
  if (authorVerifiedToggle) {
    authorVerifiedToggle.checked = state.author?.verified !== false;
  }

  const imgGroup = root.querySelector<HTMLDivElement>('#image-controls-group');
  if (imgGroup) imgGroup.hidden = state.background.type !== 'image';

  if (state.background.type === 'image') {
    setVal(root, '#bg-image-size', state.background.imageSizeMode ?? 'cover');
    
    const scale = state.background.imageScale ?? 1.0;
    setVal(root, '#bg-image-scale', String(Math.round(scale * 100)));
    const scaleLabel = root.querySelector('#bg-image-scale-val');
    if (scaleLabel) scaleLabel.textContent = `${Math.round(scale * 100)}%`;
    
    const opacity = state.background.imageOpacity ?? 0.9;
    setVal(root, '#bg-image-opacity', String(Math.round(opacity * 100)));
    const opacityLabel = root.querySelector('#bg-image-opacity-val');
    if (opacityLabel) opacityLabel.textContent = `${Math.round(opacity * 100)}%`;
  }

  // Sync backdrop preset active swatches
  const currentBg = state.background;
  root.querySelectorAll<HTMLButtonElement>('.preset-swatch').forEach((btn) => {
    const p = btn.dataset.preset;
    let isActive = false;
    if (p === 'ink-mesh' && currentBg.type === 'mesh' && currentBg.meshColors?.[3] === '#a84a32') isActive = true;
    if (p === 'amber-dusk' && currentBg.type === 'gradient' && currentBg.gradientStops?.[0]?.color === '#d96a3b') isActive = true;
    if (p === 'press-black' && currentBg.type === 'solid' && currentBg.solidColor === '#121214') isActive = true;
    if (p === 'frosted-glass' && currentBg.type === 'glass') isActive = true;
    if (p === 'ink-grain' && currentBg.type === 'noise' && currentBg.solidColor === '#0a0a0c') isActive = true;
    if (p === 'paper' && currentBg.type === 'noise' && currentBg.solidColor === '#f5f1e8') isActive = true;
    if (p === 'cinnabar-mesh' && currentBg.type === 'mesh' && currentBg.meshColors?.[2] === '#ff5a36') isActive = true;

    btn.classList.toggle('is-active', isActive);
  });
}

function setVal(root: HTMLElement, sel: string, val: string): void {
  const el = root.querySelector<HTMLInputElement | HTMLSelectElement>(sel);
  if (el && el.value !== val) el.value = val;
}

function syncSliderLabels(
  root: HTMLElement,
  state: ReturnType<EditorStore['getState']>
): void {
  const map: [string, string][] = [
    ['#font-size-val', String(state.typography.fontSize)],
    ['#line-height-val', String(state.typography.lineHeight)],
    ['#letter-spacing-val', String(state.typography.letterSpacing)],
  ];
  map.forEach(([sel, text]) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  });
}

function syncAlignButtons(root: HTMLElement, align: string): void {
  root.querySelectorAll<HTMLButtonElement>('[data-align]').forEach((btn) => {
    const active = btn.dataset.align === align;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function syncFormatPills(root: HTMLElement, format: ExportFormat): void {
  currentExportFormat = format;
  setVal(root, '#export-format', format);
}

function bindControls(root: HTMLElement): (() => void) {
  root.querySelector('#text-input')?.addEventListener('input', (e) => {
    store.setText((e.target as HTMLTextAreaElement).value);
  });

  root.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.setTextMode((btn as HTMLButtonElement).dataset.mode as TextMode);
    });
  });

  root.querySelectorAll('[data-template]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.setTemplate((btn as HTMLButtonElement).dataset.template as TemplateId);
    });
  });

  root.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.setTheme((btn as HTMLButtonElement).dataset.theme as ThemeId);
    });
  });

  bindTypography(root);
  bindAlign(root);
  bindBackground(root);
  bindMastheadToggle(root);
  bindFrames(root);
  bindAuthor(root);
  bindExport(root);
  bindCopyImage(root);
  bindShuffle(root);
  bindShare(root);
  bindFormatPills(root);
  bindPreset(root);
  bindMobileStudioNav(root);
  const unbindGlobalShortcuts = bindGlobalShortcuts(root);

  return () => {
    unbindGlobalShortcuts?.();
  };
}

function bindFrames(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-frame]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = (btn.dataset.frame || 'none') as any;
      store.setFrameStyle(frame);
    });
  });

  const padInput = root.querySelector<HTMLInputElement>('#card-padding');
  padInput?.addEventListener('input', () => {
    const val = Number(padInput.value);
    store.setCardPadding(val);
    const label = root.querySelector('#card-padding-val');
    if (label) label.textContent = `${val}px`;
  });

  const radInput = root.querySelector<HTMLInputElement>('#card-radius');
  radInput?.addEventListener('input', () => {
    const val = Number(radInput.value);
    store.setCardRadius(val);
    const label = root.querySelector('#card-radius-val');
    if (label) label.textContent = `${val}px`;
  });

  const shadowSelect = root.querySelector<HTMLSelectElement>('#card-shadow');
  shadowSelect?.addEventListener('change', () => {
    store.setCardShadow(shadowSelect.value as any);
  });
}

function bindAuthor(root: HTMLElement): void {
  const sigToggle = root.querySelector<HTMLInputElement>('#author-signature-toggle');
  sigToggle?.addEventListener('change', () => {
    store.setAuthor({ showSignature: sigToggle.checked });
  });

  const nameInput = root.querySelector<HTMLInputElement>('#author-name');
  nameInput?.addEventListener('input', () => {
    store.setAuthor({ name: nameInput.value });
  });

  const handleInput = root.querySelector<HTMLInputElement>('#author-handle');
  handleInput?.addEventListener('input', () => {
    store.setAuthor({ handle: handleInput.value });
  });

  const verifiedToggle = root.querySelector<HTMLInputElement>('#author-verified-toggle');
  verifiedToggle?.addEventListener('change', () => {
    store.setAuthor({ verified: verifiedToggle.checked });
  });
}

function bindMastheadToggle(root: HTMLElement): void {
  const check = root.querySelector<HTMLInputElement>('#show-masthead-toggle');
  if (!check) return;
  check.checked = Boolean(store.getState().showMasthead);
  check.addEventListener('change', () => {
    store.setState({ showMasthead: check.checked });
  });
}

function bindShare(root: HTMLElement): void {
  root.querySelector('#share-btn')?.addEventListener('click', async () => {
    try {
      const state = store.getState();
      const query = serializeState(state);
      const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`;

      if (navigator.share && window.matchMedia('(max-width: 768px)').matches) {
        try {
          await navigator.share({
            title: 'Typeframe Card',
            text: 'Check out this typographic design made on Typeframe:',
            url: shareUrl,
          });
          showToast('Shared successfully!', 'success');
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') return;
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      showToast('Shareable studio link copied to clipboard.', 'success');
    } catch (err: any) {
      console.error('Share failed:', err);
      showToast(`Failed to copy link: ${err?.message || 'unknown error'}`, 'error');
    }
  });
}

function bindAlign(root: HTMLElement): void {
  root.querySelectorAll('[data-align]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const align = (btn as HTMLButtonElement).dataset.align as 'left' | 'center' | 'right';
      const t = store.getState().typography;
      store.setState({ typography: { ...t, textAlign: align } });
      setVal(root, '#text-align', align);
      syncAlignButtons(root, align);
    });
  });
}

function bindFormatPills(root: HTMLElement): void {
  root.querySelector('#export-format')?.addEventListener('change', (e) => {
    const format = (e.target as HTMLSelectElement).value as ExportFormat;
    syncFormatPills(root, format);
  });

  root.querySelector('#export-scale')?.addEventListener('change', (e) => {
    const scale = Number((e.target as HTMLSelectElement).value) as 1 | 2 | 4;
    store.setExportScale(scale);
  });
}

function bindTypography(root: HTMLElement): void {
  ['font-family', 'font-weight', 'font-size', 'line-height', 'letter-spacing', 'text-align'].forEach(
    (id) => {
      root.querySelector(`#${id}`)?.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement | HTMLSelectElement;
        const t = store.getState().typography;
        const partial: Partial<typeof t> = {};
        if (id === 'font-family') partial.fontFamily = el.value;
        if (id === 'font-weight') partial.fontWeight = Number(el.value);
        if (id === 'font-size') partial.fontSize = Number(el.value);
        if (id === 'line-height') partial.lineHeight = Number(el.value);
        if (id === 'letter-spacing') partial.letterSpacing = Number(el.value);
        if (id === 'text-align') partial.textAlign = el.value as typeof t.textAlign;
        store.setState({ typography: { ...t, ...partial } });
      });
      root.querySelector(`#${id}`)?.addEventListener('input', (e) => {
        const el = e.target as HTMLInputElement;
        if (el.type !== 'range') return;
        const t = store.getState().typography;
        const partial: Partial<typeof t> = {};
        if (id === 'font-size') partial.fontSize = Number(el.value);
        if (id === 'line-height') partial.lineHeight = Number(el.value);
        if (id === 'letter-spacing') partial.letterSpacing = Number(el.value);
        store.setState({ typography: { ...t, ...partial } });
        syncSliderLabels(root, store.getState());
      });
    }
  );
}

function bindBackground(root: HTMLElement): void {
  root.querySelector('#bg-type')?.addEventListener('change', (e) => {
    const type = (e.target as HTMLSelectElement).value as BackgroundType;
    const bg = { ...store.getState().background, type };
    store.setState({ background: bg });
  });

  root.querySelector('#solid-color')?.addEventListener('input', (e) => {
    const color = (e.target as HTMLInputElement).value;
    store.setState({
      background: { ...store.getState().background, type: 'solid', solidColor: color },
    });
  });

  root.querySelector('#bg-upload')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    store.setState({
      background: {
        type: 'image',
        imageUrl: url,
        imageOpacity: 0.9,
        imageScale: 1.0,
        imageSizeMode: 'cover',
      },
    });
  });

  root.querySelector('#bg-image-size')?.addEventListener('change', (e) => {
    const sizeMode = (e.target as HTMLSelectElement).value as any;
    const bg = { ...store.getState().background, imageSizeMode: sizeMode };
    store.setState({ background: bg });
  });

  root.querySelector('#bg-image-scale')?.addEventListener('input', (e) => {
    const scaleVal = Number((e.target as HTMLInputElement).value) / 100;
    const label = root.querySelector('#bg-image-scale-val');
    if (label) label.textContent = `${Math.round(scaleVal * 100)}%`;
    const bg = { ...store.getState().background, imageScale: scaleVal };
    store.setState({ background: bg });
  });

  root.querySelector('#bg-image-opacity')?.addEventListener('input', (e) => {
    const opacityVal = Number((e.target as HTMLInputElement).value) / 100;
    const label = root.querySelector('#bg-image-opacity-val');
    if (label) label.textContent = `${Math.round(opacityVal * 100)}%`;
    const bg = { ...store.getState().background, imageOpacity: opacityVal };
    store.setState({ background: bg });
  });
}

function bindPreset(root: HTMLElement): void {
  let isRatioLocked = false;
  let lockedRatio = 1.0;

  const lockBtn = root.querySelector('#lock-ratio-btn') as HTMLButtonElement | null;
  const widthInput = root.querySelector('#custom-width') as HTMLInputElement | null;
  const heightInput = root.querySelector('#custom-height') as HTMLInputElement | null;

  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      isRatioLocked = !isRatioLocked;
      lockBtn.setAttribute('aria-pressed', String(isRatioLocked));
      const text = lockBtn.querySelector('.lock-text');
      if (text) text.textContent = isRatioLocked ? 'Locked' : 'Unlocked';

      if (isRatioLocked) {
        const state = store.getState();
        lockedRatio = state.width / state.height;
      }
    });
  }

  root.querySelector('#preset-size')?.addEventListener('change', (e) => {
    const preset = (e.target as HTMLSelectElement).value as PresetSize;
    if (preset === 'custom') {
      store.setState({ presetSize: preset });
      return;
    }
    const p = presetSizes.find((s) => s.id === preset);
    if (p) {
      store.setState({ presetSize: preset, width: p.width, height: p.height });
      if (isRatioLocked) {
        lockedRatio = p.width / p.height;
      }
    }
  });

  const handleWidthChange = () => {
    const w = Number(widthInput?.value) || 1080;
    let h = Number(heightInput?.value) || 1080;

    if (isRatioLocked) {
      h = Math.round(w / lockedRatio);
      if (heightInput) heightInput.value = String(h);
    }

    store.setState({
      presetSize: 'custom',
      customWidth: w,
      customHeight: h,
      width: w,
      height: h,
    });
  };

  const handleHeightChange = () => {
    let w = Number(widthInput?.value) || 1080;
    const h = Number(heightInput?.value) || 1080;

    if (isRatioLocked) {
      w = Math.round(h * lockedRatio);
      if (widthInput) widthInput.value = String(w);
    }

    store.setState({
      presetSize: 'custom',
      customWidth: w,
      customHeight: h,
      width: w,
      height: h,
    });
  };

  widthInput?.addEventListener('input', handleWidthChange);
  heightInput?.addEventListener('input', handleHeightChange);
  widthInput?.addEventListener('change', handleWidthChange);
  heightInput?.addEventListener('change', handleHeightChange);
}

function bindExport(root: HTMLElement): void {
  root.querySelector('#export-btn')?.addEventListener('click', async () => {
    const btn = root.querySelector<HTMLButtonElement>('#export-btn');
    const state = store.getState();
    btn?.classList.add('is-loading');
    btn?.setAttribute('aria-busy', 'true');
    const label = root.querySelector('.btn-export__text');
    const prev = label?.textContent;
    if (label) label.textContent = 'Rendering…';
    try {
      const { exportImage } = await import('../utils/export');
      await exportImage(state, currentExportFormat);
      showToast(`Exported as ${currentExportFormat.toUpperCase()}.`, 'success');
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(`Export failed: ${err?.message || 'unknown error'}`, 'error');
    } finally {
      btn?.classList.remove('is-loading');
      btn?.removeAttribute('aria-busy');
      if (label && prev) label.textContent = prev;
    }
  });
}

function updateHandles(
  layer: HTMLDivElement | null,
  wrapper: HTMLDivElement | null,
  state: ReturnType<EditorStore['getState']>
): void {
  if (!layer || !wrapper) return;

  // Track currently focused element blockId to restore focus post-render
  const activeBlockId = (document.activeElement instanceof HTMLElement) 
    ? document.activeElement.dataset.blockId 
    : null;

  layer.innerHTML = '';
  const canvas = wrapper.querySelector('canvas');
  if (!canvas || canvas.offsetWidth <= 0) return;
  const ratio = canvas.offsetWidth / state.width;
  const offsetX = 0;
  const offsetY = 0;

  state.blocks.forEach((block) => {
    const el = document.createElement('div');
    el.className = 'text-block-handle';
    el.dataset.blockId = block.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Move text block`);
    el.style.left = `${offsetX + block.x * ratio}px`;
    el.style.top = `${offsetY + block.y * ratio}px`;
    el.style.width = `${block.width * ratio}px`;
    el.style.height = `${block.height * ratio}px`;
    const resize = document.createElement('div');
    resize.className = 'text-block-handle__resize';
    resize.dataset.resize = block.id;
    el.appendChild(resize);
    layer.appendChild(el);
  });

  // Restore focus if it was active on this block
  if (activeBlockId) {
    const activeEl = layer.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`);
    activeEl?.focus();
  }
}

function bindDragResize(
  layer: HTMLDivElement | null,
  wrapper: HTMLDivElement | null
): (() => void) | void {
  if (!layer) return;
  let dragId: string | null = null;
  let resizeId: string | null = null;
  let startX = 0;
  let startY = 0;
  let startBlock = { x: 0, y: 0, width: 0, height: 0 };

  const ratio = () => {
    const state = store.getState();
    const canvas = wrapper?.querySelector('canvas');
    if (!canvas) return 1;
    return canvas.getBoundingClientRect().width / state.width;
  };

  // Keyboard nudging with arrow keys (1px / 10px with Shift)
  layer.addEventListener('keydown', (e) => {
    const handle = (e.target as HTMLElement).closest('.text-block-handle') as HTMLElement | null;
    if (!handle || !handle.dataset.blockId) return;

    const blockId = handle.dataset.blockId;
    const block = store.getState().blocks.find((b) => b.id === blockId);
    if (!block) return;

    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!arrowKeys.includes(e.key)) return;

    e.preventDefault();

    const nudge = e.shiftKey ? 10 : 1;

    if (e.ctrlKey || e.metaKey) {
      let dw = 0;
      let dh = 0;
      if (e.key === 'ArrowUp') dh = -nudge;
      if (e.key === 'ArrowDown') dh = nudge;
      if (e.key === 'ArrowLeft') dw = -nudge;
      if (e.key === 'ArrowRight') dw = nudge;
      store.setBlockSize(blockId, Math.max(100, block.width + dw), Math.max(60, block.height + dh));
    } else {
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp') dy = -nudge;
      if (e.key === 'ArrowDown') dy = nudge;
      if (e.key === 'ArrowLeft') dx = -nudge;
      if (e.key === 'ArrowRight') dx = nudge;
      store.setBlockPosition(blockId, block.x + dx, block.y + dy);
    }
  });

  layer.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    const resize = target.dataset.resize;
    const handle = target.closest('.text-block-handle') as HTMLElement | null;
    if (resize) {
      resizeId = resize;
      const block = store.getState().blocks.find((b) => b.id === resizeId);
      if (!block) return;
      startBlock = { ...block };
      startX = e.clientX;
      startY = e.clientY;
      target.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }
    if (handle?.dataset.blockId) {
      dragId = handle.dataset.blockId;
      const block = store.getState().blocks.find((b) => b.id === dragId);
      if (!block) return;
      startBlock = { x: block.x, y: block.y, width: block.width, height: block.height };
      startX = e.clientX;
      startY = e.clientY;
      handle.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }
  });

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragId && !resizeId) return;
    const r = ratio();
    const dx = (e.clientX - startX) / r;
    const dy = (e.clientY - startY) / r;
    if (dragId) {
      store.setBlockPosition(dragId, startBlock.x + dx, startBlock.y + dy);
    }
    if (resizeId) {
      store.setBlockSize(
        resizeId,
        Math.max(100, startBlock.width + dx),
        Math.max(60, startBlock.height + dy)
      );
    }
  };

  const handlePointerEnd = () => {
    dragId = null;
    resizeId = null;
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerEnd);
  window.addEventListener('pointercancel', handlePointerEnd);

  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerEnd);
    window.removeEventListener('pointercancel', handlePointerEnd);
  };
}

function bindFormattingToolbar(root: HTMLElement): (() => void) | void {
  const textarea = root.querySelector<HTMLTextAreaElement>('#text-input');
  const toolbar = root.querySelector<HTMLDivElement>('#formatting-toolbar');
  if (!textarea || !toolbar) return;

  root.querySelector('#text-color-btn')?.addEventListener('click', () => {
    root.querySelector<HTMLInputElement>('#text-color')?.click();
  });

  const updateToolbarVisibility = () => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== undefined && end !== undefined && end > start) {
      toolbar.classList.add('is-active');
    } else {
      toolbar.classList.remove('is-active');
    }
  };

  const formatColorSelection = (color: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === undefined || end === undefined || start === end) return;

    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const activeMode = store.getState().textMode;

    if (activeMode === 'plain') {
      store.setTextMode('rich');
    }

    const cleanText = selectedText.replace(/<span style="color:\s*#[a-fA-F0-9]{3,8}">/gi, '').replace(/<\/span>/gi, '');
    const replacement = `<span style="color:${color}">${cleanText}</span>`;

    const newText = beforeText + replacement + afterText;
    textarea.value = newText;
    store.setText(newText);

    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
    updateToolbarVisibility();
  };

  const colorInput = root.querySelector<HTMLInputElement>('#text-color');
  colorInput?.addEventListener('input', (e) => {
    const color = (e.target as HTMLInputElement).value;
    const indicator = root.querySelector<HTMLElement>('#text-color-indicator');
    if (indicator) indicator.style.backgroundColor = color;
    formatColorSelection(color);
  });

  colorInput?.addEventListener('change', (e) => {
    const color = (e.target as HTMLInputElement).value;
    const indicator = root.querySelector<HTMLElement>('#text-color-indicator');
    if (indicator) indicator.style.backgroundColor = color;
    formatColorSelection(color);
  });

  textarea.addEventListener('select', updateToolbarVisibility);
  textarea.addEventListener('mouseup', updateToolbarVisibility);
  textarea.addEventListener('keyup', updateToolbarVisibility);

  const handleDocumentMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!textarea.contains(target) && !toolbar.contains(target)) {
      toolbar.classList.remove('is-active');
    }
  };
  document.addEventListener('mousedown', handleDocumentMouseDown);

  const formatSelection = (action: 'bold' | 'italic' | 'heading') => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === undefined || end === undefined || start === end) return;

    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const activeMode = store.getState().textMode;
    let targetMode = activeMode;

    if (activeMode === 'plain') {
      targetMode = 'rich';
      store.setTextMode('rich');
    }

    let replacement = selectedText;
    if (action === 'bold') {
      if (targetMode === 'markdown') {
        replacement = selectedText.startsWith('**') && selectedText.endsWith('**')
          ? selectedText.slice(2, -2)
          : `**${selectedText}**`;
      } else {
        replacement = selectedText.startsWith('<b>') && selectedText.endsWith('</b>')
          ? selectedText.slice(3, -4)
          : `<b>${selectedText}</b>`;
      }
    } else if (action === 'italic') {
      if (targetMode === 'markdown') {
        replacement = selectedText.startsWith('*') && selectedText.endsWith('*')
          ? selectedText.slice(1, -1)
          : `*${selectedText}*`;
      } else {
        replacement = selectedText.startsWith('<i>') && selectedText.endsWith('</i>')
          ? selectedText.slice(3, -4)
          : `<i>${selectedText}</i>`;
      }
    } else if (action === 'heading') {
      if (targetMode === 'markdown') {
        replacement = selectedText.startsWith('# ')
          ? selectedText.slice(2)
          : selectedText.startsWith('## ')
          ? selectedText.slice(3)
          : selectedText.startsWith('### ')
          ? selectedText.slice(4)
          : `### ${selectedText}`;
      } else {
        replacement = selectedText.startsWith('<h3>') && selectedText.endsWith('</h3>')
          ? selectedText.slice(4, -5)
          : `<h3>${selectedText}</h3>`;
      }
    }

    const newText = beforeText + replacement + afterText;
    textarea.value = newText;
    store.setText(newText);

    textarea.focus();
    textarea.setSelectionRange(start, start + replacement.length);
    updateToolbarVisibility();
  };

  toolbar.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const action = btn.dataset.action as 'bold' | 'italic' | 'heading';
      formatSelection(action);
    });
  });

  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        formatSelection('bold');
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        formatSelection('italic');
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        formatSelection('heading');
      }
    }
  });

  return () => {
    document.removeEventListener('mousedown', handleDocumentMouseDown);
  };
}

function bindBackdropPresets(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('.preset-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const currentBg = store.getState().background;
      let background: BackgroundConfig = { ...currentBg };

      if (preset === 'ink-mesh') {
        background = {
          ...currentBg,
          type: 'mesh',
          meshColors: ['#0a0a0c', '#171310', '#5a3428', '#a84a32'],
          noiseIntensity: 0.04,
        };
      } else if (preset === 'amber-dusk') {
        background = {
          ...currentBg,
          type: 'gradient',
          gradientStops: [
            { color: '#d96a3b', position: 0 },
            { color: '#f0b27a', position: 1 },
          ],
          gradientAngle: 135,
        };
      } else if (preset === 'press-black') {
        background = {
          ...currentBg,
          type: 'solid',
          solidColor: '#121214',
        };
      } else if (preset === 'frosted-glass') {
        background = {
          ...currentBg,
          type: 'glass',
          meshColors: ['#2a2a2e', '#18181b', '#3c3c42', '#1c1c1f'],
          glassBlur: 20,
        };
      } else if (preset === 'ink-grain') {
        background = {
          ...currentBg,
          type: 'noise',
          solidColor: '#0a0a0c',
          noiseIntensity: 0.06,
        };
      } else if (preset === 'paper') {
        background = {
          ...currentBg,
          type: 'noise',
          solidColor: '#f5f1e8',
          noiseIntensity: 0.04,
        };
      } else if (preset === 'cinnabar-mesh') {
        background = {
          ...currentBg,
          type: 'mesh',
          meshColors: ['#0a0a0c', '#24100a', '#ff5a36', '#8f2d18'],
          noiseIntensity: 0.05,
        };
      }
      store.setState({ background });
    });
  });
}

function bindShuffle(root: HTMLElement): void {
  root.querySelector('#shuffle-btn')?.addEventListener('click', () => {
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomFont = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
    const randomWeight = fontWeights[Math.floor(Math.random() * fontWeights.length)];
    const randomAlign = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as 'left' | 'center' | 'right';

    store.setTheme(randomTheme.id);

    const currentTypography = store.getState().typography;
    store.setState({
      typography: {
        ...currentTypography,
        fontFamily: randomFont.value,
        fontWeight: randomWeight.value,
        textAlign: randomAlign,
      }
    });

    showToast('Type and surface randomized.', 'success');
  });
}

function bindCopyImage(root: HTMLElement): void {
  root.querySelector('#copy-img-btn')?.addEventListener('click', async () => {
    const btn = root.querySelector<HTMLButtonElement>('#copy-img-btn');
    const state = store.getState();
    btn?.classList.add('is-loading');
    btn?.setAttribute('aria-busy', 'true');
    try {
      const { copyImageToClipboard } = await import('../utils/export');
      await copyImageToClipboard(state);
      showToast('Image copied to clipboard.', 'success');
    } catch (err: any) {
      console.error('Copy to clipboard failed:', err);
      showToast(`Clipboard copy failed: ${err?.message || 'unknown error'}`, 'error');
    } finally {
      btn?.classList.remove('is-loading');
      btn?.removeAttribute('aria-busy');
    }
  });
}

function bindMobileStudioNav(root: HTMLElement): void {
  const setView = (view: 'compose' | 'artboard' | 'style') => {
    root.dataset.mobileView = view;

    root.querySelectorAll<HTMLButtonElement>('.mobile-nav-tab').forEach((tab) => {
      const isActive = tab.dataset.view === view;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    if (view === 'artboard') {
      const stage = root.querySelector<HTMLDivElement>('#preview-stage');
      if (stage) {
        // Force immediate render update for the newly visible stage dimensions
        const state = store.getState();
        store.setState({ ...state });
      }
    }
  };

  root.querySelectorAll<HTMLButtonElement>('.mobile-nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view as 'compose' | 'artboard' | 'style';
      if (view) setView(view);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('.btn-jump-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.jump as 'compose' | 'style';
      if (target) setView(target);
    });
  });
}

function bindGlobalShortcuts(root: HTMLElement): (() => void) {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      root.querySelector<HTMLButtonElement>('#export-btn')?.click();
    }
  };
  window.addEventListener('keydown', handleKeydown);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
  };
}

function updateScreenReaderDescription(state: ReturnType<EditorStore['getState']>): void {
  const srEl = document.getElementById('sr-preview-description');
  if (!srEl) return;
  const theme = themes.find((t) => t.id === state.themeId)?.name || state.themeId;
  const template = templates.find((t) => t.id === state.templateId)?.name || state.templateId;
  srEl.textContent = `Live preview updated: ${template} layout in ${theme} theme. Background type is ${state.background.type}. Content: "${state.text}".`;
}

export { store, templates, themes, fontFamilies, fontWeights, presetSizes };
