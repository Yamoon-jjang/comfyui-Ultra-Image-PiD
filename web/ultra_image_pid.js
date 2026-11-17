import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Current frontends expose a DOM widget's element as widget.element;
// widget.inputEl is a deprecated alias (warns on access). Prefer element and
// fall back to inputEl only on older frontends that lack it.
function ultraWidgetEl(widget) {
  if (!widget) return undefined;
  return "element" in widget ? widget.element : widget.inputEl;
}


const NODE_CLASS = "UltraStandaloneImagePiD";
const ROW_PREFIX = "lora_";
const ROW_HEIGHT = 26;
const MIN_NODE_WIDTH = 340;
const MAX_STRENGTH = 100;
const OUTPUT_DEFS = [
  { name: "Original Image", ko: "원본 이미지" },
  { name: "PiD Image", ko: "PiD 이미지" },
];

let loraListCache = null;
let loraListPromise = null;
let loraListLookupFailed = false;
let loraListLookupError = null;
let assetListRefreshPromise = null;
let loraListCacheVersion = 0;

const REFRESHABLE_COMBO_WIDGETS = [
  "model_family",
  "diffusion_model",
  "text_encoder",
  "vae_name",
  "sampler_name",
  "scheduler",
  "pid_model",
  "pid_sampler",
  "pid_scheduler",
];
const REFRESH_HOOK_FLAG = "__ultraStandaloneImagePiDRefreshHook";
const LORA_MENU_HOOK_FLAG = "__ultraStandaloneImagePiDLoraContextMenuHook";
const QUEUE_HOOK_FLAG = "__ultraStandaloneImagePiDQueueHook";
const SETTINGS_STORE_VERSION = 1;
const SETTINGS_STORAGE_KEY = "UltraStandaloneImagePiD.lastGeneratedSettings.v2";
const NODE_SETTINGS_KEY_PROPERTY = "__ultraStandaloneImagePiDSettingsKey";
const FAMILY_HEIGHT_PROPERTY = "ultraStandaloneImagePiDFamilyHeightsV1";
const LEGACY_FAMILY_SIZE_PROPERTY = "ultraStandaloneImagePiDFamilySizesV1";
const MAX_STORED_NODE_KEYS = 64;
const EXCLUDED_PERSIST_WIDGETS = new Set([
  "seed",
  "positive_prompt",
  "negative_prompt",
  "ultra_add_lora",
  "control_after_generate",
  "seed_control_after_generate",
]);
const PID_ENABLE_WIDGET = "pid_upscale";
const PID_MODEL_WIDGET = "pid_model";
const PID_SAMPLER_WIDGET = "pid_sampler";
const PID_SCHEDULER_WIDGET = "pid_scheduler";
const PID_DEGRADE_SIGMA_WIDGET = "pid_degrade_sigma";
const PID_OUTPUT_SCALE_WIDGET = "pid_output_scale";
const MINIMAX_FAMILY = "MiniMax H3 Image";
// First-selection recommendations. Other step/sampler/scheduler choices remain editable.
const MINIMAX_FIRST_USE_DEFAULTS = {
  batch_size: 1, steps: 6, cfg: 1, sampler_name: "euler", scheduler: "simple",
  denoise: 1, zero_conditioning: true, sage_attention: false, pid_upscale: false,
};
// Only H3-inapplicable controls are locked in both frontend and Python.
const MINIMAX_REQUIRED = {
  batch_size: 1, cfg: 1, denoise: 1, sage_attention: false, pid_upscale: false,
};
const MINIMAX_INACTIVE_WIDGETS = [
  "batch_size", "cfg", "denoise",
  "zero_conditioning", "pid_upscale", "sage_attention",
];
const MINIMAX_SAMPLING_TOOLTIPS = {
  steps: ["6 steps with Euler/simple follow the checkpoint's native PDD sigma grid. Other step counts use ComfyUI's native H3 grid interpolation (experimental).", "Euler/simple 6스텝은 체크포인트의 네이티브 PDD 격자를 따릅니다. 다른 스텝 수는 ComfyUI가 H3 격자를 보간해 샘플링합니다(실험적)."],
  cfg: ["Fixed at CFG 1.0 for H3's distilled no-guidance path.", "H3의 증류된 무가이던스 경로를 위해 CFG 1.0으로 고정합니다."],
  sampler_name: ["Euler is recommended for the native six-step PDD path. Other samplers are experimental.", "네이티브 6스텝 PDD 경로에는 Euler를 권장합니다. 다른 샘플러는 실험적입니다."],
  scheduler: ["simple at 6 steps follows the checkpoint PDD grid. Other schedules run through native H3 sampling experimentally.", "6스텝 simple은 체크포인트 PDD 격자를 따릅니다. 다른 스케줄러도 네이티브 H3 경로에서 실험적으로 실행됩니다."],
  denoise: ["Fixed at 1.0 so H3 sampling uses the full native sigma range for the selected steps and schedule.", "선택한 스텝·스케줄에서 H3의 전체 네이티브 시그마 범위를 사용하도록 1.0으로 고정합니다."],
  sage_attention: ["Disabled for H3 Image; no SageAttention patch is applied.", "H3 Image에서는 사용하지 않으며 SageAttention 패치를 적용하지 않습니다."],
};
const MINIMAX_ASSETS = {
  diffusion_model: /minimax.*h3.*image/i,
  text_encoder: /qwen3[._-]?vl.*minimax[._-]?h3/i,
  vae_name: /minimax[._-]?h3[._-]?image.*vae/i,
};
// Initial recommendation only: never replace a user's remembered model file.
// The official int8_convrot variants are lighter than the matching BF16 files.
const MINIMAX_FIRST_USE_PREFERRED = /int8[_-]?convrot/i;
const MINIMAX_NATIVE_SIZE_TOOLTIP = [
  "MiniMax H3 Image uses multiples of 32. A typed or restored size is snapped to the nearest valid multiple (1680 → 1696). Native ~16MP examples: 4096×4096 (1:1), 4736×3552 (4:3), 5024×3360 (3:2), 5472×3072 (16:9), 6272×2688 (21:9); portrait sizes can be transposed. Start at 2048×2048 to save memory.",
  "MiniMax H3 Image는 32픽셀 배수입니다. 직접 입력하거나 복원한 값은 가장 가까운 32배수로 맞춥니다(1680 → 1696). 네이티브 약 16MP 예: 4096×4096(1:1), 4736×3552(4:3), 5024×3360(3:2), 5472×3072(16:9), 6272×2688(21:9). 세로형은 가로·세로를 바꿉니다. 메모리 절약을 위해 2048×2048부터 시작하세요.",
];
// Only consulted when exiting H3 for an otherwise unconfigured legacy family;
// do not change legacy -> legacy first-use behavior or established profiles.
const LEGACY_RETURN_ASSETS = {
  "Krea 2": { diffusion_model: /krea.*2/i },
  "Z-Image": { diffusion_model: /z[._-]?image/i },
  "Anima": { diffusion_model: /anima/i },
  "Qwen Image": { diffusion_model: /qwen.*image/i },
  "Qwen Image 2.1": { diffusion_model: /qwen.*(?:2[._-]?1|21)/i,
    text_encoder: /qwen.*3.*vl/i, vae_name: /qwen.*2[._-]?1.*vae/i },
  "MOSS-Image": { diffusion_model: /moss/i },
};
// Mirror of the PiD part of LATENT_SPACES / MODEL_CONTRACTS in
// ultra_image_pid.py. Keep both in sync.
// PiD is bound to a latent space, not to the model that produced the latent.
const FAMILY_LATENT_SPACE = {
  "Krea 2": "wan21",
  "Z-Image": "flux1",
  "Anima": "wan21",
  "Qwen Image": "wan21",
  "Qwen Image 2.1": "qwen21",
  "MOSS-Image": "flux2",
  "MiniMax H3 Image": "minimax_h3",
};
const LATENT_SPACE_PID = {
  wan21: {
    token: "qwenimage",
    // Future Qwen-Image 2.1 PiD files may also contain "qwenimage".
    exclude: [/qwen[-_ ]?image[-_ .]?2[._-]?1(?!\d)/i],
  },
  flux1: { token: "flux1", exclude: [] },
  flux2: { token: "flux2", exclude: [] },
  // Qwen-Image 2.1 (64ch / 16x): no PiD checkpoint yet.
  qwen21: { token: null, exclude: [] },
  minimax_h3: { token: null, exclude: [] },
};
const PID_MODEL_PLACEHOLDER = "<auto PiD model>";
const PID_SAMPLER_DEFAULT = "lcm";
const PID_SCHEDULER_DEFAULT = "sgm_uniform";
const PID_SCHEDULER_FALLBACK = "simple";
const PID_CHECKPOINT_TOKEN_RE = /(?:^|[\/._\-\s])(?:pid|pixeldit)/ig;
const PID_CONCAT_SUFFIXES = ["upscale", "upscaler", "flux1", "flux2", "qwenimage", "model", "xl"];
const PID_OUTPUT_SCALE_HALF = "0.5(x2)";
const PID_OUTPUT_SCALE_FULL = "1(x4)";
const PID_DETAIL_WIDGET_NAMES = [
  "pid_model",
  "pid_sampler",
  "pid_scheduler",
  "pid_steps",
  "pid_degrade_sigma",
  "pid_output_scale",
];

function isOurNode(node) {
  return node?.comfyClass === NODE_CLASS || node?.type === NODE_CLASS;
}

function isLoraRow(widget) {
  return Boolean(widget?._ultraLoraRow);
}

function isDynamicWidget(widget) {
  return isLoraRow(widget) || Boolean(widget?._ultraLoraAddButton);
}


// The frontend emits `Comfy.Locale.change` on app.ui.settings after its
// reactive setting has changed. Keep that value authoritative so language
// updates do not depend on document events or stale browser preferences.
let explicitUiLocale = null;
function currentUiLanguageTag() {
  if (typeof explicitUiLocale === "string" && explicitUiLocale.trim()) {
    return explicitUiLocale.trim().toLowerCase();
  }
  const settingStores = [app?.extensionManager?.setting, app?.ui?.settings,
    globalThis?.app?.extensionManager?.setting, globalThis?.app?.ui?.settings];
  for (const store of settingStores) {
    for (const getterName of ["getSettingValue", "get"]) {
      try {
        const value = store?.[getterName]?.("Comfy.Locale");
        if (typeof value === "string" && value.trim()) return value.trim().toLowerCase();
      } catch (_) {}
    }
  }
  const candidates = [app?.extensionManager?.locale, globalThis?.document?.documentElement?.lang,
    globalThis?.navigator?.language];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim().toLowerCase();
  }
  return "en";
}

function isKoreanUi() {
  return currentUiLanguageTag().startsWith("ko");
}

function tr(english, korean) {
  return isKoreanUi() ? korean : english;
}

function alertMessage(messageEn, messageKo) {
  const message = tr(messageEn, messageKo);
  app.extensionManager?.toast?.addAlert?.(message);
}

function triggerRedraw(node, widget) {
  widget?.triggerDraw?.();
  node?.setDirtyCanvas?.(true, true);
  app.canvas?.setDirty?.(true, true);
}

const WIDGET_LABELS = {
  model_family: ["Model Family", "모델 계열"],
  diffusion_model: ["Diffusion Model", "확산 모델"],
  text_encoder: ["Text Encoder", "텍스트 인코더"],
  vae_name: ["VAE", "VAE"],
  width: ["Width", "가로"], height: ["Height", "세로"],
  batch_size: ["Batch Size", "배치 크기"], seed: ["Seed", "시드"],
  control_after_generate: ["Control After Generate", "생성 후 제어"],
  seed_control_after_generate: ["Control After Generate", "생성 후 제어"],
  steps: ["Steps", "스텝"], cfg: ["CFG", "CFG"],
  sampler_name: ["Sampler", "샘플러"], scheduler: ["Scheduler", "스케줄러"],
  denoise: ["Denoise", "디노이즈"],
  zero_conditioning: ["Zero Conditioning", "제로 컨디셔닝"],
  pid_upscale: ["PiD Upscale", "PiD 업스케일"],
  pid_model: ["PiD Model", "PiD 모델"],
  pid_sampler: ["PiD Sampler", "PiD 샘플러"],
  pid_scheduler: ["PiD Scheduler", "PiD 스케줄러"],
  pid_steps: ["PiD Steps", "PiD 스텝"],
  pid_degrade_sigma: ["PiD Degrade Sigma", "PiD degrade sigma"],
  pid_output_scale: ["PiD Output Scale", "PiD 최종 배율"],
  sage_attention: ["SageAttention", "SageAttention"],
};

const INPUT_LABELS = {
  positive_prompt: ["Positive Prompt", "긍정 프롬프트"],
  negative_prompt: ["Negative Prompt", "부정 프롬프트"],
};

// Locale changes affect only visible text, never canonical widget/slot names or values.
function localizeNode(node) {
  if (!isOurNode(node)) return;
  const minimax = String(getWidgetValue(node, "model_family")) === MINIMAX_FAMILY;
  for (const input of node.inputs || []) {
    const labels = INPUT_LABELS[input.name];
    if (labels) input.label = tr(...labels);
    if (input.name === "negative_prompt" && String(getWidgetValue(node, "model_family")) === MINIMAX_FAMILY) {
      input.label = tr("Negative Prompt (unused)", "부정 프롬프트 (미사용)");
    }
  }
  for (const widget of node.widgets || []) {
    if (widget.name === "model_family") {
      if (!Object.hasOwn(widget, "__ultraOriginalFamilyTooltip")) {
        widget.__ultraOriginalFamilyTooltip = widget.tooltip;
      }
      widget.tooltip = minimax
        ? tr("MiniMax H3 Image: Euler/simple/6 uses the official PDD grid; alternate sampling is experimental. CFG 1, Denoise 1, Batch 1, SageAttention OFF and PiD OFF are enforced. No blank-image reference or user Negative Prompt/Zero Conditioning setting is applied; internal ConditioningZeroOut(positive) supports CFG++ samplers.",
             "MiniMax H3 Image: Euler/simple/6은 공식 PDD 격자, 다른 샘플링 설정은 실험적입니다. CFG 1·Denoise 1·Batch 1·SageAttention OFF·PiD OFF를 유지합니다. 빈 이미지 참조와 사용자 Negative Prompt/Zero Conditioning 설정은 적용하지 않으며, CFG++ 샘플러를 위해 내부 ConditioningZeroOut(positive)를 제공합니다.")
        : widget.__ultraOriginalFamilyTooltip;
    }
    const labels = WIDGET_LABELS[widget.name];
    if (labels) widget.label = tr(...labels);
    if (widget.name === "width" || widget.name === "height") {
      if (!Object.hasOwn(widget, "__ultraOriginalSizeTooltip")) {
        widget.__ultraOriginalSizeTooltip = widget.tooltip;
      }
      widget.tooltip = String(getWidgetValue(node, "model_family")) === MINIMAX_FAMILY
        ? tr(...MINIMAX_NATIVE_SIZE_TOOLTIP) : widget.__ultraOriginalSizeTooltip;
    }
    if (Object.hasOwn(MINIMAX_SAMPLING_TOOLTIPS, widget.name)) {
      if (!Object.hasOwn(widget, "__ultraOriginalSamplingTooltip")) {
        widget.__ultraOriginalSamplingTooltip = widget.tooltip;
      }
      widget.tooltip = String(getWidgetValue(node, "model_family")) === MINIMAX_FAMILY
        ? tr(...MINIMAX_SAMPLING_TOOLTIPS[widget.name]) : widget.__ultraOriginalSamplingTooltip;
    }
  }
  const pid = findWidget(node, PID_ENABLE_WIDGET);
  if (pid?.disabled) {
    pid.label = tr("PiD Upscale (unsupported)", "PiD 업스케일 (미지원)");
    pid.tooltip = tr("No PiD checkpoint for this model family.", "이 모델 계열의 PiD 체크포인트가 없습니다.");
  }
  syncOutputLabels(node);
  node.title = "Ultra Image + PiD";
  triggerRedraw(node);
}

let localeHooksInstalled = false;
function refreshLocalizedNodes() {
  for (const node of getUltraImagePiDNodes()) localizeNode(node);
}
function installLocaleHooks() {
  if (localeHooksInstalled) return;
  localeHooksInstalled = true;
  // ComfyUI's GraphCanvas forwards setting-store changes to the legacy
  // settings dialog as `<setting-id>.change`. This fires for the Vue settings
  // UI too, unlike native DOM `change` on a custom dropdown.
  const settingsDialog = app?.ui?.settings;
  try {
    settingsDialog?.addEventListener?.("Comfy.Locale.change", (event) => {
      const selected = event?.detail?.value;
      if (typeof selected === "string" && selected.trim()) {
        explicitUiLocale = selected.trim().toLowerCase();
      } else {
        explicitUiLocale = null;
      }
      refreshLocalizedNodes();
      // Allow native ComfyUI redraw/localization to complete before final
      // repaint; neither callback mutates widget values or graph links.
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(refreshLocalizedNodes);
      }
    });
  } catch (error) {
    console.warn("[Ultra Image + PiD] Locale change listener unavailable", error);
  }
}

function normalizePidToggleValue(value) {
  return value === true || value === 1 || value === "true" || String(value || "").toLowerCase() === "on";
}

function syncOutputLabels(node) {
  if (!Array.isArray(node?.outputs)) return false;
  let changed = false;
  for (let index = 0; index < OUTPUT_DEFS.length; index += 1) {
    const output = node.outputs[index];
    const definition = OUTPUT_DEFS[index];
    if (!output) continue;
    const localized = tr(definition.name, definition.ko);
    if (output.name !== definition.name) {
      output.name = definition.name;
      changed = true;
    }
    if (output.localized_name !== localized || output.label !== localized) {
      output.localized_name = localized;
      output.label = localized;
      changed = true;
    }
    if (output.type !== "IMAGE") {
      output.type = "IMAGE";
      changed = true;
    }
  }
  return changed;
}

function normalizePidOutputScale(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (["1", "1(x4)", "1 (x4)", "x4"].includes(text)) return PID_OUTPUT_SCALE_FULL;
  if (["0.5", ".5", "0.5(x2)", "0.5 (x2)", "x2"].includes(text)) return PID_OUTPUT_SCALE_HALF;
  return PID_OUTPUT_SCALE_FULL;
}

function normalizePidDegradeSigma(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Number(fallback) || 0;
  return Math.max(0, Math.min(1, parsed));
}

function ensurePidComboDefaults(node) {
  const samplerWidget = findWidget(node, PID_SAMPLER_WIDGET);
  const schedulerWidget = findWidget(node, PID_SCHEDULER_WIDGET);
  const sigmaWidget = findWidget(node, PID_DEGRADE_SIGMA_WIDGET);
  const scaleWidget = findWidget(node, PID_OUTPUT_SCALE_WIDGET);

  const samplerOptions = widgetOptionValues(samplerWidget);
  if (samplerWidget && (!String(samplerWidget.value || "").trim() || !samplerOptions.includes(String(samplerWidget.value)))) {
    samplerWidget.value = samplerOptions.includes(PID_SAMPLER_DEFAULT) ? PID_SAMPLER_DEFAULT : (samplerOptions[0] || samplerWidget.value);
  }

  const schedulerOptions = widgetOptionValues(schedulerWidget);
  if (schedulerWidget && (!String(schedulerWidget.value || "").trim() || !schedulerOptions.includes(String(schedulerWidget.value)))) {
    schedulerWidget.value = schedulerOptions.includes(PID_SCHEDULER_DEFAULT)
      ? PID_SCHEDULER_DEFAULT
      : (schedulerOptions.includes(PID_SCHEDULER_FALLBACK) ? PID_SCHEDULER_FALLBACK : (schedulerOptions[0] || schedulerWidget.value));
  }

  if (sigmaWidget) {
    sigmaWidget.value = normalizePidDegradeSigma(sigmaWidget.value, 0);
  }

  const scaleOptions = widgetOptionValues(scaleWidget);
  const normalizedScale = normalizePidOutputScale(scaleWidget?.value);
  if (scaleWidget && (!String(scaleWidget.value || "").trim() || !scaleOptions.includes(String(scaleWidget.value)))) {
    scaleWidget.value = scaleOptions.includes(normalizedScale) ? normalizedScale : (scaleOptions[0] || normalizedScale);
  } else if (scaleWidget && String(scaleWidget.value) !== normalizedScale && scaleOptions.includes(normalizedScale)) {
    scaleWidget.value = normalizedScale;
  }
}


function clampStrength(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(-MAX_STRENGTH, Math.min(MAX_STRENGTH, parsed));
}

function normalizeRowValue(value) {
  const source = value && typeof value === "object" ? value : {};
  const strength = clampStrength(source.strength);
  return {
    on: source.on !== false,
    lora: String(source.lora || ""),
    strength: strength == null ? 1.0 : strength,
  };
}

function fitText(ctx, text, maxWidth) {
  const source = String(text || "");
  if (ctx.measureText(source).width <= maxWidth) return source;
  const suffix = "…";
  let low = 0;
  let high = source.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ctx.measureText(source.slice(0, mid) + suffix).width <= maxWidth) low = mid;
    else high = mid - 1;
  }
  return source.slice(0, low) + suffix;
}

function roundedRect(ctx, x, y, width, height, radius = 5) {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clearLoraListCache() {
  loraListCacheVersion += 1;
  loraListCache = null;
  loraListPromise = null;
  loraListLookupFailed = false;
  loraListLookupError = null;
}

function uniqueSortedStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(String))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
}

function widgetOptionValues(widget) {
  let values = widget?.options?.values;
  if (typeof values === "function") {
    try {
      values = values.call(widget);
    } catch {
      return [];
    }
  }
  return Array.isArray(values) ? values.map(String) : [];
}

async function getOwnNodeDefinition() {
  const response = await api.fetchApi(`/object_info/${NODE_CLASS}`);
  if (!response.ok) {
    throw new Error(`object_info refresh failed (${response.status})`);
  }
  const data = await response.json();
  return data?.[NODE_CLASS] || data;
}

function comboValuesFromDefinition(definition, widgetName) {
  const input = definition?.input?.required?.[widgetName];
  const values = Array.isArray(input?.[0]) ? input[0].map(String) : [];
  if (widgetName === "model_family") return [...new Set(values)];
  return uniqueSortedStrings(values);
}

function updateComboWidget(node, widgetName, values) {
  if (!Array.isArray(values) || !values.length) return false;
  const widget = (node.widgets || []).find((item) => item?.name === widgetName);
  if (!widget) return false;

  const previousValues = widgetOptionValues(widget);
  const nextValues = values.map(String);
  let changed = JSON.stringify(previousValues) !== JSON.stringify(nextValues);

  widget.options = widget.options || {};
  widget.options.values = [...nextValues];
  if (!nextValues.includes(String(widget.value))) {
    if (widgetName === PID_SAMPLER_WIDGET && nextValues.includes(PID_SAMPLER_DEFAULT)) widget.value = PID_SAMPLER_DEFAULT;
    else if (widgetName === PID_SCHEDULER_WIDGET && nextValues.includes(PID_SCHEDULER_DEFAULT)) widget.value = PID_SCHEDULER_DEFAULT;
    else if (widgetName === PID_SCHEDULER_WIDGET && nextValues.includes(PID_SCHEDULER_FALLBACK)) widget.value = PID_SCHEDULER_FALLBACK;
    else if (widgetName === PID_OUTPUT_SCALE_WIDGET && nextValues.includes(PID_OUTPUT_SCALE_FULL)) widget.value = PID_OUTPUT_SCALE_FULL;
    else widget.value = nextValues[0];
    widget.callback?.(widget.value, app.canvas, node);
    changed = true;
  }
  return changed;
}

function cloneJsonValue(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function sanitizeStoredPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const result = cloneJsonValue(payload) || {};
  result.standard = result.standard && typeof result.standard === "object" ? result.standard : {};
  if (Object.prototype.hasOwnProperty.call(result.standard, PID_ENABLE_WIDGET)) {
    result.standard[PID_ENABLE_WIDGET] = normalizePidToggleValue(result.standard[PID_ENABLE_WIDGET]);
  }
  if (Object.prototype.hasOwnProperty.call(result.standard, PID_DEGRADE_SIGMA_WIDGET)) {
    result.standard[PID_DEGRADE_SIGMA_WIDGET] = normalizePidDegradeSigma(result.standard[PID_DEGRADE_SIGMA_WIDGET]);
  }
  if (Object.prototype.hasOwnProperty.call(result.standard, PID_OUTPUT_SCALE_WIDGET)) {
    result.standard[PID_OUTPUT_SCALE_WIDGET] = normalizePidOutputScale(result.standard[PID_OUTPUT_SCALE_WIDGET]);
  }
  return result;
}

function sanitizeSettingsFamilies(source) {
  const result = {};
  if (!source || typeof source !== "object") return result;
  for (const [family, payload] of Object.entries(source)) {
    const sanitized = sanitizeStoredPayload(payload);
    if (sanitized) result[family] = sanitized;
  }
  return result;
}

function sanitizeSettingsByNode(source) {
  const result = {};
  if (!source || typeof source !== "object") return result;
  for (const [nodeKey, families] of Object.entries(source)) {
    const sanitizedFamilies = sanitizeSettingsFamilies(families);
    if (Object.keys(sanitizedFamilies).length) result[nodeKey] = sanitizedFamilies;
  }
  return result;
}

function emptySettingsStore() {
  return { version: SETTINGS_STORE_VERSION, globalByFamily: {}, byNode: {} };
}

function normalizeSettingsStore(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    version: SETTINGS_STORE_VERSION,
    globalByFamily: sanitizeSettingsFamilies(source.globalByFamily),
    byNode: sanitizeSettingsByNode(source.byNode),
  };
}

function readSettingsStore() {
  try {
    const raw = globalThis?.localStorage?.getItem?.(SETTINGS_STORAGE_KEY);
    return raw ? normalizeSettingsStore(JSON.parse(raw)) : emptySettingsStore();
  } catch {
    return emptySettingsStore();
  }
}

function storeEntryTimestamp(entry) {
  if (!entry || typeof entry !== "object") return 0;
  let latest = 0;
  for (const payload of Object.values(entry)) {
    const timestamp = Number(payload?.updatedAt || 0);
    if (Number.isFinite(timestamp)) latest = Math.max(latest, timestamp);
  }
  return latest;
}

function pruneStoredNodes(store) {
  const byNode = store?.byNode && typeof store.byNode === "object" ? store.byNode : {};
  const keys = Object.keys(byNode);
  if (keys.length <= MAX_STORED_NODE_KEYS) return;
  keys
    .sort((a, b) => storeEntryTimestamp(byNode[b]) - storeEntryTimestamp(byNode[a]))
    .slice(MAX_STORED_NODE_KEYS)
    .forEach((key) => delete byNode[key]);
}

function writeSettingsStore(store) {
  try {
    const normalized = normalizeSettingsStore(store);
    pruneStoredNodes(normalized);
    globalThis?.localStorage?.setItem?.(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn(tr("[Ultra Image + PiD] Failed to save per-family last generation settings", "[Ultra Image + PiD] 모델별 마지막 생성 설정 저장 실패"), error);
  }
}

function generateNodeSettingsKey() {
  try {
    const value = globalThis?.crypto?.randomUUID?.();
    if (value) return String(value);
  } catch {
    // Fall through to the compatibility key below.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function findWidget(node, name) {
  return (node?.widgets || []).find((widget) => widget?.name === name) || null;
}

function getWidgetValue(node, name) {
  return findWidget(node, name)?.value;
}

function getNodeStorageId(node) {
  if (!node) return null;
  node.properties = node.properties && typeof node.properties === "object" ? node.properties : {};
  let persistentKey = String(node.properties[NODE_SETTINGS_KEY_PROPERTY] || "");
  if (!persistentKey) {
    persistentKey = generateNodeSettingsKey();
    node.properties[NODE_SETTINGS_KEY_PROPERTY] = persistentKey;
  }
  const nodeId = node.id == null ? "new" : String(node.id);
  return `${persistentKey}:${nodeId}`;
}

function standardPersistWidgets(node) {
  return (node?.widgets || []).filter(
    (widget) =>
      widget &&
      !isDynamicWidget(widget) &&
      !EXCLUDED_PERSIST_WIDGETS.has(String(widget.name || "")) &&
      String(widget.name || "") !== "model_family",
  );
}

function setWidgetVisible(widget, visible) {
  if (!widget) return;
  // Core LiteGraph derives widget visibility and layout from widget.hidden.
  // Do not patch computeSize() or draw(): those overrides can make the
  // native minimum node height disagree with the actual widget layout.
  if (widget.__ultraPromptOriginalDisabled === undefined) {
    widget.__ultraPromptOriginalDisabled = Boolean(widget.disabled);
  }
  widget.hidden = !visible;
  widget.disabled = visible ? widget.__ultraPromptOriginalDisabled : true;
  const element = ultraWidgetEl(widget);
  if (element) {
    element.style.display = visible ? "" : "none";
    if (visible) element.removeAttribute?.("aria-hidden");
    else element.setAttribute?.("aria-hidden", "true");
    element.tabIndex = visible ? 0 : -1;
  }
}

function pidEnabled(node) {
  const value = getWidgetValue(node, PID_ENABLE_WIDGET);
  return normalizePidToggleValue(value);
}

function pidSpecForFamily(family) {
  // Unknown model families must never inherit another family's PiD support.
  const space = FAMILY_LATENT_SPACE[String(family || "")];
  return LATENT_SPACE_PID[space] || { token: null, exclude: [] };
}

function applyMiniMaxFirstUse(node) {
  for (const [name, value] of Object.entries({ width: 2048, height: 2048, ...MINIMAX_FIRST_USE_DEFAULTS })) {
    setWidgetValue(node, findWidget(node, name), value);
  }
  const missing = [];
  for (const [name, pattern] of Object.entries(MINIMAX_ASSETS)) {
    const target = findWidget(node, name);
    const matchingOptions = widgetOptionValues(target).filter(
      (option) => pattern.test(String(option).split(/[\\/]/).pop()),
    );
    const matching = (name !== "vae_name"
      ? matchingOptions.find((option) => MINIMAX_FIRST_USE_PREFERRED.test(String(option).split(/[\\/]/).pop()))
      : undefined)
      ?? matchingOptions[0];
    if (matching) setWidgetValue(node, target, matching);
    else missing.push(name);
  }
  replaceLoraRows(node, []);
  if (missing.length) {
    alertMessage(`MiniMax H3 Image: install/select matching ${missing.join(", ")} files before running.`,
      `MiniMax H3 Image: 실행 전에 전용 ${missing.join(", ")} 파일을 설치·선택하세요.`);
  }
}

function restoreUnconfiguredLegacyAssetsAfterH3(node, family) {
  const hints = LEGACY_RETURN_ASSETS[family] || {};
  const missing = [];
  for (const name of ["diffusion_model", "text_encoder", "vae_name"]) {
    const target = findWidget(node, name);
    if (!target) continue;
    // Never silently carry the H3-only asset into a non-H3 family. Prefer
    // matching installed files, otherwise request an explicit user selection.
    const candidates = widgetOptionValues(target).filter((option) => !/minimax[._-]?h3/i.test(option));
    const hint = hints[name];
    const match = hint ? candidates.find((option) => hint.test(String(option).split(/[\\/]/).pop())) : null;
    if (match) setWidgetValue(node, target, match);
    else if (/minimax[._-]?h3/i.test(String(target.value))) missing.push(name);
  }
  if (missing.length) {
    alertMessage(`Select ${family} ${missing.join(", ")} manually. H3 assets cannot be reused.`,
      `${family} 전용 ${missing.join(", ")} 파일을 직접 선택하세요. H3 모델 파일을 재사용할 수 없습니다.`);
  }
}

function snapMiniMaxSizeWidget(node, target) {
  if (!target || String(getWidgetValue(node, "model_family")) !== MINIMAX_FAMILY) return false;
  const value = Number(target.value);
  // Preserve malformed/out-of-range inputs for Python's explicit validation.
  // Only align ordinary editable dimensions, never a value for another family.
  if (!Number.isSafeInteger(value) || value < 64 || value > 16384) return false;
  const aligned = Math.min(16384, Math.max(64, Math.round(value / 32) * 32));
  if (value === aligned) return false;
  target.value = aligned;
  triggerRedraw(node, target);
  return true;
}

function attachMiniMaxSizeHook(node, target) {
  if (!target || target.__ultraMiniMaxSizeHook) return;
  const originalCallback = typeof target.callback === "function" ? target.callback : null;
  target.callback = function ultraMiniMaxSizeCallback(value, ...args) {
    const result = originalCallback?.call(this, value, ...args);
    snapMiniMaxSizeWidget(node, target);
    return result;
  };
  target.__ultraMiniMaxSizeHook = true;
}

function attachMiniMaxSamplingHooks(node) {
  for (const name of ["steps", "sampler_name", "scheduler"]) {
    const target = findWidget(node, name);
    if (!target || target.__ultraMiniMaxSamplingHook) continue;
    const previous = typeof target.callback === "function" ? target.callback : null;
    target.callback = function ultraMiniMaxSamplingCallback(value, ...args) {
      const result = previous?.call(this, value, ...args);
      syncMiniMaxControls(node);
      localizeNode(node);
      return result;
    };
    target.__ultraMiniMaxSamplingHook = true;
  }
}

function syncMiniMaxControls(node) {
  const minimax = String(getWidgetValue(node, "model_family")) === MINIMAX_FAMILY;
  attachMiniMaxSamplingHooks(node);
  // Native H3 Conditioning requires 32px-aligned dimensions. The legacy
  // generators retain their existing 16px drag/keyboard increment.
  for (const name of ["width", "height"]) {
    const target = findWidget(node, name);
    if (target) {
      attachMiniMaxSizeHook(node, target);
      target.options ||= {};
      // Current ComfyUI number widgets use step2; the legacy step is 10x.
      const sizeStep = minimax ? 32 : 16;
      target.options.step2 = sizeStep;
      target.options.step = sizeStep * 10;
      if (minimax) snapMiniMaxSizeWidget(node, target);
    }
  }
  for (const name of Object.keys(MINIMAX_FIRST_USE_DEFAULTS)) {
    const target = findWidget(node, name);
    if (!target) continue;
    if (minimax && Object.hasOwn(MINIMAX_REQUIRED, name)) {
      target.value = MINIMAX_REQUIRED[name];
    }
    // Visibility owns the disabled state. Setting it here first would make
    // the widget remember a locked H3 value as its ordinary-family baseline.
  }
  for (const name of MINIMAX_INACTIVE_WIDGETS) {
    setWidgetVisible(findWidget(node, name), !minimax);
  }
  // Restoring the ordinary PiD row must not unlock unsupported non-H3 families.
  syncPidSupportLock(node);
  for (const slot of node.inputs || []) {
    if (slot.name === "negative_prompt") {
      slot.label = minimax ? tr("Negative Prompt (unused)", "부정 프롬프트 (미사용)")
        : tr(...INPUT_LABELS.negative_prompt);
    }
  }
  return minimax;
}

function normalizePathText(value) {
  return String(value || "").replace(/\\/g, "/").toLowerCase();
}

function looksLikePidCheckpoint(value) {
  const normalized = String(value || "").replace(/\\/g, "/");
  for (const match of normalized.matchAll(PID_CHECKPOINT_TOKEN_RE)) {
    const suffix = normalized.slice(match.index + match[0].length);
    if (!suffix) return true;
    const first = suffix[0];
    if (/[\/._\-\s\d]/.test(first)) return true;
    const lowered = suffix.toLowerCase();
    if (PID_CONCAT_SUFFIXES.some((prefix) => lowered.startsWith(prefix))) return true;
  }
  return false;
}

function pidModelMatchesFamily(value, family) {
  const normalized = normalizePathText(value);
  if (!normalized || !looksLikePidCheckpoint(value)) return false;
  const spec = pidSpecForFamily(family);
  if (!spec.token || !normalized.includes(spec.token)) return false;
  return !spec.exclude.some((pattern) => pattern.test(normalized));
}

function scorePidModelCandidate(candidate, reference = "") {
  const candidateText = normalizePathText(candidate);
  const referenceText = normalizePathText(reference);
  let score = 0;
  if (candidateText.includes("4step")) score += 8;
  if (candidateText.includes("int8")) score += 4;
  if (candidateText.includes("convrot")) score += 3;
  if (candidateText.includes("bf16")) score += 2;
  if (candidateText.includes("1024_to_4096")) score += 2;
  if (referenceText && candidateText === referenceText) score += 100;
  return score;
}

function pidModelOptionsForFamily(node, family) {
  const widget = findWidget(node, PID_MODEL_WIDGET);
  const allValues = Array.isArray(widget?._ultraAllPidModelValues)
    ? widget._ultraAllPidModelValues
    : widgetOptionValues(widget);
  return allValues.filter((value) => pidModelMatchesFamily(value, family));
}

function syncPidModelOptions(node, family = getWidgetValue(node, "model_family"), preferred = null) {
  const widget = findWidget(node, PID_MODEL_WIDGET);
  if (!widget) return false;
  if (!Array.isArray(widget._ultraAllPidModelValues)) {
    widget._ultraAllPidModelValues = widgetOptionValues(widget);
  }

  const values = pidModelOptionsForFamily(node, family);
  const previous = String(widget.value || "");
  widget.options = widget.options || {};
  widget.options.values = [...values];

  if (!values.length) {
    widget.options.values = [PID_MODEL_PLACEHOLDER];
    widget.value = PID_MODEL_PLACEHOLDER;
    return previous !== widget.value;
  }

  const requested = String(preferred || previous || "");
  const next = values.includes(requested)
    ? requested
    : [...values].sort((a, b) => {
        const delta = scorePidModelCandidate(b, requested) - scorePidModelCandidate(a, requested);
        return delta || a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      })[0];
  widget.value = next;
  return previous !== next;
}

function familySupportsPid(family) {
  return Boolean(pidSpecForFamily(family).token);
}

function syncPidSupportLock(node) {
  const widget = findWidget(node, PID_ENABLE_WIDGET);
  if (!widget) return true;
  const supported = familySupportsPid(getWidgetValue(node, "model_family"));
  if (!widget.__ultraPidLockState) widget.__ultraPidLockState = {locked: false};
  widget.__ultraPidLockState.locked = !supported;
  widget.disabled = !supported;
  if (!supported && normalizePidToggleValue(widget.value)) widget.value = false;
  if (!widget.__ultraOriginalPidTooltip) widget.__ultraOriginalPidTooltip = widget.tooltip;
  if (supported) widget.tooltip = widget.__ultraOriginalPidTooltip;
  return supported;
}

function syncPidVisibility(node) {
  syncPidSupportLock(node);
  const enableWidget = findWidget(node, PID_ENABLE_WIDGET);
  const visible = pidEnabled(node);
  if (enableWidget && enableWidget.value !== visible) {
    enableWidget.value = visible;
  }
  for (const name of PID_DETAIL_WIDGET_NAMES) {
    setWidgetVisible(findWidget(node, name), visible);
  }
  return visible;
}

function attachPidVisibilityHook(node) {
  const widget = findWidget(node, PID_ENABLE_WIDGET);
  if (!widget || widget.__ultraPidVisibilityHook) return false;
  const originalCallback = typeof widget.callback === "function" ? widget.callback : null;
  widget.callback = function ultraPidVisibilityCallback(value, ...args) {
    const result = originalCallback ? originalCallback.call(this, value, ...args) : undefined;
    syncPidVisibility(node);
    // Core content-fit only for an actual user toggle; never during an
    // asynchronous model-settings restoration or graph configuration.
    if (!node.__ultraRestoringFamilySettings && !node.__ultraConfiguredInProgress) {
      fitAfterWidgetStructureChange(node);
    }
    triggerRedraw(node, widget);
    return result;
  };
  widget.__ultraPidVisibilityHook = true;
  return true;
}

function captureNodeSettings(node) {
  const family = String(getWidgetValue(node, "model_family") || "");
  if (!family) return null;

  const standard = {};
  for (const widget of standardPersistWidgets(node)) {
    if (!widget?.name) continue;
    const cloned = cloneJsonValue(widget.value);
    if (cloned !== undefined) standard[String(widget.name)] = cloned;
  }

  const loras = getLoraRows(node)
    .map((row) => normalizeRowValue(row?.value))
    .filter((row) => row.lora);

  return { family, standard, loras, updatedAt: Date.now() };
}

function promptNodeIdsFromValue(value, ids, seen, depth = 0) {
  if (value == null || depth > 6) return;
  if (typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) promptNodeIdsFromValue(item, ids, seen, depth + 1);
    return;
  }

  const entries = Object.entries(value);
  const promptEntries = entries.filter(
    ([key, item]) =>
      /^-?\d+$/.test(String(key)) &&
      item &&
      typeof item === "object" &&
      typeof item.class_type === "string",
  );
  for (const [key] of promptEntries) ids.add(String(key));

  for (const [key, item] of entries) {
    if (key === "workflow") continue;
    promptNodeIdsFromValue(item, ids, seen, depth + 1);
  }
}

function queuedPromptNodeIds(...values) {
  const ids = new Set();
  const seen = new Set();
  for (const value of values) promptNodeIdsFromValue(value, ids, seen);
  return ids;
}

function captureNodeSettingsEntries(queuedNodeIds = null) {
  const queuedIds = queuedNodeIds instanceof Set ? queuedNodeIds : new Set();
  const nodes = getUltraImagePiDNodes().filter((node) => {
    const mode = Number(node?.mode ?? 0);
    if (mode === 2 || mode === 4) return false;
    return !queuedIds.size || queuedIds.has(String(node?.id));
  });

  return nodes
    .map((node) => ({
      graphNodeId: String(node?.id ?? ""),
      storageId: getNodeStorageId(node),
      payload: captureNodeSettings(node),
    }))
    .filter((entry) => entry.payload);
}

function persistCapturedNodeSettings(entries, queuedNodeIds = null) {
  const queuedIds = queuedNodeIds instanceof Set ? queuedNodeIds : new Set();
  const selected = (Array.isArray(entries) ? entries : []).filter(
    (entry) => !queuedIds.size || queuedIds.has(String(entry.graphNodeId)),
  );
  if (!selected.length) return false;

  const store = readSettingsStore();
  const familyCounts = new Map();
  for (const { payload } of selected) {
    familyCounts.set(payload.family, Number(familyCounts.get(payload.family) || 0) + 1);
  }

  for (const { storageId, payload } of selected) {
    if (storageId) {
      if (!store.byNode[storageId] || typeof store.byNode[storageId] !== "object") {
        store.byNode[storageId] = {};
      }
      store.byNode[storageId][payload.family] = payload;
    }
    if (familyCounts.get(payload.family) === 1) {
      store.globalByFamily[payload.family] = payload;
    }
  }
  writeSettingsStore(store);
  return true;
}

function getStoredSettings(node, family) {
  if (!family) return null;
  const store = readSettingsStore();
  const nodeStorageId = getNodeStorageId(node);
  const nodeSpecific = nodeStorageId ? store.byNode?.[nodeStorageId]?.[family] : null;
  if (nodeSpecific && typeof nodeSpecific === "object") return nodeSpecific;
  const globalValue = store.globalByFamily?.[family];
  if (globalValue && typeof globalValue === "object") return globalValue;
  return null;
}

function setWidgetValue(node, widget, nextValue) {
  if (!widget || nextValue === undefined) return false;

  let resolvedValue = cloneJsonValue(nextValue);
  if (widget?.name === PID_ENABLE_WIDGET) {
    resolvedValue = normalizePidToggleValue(resolvedValue);
  } else if (widget?.name === PID_OUTPUT_SCALE_WIDGET) {
    resolvedValue = normalizePidOutputScale(resolvedValue);
  } else if (widget?.name === PID_DEGRADE_SIGMA_WIDGET) {
    resolvedValue = normalizePidDegradeSigma(resolvedValue, 0);
  }
  const optionsValues = widgetOptionValues(widget);
  if (optionsValues.length) {
    const asString = String(resolvedValue);
    if (!optionsValues.includes(asString)) return false;
    resolvedValue = asString;
  }

  const previousValue = cloneJsonValue(widget.value);
  const changed = JSON.stringify(previousValue) !== JSON.stringify(resolvedValue);
  widget.value = resolvedValue;
  if (changed && typeof widget.callback === "function") {
    try {
      widget.callback.call(widget, widget.value, app.canvas, node);
    } catch (error) {
      console.warn(tr(`[Ultra Image + PiD] Widget callback failed while restoring '${widget.name}'`, `[Ultra Image + PiD] 위젯 '${widget.name}' 값 복원 중 callback 실패`), error);
    }
  }
  return changed;
}

async function prepareLoraRows(rows) {
  const normalizedRows = Array.isArray(rows)
    ? rows.map((row) => normalizeRowValue(row)).filter((row) => row.lora)
    : [];
  const availableLoras = await getLoraList(false);
  if (loraListLookupFailed) return normalizedRows;
  return normalizedRows.filter((row) => availableLoras.includes(String(row.lora)));
}

function replaceLoraRows(node, rows) {
  removeDynamicWidgets(node);
  node._ultraLoraCounter = 0;
  for (const row of rows || []) addLoraRow(node, row, null, false);
  ensureAddButton(node);
  // A family restore updates several widgets/rows together. The caller
  // decides whether a single native content-fit is needed after it finishes.
}

async function applyStoredSettingsForFamily(node, family, restoreToken, { restorePidToggle = true, geometryTransition = null } = {}) {
  if (!node || !family) return false;
  const stored = node.__ultraFamilyDrafts?.[family] || getStoredSettings(node, family);
  const preparedLoras = stored ? await prepareLoraRows(stored.loras || []) : [];
  const isCurrentRequest = () =>
    Number(node.__ultraSettingsRestoreToken || 0) === Number(restoreToken) &&
    !node.__ultraConfiguredInProgress &&
    String(getWidgetValue(node, "model_family") || "") === String(family);
  if (!isCurrentRequest()) return false;

  const beforeRowCount = getLoraRows(node).length;
  const beforePidVisible = PID_DETAIL_WIDGET_NAMES.some((name) => !findWidget(node, name)?.hidden);
  let changed = false;
  // Applying saved settings is one logical operation. Do not let each
  // restored widget callback independently resize the node.
  node.__ultraRestoringFamilySettings = true;
  try {
    if (stored) {
      for (const [name, value] of Object.entries(stored.standard || {})) {
        if (!restorePidToggle && name === PID_ENABLE_WIDGET) continue;
        const widget = findWidget(node, name);
        changed = setWidgetValue(node, widget, value) || changed;
      }
      if (!isCurrentRequest()) return false;
      replaceLoraRows(node, preparedLoras);
    } else if (family === MINIMAX_FAMILY) {
      applyMiniMaxFirstUse(node);
    } else if (node.__ultraLastFamilyWasMiniMax) {
      // Only the new H3 route changes legacy first-use behavior. Avoid
      // carrying H3's recommended dimensions/sampler into a never-used family.
      for (const [name, value] of Object.entries({
        width: 1152, height: 896, batch_size: 1, steps: 10, cfg: 1,
        sampler_name: "euler", scheduler: "simple", denoise: 1,
        zero_conditioning: true, sage_attention: false,
      })) setWidgetValue(node, findWidget(node, name), value);
      restoreUnconfiguredLegacyAssetsAfterH3(node, family);
    }
    if (!isCurrentRequest()) return false;
    const storedPidModel = stored?.standard?.pid_model;
    changed = syncPidModelOptions(node, family, storedPidModel) || changed;
    ensurePidComboDefaults(node);
    syncPidVisibility(node);
    syncMiniMaxControls(node);
  } finally {
    node.__ultraRestoringFamilySettings = false;
  }
  if (!isCurrentRequest()) return false;
  // Only visible-row structural changes justify a native content-fit.
  // Merely restoring different model/sampler values must never alter geometry.
  const afterPidVisible = PID_DETAIL_WIDGET_NAMES.some((name) => !findWidget(node, name)?.hidden);
  if (geometryTransition) {
    // Make one final size change only after the LoRA/widget layout settles.
    // Avoid a provisional resize that makes the bottom border jump twice.
    applyFamilySize(node, family, geometryTransition);
  } else if (beforeRowCount !== getLoraRows(node).length || beforePidVisible !== afterPidVisible) {
    fitAfterWidgetStructureChange(node);
  }
  triggerRedraw(node);
  return changed || Boolean(stored);
}

function attachModelFamilyRestoreHook(node) {
  const widget = findWidget(node, "model_family");
  if (!widget || widget.__ultraModelFamilyRestoreHook) return false;

  const originalCallback = typeof widget.callback === "function" ? widget.callback : null;
  node.__ultraCurrentFamily = String(getWidgetValue(node, "model_family") || "");
  widget.callback = function ultraImagePiDModelFamilyCallback(value, ...args) {
    const oldFamily = node.__ultraCurrentFamily;
    const nextFamily = String(value || widget.value || "");
    const geometryTransition = oldFamily && oldFamily !== nextFamily &&
      !node.__ultraConfiguredInProgress && !app?.configuringGraph
      ? beginFamilySizeTransition(node, oldFamily) : null;
    const result = originalCallback ? originalCallback.call(this, value, ...args) : undefined;
    const family = String(value || widget.value || "");
    if (oldFamily && oldFamily !== family && !node.__ultraConfiguredInProgress && !app?.configuringGraph) {
      node.__ultraFamilyDrafts ||= Object.create(null);
      node.__ultraFamilyDrafts[oldFamily] = { ...captureNodeSettings(node), family: oldFamily };
    }
    node.__ultraCurrentFamily = family;
    node.__ultraLastFamilyWasMiniMax = oldFamily === MINIMAX_FAMILY && family !== MINIMAX_FAMILY;
    syncPidModelOptions(node, family);
    syncPidVisibility(node);
    syncMiniMaxControls(node);
    localizeNode(node);
    const restoreToken = Number(node.__ultraSettingsRestoreToken || 0) + 1;
    node.__ultraSettingsRestoreToken = restoreToken;
    Promise.resolve()
      .then(() => applyStoredSettingsForFamily(node, family, restoreToken, { geometryTransition }))
      .catch((error) => {
        console.warn(tr("[Ultra Image + PiD] Failed to restore per-family last generation settings", "[Ultra Image + PiD] 모델별 마지막 생성 설정 복원 실패"), error);
      });
    return result;
  };
  widget.__ultraModelFamilyRestoreHook = true;
  return true;
}

function ensureQueueHook() {
  const candidates = [
    [api, "queuePrompt"],
    [app, "queuePrompt"],
  ];

  for (const [target, methodName] of candidates) {
    const original = target?.[methodName];
    if (typeof original !== "function") continue;
    if (original?.[QUEUE_HOOK_FLAG]) return true;

    const wrapped = async function ultraImagePiDQueueHook(...args) {
      const queuedIdsBefore = queuedPromptNodeIds(args);
      const settingsSnapshot = captureNodeSettingsEntries(queuedIdsBefore);
      const result = await original.apply(this, args);
      if (result !== false) {
        try {
          const queuedIds = queuedPromptNodeIds(args, result);
          persistCapturedNodeSettings(settingsSnapshot, queuedIds.size ? queuedIds : queuedIdsBefore);
        } catch (error) {
          console.warn(tr("[Ultra Image + PiD] Failed to record per-family last generation settings", "[Ultra Image + PiD] 모델별 마지막 생성 설정 기록 실패"), error);
        }
      }
      return result;
    };
    Object.defineProperty(wrapped, QUEUE_HOOK_FLAG, { value: true });
    target[methodName] = wrapped;
    return true;
  }
  return false;
}

function getUltraImagePiDNodes() {
  const seen = new Set();
  const nodes = [];
  for (const graph of [app.graph, app.canvas?.graph]) {
    for (const node of graph?._nodes || []) {
      if (!seen.has(node) && isOurNode(node)) {
        seen.add(node);
        nodes.push(node);
      }
    }
  }
  return nodes;
}

async function refreshUltraImagePiDAssetLists(force = true) {
  if (assetListRefreshPromise) return assetListRefreshPromise;

  assetListRefreshPromise = (async () => {
    if (force) clearLoraListCache();
    const [definition] = await Promise.all([getOwnNodeDefinition(), getLoraList(force)]);
    const comboValues = Object.fromEntries(
      REFRESHABLE_COMBO_WIDGETS.map((name) => [name, comboValuesFromDefinition(definition, name)]),
    );

    for (const node of getUltraImagePiDNodes()) {
      let changed = false;
      for (const [name, values] of Object.entries(comboValues)) {
        if (name === PID_MODEL_WIDGET) {
          const widget = findWidget(node, PID_MODEL_WIDGET);
          if (widget) widget._ultraAllPidModelValues = [...values];
        }
        changed = updateComboWidget(node, name, values) || changed;
      }
      changed = syncPidModelOptions(node, getWidgetValue(node, "model_family")) || changed;
      ensurePidComboDefaults(node);
      syncPidVisibility(node);
      if (changed) triggerRedraw(node);
    }
  })();

  try {
    return await assetListRefreshPromise;
  } finally {
    assetListRefreshPromise = null;
  }
}

function ensureRefreshHook() {
  const currentRefresh = app.refreshComboInNodes;
  if (typeof currentRefresh !== "function") return false;
  if (currentRefresh[REFRESH_HOOK_FLAG]) return true;

  const wrappedRefresh = async function ultraImagePiDRefreshHook(...args) {
    clearLoraListCache();
    let result;
    try {
      result = await currentRefresh.apply(this, args);
    } finally {
      try {
        await refreshUltraImagePiDAssetLists(true);
      } catch (error) {
        console.error(tr("[Ultra Image + PiD] Failed to refresh model and LoRA lists", "[Ultra Image + PiD] 모델·LoRA 목록 새로고침 실패"), error);
      }
    }
    return result;
  };
  Object.defineProperty(wrappedRefresh, REFRESH_HOOK_FLAG, { value: true });
  app.refreshComboInNodes = wrappedRefresh;
  return true;
}

async function getLoraList(force = false) {
  if (force) clearLoraListCache();
  if (loraListCache) return loraListCache;
  if (loraListPromise) return loraListPromise;

  const requestVersion = loraListCacheVersion;
  const requestPromise = (async () => {
    const classNames = ["LoraLoaderModelOnly", "LoraLoader"];
    let hadSuccessfulLookup = false;
    let lastError = null;
    for (const className of classNames) {
      try {
        const response = await api.fetchApi(`/object_info/${className}`);
        if (!response.ok) {
          lastError = new Error(`${className} object_info failed (${response.status})`);
          continue;
        }
        hadSuccessfulLookup = true;
        const data = await response.json();
        const definition = data?.[className] || data;
        const input = definition?.input?.required?.lora_name;
        const values = Array.isArray(input?.[0]) ? input[0] : [];
        if (values.length) {
          const result = uniqueSortedStrings(values);
          if (requestVersion === loraListCacheVersion) {
            loraListCache = result;
            loraListLookupFailed = false;
            loraListLookupError = null;
          }
          return result;
        }
      } catch (error) {
        lastError = error;
        console.warn(`[Ultra Image + PiD] Failed to read ${className} LoRA list.`, error);
      }
    }
    if (requestVersion === loraListCacheVersion) {
      loraListCache = [];
      loraListLookupFailed = !hadSuccessfulLookup;
      loraListLookupError = lastError;
    }
    return [];
  })();
  loraListPromise = requestPromise;

  try {
    return await requestPromise;
  } finally {
    if (loraListPromise === requestPromise) loraListPromise = null;
  }
}

function makeMenuTree(paths) {
  const root = { children: new Map(), values: [] };
  for (const fullPath of paths) {
    const parts = String(fullPath).split(/[\\/]/g).filter(Boolean);
    let current = root;
    for (let index = 0; index < Math.max(0, parts.length - 1); index += 1) {
      const part = parts[index];
      if (!current.children.has(part)) {
        current.children.set(part, { children: new Map(), values: [] });
      }
      current = current.children.get(part);
    }
    current.values.push({ label: parts.at(-1) || fullPath, value: fullPath });
  }
  return root;
}

function treeToMenuOptions(tree, onChoose) {
  const options = [];
  const folders = [...tree.children.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [folder, child] of folders) {
    options.push({
      content: `📁 ${folder}`,
      submenu: { options: treeToMenuOptions(child, onChoose) },
    });
  }
  const values = [...tree.values].sort((a, b) => a.label.localeCompare(b.label));
  for (const item of values) {
    options.push({ content: item.label, callback: () => onChoose(item.value) });
  }
  return options;
}

async function showLoraChooser(event, onChoose) {
  const loras = await getLoraList(false);
  if (!loras.length) {
    if (loraListLookupFailed) {
      console.warn("[Ultra Image + PiD] LoRA list lookup failed.", loraListLookupError);
      alertMessage(
        "Could not read the LoRA list from ComfyUI. Try Refresh model and LoRA lists, then restart ComfyUI if the problem continues.",
        "ComfyUI에서 LoRA 목록을 읽지 못했습니다. 모델·LoRA 목록 새로고침을 시도하고, 계속되면 ComfyUI를 재시작하십시오.",
      );
    } else {
      alertMessage("No LoRA files were found in the models/loras folder.", "models/loras 폴더에서 LoRA 파일을 찾지 못했습니다.");
    }
    return;
  }
  const options = treeToMenuOptions(makeMenuTree(loras), onChoose);
  new LiteGraph.ContextMenu(options, {
    event,
    title: tr("Select LoRA", "LoRA 선택"),
    scale: Math.max(1, app.canvas?.ds?.scale || 1),
  });
}

async function promptStrength(widget, node, event) {
  const applyValue = (value) => {
    if (value == null) return;
    const parsed = clampStrength(value);
    if (parsed == null) return;
    widget.value.strength = Math.round(parsed * 1000) / 1000;
    triggerRedraw(node, widget);
  };

  if (app.canvas?.prompt) {
    app.canvas.prompt(tr("LoRA strength", "LoRA 강도"), String(widget.value.strength), applyValue, event);
    return;
  }
  const dialog = app.extensionManager?.dialog;
  if (dialog?.prompt) {
    const value = await dialog.prompt({
      title: tr("LoRA strength", "LoRA 강도"),
      message: tr(`Enter a value between -${MAX_STRENGTH} and ${MAX_STRENGTH}.`, `-${MAX_STRENGTH}에서 ${MAX_STRENGTH} 사이의 값을 입력하십시오.`),
      defaultValue: String(widget.value.strength),
    });
    applyValue(value);
    return;
  }
  alertMessage(
    "This ComfyUI frontend cannot open the LoRA strength input dialog.",
    "현재 ComfyUI 프런트엔드에서는 LoRA 강도 입력창을 열 수 없습니다.",
  );
}

class UltraLoraRowWidget {
  constructor(name, value) {
    this.name = name;
    this.type = "custom";
    this.options = {};
    this.value = normalizeRowValue(value);
    this._ultraLoraRow = true;
    this.last_y = 0;
    this._lastWidth = MIN_NODE_WIDTH;
    Object.defineProperty(this, "width", {
      configurable: true,
      get: () => undefined,
      set: () => {},
    });
  }

  computeSize(width) {
    return [width, ROW_HEIGHT];
  }

  draw(ctx, node, width, y, height) {
    this.last_y = y;
    this._lastWidth = width;
    const left = 15;
    const right = width - 15;
    const top = y + 2;
    const rowHeight = Math.max(20, height - 4);
    const toggleWidth = 24;
    const strengthWidth = 68;
    const gap = 4;
    const loraX = left + toggleWidth + gap;
    const strengthX = right - strengthWidth;
    const loraWidth = Math.max(50, strengthX - gap - loraX);

    ctx.save();
    ctx.globalAlpha = this.value.on ? 1 : 0.5;
    ctx.fillStyle = LiteGraph.WIDGET_BGCOLOR || "#222";
    ctx.strokeStyle = LiteGraph.WIDGET_OUTLINE_COLOR || "#666";
    ctx.lineWidth = 1;

    roundedRect(ctx, left, top, toggleWidth, rowHeight, 5);
    ctx.fill();
    ctx.stroke();
    roundedRect(ctx, loraX, top, loraWidth, rowHeight, 5);
    ctx.fill();
    ctx.stroke();
    roundedRect(ctx, strengthX, top, strengthWidth, rowHeight, 5);
    ctx.fill();
    ctx.stroke();

    const midY = top + rowHeight / 2;
    ctx.textBaseline = "middle";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = this.value.on ? "#8fd18f" : "#888";
    ctx.textAlign = "center";
    ctx.fillText(this.value.on ? "●" : "○", left + toggleWidth / 2, midY);

    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR || "#ddd";
    ctx.textAlign = "left";
    const label = this.value.lora || tr("Select LoRA", "LoRA 선택");
    ctx.fillText(fitText(ctx, label, loraWidth - 14), loraX + 7, midY);

    ctx.textAlign = "center";
    ctx.fillText(Number(this.value.strength).toFixed(2), strengthX + strengthWidth / 2, midY);
    ctx.restore();
  }

  serializeValue(node) {
    const rows = getLoraRows(node);
    return {
      on: this.value.on !== false,
      lora: String(this.value.lora || ""),
      strength: Number(this.value.strength),
      order: Math.max(0, rows.indexOf(this)),
    };
  }

  mouse(event, pos, node) {
    if (event.type !== "pointerdown" || event.button === 2) return false;
    const width = this._lastWidth || node.size?.[0] || MIN_NODE_WIDTH;
    const left = 15;
    const right = width - 15;
    const toggleEnd = left + 24;
    const strengthStart = right - 68;
    const x = pos[0];

    if (x >= left && x <= toggleEnd) {
      this.value.on = !this.value.on;
      triggerRedraw(node, this);
      return true;
    }
    if (x >= strengthStart && x <= right) {
      promptStrength(this, node, event);
      return true;
    }
    if (x > toggleEnd && x < strengthStart) {
      showLoraChooser(event, (selected) => {
        this.value.lora = selected;
        triggerRedraw(node, this);
      });
      return true;
    }
    return false;
  }
}


class UltraLoraAddButtonWidget {
  constructor() {
    this.name = "ultra_add_lora";
    this.type = "custom";
    this.value = "";
    this.options = { serialize: false };
    this.serialize = false;
    this._ultraLoraAddButton = true;
    this.last_y = 0;
    Object.defineProperty(this, "width", {
      configurable: true,
      get: () => undefined,
      set: () => {},
    });
  }

  computeSize(width) {
    return [width, ROW_HEIGHT];
  }

  draw(ctx, node, width, y, height) {
    this.last_y = y;
    const left = 15;
    const top = y + 2;
    const rowHeight = Math.max(20, height - 4);
    const buttonWidth = width - 30;
    ctx.save();
    ctx.fillStyle = LiteGraph.WIDGET_BGCOLOR || "#222";
    ctx.strokeStyle = LiteGraph.WIDGET_OUTLINE_COLOR || "#666";
    roundedRect(ctx, left, top, buttonWidth, rowHeight, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR || "#ddd";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tr("＋ Add LoRA", "＋ LoRA 추가"), width / 2, top + rowHeight / 2);
    ctx.restore();
  }

  mouse(event, pos, node) {
    if (event.type !== "pointerdown" || event.button === 2) return false;
    showLoraChooser(event, (selected) => addLoraRow(node, { lora: selected }));
    return true;
  }
}

function getLoraRows(node) {
  return (node.widgets || []).filter(isLoraRow);
}

function removeDynamicWidgets(node) {
  if (!Array.isArray(node.widgets)) return;
  for (const widget of [...node.widgets].reverse()) {
    if (!isDynamicWidget(widget)) continue;
    if (typeof node.removeWidget === "function") node.removeWidget(widget);
    else {
      const index = node.widgets.indexOf(widget);
      if (index >= 0) node.widgets.splice(index, 1);
    }
  }
}

function ensureCounter(node, name) {
  const match = String(name || "").match(/^lora_(\d+)$/i);
  if (match) node._ultraLoraCounter = Math.max(node._ultraLoraCounter || 0, Number(match[1]));
}

function nextRowName(node) {
  node._ultraLoraCounter = (node._ultraLoraCounter || 0) + 1;
  return `${ROW_PREFIX}${node._ultraLoraCounter}`;
}

function ensureAddButton(node) {
  let button = (node.widgets || []).find((widget) => widget?._ultraLoraAddButton);
  if (!button) {
    button = node.addCustomWidget(new UltraLoraAddButtonWidget());
  }
  const index = node.widgets.indexOf(button);
  if (index >= 0) node.widgets.splice(index, 1);
  node.widgets.push(button);
  return button;
}

function addLoraRow(node, value = {}, name = null, resize = true) {
  const widgetName = name || nextRowName(node);
  ensureCounter(node, widgetName);
  const row = node.addCustomWidget(new UltraLoraRowWidget(widgetName, value));
  const button = ensureAddButton(node);
  const rowIndex = node.widgets.indexOf(row);
  const buttonIndex = node.widgets.indexOf(button);
  if (rowIndex > buttonIndex) {
    node.widgets.splice(rowIndex, 1);
    node.widgets.splice(buttonIndex, 0, row);
  }
  if (resize) fitAfterWidgetStructureChange(node);
  triggerRedraw(node, row);
  return row;
}

// Ask LiteGraph to fit the current visible content. Never adjust margins,
// accumulate minimum heights, or install custom resize/restore handlers.
// Called once after a real widget-structure change or completed graph load.
function fitAfterWidgetStructureChange(node) {
  if (!node || typeof node.computeSize !== "function" || typeof node.setSize !== "function") return;
  const nativeSize = node.computeSize();
  if (!Array.isArray(nativeSize) || !Number.isFinite(nativeSize[1])) return;
  const currentWidth = Number(node.size?.[0]);
  const width = Number.isFinite(currentWidth) ? currentWidth : nativeSize[0];
  // Do not change geometry when core reports the existing size is sufficient.
  if (node.size?.[0] === width && node.size?.[1] === nativeSize[1]) return;
  node.setSize([width, nativeSize[1]]);
  triggerRedraw(node);
}

// A workflow already carries the user's requested size. On load only grow
// undersized nodes enough to display their content; shrinking to computeSize()
// here would discard a deliberately enlarged node and its editor-like spacing.
function preserveLoadedNodeSize(node) {
  if (!node || typeof node.computeSize !== "function" || typeof node.setSize !== "function") return;
  const nativeSize = node.computeSize();
  const width = Math.max(Number(node.size?.[0]) || 0, Number(nativeSize?.[0]) || 0);
  const height = Math.max(Number(node.size?.[1]) || 0, Number(nativeSize?.[1]) || 0);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
  if (node.size?.[0] !== width || node.size?.[1] !== height) {
    node.setSize([width, height]);
    triggerRedraw(node);
  }
}

// Only height is remembered per family; width remains the node's live width.
// Keep the user's manually added vertical space on model changes: a raw
// computeSize() fit would erase that space on every H3 switch.
function validFamilySize(value) {
  const width = Number(value?.[0]);
  const height = Number(value?.[1]);
  return Number.isFinite(width) && width >= MIN_NODE_WIDTH && width <= 16384 &&
    Number.isFinite(height) && height >= 40 && height <= 16384
    ? [width, height] : null;
}

function validFamilyHeight(value) {
  const height = Number(value);
  return Number.isFinite(height) && height >= 40 && height <= 16384 ? height : null;
}

function familyHeightStore(node) {
  node.properties ||= {};
  const value = node.properties[FAMILY_HEIGHT_PROPERTY];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    node.properties[FAMILY_HEIGHT_PROPERTY] = {};
  }
  const heights = node.properties[FAMILY_HEIGHT_PROPERTY];
  const legacy = node.properties[LEGACY_FAMILY_SIZE_PROPERTY];
  if (legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
    for (const family of Object.keys(FAMILY_LATENT_SPACE)) {
      if (validFamilyHeight(heights[family]) !== null) continue;
      const oldSize = validFamilySize(legacy[family]);
      if (oldSize) heights[family] = oldSize[1];
    }
  }
  delete node.properties[LEGACY_FAMILY_SIZE_PROPERTY];
  return heights;
}

function nativeFamilyMinHeight(node) {
  try {
    const height = Number(node.computeSize?.()?.[1]);
    return Number.isFinite(height) && height > 0 ? height : null;
  } catch (_) {
    return null;
  }
}

function beginFamilySizeTransition(node, oldFamily) {
  if (node?.flags?.collapsed || !Object.hasOwn(FAMILY_LATENT_SPACE, oldFamily)) return null;
  const size = validFamilySize(node?.size);
  if (!size) return null;
  const beforeMinHeight = nativeFamilyMinHeight(node) ?? size[1];
  familyHeightStore(node)[oldFamily] = size[1];
  return { size, beforeMinHeight };
}

function applyFamilySize(node, family, transition) {
  if (!transition || node?.flags?.collapsed || !Object.hasOwn(FAMILY_LATENT_SPACE, family) ||
      typeof node?.setSize !== "function") return;
  const savedHeight = validFamilyHeight(familyHeightStore(node)[family]);
  const nativeSize = node.computeSize?.();
  const nativeWidth = Number(nativeSize?.[0]);
  const nativeHeight = Number(nativeSize?.[1]);
  if (!Number.isFinite(nativeHeight) || nativeHeight <= 0) return;
  const requestedWidth = Number(node.size?.[0]);
  const requestedHeight = savedHeight ??
    transition.size[1] + nativeHeight - transition.beforeMinHeight;
  const width = Math.max(MIN_NODE_WIDTH, Number.isFinite(nativeWidth) ? nativeWidth : 0,
    Number.isFinite(requestedWidth) ? requestedWidth : transition.size[0]);
  const height = Math.max(nativeHeight, requestedHeight);
  if (!Number.isFinite(height) || height > 16384 || width > 16384) return;
  if (node.size?.[0] !== width || node.size?.[1] !== height) {
    node.setSize([width, height]);
    triggerRedraw(node);
  }
}

function moveRow(node, row, direction) {
  const rows = getLoraRows(node);
  const current = rows.indexOf(row);
  const target = current + direction;
  if (current < 0 || target < 0 || target >= rows.length) return;
  const other = rows[target];
  const currentWidgetIndex = node.widgets.indexOf(row);
  const otherWidgetIndex = node.widgets.indexOf(other);
  node.widgets[currentWidgetIndex] = other;
  node.widgets[otherWidgetIndex] = row;
  triggerRedraw(node, row);
}

function removeRow(node, row) {
  if (typeof node.removeWidget === "function") node.removeWidget(row);
  else {
    const index = node.widgets.indexOf(row);
    if (index >= 0) node.widgets.splice(index, 1);
  }
  fitAfterWidgetStructureChange(node);
}

function getLoraRowMenuItems(node, row) {
  const rows = getLoraRows(node);
  const index = rows.indexOf(row);
  return [
    {
      content: row.value.on ? tr("Disable this LoRA", "이 LoRA 비활성화") : tr("Enable this LoRA", "이 LoRA 활성화"),
      callback: () => {
        row.value.on = !row.value.on;
        triggerRedraw(node, row);
      },
    },
    {
      content: tr("Move LoRA up", "LoRA 위로 이동"),
      disabled: index <= 0,
      callback: () => moveRow(node, row, -1),
    },
    {
      content: tr("Move LoRA down", "LoRA 아래로 이동"),
      disabled: index < 0 || index >= rows.length - 1,
      callback: () => moveRow(node, row, 1),
    },
    {
      content: tr("Remove only this LoRA", "이 LoRA만 삭제"),
      callback: () => removeRow(node, row),
    },
    null,
    {
      content: tr("Refresh LoRA list", "LoRA 목록 새로고침"),
      callback: async () => {
        await getLoraList(true);
        triggerRedraw(node, row);
      },
    },
  ];
}

function rowUnderPointer(node, canvas = app.canvas) {
  const graphMouse = canvas?.graph_mouse || canvas?.graphMouse;
  if (!graphMouse || !node?.pos) return null;
  const localX = graphMouse[0] - node.pos[0];
  const localY = graphMouse[1] - node.pos[1];
  if (localX < 0 || localX > (node.size?.[0] || 0)) return null;
  for (const row of getLoraRows(node)) {
    const y = Number(row.last_y || 0);
    if (localY >= y && localY <= y + ROW_HEIGHT) return row;
  }
  return null;
}

function ensureLoraContextMenuHook() {
  // Current frontends collect extension node-menu items through the
  // getNodeMenuItems() hook below (classic canvas and Nodes 2.0 alike) and
  // warn that monkey-patching getNodeMenuOptions is deprecated. Patch the
  // canvas only on older frontends that lack that hook.
  if (typeof app?.collectNodeMenuItems === "function") return true;
  const canvas = app.canvas;
  const currentGetNodeMenuOptions = canvas?.getNodeMenuOptions;
  if (typeof currentGetNodeMenuOptions !== "function") return false;
  if (currentGetNodeMenuOptions[LORA_MENU_HOOK_FLAG]) return true;

  const wrappedGetNodeMenuOptions = function ultraImagePiDLoraContextMenu(node, ...args) {
    if (isOurNode(node)) {
      const row = rowUnderPointer(node, this);
      if (row) return getLoraRowMenuItems(node, row);
    }
    return currentGetNodeMenuOptions.call(this, node, ...args);
  };
  Object.defineProperty(wrappedGetNodeMenuOptions, LORA_MENU_HOOK_FLAG, { value: true });
  canvas.getNodeMenuOptions = wrappedGetNodeMenuOptions;
  return true;
}

function parseDynamicValues(values) {
  const result = [];
  const source = Array.isArray(values) ? values : [];

  // New dynamic format: one object per row.
  for (const value of source) {
    if (value && typeof value === "object" && typeof value.lora === "string") {
      const parsedOrder = Number(value.order);
      result.push({
        value: normalizeRowValue(value),
        order: Number.isFinite(parsedOrder) ? parsedOrder : result.length,
      });
    }
  }
  if (result.length) {
    result.sort((a, b) => a.order - b.order);
    return result.map((entry) => entry.value);
  }

  return [];
}

// Some older saved workflows have three retired blank-assist widgets
// immediately after the regular widget block. Drop ONLY that typed triple,
// leaving all LoRA row objects and old pre-assist workflows untouched.
function normalizeH3LegacyWidgetValues(savedValues, standardCount) {
  if (!Array.isArray(savedValues) || savedValues.length < standardCount + 3) return savedValues;
  const triple = savedValues.slice(standardCount, standardCount + 3);
  if (typeof triple[0] !== "boolean" || !triple.slice(1).every((x) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1)) {
    return savedValues;
  }
  return [...savedValues.slice(0, standardCount), ...savedValues.slice(standardCount + 3)];
}


function cancelNewNodeSettingsRestore(node) {
  // Cancel both the scheduled callback and any already-running asynchronous
  // stored-settings lookup. A workflow's serialized widgets AND geometry
  // must win over a new-node settings restoration that began earlier.
  node.__ultraSettingsRestoreToken = Number(node.__ultraSettingsRestoreToken || 0) + 1;
  node.__ultraNewNodeRestoreGeneration = Number(node.__ultraNewNodeRestoreGeneration || 0) + 1;
  if (node.__ultraNewNodeRestoreTimer != null) {
    clearTimeout(node.__ultraNewNodeRestoreTimer);
    node.__ultraNewNodeRestoreTimer = null;
  }
}

function scheduleNewNodeSettingsRestore(node) {
  const generation = Number(node.__ultraNewNodeRestoreGeneration || 0) + 1;
  node.__ultraNewNodeRestoreGeneration = generation;
  node.__ultraNewNodeRestoreTimer = setTimeout(() => {
    node.__ultraNewNodeRestoreTimer = null;
    if (Number(node.__ultraNewNodeRestoreGeneration || 0) !== generation) return;
    // A genuinely new node gets the last remembered settings for its current
    // model family. Workflow loads and standard copy/paste paths must keep
    // their serialized values and geometry authoritative.
    if (node.__ultraConfiguredFromWorkflow || node.__ultraLoadedFromGraph || node.__ultraConfiguredInProgress || app?.configuringGraph) return;
    const family = String(getWidgetValue(node, "model_family") || "");
    if (!family) return;
    const restoreToken = Number(node.__ultraSettingsRestoreToken || 0) + 1;
    node.__ultraSettingsRestoreToken = restoreToken;
    Promise.resolve(applyStoredSettingsForFamily(node, family, restoreToken, { restorePidToggle: false })).catch((error) => {
      console.warn(
        tr(
          "[Ultra Image + PiD] Failed to restore settings for a new node",
          "[Ultra Image + PiD] 새 노드의 마지막 실행 설정 복원 실패",
        ),
        error,
      );
    });
  }, 0);
}

app.registerExtension({
  name: "Ultra.StandaloneImagePiD.DynamicLoRA",

  setup() {
    installLocaleHooks();
    ensureRefreshHook();
    ensureLoraContextMenuHook();
    ensureQueueHook();
  },

  async beforeRegisterNodeDef(nodeType, nodeData) {
    ensureRefreshHook();
    ensureQueueHook();
    if (nodeData?.name !== NODE_CLASS && nodeType?.comfyClass !== NODE_CLASS) return;

    const originalConfigure = nodeType.prototype.configure;
    nodeType.prototype.configure = function configureUltraImagePiD(info) {
      cancelNewNodeSettingsRestore(this);
      this.__ultraConfiguredFromWorkflow = true;
      this.__ultraConfiguredInProgress = true;
      const savedValues = Array.isArray(info?.widgets_values) ? info.widgets_values : [];
      removeDynamicWidgets(this);
      const standardCount = this.widgets?.filter((widget) => widget?.serialize !== false).length || 0;
      const normalizedValues = normalizeH3LegacyWidgetValues(savedValues, standardCount);

      try {
        // The core restores standard widgets and node geometry. Dynamic LoRA
        // rows are independent widgets appended after core configuration.
        const baseInfo = { ...info, widgets_values: normalizedValues.slice(0, standardCount) };
        const result = originalConfigure?.call(this, baseInfo);
        attachPidVisibilityHook(this);
        syncPidModelOptions(this, getWidgetValue(this, "model_family"));
        ensurePidComboDefaults(this);
        syncPidVisibility(this);
        syncMiniMaxControls(this);
        this._ultraLoraCounter = 0;
        for (const value of parseDynamicValues(normalizedValues.slice(standardCount))) {
          addLoraRow(this, value, null, false);
        }
        ensureAddButton(this);
        localizeNode(this);
        return result;
      } finally {
        this.__ultraConfiguredInProgress = false;
      }
    };
  },

  loadedGraphNode(node) {
    if (!isOurNode(node)) return;
    cancelNewNodeSettingsRestore(node);
    node.__ultraLoadedFromGraph = true;
    node.__ultraConfiguredFromWorkflow = true;
    // Core restore owns the saved node height. Reconcile widget visibility,
    // then grow only if the saved bounds are too small for visible controls.
    // A full fit would destroy intentionally retained per-family whitespace.
    syncPidVisibility(node);
    syncMiniMaxControls(node);
    localizeNode(node);
    preserveLoadedNodeSize(node);
  },

  async nodeCreated(node) {
    if (!isOurNode(node)) return;
    ensureRefreshHook();
    ensureLoraContextMenuHook();
    ensureQueueHook();
    node.serialize_widgets = true;
    if (node.__ultraConfiguredFromWorkflow !== true) node.__ultraConfiguredFromWorkflow = false;
    if (node.__ultraLoadedFromGraph !== true) node.__ultraLoadedFromGraph = false;
    node.properties = node.properties || {};
    node._ultraLoraCounter = node._ultraLoraCounter || 0;
    syncOutputLabels(node);
    installLocaleHooks();

    attachPidVisibilityHook(node);
    syncPidModelOptions(node, getWidgetValue(node, "model_family"));
    ensurePidComboDefaults(node);
    syncPidVisibility(node);
    syncMiniMaxControls(node);
    ensureAddButton(node);
    localizeNode(node);
    // The core constructor measured six PiD controls before this extension
    // hid them. Fit only genuinely NEW nodes once to the current visible
    // widgets; graph-loaded nodes keep their serialized size untouched.
    if (!node.__ultraConfiguredFromWorkflow && !app?.configuringGraph) {
      fitAfterWidgetStructureChange(node);
    }
    attachModelFamilyRestoreHook(node);

    // Apply remembered settings only to a genuinely new node. Workflow
    // loads/copies call configure(), which marks the node and keeps its own
    // serialized settings authoritative.
    scheduleNewNodeSettingsRestore(node);

    getLoraList(false);
    refreshUltraImagePiDAssetLists(false).catch((error) => {
      console.error(
        tr(
          "[Ultra Image + PiD] Initial model-family and asset sync failed",
          "[Ultra Image + PiD] 초기 모델 계열·자산 목록 동기화 실패",
        ),
        error,
      );
    });
  },

  getNodeMenuItems(node) {
    if (!isOurNode(node)) return [];
    const row = rowUnderPointer(node);
    if (row) return getLoraRowMenuItems(node, row);
    return [
      {
        content: tr("Refresh model and LoRA lists", "모델·LoRA 목록 새로고침"),
        callback: async () => {
          await refreshUltraImagePiDAssetLists(true);
          triggerRedraw(node);
        },
      },
    ];
  },
});

