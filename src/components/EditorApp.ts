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
import { exportImage } from '../utils/export';
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

export function initEditor(root: HTMLElement): () => void {
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

  // Synchronize state changes to URL and localStorage (debounced)
  const syncStorage = debounce((state: ReturnType<EditorStore['getState']>) => {
    if (typeof window !== 'undefined') {
      const query = serializeState(state);
      window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
      saveStateToLocalStorage(state);
    }
  }, 300);

  let lastImageUrl: string | undefined = hydratedState.background.imageUrl;

  const unsub = store.subscribe((state) => {
    renderLoop.schedule(state);
    syncForm(root, state);

    // Revoke old blob URL if background image has changed
    const currentImageUrl = state.background.imageUrl;
    if (lastImageUrl && lastImageUrl !== currentImageUrl && lastImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(lastImageUrl);
    }
    lastImageUrl = currentImageUrl;

    // Sync storage
    syncStorage(state);
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

  bindControls(root);
  bindDragResize(handlesLayer, previewWrapper);

  return () => {
    unsub();
    renderLoop.destroy();
    resizeObserver.disconnect();
    document.fonts.removeEventListener('loadingdone', fontLoadedHandler);

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
    btn.classList.toggle('is-active', btn.dataset.mode === state.textMode);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-template]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.template === state.templateId);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.theme === state.themeId);
  });

  setVal(root, '#font-family', state.typography.fontFamily);
  setVal(root, '#font-weight', String(state.typography.fontWeight));
  setVal(root, '#font-size', String(state.typography.fontSize));
  setVal(root, '#line-height', String(state.typography.lineHeight));
  setVal(root, '#letter-spacing', String(state.typography.letterSpacing));
  setVal(root, '#text-align', state.typography.textAlign);
  syncSliderLabels(root, state);
  syncAlignButtons(root, state.typography.textAlign);
  setVal(root, '#bg-type', state.background.type);
  setVal(root, '#solid-color', state.background.solidColor ?? '#0f0f12');
  setVal(root, '#export-format', 'png');
  setVal(root, '#preset-size', state.presetSize);
  setVal(root, '#custom-width', String(state.customWidth));
  setVal(root, '#custom-height', String(state.customHeight));

  const mastheadCheck = root.querySelector<HTMLInputElement>('#show-masthead');
  if (mastheadCheck) mastheadCheck.checked = !!state.showMasthead;

  const imgGroup = root.querySelector<HTMLDivElement>('#image-controls-group');
  if (imgGroup) {
    imgGroup.style.display = state.background.type === 'image' ? 'block' : 'none';
  }

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
    btn.classList.toggle('is-active', btn.dataset.align === align);
  });
}

function syncFormatPills(root: HTMLElement, format: string): void {
  root.querySelectorAll<HTMLButtonElement>('[data-format]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.format === format);
  });
  setVal(root, '#export-format', format);
}

function bindControls(root: HTMLElement): void {
  root.querySelector('#text-input')?.addEventListener('input', (e) => {
    store.setText((e.target as HTMLTextAreaElement).value);
  });

  root.querySelector('#show-masthead')?.addEventListener('change', (e) => {
    store.setState({ showMasthead: (e.target as HTMLInputElement).checked });
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
  bindExport(root);
  bindFormatPills(root);
  bindPreset(root);
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
  root.querySelectorAll('[data-format]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = (btn as HTMLButtonElement).dataset.format as ExportFormat;
      syncFormatPills(root, format);
    });
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
  root.querySelector('#preset-size')?.addEventListener('change', (e) => {
    const preset = (e.target as HTMLSelectElement).value as PresetSize;
    if (preset === 'custom') {
      store.setState({ presetSize: preset });
      return;
    }
    const p = presetSizes.find((s) => s.id === preset);
    if (p) store.setState({ presetSize: preset, width: p.width, height: p.height });
  });

  const applyCustom = () => {
    const w = Number((root.querySelector('#custom-width') as HTMLInputElement)?.value) || 1080;
    const h = Number((root.querySelector('#custom-height') as HTMLInputElement)?.value) || 1080;
    store.setState({
      presetSize: 'custom',
      customWidth: w,
      customHeight: h,
      width: w,
      height: h,
    });
  };
  root.querySelector('#custom-width')?.addEventListener('change', applyCustom);
  root.querySelector('#custom-height')?.addEventListener('change', applyCustom);
}

function bindExport(root: HTMLElement): void {
  root.querySelector('#export-btn')?.addEventListener('click', async () => {
    const btn = root.querySelector('#export-btn');
    const format = (root.querySelector('#export-format') as HTMLSelectElement)
      .value as ExportFormat;
    const state = store.getState();
    btn?.classList.add('is-loading');
    const label = root.querySelector('.btn-export__text');
    const prev = label?.textContent;
    if (label) label.textContent = 'Rendering…';
    try {
      await exportImage(state, format);
      showToast(`Image exported successfully as ${format.toUpperCase()}!`, 'success');
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(`Failed to export: ${err?.message || 'unknown error'}`, 'error');
    } finally {
      btn?.classList.remove('is-loading');
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
): void {
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
    let dx = 0;
    let dy = 0;

    if (e.key === 'ArrowUp') dy = -nudge;
    if (e.key === 'ArrowDown') dy = nudge;
    if (e.key === 'ArrowLeft') dx = -nudge;
    if (e.key === 'ArrowRight') dx = nudge;

    store.setBlockPosition(blockId, block.x + dx, block.y + dy);
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
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  });

  window.addEventListener('pointermove', (e) => {
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
  });

  window.addEventListener('pointerup', () => {
    dragId = null;
    resizeId = null;
  });
}

export { store, templates, themes, fontFamilies, fontWeights, presetSizes };
