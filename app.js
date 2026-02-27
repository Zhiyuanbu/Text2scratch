
import {
  CLOUD_TABLE,
  SHARE_QUERY_PARAM,
  buildShareUrl,
  createSupabaseClient,
  formatSupabaseError,
  getConfirmPageUrl,
  getIndexPageUrl,
  isDuplicateError,
  isMissingRowError
} from "./supabase-client.js";

const STAGE_BACKDROP = {
  assetId: "6821a718a962852e3796b6273aaeb291",
  md5ext: "6821a718a962852e3796b6273aaeb291.svg",
  name: "backdrop1",
  bitmapResolution: 1,
  dataFormat: "svg",
  rotationCenterX: 240,
  rotationCenterY: 180
};

const SPRITE_COSTUME = {
  assetId: "ff8acd23f6a612cc18fa5614002d9933",
  md5ext: "ff8acd23f6a612cc18fa5614002d9933.svg",
  name: "costume1",
  bitmapResolution: 1,
  dataFormat: "svg",
  rotationCenterX: 48,
  rotationCenterY: 48
};

const STAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a7e7ff"/><stop offset="100%" stop-color="#f9f7d9"/></linearGradient></defs><rect width="480" height="360" fill="url(#bg)"/></svg>';

const SPRITE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="#ff9f1c" stroke="#2e2e2e" stroke-width="6"/><circle cx="36" cy="40" r="5" fill="#2e2e2e"/><circle cx="60" cy="40" r="5" fill="#2e2e2e"/><path d="M30 58 Q48 72 66 58" stroke="#2e2e2e" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';

const CORE_PREFIX_LABELS = {
  event: "Events",
  motion: "Motion",
  looks: "Looks",
  sound: "Sound",
  control: "Control",
  sensing: "Sensing",
  operator: "Operators",
  data: "Variables & Lists",
  procedures: "My Blocks"
};

const INDENT_UNIT = "  ";
const MONACO_VS_PATH = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs";
const MARKER_OWNER = "text2scratch-diagnostics";
const DIAGNOSTIC_DEBOUNCE_MS = 220;
const TOAST_LIFETIME_MS = 3600;
const CAPTCHA_CACHE_KEY = "text2scratch.hcaptcha.token";
const CAPTCHA_CACHE_MAX_AGE_MS = 20 * 60 * 1000;
const BLOCKING_DIAGNOSTIC_CODES = new Set([
  "t2s.missing-end",
  "t2s.unmatched-end",
  "t2s.invalid-else",
  "t2s.expression-standalone",
  "t2s.unknown-command",
  "t2s.stage-incompatible",
  "t2s.at-format",
  "t2s.problem"
]);

const STAGE_UNSUPPORTED_OPCODE_PREFIXES = [
  "motion_",
  "pen_"
];

const STAGE_UNSUPPORTED_OPCODES = new Set([
  "event_whenthisspriteclicked",
  "looks_say",
  "looks_sayforsecs",
  "looks_think",
  "looks_thinkforsecs",
  "looks_switchcostumeto",
  "looks_nextcostume",
  "looks_changeeffectby",
  "looks_seteffectto",
  "looks_cleargraphiceffects",
  "looks_show",
  "looks_hide",
  "looks_gotofrontback",
  "looks_goforwardbackwardlayers",
  "looks_changesizeby",
  "looks_setsizeto",
  "looks_costumenumbername",
  "looks_size",
  "sensing_touchingobject",
  "sensing_touchingcolor",
  "sensing_coloristouchingcolor",
  "sensing_distanceto",
  "control_start_as_clone",
  "control_create_clone_of",
  "control_delete_this_clone"
]);

const DEFAULT_PROJECT_NAME = "multi_sprite_project";
const DEFAULT_MULTI_SPRITE_SAMPLE = [
  "# Stage setup",
  "make_var score 0",
  "make_broadcast start_round",
  "stage_code =",
  "  when_flag_clicked",
  "  switch_backdrop_to backdrop1",
  "  broadcast start_round",
  "end",
  "",
  "sprite = \"Cat\"",
  "svg = \"https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg\"",
  "cat_code =",
  "  when_broadcast_received start_round",
  "  set_var score 0",
  "  repeat 6",
  "    move 14",
  "    turn_right 30",
  "    change_var score 1",
  "  end",
  "end",
  "",
  "sprite = \"Ball\"",
  "ball_code =",
  "  when_broadcast_received start_round",
  "  go_to_xy 0 0",
  "  if var(score) > 4",
  "    say \"Ready to play\"",
  "  else",
  "    think \"Need more points\"",
  "  end",
  "end"
];

const ui = {
  editorHost: document.getElementById("editorHost"),
  input: document.getElementById("scriptInput"),
  projectName: document.getElementById("projectNameInput"),
  download: document.getElementById("downloadBtn"),
  downloadFormat: document.getElementById("downloadFormat"),
  upload: document.getElementById("uploadBtn"),
  uploadFormat: document.getElementById("uploadFormat"),
  importInput: document.getElementById("importInput"),
  sample: document.getElementById("sampleBtn"),
  status: document.getElementById("status"),
  commands: document.getElementById("commandList"),
  authState: document.getElementById("cloudAuthState"),
  signOut: document.getElementById("signOutBtn"),
  saveCloud: document.getElementById("saveCloudBtn"),
  shareProject: document.getElementById("shareProjectBtn"),
  cloudProjects: document.getElementById("cloudProjectsSelect"),
  shareLinkOutput: document.getElementById("shareLinkOutput"),
  copyShareLink: document.getElementById("copyShareLinkBtn"),
  sharedProjectNotice: document.getElementById("sharedProjectNotice"),
  profileMenuBtn: document.getElementById("profileMenuBtn"),
  profileAvatarBadge: document.getElementById("profileAvatarBadge"),
  profileNavLabel: document.getElementById("profileNavLabel"),
  profileFlyout: document.getElementById("profileFlyout"),
  profileFlyoutClose: document.getElementById("profileFlyoutClose"),
  profileGuestView: document.getElementById("profileGuestView"),
  profileUserView: document.getElementById("profileUserView"),
  profileAuthStatus: document.getElementById("profileAuthStatus"),
  profileUserAvatar: document.getElementById("profileUserAvatar"),
  profileUserDisplayName: document.getElementById("profileUserDisplayName"),
  profileUserEmail: document.getElementById("profileUserEmail"),
  profileSendResetBtn: document.getElementById("profileSendResetBtn"),
  profileSignOutModalBtn: document.getElementById("profileSignOutModalBtn"),
  profileDeleteAccountBtn: document.getElementById("profileDeleteAccountBtn")
};

let blockCatalog = null;
let reverseCatalog = null;
const editorState = {
  usingMonaco: false,
  instance: null,
  monacoRef: null,
  diagnosticTimer: null,
  codeActionsRegistered: false,
  hoverRegistered: false
};

const toastState = {
  host: null
};

const supabaseState = {
  client: null,
  user: null,
  activeProjectId: null,
  authListener: null
};

const profileMenuState = {
  open: false
};

const shareState = {
  active: false,
  readOnly: false,
  ownerId: "",
  ownerName: ""
};

init();

async function init() {
  ensureToastHost();
  await initEditor();
  setProjectName(DEFAULT_PROJECT_NAME);

  try {
    const response = await fetch("blocks.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load blocks.json (${response.status})`);
    }

    blockCatalog = await response.json();
    reverseCatalog = buildReverseCatalog(blockCatalog);
    if (editorState.usingMonaco && editorState.monacoRef) {
      registerEditorHoverProvider(editorState.monacoRef);
    }
    setEditorValue(getSampleScript(blockCatalog));
    renderCommandList(blockCatalog);
    setStatus("Ready. Import SB3, edit text commands, then export as .sb3 or .t2sh.");
    scheduleDiagnosticsUpdate();
  } catch (error) {
    setStatus(`Startup error: ${error.message}`, true);
  }

  ui.download.addEventListener("click", onExportClick);
  ui.upload.addEventListener("click", onUploadClick);
  ui.importInput.addEventListener("change", onImportFilePicked);
  ui.sample.addEventListener("click", () => {
    if (!blockCatalog) {
      setStatus("Block catalog is not loaded.", true);
      return;
    }
    if (shareState.readOnly) {
      setStatus("This shared project is read-only. Fork it first to edit sample content.", "warning");
      return;
    }

    setEditorValue(getSampleScript(blockCatalog));
    setProjectName(DEFAULT_PROJECT_NAME);
    setStatus("Multi-sprite sample script loaded.");
    scheduleDiagnosticsUpdate();
  });

  initProfileAuthUi();
  initSupabaseWorkspace().catch((error) => {
    setStatus(`Cloud setup error: ${error.message}`, "warning");
  });
}

async function onExportClick() {
  const format = ui.downloadFormat?.value || "sb3";
  if (format === "t2sh") {
    await exportT2shFile();
    return;
  }
  await exportSb3File();
}

async function exportSb3File() {
  if (!blockCatalog) {
    setStatus("Block catalog is not loaded.", true);
    return;
  }

  const blocking = getBlockingDiagnostics();
  if (blocking.length > 0) {
    const first = blocking[0];
    const lineInfo = Number.isFinite(first?.startLineNumber) ? `Line ${first.startLineNumber}: ` : "";
    setStatus(`Conversion blocked due to syntax problems. ${lineInfo}${first.message}`, "error");
    return;
  }

  try {
    const parsed = parseScript(getEditorValue(), blockCatalog);
    const build = await buildProject(parsed);
    const fileName = `${getProjectFileBaseName()}.sb3`;
    await downloadSb3(build.project, fileName, build.assets);

    const lines = [
      `Created ${fileName}.`,
      `Generated ${parsed.commandCount} primary block(s).`,
      `Generated ${parsed.totalBlockCount} total block node(s).`,
      `Generated ${parsed.stageScriptCount} stage script(s).`,
      `Generated ${parsed.sprites.length} sprite target(s).`
    ];

    const allWarnings = [...parsed.warnings, ...build.assetWarnings];
    if (allWarnings.length > 0) {
      lines.push(`${allWarnings.length} warning(s):`);
      lines.push(...allWarnings.slice(0, 10));
      if (allWarnings.length > 10) {
        lines.push(`...and ${allWarnings.length - 10} more.`);
      }
      setStatus(lines.join("\n"), true);
      return;
    }

    setStatus(lines.join("\n"));
  } catch (error) {
    setStatus(`Conversion error: ${error.message}`, true);
  }
}

function getSampleScript(catalog) {
  if (Array.isArray(catalog?.sampleScript) && catalog.sampleScript.length > 0) {
    return catalog.sampleScript.join("\n");
  }
  return DEFAULT_MULTI_SPRITE_SAMPLE.join("\n");
}

function setProjectName(name) {
  if (!ui.projectName) {
    return;
  }
  ui.projectName.value = sanitizeName(name, DEFAULT_PROJECT_NAME).slice(0, 80);
}

function getProjectName() {
  const raw = ui.projectName?.value || DEFAULT_PROJECT_NAME;
  const cleaned = raw.trim();
  return cleaned.length > 0 ? cleaned : DEFAULT_PROJECT_NAME;
}

function getProjectFileBaseName() {
  return getProjectName()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "project";
}

async function exportT2shFile() {
  try {
    const fileName = `${getProjectFileBaseName()}.t2sh`;
    const payload = {
      type: "text2scratch-session",
      version: 1,
      projectName: getProjectName(),
      script: getEditorValue(),
      savedAt: new Date().toISOString()
    };

    const blob = await createT2shBlob(payload);
    downloadBlob(blob, fileName);
    setStatus(`Saved ${fileName}. Use Import + .t2sh to restore this session quickly.`, "success");
  } catch (error) {
    setStatus(`Export error: ${error.message}`, "error");
  }
}

async function createT2shBlob(payload) {
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip is not available.");
  }

  const zip = new JSZip();
  zip.file("session.json", JSON.stringify(payload));
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function onUploadClick() {
  if (!ui.importInput) {
    return;
  }
  if (shareState.readOnly) {
    setStatus("This shared project is read-only. Fork it first before importing over it.", "warning");
    return;
  }

  const format = ui.uploadFormat?.value || "auto";
  if (format === "sb3") {
    ui.importInput.accept = ".sb3";
  } else if (format === "t2sh") {
    ui.importInput.accept = ".t2sh";
  } else {
    ui.importInput.accept = ".sb3,.t2sh";
  }

  ui.importInput.click();
}

async function onImportFilePicked(event) {
  const file = event.target?.files?.[0];
  if (!file) {
    return;
  }

  try {
    if (!blockCatalog) {
      throw new Error("Block catalog is not loaded yet.");
    }

    const chosenFormat = ui.uploadFormat?.value || "auto";
    const extension = file.name.toLowerCase().split(".").pop();
    const effectiveFormat = chosenFormat === "auto"
      ? (extension === "t2sh" ? "t2sh" : "sb3")
      : chosenFormat;

    if (effectiveFormat === "t2sh") {
      await importT2shFile(file);
    } else {
      await importSb3File(file);
    }
  } catch (error) {
    setStatus(`Import error: ${error.message}`, true);
  } finally {
    if (ui.importInput) {
      ui.importInput.value = "";
    }
  }
}

async function importT2shFile(file) {
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip is not available.");
  }

  const zip = await JSZip.loadAsync(file);
  const sessionFile = zip.file("session.json");
  if (!sessionFile) {
    throw new Error("Invalid .t2sh file: missing session.json.");
  }

  const sessionText = await sessionFile.async("string");
  const payload = JSON.parse(sessionText);
  if (payload.type !== "text2scratch-session" || typeof payload.script !== "string") {
    throw new Error("Invalid .t2sh session payload.");
  }

  setEditorValue(payload.script);
  setProjectName(payload.projectName || stripFileExtension(file.name));
  setStatus(`Imported ${file.name}.`);
}

async function importSb3File(file) {
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip is not available.");
  }

  const zip = await JSZip.loadAsync(file);
  const projectFile = zip.file("project.json");
  if (!projectFile) {
    throw new Error("Invalid .sb3 file: project.json not found.");
  }

  const projectText = await projectFile.async("string");
  const projectData = JSON.parse(projectText);
  const spriteSvgSources = await extractSpriteSvgSourcesFromSb3(projectData, zip);
  const importedScript = convertSb3ProjectToText(projectData, reverseCatalog, {
    spriteSvgSources
  });
  setEditorValue(importedScript);
  setProjectName(stripFileExtension(file.name));
  setStatus(`Imported ${file.name} and converted it to text2scratch code.`);
}

async function extractSpriteSvgSourcesFromSb3(projectData, zip) {
  const targets = Array.isArray(projectData?.targets)
    ? projectData.targets.filter((target) => !target?.isStage)
    : [];

  const spriteSvgSources = [];

  for (const target of targets) {
    const svgSource = await readFirstSvgCostumeSource(zip, target);
    spriteSvgSources.push(svgSource);
  }

  return spriteSvgSources;
}

async function readFirstSvgCostumeSource(zip, target) {
  const costumes = Array.isArray(target?.costumes) ? target.costumes : [];
  const svgCostume = costumes.find((costume) => {
    if (!costume) {
      return false;
    }

    const format = String(costume.dataFormat || "").toLowerCase();
    if (format && format !== "svg") {
      return false;
    }

    const md5ext = String(costume.md5ext || "").toLowerCase();
    return md5ext.endsWith(".svg");
  });

  if (!svgCostume) {
    return "";
  }

  const md5ext = String(svgCostume.md5ext || "");
  const fallbackName = svgCostume.assetId ? `${svgCostume.assetId}.svg` : "";
  const svgFile = zip.file(md5ext) || (fallbackName ? zip.file(fallbackName) : null);
  if (!svgFile) {
    return "";
  }

  const svgText = await svgFile.async("string");
  if (!svgText || !svgText.includes("<svg")) {
    return "";
  }

  return toSvgDataUri(svgText);
}

function toSvgDataUri(svgText) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
}

function stripFileExtension(fileName) {
  return String(fileName || DEFAULT_PROJECT_NAME).replace(/\.[^.]+$/, "");
}

function buildReverseCatalog(catalog) {
  const opcodeMap = new Map();
  const byName = new Map();

  Object.entries(catalog?.commands || {}).forEach(([name, definition]) => {
    if (!definition || definition.hidden) {
      return;
    }

    byName.set(name, definition);
    if (!definition.opcode) {
      return;
    }

    if (!opcodeMap.has(definition.opcode)) {
      opcodeMap.set(definition.opcode, []);
    }

    opcodeMap.get(definition.opcode).push({
      name,
      definition
    });
  });

  return {
    byName,
    opcodeMap
  };
}

function convertSb3ProjectToText(projectData, reverse, options = {}) {
  if (!projectData || !Array.isArray(projectData.targets)) {
    throw new Error("Invalid project.json format.");
  }

  const stageTarget = projectData.targets.find((target) => target.isStage) || null;
  const spriteTargets = projectData.targets.filter((target) => !target.isStage);
  const spriteSvgSources = Array.isArray(options.spriteSvgSources) ? options.spriteSvgSources : [];

  const lines = [
    "# Imported from .sb3",
    "# Review and adjust values before exporting."
  ];

  if (stageTarget) {
    const stageLines = convertTargetToScriptLines(stageTarget, reverse, { targetType: "stage" });
    if (stageLines.length > 0) {
      lines.push("");
      lines.push("stage_code =");
      stageLines.forEach((line) => {
        lines.push(`${INDENT_UNIT}${line}`);
      });
      lines.push("end");
    }
  }

  spriteTargets.forEach((sprite, index) => {
    const spriteLines = convertTargetToScriptLines(sprite, reverse, { targetType: "sprite" });
    const spriteSvgSource = typeof spriteSvgSources[index] === "string" ? spriteSvgSources[index] : "";

    lines.push("");
    lines.push(`sprite = ${formatToken(sprite.name || "Sprite")}`);
    if (spriteSvgSource.length > 0) {
      lines.push(`svg = ${formatToken(spriteSvgSource)}`);
    }
    lines.push(`${formatSpriteCodeHeader(sprite.name || "Sprite")} =`);
    if (spriteLines.length > 0) {
      spriteLines.forEach((line) => {
        lines.push(`${INDENT_UNIT}${line}`);
      });
    } else {
      lines.push(`${INDENT_UNIT}# no scripts imported for this sprite`);
    }
    lines.push("end");
  });

  return trimTrailingEmptyLines(lines).join("\n");
}

function convertTargetToScriptLines(target, reverse, options = {}) {
  const targetType = options.targetType || "sprite";
  const blocks = target?.blocks || {};
  const lines = [];
  const visited = new Set();
  const context = {
    reverse,
    blocks
  };

  if (targetType === "stage") {
    appendVariableDeclarations(lines, target?.variables, "stage");
    appendListDeclarations(lines, target?.lists, "stage");
    appendBroadcastDeclarations(lines, target?.broadcasts);
  } else {
    appendVariableDeclarations(lines, target?.variables, "sprite");
    appendListDeclarations(lines, target?.lists, "sprite");
  }

  const topLevelIds = getTopLevelScriptIds(blocks);
  topLevelIds.forEach((topId) => {
    const scriptLines = convertStackToText(topId, context, 0, visited);
    if (scriptLines.length > 0) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      lines.push(...scriptLines);
    }
  });

  return trimTrailingEmptyLines(lines);
}

function appendVariableDeclarations(lines, variableMap, targetType) {
  const items = Object.values(variableMap || {})
    .filter((entry) => Array.isArray(entry) && entry.length >= 2)
    .map((entry) => ({ name: String(entry[0] || ""), value: entry[1] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  items.forEach((item) => {
    const safeName = sanitizeName(item.name, targetType === "stage" ? "stage_var" : "sprite_var");
    const initialValue = formatVariableInitialValue(item.value);
    lines.push(`make_var ${formatToken(safeName)} ${initialValue}`);
  });
}

function appendListDeclarations(lines, listMap) {
  const items = Object.values(listMap || {})
    .filter((entry) => Array.isArray(entry) && entry.length >= 1)
    .map((entry) => sanitizeName(entry[0], "list"))
    .sort((a, b) => a.localeCompare(b));

  items.forEach((name) => {
    lines.push(`make_list ${formatToken(name)}`);
  });
}

function appendBroadcastDeclarations(lines, broadcastMap) {
  const items = Object.values(broadcastMap || {})
    .map((value) => sanitizeName(value, "message1"))
    .sort((a, b) => a.localeCompare(b));

  items.forEach((name) => {
    lines.push(`make_broadcast ${formatToken(name)}`);
  });
}

function getTopLevelScriptIds(blocks) {
  return Object.entries(blocks || {})
    .filter(([, block]) => {
      if (!block || block.shadow || !block.topLevel) {
        return false;
      }
      if (block.parent) {
        return false;
      }
      return block.opcode !== "procedures_prototype";
    })
    .sort((a, b) => {
      const yA = Number.isFinite(a[1]?.y) ? a[1].y : 0;
      const yB = Number.isFinite(b[1]?.y) ? b[1].y : 0;
      if (yA !== yB) {
        return yA - yB;
      }
      const xA = Number.isFinite(a[1]?.x) ? a[1].x : 0;
      const xB = Number.isFinite(b[1]?.x) ? b[1].x : 0;
      return xA - xB;
    })
    .map(([id]) => id);
}

function convertStackToText(startBlockId, context, indentLevel, visited) {
  const lines = [];
  let current = startBlockId;

  while (current && context.blocks[current] && !visited.has(current)) {
    visited.add(current);
    const converted = convertSingleBlockToText(current, context, indentLevel, visited);
    lines.push(...converted.lines);
    current = converted.next;
  }

  return lines;
}

function convertSingleBlockToText(blockId, context, indentLevel, visited) {
  const block = context.blocks[blockId];
  if (!block) {
    return { lines: [], next: null };
  }

  const prefix = INDENT_UNIT.repeat(indentLevel);

  if (block.opcode === "control_repeat") {
    const times = formatBlockInputValue(block, "TIMES", { type: "number", default: "10" }, context, "stack");
    const subId = getInputBlockId(block.inputs?.SUBSTACK);
    const lines = [`${prefix}repeat ${times}`];
    lines.push(...convertStackToText(subId, context, indentLevel + 1, visited));
    lines.push(`${prefix}end`);
    return { lines, next: block.next || null };
  }

  if (block.opcode === "control_forever") {
    const subId = getInputBlockId(block.inputs?.SUBSTACK);
    const lines = [`${prefix}forever`];
    lines.push(...convertStackToText(subId, context, indentLevel + 1, visited));
    lines.push(`${prefix}end`);
    return { lines, next: block.next || null };
  }

  if (block.opcode === "control_repeat_until") {
    const condition = formatBlockInputValue(block, "CONDITION", { type: "boolean", default: "false" }, context, "stack");
    const subId = getInputBlockId(block.inputs?.SUBSTACK);
    const lines = [`${prefix}repeat_until ${condition}`];
    lines.push(...convertStackToText(subId, context, indentLevel + 1, visited));
    lines.push(`${prefix}end`);
    return { lines, next: block.next || null };
  }

  if (block.opcode === "control_if" || block.opcode === "control_if_else") {
    const condition = formatBlockInputValue(block, "CONDITION", { type: "boolean", default: "false" }, context, "stack");
    const subOne = getInputBlockId(block.inputs?.SUBSTACK);
    const subTwo = getInputBlockId(block.inputs?.SUBSTACK2);
    const lines = [`${prefix}if ${condition}`];
    lines.push(...convertStackToText(subOne, context, indentLevel + 1, visited));
    if (block.opcode === "control_if_else") {
      lines.push(`${prefix}else`);
      lines.push(...convertStackToText(subTwo, context, indentLevel + 1, visited));
    }
    lines.push(`${prefix}end`);
    return { lines, next: block.next || null };
  }

  if (block.opcode === "procedures_definition") {
    const procCode = getProcedureNameFromDefinition(block, context.blocks);
    const lines = [`${prefix}define ${procCode}`];
    return { lines, next: block.next || null };
  }

  if (block.opcode === "procedures_call") {
    const procCode = getProcedureNameFromCall(block);
    const lines = [`${prefix}call ${procCode}`];
    return { lines, next: block.next || null };
  }

  const command = pickCommandByOpcode(context.reverse, block.opcode, "stack");
  if (!command) {
    return {
      lines: [`${prefix}# unsupported opcode: ${block.opcode}`],
      next: block.next || null
    };
  }

  const args = buildCommandArgsFromBlock(command.definition, block, context, "stack");
  const line = args.length > 0 ? `${command.name} ${args.join(" ")}` : command.name;
  return {
    lines: [`${prefix}${line}`],
    next: block.next || null
  };
}

function getProcedureNameFromDefinition(definitionBlock, blocks) {
  const prototypeId = getInputBlockId(definitionBlock.inputs?.custom_block);
  const prototype = prototypeId ? blocks[prototypeId] : null;
  const proccode = prototype?.mutation?.proccode || "my_block";
  return proccode;
}

function getProcedureNameFromCall(callBlock) {
  const proccode = callBlock?.mutation?.proccode || "my_block";
  return String(proccode || "my_block").trim() || "my_block";
}

function pickCommandByOpcode(reverse, opcode, preferredKind) {
  const entries = reverse?.opcodeMap?.get(opcode) || [];
  if (entries.length === 0) {
    return null;
  }

  if (preferredKind) {
    const byKind = entries.find((entry) => (entry.definition.kind || "stack") === preferredKind);
    if (byKind) {
      return byKind;
    }
  }

  return entries[0];
}

function buildCommandArgsFromBlock(definition, block, context, mode) {
  const positional = [];
  let highest = -1;

  (definition.fields || []).forEach((spec) => {
    if (!Number.isInteger(spec.from)) {
      return;
    }

    const value = formatFieldValue(block, spec);
    positional[spec.from] = value;
    highest = Math.max(highest, spec.from);
  });

  (definition.inputs || []).forEach((spec) => {
    if (spec.from === "rest") {
      const start = Number.isInteger(spec.start) ? spec.start : 0;
      const value = formatBlockInputValue(block, spec.name, spec, context, mode);
      positional[start] = value;
      highest = Math.max(highest, start);
      return;
    }

    if (!Number.isInteger(spec.from)) {
      return;
    }

    const value = formatBlockInputValue(block, spec.name, spec, context, mode);
    positional[spec.from] = value;
    highest = Math.max(highest, spec.from);
  });

  if (highest < 0) {
    return [];
  }

  const args = [];
  for (let i = 0; i <= highest; i += 1) {
    if (typeof positional[i] === "string" && positional[i].length > 0) {
      args.push(positional[i]);
    }
  }
  return args;
}

function formatFieldValue(block, spec) {
  const fieldEntry = block.fields?.[spec.name];
  const value = fieldEntry ? String(fieldEntry[0] ?? "") : String(spec.default ?? "");
  return formatToken(value);
}

function formatBlockInputValue(block, inputName, spec, context, mode) {
  const input = block.inputs?.[inputName];
  const defaultValue = spec.default !== undefined ? String(spec.default) : "";

  if (spec.type === "menu") {
    const menuValue = resolveMenuInputValue(input, defaultValue, context);
    return formatToken(menuValue);
  }

  if (spec.type === "boolean") {
    const expression = resolveReporterInputValue(input, context, "boolean");
    return expression || defaultValue || "false";
  }

  const reporterExpression = resolveReporterInputValue(input, context, "reporter");
  if (reporterExpression) {
    return mode === "expression" ? reporterExpression : `@${reporterExpression}`;
  }

  const primitive = decodeInputPrimitive(input);
  const value = primitive.length > 0 ? primitive : defaultValue;
  if (spec.type === "number" || spec.type === "integer" || spec.type === "angle") {
    return formatNumericToken(value, defaultValue || "0");
  }
  if (spec.type === "color") {
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : (defaultValue || "#ff0000");
  }
  return formatToken(value);
}

function resolveMenuInputValue(input, fallback, context) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  if (input[0] === 3) {
    const reporterExpression = resolveReporterInputValue(input, context, "reporter");
    if (reporterExpression) {
      return `@${reporterExpression}`;
    }
  }

  const menuBlockId = getMenuShadowBlockId(input);
  const menuBlock = menuBlockId ? context.blocks[menuBlockId] : null;
  if (menuBlock?.fields) {
    const firstField = Object.values(menuBlock.fields)[0];
    if (Array.isArray(firstField) && String(firstField[0] || "").length > 0) {
      return String(firstField[0]);
    }
  }

  const primitive = decodeInputPrimitive(input);
  if (primitive.length > 0) {
    return primitive;
  }

  return fallback;
}

function resolveReporterInputValue(input, context, expectedType) {
  const blockId = getInputBlockId(input);
  if (!blockId || !context.blocks[blockId]) {
    return "";
  }
  return convertReporterBlockToText(blockId, context, expectedType);
}

function convertReporterBlockToText(blockId, context, expectedType) {
  const block = context.blocks[blockId];
  if (!block) {
    return "";
  }

  if (block.opcode === "operator_gt" || block.opcode === "operator_lt" || block.opcode === "operator_equals") {
    const operator = block.opcode === "operator_gt" ? ">" : block.opcode === "operator_lt" ? "<" : "=";
    const left = resolveOperandText(block.inputs?.OPERAND1, context);
    const right = resolveOperandText(block.inputs?.OPERAND2, context);
    return `${left} ${operator} ${right}`.trim();
  }

  if (block.opcode === "operator_and" || block.opcode === "operator_or") {
    const operator = block.opcode === "operator_and" ? "and" : "or";
    const left = resolveOperandText(block.inputs?.OPERAND1, context);
    const right = resolveOperandText(block.inputs?.OPERAND2, context);
    return `${operator}(${left}, ${right})`;
  }

  if (block.opcode === "operator_not") {
    const operand = resolveOperandText(block.inputs?.OPERAND, context);
    return `not(${operand})`;
  }

  if (block.opcode === "argument_reporter_string_number") {
    const argumentName = formatToken(getProcedureArgumentName(block));
    return `arg(${argumentName})`;
  }

  if (block.opcode === "argument_reporter_boolean") {
    const argumentName = formatToken(getProcedureArgumentName(block));
    return `arg_bool(${argumentName})`;
  }

  const command = pickReporterCommandByOpcode(context.reverse, block.opcode);
  if (!command) {
    return `unknown(${formatToken(block.opcode)})`;
  }

  const args = buildCommandArgsFromBlock(command.definition, block, context, "expression")
    .map((item) => item.startsWith("@") ? item.slice(1) : item);
  return `${command.name}(${args.join(", ")})`;
}

function getProcedureArgumentName(block) {
  const valueField = block?.fields?.VALUE;
  if (Array.isArray(valueField) && String(valueField[0] ?? "").trim().length > 0) {
    return String(valueField[0]).trim();
  }
  return "input";
}

function pickReporterCommandByOpcode(reverse, opcode) {
  const entries = reverse?.opcodeMap?.get(opcode) || [];
  const reporter = entries.find((entry) => {
    const kind = entry.definition.kind || "stack";
    return kind === "reporter" || kind === "boolean";
  });
  return reporter || entries[0] || null;
}

function resolveOperandText(input, context) {
  const reporterExpression = resolveReporterInputValue(input, context, "reporter");
  if (reporterExpression) {
    return reporterExpression;
  }
  const primitive = decodeInputPrimitive(input);
  if (primitive.length > 0) {
    return primitive;
  }
  return "0";
}

function getInputBlockId(input) {
  if (!Array.isArray(input)) {
    return "";
  }

  if (typeof input[1] === "string") {
    return input[1];
  }
  if (typeof input[2] === "string") {
    return input[2];
  }
  return "";
}

function getMenuShadowBlockId(input) {
  if (!Array.isArray(input)) {
    return "";
  }
  if (typeof input[2] === "string") {
    return input[2];
  }
  if (typeof input[1] === "string") {
    return input[1];
  }
  return "";
}

function decodeInputPrimitive(input) {
  if (!Array.isArray(input)) {
    return "";
  }

  const candidate = Array.isArray(input[1]) ? input[1] : Array.isArray(input[2]) ? input[2] : null;
  if (!candidate || candidate.length < 2) {
    return "";
  }

  const typeCode = candidate[0];
  const value = candidate[1];

  if (typeCode === 10 || typeCode === 4 || typeCode === 7 || typeCode === 8 || typeCode === 9) {
    return String(value ?? "");
  }
  if (typeCode === 12 || typeCode === 13 || typeCode === 11) {
    return String(value ?? "");
  }
  return String(value ?? "");
}

function formatVariableInitialValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && String(value).trim() !== "") {
    return String(asNumber);
  }
  return formatToken(String(value ?? ""));
}

function formatNumericToken(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return String(parsed);
  }
  const fallbackParsed = Number(fallback);
  if (Number.isFinite(fallbackParsed)) {
    return String(fallbackParsed);
  }
  return "0";
}

function formatToken(value) {
  const text = String(value ?? "");
  if (text.length === 0) {
    return "\"\"";
  }
  if (/^[a-zA-Z0-9_.:+\-#]+$/.test(text)) {
    return text;
  }
  const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  return `"${escaped}"`;
}

function formatSpriteCodeHeader(name) {
  const safeName = sanitizeName(name, "Sprite");
  if (/^[a-zA-Z0-9_-]+$/.test(safeName)) {
    return `${safeName}_code`;
  }
  const escaped = safeName.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  return `"${escaped}"_code`;
}

function trimTrailingEmptyLines(lines) {
  const copy = [...lines];
  while (copy.length > 0 && copy[copy.length - 1] === "") {
    copy.pop();
  }
  return copy;
}

function parseScript(text, catalog) {
  const program = parseProgram(text);

  const parsedSprites = [];
  const warnings = [];
  const usedExtensions = new Set();
  const broadcasts = {};
  let commandCount = 0;
  let totalBlockCount = 0;

  const parsedStage = parseSpriteCommands(program.stage.lines, catalog, {
    targetType: "stage",
    targetName: "Stage"
  });

  parsedStage.warnings.forEach((warning) => {
    warnings.push(`[Stage] ${warning}`);
  });

  parsedStage.usedExtensions.forEach((extension) => usedExtensions.add(extension));
  Object.entries(parsedStage.broadcasts).forEach(([id, name]) => {
    broadcasts[id] = name;
  });

  commandCount += parsedStage.commandCount;
  totalBlockCount += parsedStage.totalBlockCount;

  program.sprites.forEach((spriteDef) => {
    const parsedSprite = parseSpriteCommands(spriteDef.lines, catalog, {
      targetType: "sprite",
      targetName: spriteDef.name
    });

    parsedSprite.warnings.forEach((warning) => {
      warnings.push(`[${spriteDef.name}] ${warning}`);
    });

    parsedSprite.usedExtensions.forEach((extension) => usedExtensions.add(extension));
    Object.entries(parsedSprite.broadcasts).forEach(([id, name]) => {
      broadcasts[id] = name;
    });

    commandCount += parsedSprite.commandCount;
    totalBlockCount += parsedSprite.totalBlockCount;

    parsedSprites.push({
      name: spriteDef.name,
      svgSource: spriteDef.svgSource,
      blocks: parsedSprite.blocks,
      spriteVariables: parsedSprite.spriteVariables,
      spriteLists: parsedSprite.spriteLists
    });
  });

  return {
    sprites: parsedSprites,
    stageBlocks: parsedStage.blocks,
    warnings,
    commandCount,
    totalBlockCount,
    usedExtensions: [...usedExtensions].sort(),
    stageVariables: parsedStage.stageVariables,
    stageLists: parsedStage.stageLists,
    broadcasts,
    stageScriptCount: Object.values(parsedStage.blocks).filter((block) => block.topLevel).length
  };
}

function parseProgram(text) {
  const lines = text.split(/\r?\n/);
  const spritesByKey = new Map();
  const spriteOrder = [];
  const stage = {
    lines: []
  };

  function ensureSprite(name, explicit = false) {
    const finalName = sanitizeName(name, "Sprite1");
    const key = finalName.toLowerCase();
    if (!spritesByKey.has(key)) {
      const entry = {
        name: finalName,
        svgSource: "",
        lines: [],
        explicit
      };
      spritesByKey.set(key, entry);
      spriteOrder.push(entry);
      return entry;
    }

    const existing = spritesByKey.get(key);
    if (explicit) {
      existing.explicit = true;
      existing.name = finalName;
    }
    return existing;
  }

  let activeSprite = ensureSprite("Sprite1");
  let openCodeBlock = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();
    const indent = countIndent(rawLine);

    if (!openCodeBlock) {
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      if (parseStageCodeHeader(trimmed)) {
        openCodeBlock = {
          targetType: "stage",
          indent,
          label: "stage_code",
          startLineNumber: lineNumber
        };
        return;
      }

      const spriteMatch = trimmed.match(/^sprite\s*=\s*(.+)$/i);
      if (spriteMatch) {
        const spriteName = parseAssignmentValue(spriteMatch[1], "Sprite1");
        activeSprite = ensureSprite(spriteName, true);
        return;
      }

      const svgMatch = trimmed.match(/^svg\s*=\s*(.+)$/i);
      if (svgMatch) {
        activeSprite.svgSource = parseAssignmentValue(svgMatch[1], "");
        activeSprite.explicit = true;
        return;
      }

      const codeSpriteName = parseSpriteCodeHeader(trimmed);
      if (codeSpriteName) {
        const sprite = ensureSprite(codeSpriteName, true);
        openCodeBlock = {
          targetType: "sprite",
          sprite,
          indent,
          label: `${sprite.name}_code`,
          startLineNumber: lineNumber
        };
        return;
      }

      activeSprite.lines.push({ rawLine, lineNumber });
      return;
    }

    if (trimmed === "end" && indent <= openCodeBlock.indent) {
      openCodeBlock = null;
      return;
    }

    if (trimmed && !trimmed.startsWith("#") && indent <= openCodeBlock.indent) {
      throw new Error(`Line ${lineNumber}: code inside ${openCodeBlock.label} must be indented and closed by an outer "end".`);
    }

    if (openCodeBlock.targetType === "stage") {
      stage.lines.push({ rawLine, lineNumber });
      return;
    }

    openCodeBlock.sprite.lines.push({ rawLine, lineNumber });
  });

  if (openCodeBlock) {
    throw new Error(`Line ${openCodeBlock.startLineNumber}: missing closing "end" for ${openCodeBlock.label} block.`);
  }

  const defaultSprite = spriteOrder[0];
  const shouldDropDefault =
    defaultSprite &&
    defaultSprite.name === "Sprite1" &&
    !defaultSprite.explicit &&
    defaultSprite.lines.length === 0 &&
    !defaultSprite.svgSource &&
    (spriteOrder.length > 1 || stage.lines.length > 0);

  if (shouldDropDefault) {
    spriteOrder.shift();
  }

  return {
    stage,
    sprites: spriteOrder
  };
}

function parseSpriteCodeHeader(line) {
  const match = line.match(/^(?:"([^"]+)"|'([^']+)'|([a-zA-Z0-9_-]+))_code\s*=\s*$/i);
  if (!match) {
    return "";
  }
  return sanitizeName(match[1] || match[2] || match[3], "Sprite1");
}

function parseStageCodeHeader(line) {
  return /^stage_code\s*=\s*$/i.test(line);
}

function parseAssignmentValue(raw, fallback) {
  const value = stripQuotes(raw || "").trim();
  return value.length > 0 ? value : fallback;
}

function countIndent(value) {
  let count = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === " ") {
      count += 1;
      continue;
    }
    if (char === "\t") {
      count += INDENT_UNIT.length;
      continue;
    }
    break;
  }
  return count;
}
function parseSpriteCommands(lines, catalog, options = {}) {
  const ctx = {
    catalog,
    targetType: options.targetType || "sprite",
    targetName: options.targetName || "Sprite",
    blocks: {},
    warnings: [],
    commandCount: 0,
    totalBlockCount: 0,
    idCounter: 0,
    topLevelY: 64,
    activeScript: null,
    cStack: [],
    usedExtensions: new Set(),
    data: {
      stageVariables: {},
      spriteVariables: {},
      stageLists: {},
      spriteLists: {},
      broadcasts: {}
    },
    registries: {
      variables: new Map(),
      lists: new Map(),
      broadcasts: new Map(),
      procedures: new Map()
    }
  };

  lines.forEach(({ rawLine, lineNumber }) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      return;
    }

    const tokens = tokenizeLine(line);
    if (tokens.length === 0) {
      return;
    }

    const rawCommand = normalizeCommand(tokens[0]);
    const commandName = resolveCommand(rawCommand, catalog);
    const definition = catalog.commands[commandName];
    if (!definition) {
      throw new Error(`Line ${lineNumber}: unknown command "${tokens[0]}".`);
    }

    const args = tokens.slice(1);
    processLineCommand(ctx, commandName, definition, args, lineNumber);
  });

  if (ctx.cStack.length > 0) {
    const open = ctx.cStack[ctx.cStack.length - 1];
    throw new Error(`Missing "end" for block opened on line ${open.lineNumber}.`);
  }

  return {
    blocks: ctx.blocks,
    warnings: ctx.warnings,
    commandCount: ctx.commandCount,
    totalBlockCount: ctx.totalBlockCount,
    usedExtensions: [...ctx.usedExtensions].sort(),
    stageVariables: ctx.data.stageVariables,
    spriteVariables: ctx.data.spriteVariables,
    stageLists: ctx.data.stageLists,
    spriteLists: ctx.data.spriteLists,
    broadcasts: ctx.data.broadcasts
  };
}

function processLineCommand(ctx, commandName, definition, args, lineNumber) {
  const kind = definition.kind || "stack";

  if (kind === "end") {
    if (ctx.cStack.length === 0) {
      throw new Error(`Line ${lineNumber}: "end" has no matching block.`);
    }
    ctx.cStack.pop();
    return;
  }

  if (kind === "else") {
    if (ctx.cStack.length === 0) {
      throw new Error(`Line ${lineNumber}: "else" has no matching "if" block.`);
    }

    const top = ctx.cStack[ctx.cStack.length - 1];
    if (top.stacks.length < 2) {
      const parent = ctx.blocks[top.blockId];
      if (!parent || parent.opcode !== "control_if") {
        throw new Error(`Line ${lineNumber}: "else" can only be used inside "if" or "if_else".`);
      }

      parent.opcode = "control_if_else";
      top.stacks = ["SUBSTACK", "SUBSTACK2"];
    }

    if (top.activeStackIndex === 1) {
      throw new Error(`Line ${lineNumber}: "else" can only appear once in an "if" block.`);
    }

    top.activeStackIndex = 1;
    return;
  }

  if (kind === "meta") {
    runMetaCommand(ctx, commandName, args, lineNumber);
    return;
  }

  if (!isCommandAvailableForTarget(commandName, definition, ctx.targetType)) {
    const targetLabel = ctx.targetType === "stage" ? "Stage" : "sprite";
    const guidance = ctx.targetType === "stage"
      ? "Move this line into a sprite_code section."
      : "Move this line into a stage_code section.";
    throw new Error(`Line ${lineNumber}: "${commandName}" is not available on ${targetLabel}. ${guidance}`);
  }

  if (kind === "reporter" || kind === "boolean") {
    throw new Error(
      `Line ${lineNumber}: "${commandName}" is a reporter/boolean expression. Use it inside another command input, for example var(score) or @var(score).`
    );
  }

  if (kind === "define") {
    if (ctx.cStack.length > 0) {
      throw new Error(`Line ${lineNumber}: close nested blocks before starting "define".`);
    }

    createProcedureDefinition(ctx, args, lineNumber);
    return;
  }

  if (kind === "hat") {
    if (ctx.cStack.length > 0) {
      throw new Error(`Line ${lineNumber}: close nested blocks before starting a new script.`);
    }
  }

  if (kind !== "hat") {
    ensureScriptContext(ctx);
  }

  const blockId = createBlock(ctx, definition.opcode, {
    topLevel: kind === "hat",
    shadow: false,
    lineNumber
  });

  applyFields(ctx, blockId, definition.fields || [], args, lineNumber, commandName);
  applyInputs(ctx, blockId, definition.inputs || [], args, lineNumber, commandName);

  if (definition.extension) {
    ctx.usedExtensions.add(definition.extension);
  }

  if (kind === "hat") {
    setActiveScript(ctx, blockId);
  } else {
    attachToFlow(ctx, blockId);
  }

  if (kind === "c") {
    ctx.cStack.push({
      blockId,
      stacks: Array.isArray(definition.stacks) ? definition.stacks : ["SUBSTACK"],
      activeStackIndex: 0,
      lineNumber,
      firstByStack: {},
      lastByStack: {}
    });
  }

  if (kind === "call") {
    attachProcedureCallMutation(ctx, blockId, args);
  }

  ctx.commandCount += 1;
}

function isCommandAvailableForTarget(commandName, definition, targetType) {
  if (targetType !== "stage") {
    return true;
  }

  const kind = definition.kind || "stack";
  if (["meta", "end", "else", "define", "call"].includes(kind)) {
    return true;
  }

  const opcode = definition.opcode || "";
  if (!opcode) {
    return true;
  }

  if (STAGE_UNSUPPORTED_OPCODES.has(opcode)) {
    return false;
  }

  if (STAGE_UNSUPPORTED_OPCODE_PREFIXES.some((prefix) => opcode.startsWith(prefix))) {
    return false;
  }

  return true;
}

function runMetaCommand(ctx, commandName, args, lineNumber) {
  if (commandName === "make_var") {
    const variableName = sanitizeName(args[0], "my variable");
    const initialValue = args.length > 1 ? args.slice(1).join(" ") : "0";
    ensureRegistryEntry(ctx, "variables", variableName, initialValue);
    return;
  }

  if (commandName === "make_list") {
    const listName = sanitizeName(args[0], "my list");
    ensureRegistryEntry(ctx, "lists", listName, "");
    return;
  }

  if (commandName === "make_broadcast") {
    const messageName = sanitizeName(args[0], "message1");
    ensureRegistryEntry(ctx, "broadcasts", messageName, "");
    return;
  }

  throw new Error(`Line ${lineNumber}: unsupported meta command "${commandName}".`);
}

function createProcedureDefinition(ctx, args, lineNumber) {
  const procedureName = sanitizeName(args.join(" "), "my_block");
  const entry = ensureProcedure(ctx, procedureName);

  const definitionId = createBlock(ctx, "procedures_definition", {
    topLevel: true,
    shadow: false,
    lineNumber
  });

  const prototypeId = createBlock(ctx, "procedures_prototype", {
    topLevel: false,
    shadow: true,
    parent: definitionId,
    lineNumber
  });

  ctx.blocks[definitionId].inputs.custom_block = [1, prototypeId];
  ctx.blocks[prototypeId].mutation = {
    tagName: "mutation",
    children: [],
    proccode: entry.proccode,
    argumentids: "[]",
    argumentnames: "[]",
    argumentdefaults: "[]",
    warp: "false"
  };

  setActiveScript(ctx, definitionId);
  ctx.commandCount += 1;
}

function attachProcedureCallMutation(ctx, blockId, args) {
  const procedureName = sanitizeName(args.join(" "), "my_block");
  const entry = ensureProcedure(ctx, procedureName);

  ctx.blocks[blockId].mutation = {
    tagName: "mutation",
    children: [],
    proccode: entry.proccode,
    argumentids: "[]",
    warp: "false"
  };
}

function ensureProcedure(ctx, name) {
  const key = name.toLowerCase();
  if (ctx.registries.procedures.has(key)) {
    return ctx.registries.procedures.get(key);
  }

  const entry = { proccode: name };
  ctx.registries.procedures.set(key, entry);
  return entry;
}

function ensureScriptContext(ctx) {
  if (ctx.activeScript) {
    return;
  }

  const hatId = createBlock(ctx, "event_whenflagclicked", {
    topLevel: true,
    shadow: false,
    lineNumber: 0
  });

  setActiveScript(ctx, hatId);
}

function setActiveScript(ctx, hatId) {
  ctx.activeScript = { hatId, lastId: hatId };
  ctx.cStack = [];
}

function attachToFlow(ctx, blockId) {
  const parentC = ctx.cStack[ctx.cStack.length - 1];
  if (!parentC) {
    const lastTopId = ctx.activeScript.lastId;
    ctx.blocks[lastTopId].next = blockId;
    ctx.blocks[blockId].parent = lastTopId;
    ctx.activeScript.lastId = blockId;
    return;
  }

  const stackName = parentC.stacks[parentC.activeStackIndex];
  const lastChildId = parentC.lastByStack[stackName];
  if (!lastChildId) {
    ctx.blocks[parentC.blockId].inputs[stackName] = [2, blockId];
    ctx.blocks[blockId].parent = parentC.blockId;
    parentC.firstByStack[stackName] = blockId;
    parentC.lastByStack[stackName] = blockId;
    return;
  }

  ctx.blocks[lastChildId].next = blockId;
  ctx.blocks[blockId].parent = lastChildId;
  parentC.lastByStack[stackName] = blockId;
}

function applyInputs(ctx, blockId, specs, args, lineNumber, commandName) {
  specs.forEach((spec) => {
    let rawValue = readArgument(args, spec);
    if ((!rawValue || rawValue.length === 0) && spec.default !== undefined) {
      rawValue = String(spec.default);
      ctx.warnings.push(`Line ${lineNumber}: ${commandName} defaulted input ${spec.name} to "${rawValue}".`);
    }

    if (spec.type === "menu") {
      const isMenuExpression = supportsExpression(spec, rawValue);
      const baseMenuValue = isMenuExpression ? String(spec.default ?? "") : rawValue;
      const menuValue = normalizeMenuValue(spec, baseMenuValue, lineNumber, commandName, ctx.warnings);
      const menuId = createMenuShadow(ctx, blockId, spec, menuValue);

      if (isMenuExpression) {
        const expressionText = stripExpressionPrefix(rawValue);
        const reporterId = parseExpression(ctx, expressionText, lineNumber, blockId, "text");
        ctx.blocks[blockId].inputs[spec.name] = [3, reporterId, menuId];
      } else {
        ctx.blocks[blockId].inputs[spec.name] = [1, menuId];
      }
      return;
    }

    if (spec.type === "boolean") {
      const reporterId = parseBooleanInput(ctx, rawValue, lineNumber, commandName, blockId);
      ctx.blocks[blockId].inputs[spec.name] = [2, reporterId];
      return;
    }

    if (supportsExpression(spec, rawValue)) {
      const expressionText = stripExpressionPrefix(rawValue);
      const reporterId = parseExpression(ctx, expressionText, lineNumber, blockId, spec.type);
      const shadowPrimitive = toScratchPrimitive(spec.type, String(spec.default ?? ""));
      ctx.blocks[blockId].inputs[spec.name] = [3, reporterId, shadowPrimitive];
      return;
    }

    const normalized = normalizePrimitiveValue(spec, rawValue, lineNumber, commandName, ctx.warnings);
    ctx.blocks[blockId].inputs[spec.name] = [1, toScratchPrimitive(spec.type, normalized)];
  });
}

function applyFields(ctx, blockId, specs, args, lineNumber, commandName) {
  specs.forEach((spec) => {
    let rawValue = readArgument(args, spec);
    if ((!rawValue || rawValue.length === 0) && spec.default !== undefined) {
      rawValue = String(spec.default);
      ctx.warnings.push(`Line ${lineNumber}: ${commandName} defaulted field ${spec.name} to "${rawValue}".`);
    }

    let value = rawValue || "";
    if (spec.uppercase) {
      value = value.toUpperCase();
    }

    if (Array.isArray(spec.options) && spec.options.length > 0 && !spec.options.includes(value)) {
      const fallback = spec.default;
      ctx.warnings.push(`Line ${lineNumber}: invalid ${spec.name} "${value}", using "${fallback}".`);
      value = String(fallback ?? "");
    }

    if (spec.registry) {
      const entry = ensureRegistryEntry(ctx, spec.registry, sanitizeName(value, spec.default || "item"), "");
      ctx.blocks[blockId].fields[spec.name] = [entry.name, entry.id];
      return;
    }

    ctx.blocks[blockId].fields[spec.name] = [value, null];
  });
}

function supportsExpression(spec, rawValue) {
  if (!rawValue) {
    return false;
  }
  if (spec.allowExpression === false) {
    return false;
  }

  const value = rawValue.trim();
  if (value.startsWith("@")) {
    return true;
  }

  if (spec.type === "text") {
    return false;
  }

  return looksExpressionCall(value);
}

function stripExpressionPrefix(value) {
  const trimmed = (value || "").trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}
function parseBooleanInput(ctx, rawValue, lineNumber, commandName, parentBlockId) {
  const value = (rawValue || "").trim();

  if (value.startsWith("@")) {
    return parseExpression(ctx, value.slice(1), lineNumber, parentBlockId, "boolean");
  }

  if (looksExpressionCall(value)) {
    return parseExpression(ctx, value, lineNumber, parentBlockId, "boolean");
  }

  const friendly = parseFriendlyBooleanExpression(ctx, value, lineNumber, parentBlockId);
  if (friendly) {
    return friendly;
  }

  const normalized = value.toLowerCase();
  if (normalized === "true" || normalized === "false") {
    return createBooleanLiteralReporter(ctx, normalized === "true", parentBlockId);
  }

  ctx.warnings.push(`Line ${lineNumber}: ${commandName} expected boolean expression for condition; using false.`);
  return createBooleanLiteralReporter(ctx, false, parentBlockId);
}

function parseFriendlyBooleanExpression(ctx, rawValue, lineNumber, parentBlockId) {
  const comparison = splitComparison(rawValue);
  if (!comparison) {
    return null;
  }

  if (comparison.operator === ">" || comparison.operator === "<" || comparison.operator === "=" || comparison.operator === "==") {
    return createComparisonReporter(ctx, comparison.left, comparison.operator, comparison.right, lineNumber, parentBlockId);
  }

  if (comparison.operator === ">=") {
    const inner = createComparisonReporter(ctx, comparison.left, "<", comparison.right, lineNumber, parentBlockId);
    return createNotReporter(ctx, inner, parentBlockId);
  }

  if (comparison.operator === "<=") {
    const inner = createComparisonReporter(ctx, comparison.left, ">", comparison.right, lineNumber, parentBlockId);
    return createNotReporter(ctx, inner, parentBlockId);
  }

  if (comparison.operator === "!=") {
    const inner = createComparisonReporter(ctx, comparison.left, "=", comparison.right, lineNumber, parentBlockId);
    return createNotReporter(ctx, inner, parentBlockId);
  }

  return null;
}

function splitComparison(text) {
  const value = (text || "").trim();
  if (!value) {
    return null;
  }

  const operators = [">=", "<=", "!=", "==", ">", "<", "="];
  let quote = null;
  let depth = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    const prev = i > 0 ? value[i - 1] : "";

    if ((char === '"' || char === "'") && prev !== "\\") {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
      continue;
    }

    if (quote) {
      continue;
    }

    if (char === "(") {
      depth += 1;
      continue;
    }

    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth > 0) {
      continue;
    }

    const operator = operators.find((item) => value.startsWith(item, i));
    if (!operator) {
      continue;
    }

    const left = value.slice(0, i).trim();
    const right = value.slice(i + operator.length).trim();
    if (!left || !right) {
      return null;
    }

    return { left, operator, right };
  }

  return null;
}

function createComparisonReporter(ctx, leftRaw, operator, rightRaw, lineNumber, parentBlockId) {
  const opcode = operator === ">" ? "operator_gt" : operator === "<" ? "operator_lt" : "operator_equals";
  const blockId = createBlock(ctx, opcode, {
    topLevel: false,
    shadow: false,
    parent: parentBlockId,
    lineNumber
  });

  setBinaryOperand(ctx, blockId, "OPERAND1", leftRaw, lineNumber);
  setBinaryOperand(ctx, blockId, "OPERAND2", rightRaw, lineNumber);
  return blockId;
}

function createNotReporter(ctx, operandBlockId, parentBlockId) {
  const blockId = createBlock(ctx, "operator_not", {
    topLevel: false,
    shadow: false,
    parent: parentBlockId,
    lineNumber: 0
  });

  ctx.blocks[blockId].inputs.OPERAND = [2, operandBlockId];
  ctx.blocks[operandBlockId].parent = blockId;
  return blockId;
}

function setBinaryOperand(ctx, blockId, inputName, rawValue, lineNumber) {
  const value = (rawValue || "").trim();
  if (!value) {
    ctx.blocks[blockId].inputs[inputName] = [1, [10, ""]];
    return;
  }

  if (value.startsWith("@")) {
    const reporterId = parseExpression(ctx, value.slice(1), lineNumber, blockId, "text");
    ctx.blocks[blockId].inputs[inputName] = [2, reporterId];
    return;
  }

  if (looksExpressionCall(value)) {
    const reporterId = parseExpression(ctx, value, lineNumber, blockId, "text");
    ctx.blocks[blockId].inputs[inputName] = [2, reporterId];
    return;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    ctx.blocks[blockId].inputs[inputName] = [1, [4, String(numeric)]];
    return;
  }

  ctx.blocks[blockId].inputs[inputName] = [1, [10, stripQuotes(value)]];
}

function createBooleanLiteralReporter(ctx, boolValue, parentBlockId) {
  const id = createBlock(ctx, "operator_equals", {
    topLevel: false,
    shadow: false,
    parent: parentBlockId,
    lineNumber: 0
  });

  const literal = boolValue ? "1" : "0";
  ctx.blocks[id].inputs.OPERAND1 = [1, [10, literal]];
  ctx.blocks[id].inputs.OPERAND2 = [1, [10, "1"]];
  return id;
}

function parseExpression(ctx, expressionText, lineNumber, parentBlockId, expectedType) {
  const parsed = parseExpressionCall(expressionText);
  const commandName = resolveCommand(normalizeCommand(parsed.name), ctx.catalog);
  const definition = ctx.catalog.commands[commandName];

  if (!definition) {
    throw new Error(`Line ${lineNumber}: unknown expression "${parsed.name}".`);
  }

  const kind = definition.kind || "stack";
  if (kind !== "reporter" && kind !== "boolean") {
    throw new Error(`Line ${lineNumber}: "${parsed.name}" is not a reporter expression.`);
  }

  if (!isCommandAvailableForTarget(commandName, definition, ctx.targetType)) {
    throw new Error(`Line ${lineNumber}: expression "${parsed.name}" is not available on ${ctx.targetType === "stage" ? "Stage" : "sprite"}.`);
  }

  if (expectedType === "boolean" && kind !== "boolean") {
    ctx.warnings.push(`Line ${lineNumber}: expression "${parsed.name}" is not boolean.`);
  }

  const blockId = createBlock(ctx, definition.opcode, {
    topLevel: false,
    shadow: false,
    parent: parentBlockId,
    lineNumber
  });

  applyFields(ctx, blockId, definition.fields || [], parsed.args, lineNumber, commandName);
  applyInputs(ctx, blockId, definition.inputs || [], parsed.args, lineNumber, commandName);

  if (definition.extension) {
    ctx.usedExtensions.add(definition.extension);
  }

  return blockId;
}

function parseExpressionCall(text) {
  const value = text.trim();
  const firstParen = value.indexOf("(");
  if (firstParen < 0) {
    return { name: value, args: [] };
  }

  if (!value.endsWith(")")) {
    throw new Error(`Malformed expression "${value}".`);
  }

  const name = value.slice(0, firstParen).trim();
  const inside = value.slice(firstParen + 1, -1);
  const args = splitExpressionArgs(inside).map((item) => stripQuotes(item.trim()));
  return { name, args };
}

function splitExpressionArgs(text) {
  const args = [];
  let current = "";
  let depth = 0;
  let quote = null;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const prev = i > 0 ? text[i - 1] : "";

    if ((char === '"' || char === "'") && prev !== "\\") {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
      current += char;
      continue;
    }

    if (!quote) {
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth = Math.max(0, depth - 1);
      } else if (char === "," && depth === 0) {
        args.push(current);
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.length > 0 || text.endsWith(",")) {
    args.push(current);
  }

  return args;
}

function createMenuShadow(ctx, parentBlockId, spec, rawValue) {
  const menuBlockId = createBlock(ctx, spec.menuOpcode, {
    topLevel: false,
    shadow: true,
    parent: parentBlockId,
    lineNumber: 0
  });

  const fieldValue = spec.registry
    ? (() => {
        const entry = ensureRegistryEntry(ctx, spec.registry, sanitizeName(rawValue, spec.default || "item"), "");
        return [entry.name, entry.id];
      })()
    : [rawValue, null];

  ctx.blocks[menuBlockId].fields[spec.menuField] = fieldValue;
  return menuBlockId;
}

function normalizeMenuValue(spec, rawValue, lineNumber, commandName, warnings) {
  const fallback = String(spec.default ?? "");
  let value = (rawValue || "").trim();
  if (value.length === 0) {
    value = fallback;
  }

  if (spec.uppercase) {
    value = value.toUpperCase();
  }

  if (Array.isArray(spec.options) && spec.options.length > 0 && !spec.options.includes(value)) {
    warnings.push(`Line ${lineNumber}: invalid ${spec.name} "${value}", using "${fallback}".`);
    return fallback;
  }

  return value;
}

function normalizePrimitiveValue(spec, rawValue, lineNumber, commandName, warnings) {
  const fallback = String(spec.default ?? "");
  const value = (rawValue || "").trim();

  if (spec.type === "text") {
    if (value.length > 0) {
      return value;
    }
    return fallback;
  }

  if (spec.type === "color") {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      return value;
    }
    if (value.length > 0) {
      warnings.push(`Line ${lineNumber}: ${commandName} expected color like #RRGGBB for ${spec.name}, using ${fallback}.`);
    }
    return fallback || "#ff0000";
  }

  if (spec.type === "integer") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return String(Math.trunc(parsed));
    }
    warnings.push(`Line ${lineNumber}: ${commandName} expected integer for ${spec.name}, using ${fallback}.`);
    return fallback || "0";
  }

  if (spec.type === "angle" || spec.type === "number") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return String(parsed);
    }
    warnings.push(`Line ${lineNumber}: ${commandName} expected number for ${spec.name}, using ${fallback}.`);
    return fallback || "0";
  }

  return fallback;
}

function toScratchPrimitive(type, value) {
  if (type === "integer") {
    return [7, value || "0"];
  }
  if (type === "angle") {
    return [8, value || "90"];
  }
  if (type === "text") {
    return [10, value || ""];
  }
  if (type === "color") {
    return [9, value || "#ff0000"];
  }
  return [4, value || "0"];
}

function readArgument(args, spec) {
  if (spec.from === "rest") {
    const start = Number.isInteger(spec.start) ? spec.start : 0;
    if (start >= args.length) {
      return "";
    }
    return args.slice(start).join(" ");
  }

  if (Number.isInteger(spec.from)) {
    if (spec.type === "boolean") {
      return args.slice(spec.from).join(" ");
    }
    return args[spec.from] || "";
  }

  return "";
}

function tokenizeLine(line) {
  const tokens = [];
  let current = "";
  let quote = null;
  let depth = 0;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const prev = i > 0 ? line[i - 1] : "";

    if ((char === '"' || char === "'") && prev !== "\\") {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
      current += char;
      continue;
    }

    if (!quote) {
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth = Math.max(0, depth - 1);
      }

      if (/\s/.test(char) && depth === 0) {
        if (current.length > 0) {
          tokens.push(stripQuotes(current));
          current = "";
        }
        continue;
      }
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(stripQuotes(current));
  }

  return tokens;
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).replace(/\\(["'\\])/g, "$1");
  }

  return trimmed;
}

function normalizeCommand(token) {
  return token.toLowerCase().replace(/-/g, "_");
}

function resolveCommand(rawCommand, catalog) {
  if (catalog.commands[rawCommand]) {
    return rawCommand;
  }
  return catalog.aliases?.[rawCommand] || rawCommand;
}

function sanitizeName(name, fallback) {
  const cleaned = (name || "").trim();
  return cleaned.length > 0 ? cleaned : fallback;
}
function ensureRegistryEntry(ctx, registryName, name, initialValue) {
  const key = name.toLowerCase();
  const registry = ctx.registries[registryName];
  if (registry.has(key)) {
    return registry.get(key);
  }

  const id = registryName === "broadcasts" ? makeBroadcastId(name) : makeId(ctx, registryName.slice(0, 3));
  const entry = { id, name };
  registry.set(key, entry);

  if (registryName === "variables") {
    if (ctx.targetType === "stage") {
      ctx.data.stageVariables[id] = [name, initialValue || "0"];
    } else {
      ctx.data.spriteVariables[id] = [name, initialValue || "0"];
    }
  } else if (registryName === "lists") {
    if (ctx.targetType === "stage") {
      ctx.data.stageLists[id] = [name, []];
    } else {
      ctx.data.spriteLists[id] = [name, []];
    }
  } else if (registryName === "broadcasts") {
    ctx.data.broadcasts[id] = name;
  }

  return entry;
}

function makeBroadcastId(name) {
  const seed = createAssetId(`broadcast:${name.toLowerCase()}`);
  return `msg_${seed.slice(0, 16)}`;
}

function createBlock(ctx, opcode, options) {
  const blockId = makeId(ctx, "blk");
  const block = {
    opcode,
    next: null,
    parent: options.parent || null,
    inputs: {},
    fields: {},
    shadow: Boolean(options.shadow),
    topLevel: Boolean(options.topLevel)
  };

  if (block.topLevel) {
    block.x = 64;
    block.y = ctx.topLevelY;
    ctx.topLevelY += 140;
  }

  ctx.blocks[blockId] = block;
  ctx.totalBlockCount += 1;
  return blockId;
}

function makeId(ctx, prefix) {
  ctx.idCounter += 1;
  return `${prefix}_${ctx.idCounter.toString(36)}`;
}

function looksExpressionCall(value) {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed.startsWith("@") || !trimmed.endsWith(")")) {
    return false;
  }

  const firstParen = trimmed.indexOf("(");
  if (firstParen <= 0) {
    return false;
  }

  const name = trimmed.slice(0, firstParen).trim();
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name);
}

async function buildProject(parsed) {
  const stageTarget = {
    isStage: true,
    name: "Stage",
    variables: parsed.stageVariables,
    lists: parsed.stageLists,
    broadcasts: parsed.broadcasts,
    blocks: parsed.stageBlocks,
    comments: {},
    currentCostume: 0,
    costumes: [STAGE_BACKDROP],
    sounds: [],
    volume: 100,
    layerOrder: 0,
    tempo: 60,
    videoTransparency: 50,
    videoState: "on",
    textToSpeechLanguage: null
  };

  const assets = new Map();
  const assetWarnings = [];
  assets.set(STAGE_BACKDROP.md5ext, STAGE_SVG);

  const spriteTargets = [];
  for (let i = 0; i < parsed.sprites.length; i += 1) {
    const sprite = parsed.sprites[i];
    const resolved = await resolveSpriteCostume(sprite.svgSource, sprite.name);

    if (resolved.warning) {
      assetWarnings.push(resolved.warning);
    }

    assets.set(resolved.costume.md5ext, resolved.svg);

    spriteTargets.push({
      isStage: false,
      name: sprite.name,
      variables: sprite.spriteVariables,
      lists: sprite.spriteLists,
      broadcasts: {},
      blocks: sprite.blocks,
      comments: {},
      currentCostume: 0,
      costumes: [resolved.costume],
      sounds: [],
      volume: 100,
      layerOrder: i + 1,
      visible: true,
      x: 0,
      y: 0,
      size: 100,
      direction: 90,
      draggable: false,
      rotationStyle: "all around"
    });
  }

  return {
    project: {
      targets: [stageTarget, ...spriteTargets],
      monitors: [],
      extensions: parsed.usedExtensions,
      meta: {
        semver: "3.0.0",
        vm: "0.2.0",
        agent: "text2scratch"
      }
    },
    assets,
    assetWarnings
  };
}

async function resolveSpriteCostume(svgSource, spriteName) {
  if (!svgSource) {
    return {
      costume: { ...SPRITE_COSTUME },
      svg: SPRITE_SVG,
      warning: ""
    };
  }

  try {
    const svgText = await loadSvgText(svgSource);
    const normalizedSvg = extractSvgMarkup(svgText);
    const center = inferSvgCenter(normalizedSvg);
    const assetId = createAssetId(normalizedSvg);

    return {
      costume: {
        assetId,
        md5ext: `${assetId}.svg`,
        name: "costume1",
        bitmapResolution: 1,
        dataFormat: "svg",
        rotationCenterX: center.x,
        rotationCenterY: center.y
      },
      svg: normalizedSvg,
      warning: ""
    };
  } catch (error) {
    return {
      costume: { ...SPRITE_COSTUME },
      svg: SPRITE_SVG,
      warning: `Sprite "${spriteName}": could not load svg source (${error.message}). Default sprite used.`
    };
  }
}

async function loadSvgText(source) {
  const value = (source || "").trim();
  if (!value) {
    return SPRITE_SVG;
  }

  if (value.startsWith("data:")) {
    return decodeDataUrl(value);
  }

  if (value.startsWith("<svg")) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    const response = await fetch(value, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  }

  throw new Error("use a data URL or https:// URL");
}

function decodeDataUrl(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("invalid data URL");
  }

  const meta = dataUrl.slice(0, commaIndex).toLowerCase();
  const payload = dataUrl.slice(commaIndex + 1);

  if (meta.includes(";base64")) {
    return atob(payload);
  }

  return decodeURIComponent(payload);
}
function extractSvgMarkup(text) {
  const trimmed = (text || "").trim();
  if (trimmed.startsWith("<svg") && trimmed.includes("</svg>")) {
    return trimmed;
  }

  const match = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) {
    throw new Error("response does not include svg markup");
  }
  return match[0];
}

function inferSvgCenter(svgText) {
  const viewBoxMatch = svgText.match(/viewBox\s*=\s*['"]\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s*['"]/i);
  if (viewBoxMatch) {
    const width = Number(viewBoxMatch[3]);
    const height = Number(viewBoxMatch[4]);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return {
        x: Math.round(width / 2),
        y: Math.round(height / 2)
      };
    }
  }

  const widthMatch = svgText.match(/width\s*=\s*['"]\s*([-+]?\d*\.?\d+)/i);
  const heightMatch = svgText.match(/height\s*=\s*['"]\s*([-+]?\d*\.?\d+)/i);
  const width = widthMatch ? Number(widthMatch[1]) : 96;
  const height = heightMatch ? Number(heightMatch[1]) : 96;

  return {
    x: Math.round((Number.isFinite(width) && width > 0 ? width : 96) / 2),
    y: Math.round((Number.isFinite(height) && height > 0 ? height : 96) / 2)
  };
}

function createAssetId(text) {
  let h1 = 2166136261 >>> 0;
  let h2 = 3339675911 >>> 0;

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);

    h2 ^= code;
    h2 = Math.imul(h2, 2246822519);
  }

  const part1 = toHex(h1);
  const part2 = toHex(h2);
  const part3 = toHex(h1 ^ h2);
  const part4 = toHex((h1 + h2) >>> 0);
  return `${part1}${part2}${part3}${part4}`;
}

function toHex(value) {
  return (value >>> 0).toString(16).padStart(8, "0");
}

async function downloadSb3(project, fileName, assets) {
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip is not available.");
  }

  const zip = new JSZip();
  zip.file("project.json", JSON.stringify(project));

  assets.forEach((content, name) => {
    zip.file(name, content);
  });

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderCommandList(catalog) {
  if (!ui.commands) {
    return;
  }

  ui.commands.innerHTML = "";

  const entries = Object.entries(catalog.commands)
    .filter(([, definition]) => definition.syntax && !definition.hidden)
    .map(([name, definition]) => ({
      name,
      definition,
      section: getCommandSectionLabel(name, definition)
    }))
    .sort((a, b) => {
      if (a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }
      return a.name.localeCompare(b.name);
    });

  let currentSection = "";
  entries.forEach(({ definition, section }) => {
    if (section !== currentSection) {
      currentSection = section;
      const sectionItem = document.createElement("li");
      sectionItem.className = "command-section";
      sectionItem.textContent = section;
      ui.commands.appendChild(sectionItem);
    }

    const item = document.createElement("li");
    const syntax = document.createElement("span");
    syntax.className = "syntax";
    syntax.textContent = definition.syntax;
    item.appendChild(syntax);

    if (definition.description) {
      const description = document.createElement("span");
      description.textContent = ` - ${definition.description}`;
      item.appendChild(description);
    }

    ui.commands.appendChild(item);
  });
}

function getCommandSectionLabel(name, definition) {
  if (definition.extension) {
    return `Extension: ${definition.extension}`;
  }

  if (definition.kind === "meta") {
    return "Core: Meta";
  }
  if (definition.kind === "define" || definition.kind === "call") {
    return "Core: My Blocks";
  }
  if (name === "else" || name === "end") {
    return "Core: Control";
  }

  const opcode = definition.opcode || "";
  const prefix = opcode.split("_")[0];
  return `Core: ${CORE_PREFIX_LABELS[prefix] || "Meta"}`;
}

async function initEditor() {
  const monacoLoaded = await initMonacoEditor();
  if (monacoLoaded) {
    return;
  }

  if (ui.editorHost) {
    ui.editorHost.style.display = "none";
  }

  if (ui.input) {
    ui.input.classList.add("visible");
    attachEditorEnhancements();
  }
}

function initMonacoEditor() {
  return new Promise((resolve) => {
    if (!ui.editorHost || typeof window.require !== "function") {
      resolve(false);
      return;
    }

    const loader = window.require;
    if (typeof loader.config === "function") {
      loader.config({ paths: { vs: MONACO_VS_PATH } });
    }

    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const timeoutId = window.setTimeout(() => finish(false), 5000);

    loader(
      ["vs/editor/editor.main"],
      () => {
        if (settled) {
          return;
        }
        window.clearTimeout(timeoutId);
        const monacoRef = window.monaco;
        if (!monacoRef?.editor || !monacoRef.languages) {
          finish(false);
          return;
        }

        registerText2ScratchLanguage(monacoRef);
        defineText2ScratchTheme(monacoRef);
        registerText2ScratchCodeActions(monacoRef);
        registerEditorHoverProvider(monacoRef);

        editorState.instance = monacoRef.editor.create(ui.editorHost, {
          value: ui.input?.value || "",
          language: "text2scratch",
          theme: "text2scratch-theme",
          automaticLayout: true,
          contextmenu: true,
          fixedOverflowWidgets: true,
          minimap: { enabled: false },
          roundedSelection: false,
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          tabSize: INDENT_UNIT.length,
          insertSpaces: true,
          fontFamily: "IBM Plex Mono, Cascadia Code, Consolas, monospace",
          fontSize: 14,
          lineHeight: 20,
          lineNumbersMinChars: 3,
          padding: { top: 12, bottom: 12 },
          wordWrap: "on",
          lightbulb: {
            enabled: true
          }
        });

        editorState.monacoRef = monacoRef;
        editorState.usingMonaco = true;
        ui.editorHost.classList.add("ready");
        editorState.instance.onDidChangeModelContent(() => {
          scheduleDiagnosticsUpdate();
        });

        if (ui.input) {
          ui.input.classList.remove("visible");
        }

        scheduleDiagnosticsUpdate();
        finish(true);
      },
      () => {
        if (settled) {
          return;
        }
        window.clearTimeout(timeoutId);
        finish(false);
      }
    );
  });
}

function registerText2ScratchLanguage(monacoRef) {
  const alreadyRegistered = monacoRef.languages
    .getLanguages()
    .some((language) => language.id === "text2scratch");

  if (!alreadyRegistered) {
    monacoRef.languages.register({ id: "text2scratch" });
  }

  monacoRef.languages.setMonarchTokensProvider("text2scratch", {
    tokenizer: {
      root: [
        [/^\s*#.*/, "comment"],
        [/\"([^\"\\]|\\.)*\"/, "string"],
        [/'([^'\\]|\\.)*'/, "string"],
        [/@?[a-zA-Z_][\w-]*(?=\()/, "type.identifier"],
        [/\b(?:else|end|repeat|forever|if|if_else|repeat_until|define)\b/, "keyword.control"],
        [/\b(?:make_var|make_list|make_broadcast|sprite|svg|stage_code)\b/, "keyword"],
        [/^\s*[a-zA-Z_][\w-]*/, "keyword"],
        [/\b\d+(?:\.\d+)?\b/, "number"],
        [/#.*/, "comment"]
      ]
    }
  });

  monacoRef.languages.setLanguageConfiguration("text2scratch", {
    comments: {
      lineComment: "#"
    },
    brackets: [["(", ")"]],
    autoClosingPairs: [
      { open: "\"", close: "\"" },
      { open: "'", close: "'" },
      { open: "(", close: ")" }
    ],
    indentationRules: {
      increaseIndentPattern: /^\s*(repeat|forever|if|if_else|repeat_until|define)\b.*$|^\s*[a-zA-Z0-9_-]+_code\s*=\s*$|^\s*else\s*$/i,
      decreaseIndentPattern: /^\s*end\b/i
    },
    onEnterRules: [
      {
        beforeText: /^\s*(repeat|forever|if|if_else|repeat_until|define)\b.*$/i,
        action: {
          indentAction: monacoRef.languages.IndentAction.Indent
        }
      },
      {
        beforeText: /^\s*[a-zA-Z0-9_-]+_code\s*=\s*$/i,
        action: {
          indentAction: monacoRef.languages.IndentAction.Indent
        }
      },
      {
        beforeText: /^\s*else\s*$/i,
        action: {
          indentAction: monacoRef.languages.IndentAction.Indent
        }
      }
    ]
  });
}

function defineText2ScratchTheme(monacoRef) {
  monacoRef.editor.defineTheme("text2scratch-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "56B6C2" },
      { token: "keyword.control", foreground: "E5C07B" },
      { token: "string", foreground: "98C379" },
      { token: "number", foreground: "D19A66" },
      { token: "comment", foreground: "63707D" },
      { token: "type.identifier", foreground: "8AB4F8" }
    ],
    colors: {
      "editor.background": "#0f1720",
      "editorLineNumber.foreground": "#557189",
      "editorLineNumber.activeForeground": "#bbd7ec",
      "editorCursor.foreground": "#f1cb7f",
      "editor.selectionBackground": "#2d4c69a8",
      "editor.inactiveSelectionBackground": "#2d4c694f",
      "editorLineHighlightBackground": "#152232",
      "editorIndentGuide.background1": "#2e4252",
      "editorGutter.background": "#0f1720"
    }
  });
}

function registerText2ScratchCodeActions(monacoRef) {
  if (editorState.codeActionsRegistered) {
    return;
  }

  const quickFixKind = getQuickFixKind(monacoRef);
  monacoRef.languages.registerCodeActionProvider("text2scratch", {
    providedCodeActionKinds: [quickFixKind],
    provideCodeActions(model, _range, context) {
      const actions = [];

      (context.markers || []).forEach((marker) => {
        actions.push(...buildQuickFixesForMarker(monacoRef, model, marker));
      });

      return {
        actions,
        dispose() {}
      };
    }
  });

  editorState.codeActionsRegistered = true;
}

function registerEditorHoverProvider(monacoRef) {
  if (editorState.hoverRegistered) {
    return;
  }

  monacoRef.languages.registerHoverProvider("text2scratch", {
    provideHover(model, position) {
      const lineText = model.getLineContent(position.lineNumber) || "";
      const tokenInfo = findTokenAtColumn(lineText, position.column);
      if (!tokenInfo) {
        return null;
      }

      const hover = buildHoverInfo(tokenInfo.token);
      if (!hover) {
        return null;
      }
      const syntaxSnippet = hover.syntax ? "`" + hover.syntax + "`" : "";

      return {
        range: new monacoRef.Range(position.lineNumber, tokenInfo.startColumn, position.lineNumber, tokenInfo.endColumn),
        contents: [
          { value: `**${hover.title}**` },
          { value: syntaxSnippet },
          { value: hover.description }
        ].filter((item) => item.value && item.value.trim().length > 0)
      };
    }
  });

  editorState.hoverRegistered = true;
}

function findTokenAtColumn(lineText, column) {
  const pattern = /@?[a-zA-Z_][a-zA-Z0-9_-]*/g;
  let match = pattern.exec(lineText);
  while (match) {
    const start = match.index + 1;
    const end = match.index + match[0].length + 1;
    if (column >= start && column <= end) {
      return {
        token: match[0],
        startColumn: start,
        endColumn: end
      };
    }
    match = pattern.exec(lineText);
  }
  return null;
}

function buildHoverInfo(rawToken) {
  const token = String(rawToken || "").trim();
  if (!token) {
    return null;
  }

  const normalized = normalizeCommand(token.replace(/^@/, ""));
  if (normalized === "stage_code") {
    return {
      title: "stage_code",
      syntax: "stage_code =",
      description: "Starts a Stage-only code section. Commands inside this section must be stage-compatible."
    };
  }

  if (/_code$/.test(normalized)) {
    return {
      title: normalized,
      syntax: `${normalized} =`,
      description: "Starts a sprite code section. Use commands for the sprite target until closing with end."
    };
  }

  const catalogCommands = blockCatalog?.commands || {};
  const commandName = resolveCommand(normalized, blockCatalog || { commands: {} });
  const definition = catalogCommands[commandName];
  if (!definition) {
    return null;
  }

  const description = (definition.description || "").trim() || "Scratch command supported by text2scratch.";
  const syntax = definition.syntax || commandName;
  return {
    title: commandName,
    syntax,
    description
  };
}

function buildQuickFixesForMarker(monacoRef, model, marker) {
  const code = getMarkerCodeValue(marker);
  if (!code) {
    return [];
  }

  const lineNumber = clamp(marker.startLineNumber || 1, 1, model.getLineCount());
  const lineContent = model.getLineContent(lineNumber);
  const trimmed = lineContent.trim();
  const indent = lineContent.match(/^\s*/)?.[0] || "";

  if (code === "t2s.missing-end") {
    const lastLine = model.getLineCount();
    const lastColumn = model.getLineMaxColumn(lastLine);
    const prefix = lastColumn > 1 ? "\n" : "";
    return [
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        "Quick Fix: Add missing end at file bottom",
        [{
          range: new monacoRef.Range(lastLine, lastColumn, lastLine, lastColumn),
          text: `${prefix}end`
        }],
        true
      )
    ];
  }

  if (code === "t2s.unmatched-end" || code === "t2s.invalid-else") {
    return [
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        `Quick Fix: Remove "${trimmed}"`,
        [buildRemoveLineEdit(monacoRef, model, lineNumber)],
        true
      )
    ];
  }

  if (code === "t2s.unknown-command") {
    if (trimmed.startsWith("#")) {
      return [];
    }

    return [
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        "Quick Fix: Comment out unknown command",
        [buildReplaceLineEdit(monacoRef, model, lineNumber, `${indent}# ${trimmed}`)],
        true
      )
    ];
  }

  if (code === "t2s.expression-standalone") {
    const expression = ensureExpressionPrefix(trimmed);
    if (!expression) {
      return [];
    }

    return [
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        "Quick Fix: Store expression in temp variable",
        [buildReplaceLineEdit(monacoRef, model, lineNumber, `${indent}set_var temp ${expression}`)],
        true
      ),
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        "Quick Fix: Comment out expression line",
        [buildReplaceLineEdit(monacoRef, model, lineNumber, `${indent}# ${trimmed}`)],
        false
      )
    ];
  }

  if (code === "t2s.at-format") {
    const column = clamp(marker.startColumn || 1, 1, model.getLineMaxColumn(lineNumber));
    const char = lineContent[column - 1] || "";
    if (char !== "@") {
      return [];
    }

    return [
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        "Quick Fix: Remove stray @",
        [{
          range: new monacoRef.Range(lineNumber, column, lineNumber, column + 1),
          text: ""
        }],
        true
      )
    ];
  }

  if (code === "t2s.stage-incompatible") {
    return [
      createQuickFixAction(
        monacoRef,
        model,
        marker,
        "Quick Fix: Comment out stage-incompatible line",
        [buildReplaceLineEdit(monacoRef, model, lineNumber, `${indent}# ${trimmed}`)],
        true
      )
    ];
  }

  return [];
}

function createQuickFixAction(monacoRef, model, marker, title, edits, preferred) {
  return {
    title,
    kind: getQuickFixKind(monacoRef),
    diagnostics: [marker],
    isPreferred: Boolean(preferred),
    edit: {
      edits: edits.map((item) => ({
        resource: model.uri,
        textEdit: item
      }))
    }
  };
}

function getQuickFixKind(monacoRef) {
  const kind = monacoRef?.languages?.CodeActionKind?.QuickFix;
  if (typeof kind === "string" && kind.length > 0) {
    return kind;
  }
  if (kind && typeof kind.value === "string" && kind.value.length > 0) {
    return kind.value;
  }
  return "quickfix";
}

function buildReplaceLineEdit(monacoRef, model, lineNumber, text) {
  return {
    range: new monacoRef.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
    text
  };
}

function buildRemoveLineEdit(monacoRef, model, lineNumber) {
  if (lineNumber < model.getLineCount()) {
    return {
      range: new monacoRef.Range(lineNumber, 1, lineNumber + 1, 1),
      text: ""
    };
  }

  return {
    range: new monacoRef.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
    text: ""
  };
}

function ensureExpressionPrefix(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("@")) {
    return trimmed;
  }

  if (looksExpressionCall(trimmed)) {
    return `@${trimmed}`;
  }

  return "";
}

function getMarkerCodeValue(marker) {
  const code = marker?.code;
  if (!code) {
    return "";
  }

  if (typeof code === "string") {
    return code;
  }

  if (typeof code === "object" && typeof code.value === "string") {
    return code.value;
  }

  return String(code);
}

function getEditorValue() {
  if (editorState.usingMonaco && editorState.instance) {
    return editorState.instance.getValue();
  }
  return ui.input?.value || "";
}

function setEditorValue(value) {
  const next = value || "";
  if (editorState.usingMonaco && editorState.instance) {
    editorState.instance.setValue(next);
    scheduleDiagnosticsUpdate();
    return;
  }

  if (ui.input) {
    ui.input.value = next;
  }

  scheduleDiagnosticsUpdate();
}

function attachEditorEnhancements() {
  if (!ui.input) {
    return;
  }

  ui.input.addEventListener("input", () => {
    scheduleDiagnosticsUpdate();
  });

  ui.input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      handleTabIndent(event.shiftKey);
      scheduleDiagnosticsUpdate();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleAutoIndentEnter();
      scheduleDiagnosticsUpdate();
    }
  });
}

function handleTabIndent(isOutdent) {
  const textarea = ui.input;
  const value = textarea.value;
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;

  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionEnd);
  const finalLineEnd = lineEnd < 0 ? value.length : lineEnd;

  if (selectionStart !== selectionEnd && finalLineEnd > lineStart) {
    const selected = value.slice(lineStart, finalLineEnd);
    const lines = selected.split("\n");

    const transformed = lines.map((line) => {
      if (!isOutdent) {
        return `${INDENT_UNIT}${line}`;
      }

      if (line.startsWith(INDENT_UNIT)) {
        return line.slice(INDENT_UNIT.length);
      }
      if (line.startsWith("\t")) {
        return line.slice(1);
      }
      return line;
    });

    const updated = `${value.slice(0, lineStart)}${transformed.join("\n")}${value.slice(finalLineEnd)}`;
    textarea.value = updated;

    const deltaPerLine = transformed[0].length - lines[0].length;
    textarea.selectionStart = Math.max(lineStart, selectionStart + deltaPerLine);
    textarea.selectionEnd = Math.max(textarea.selectionStart, selectionEnd + (transformed.join("\n").length - selected.length));
    return;
  }

  if (!isOutdent) {
    const insert = INDENT_UNIT;
    textarea.value = `${value.slice(0, selectionStart)}${insert}${value.slice(selectionEnd)}`;
    textarea.selectionStart = selectionStart + insert.length;
    textarea.selectionEnd = selectionStart + insert.length;
    return;
  }

  const beforeCursor = value.slice(0, selectionStart);
  if (beforeCursor.endsWith(INDENT_UNIT)) {
    textarea.value = `${value.slice(0, selectionStart - INDENT_UNIT.length)}${value.slice(selectionStart)}`;
    textarea.selectionStart = selectionStart - INDENT_UNIT.length;
    textarea.selectionEnd = selectionStart - INDENT_UNIT.length;
  }
}

function handleAutoIndentEnter() {
  const textarea = ui.input;
  const value = textarea.value;
  const caret = textarea.selectionStart;

  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const currentLine = value.slice(lineStart, caret);
  const baseIndent = currentLine.match(/^\s*/)?.[0] || "";
  const trimmed = currentLine.trim();

  let nextIndent = baseIndent;
  if (shouldIncreaseIndent(trimmed)) {
    nextIndent += INDENT_UNIT;
  }

  if (/^end$/i.test(trimmed)) {
    nextIndent = baseIndent.length >= INDENT_UNIT.length ? baseIndent.slice(0, -INDENT_UNIT.length) : "";
  }

  const insertText = `\n${nextIndent}`;
  textarea.value = `${value.slice(0, caret)}${insertText}${value.slice(textarea.selectionEnd)}`;
  const nextCaret = caret + insertText.length;
  textarea.selectionStart = nextCaret;
  textarea.selectionEnd = nextCaret;
}

function shouldIncreaseIndent(trimmedLine) {
  if (!trimmedLine) {
    return false;
  }

  const normalized = normalizeCommand(trimmedLine.split(/\s+/)[0]);
  if (["repeat", "forever", "if", "if_else", "repeat_until", "define"].includes(normalized)) {
    return true;
  }

  return /_code\s*=\s*$/i.test(trimmedLine) || /^else$/i.test(normalized);
}

function scheduleDiagnosticsUpdate() {
  if (editorState.diagnosticTimer) {
    window.clearTimeout(editorState.diagnosticTimer);
  }

  editorState.diagnosticTimer = window.setTimeout(() => {
    editorState.diagnosticTimer = null;
    refreshDiagnostics();
  }, DIAGNOSTIC_DEBOUNCE_MS);
}

function refreshDiagnostics() {
  if (!editorState.usingMonaco || !editorState.instance || !editorState.monacoRef?.editor) {
    return;
  }

  const model = editorState.instance.getModel();
  if (!model) {
    return;
  }

  const markers = buildDiagnostics(getEditorValue(), blockCatalog);
  editorState.monacoRef.editor.setModelMarkers(model, MARKER_OWNER, markers);
}

function buildDiagnostics(text, catalog) {
  const markers = [];
  if (!catalog?.commands) {
    return markers;
  }

  try {
    const parsed = parseScript(text, catalog);
    parsed.warnings.forEach((warning) => {
      markers.push(createMarkerFromMessage(text, warning, "warning"));
    });
  } catch (error) {
    markers.push(createMarkerFromMessage(text, error.message || "Syntax error.", "error"));
  }

  markers.push(...collectEditorHints(text));
  return dedupeMarkers(markers);
}

function collectEditorHints(text) {
  const markers = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine || "";
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const lineNumber = index + 1;

    if (trimmed.startsWith("@") && looksExpressionCall(trimmed.slice(1))) {
      markers.push({
        severity: editorState.monacoRef.MarkerSeverity.Warning,
        message: "Problem: This expression cannot be used alone on a line.",
        code: "t2s.expression-standalone",
        source: "text2scratch",
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: Math.max(2, line.length + 1)
      });
    }

    if (trimmed.includes("@") && !/@[a-zA-Z_][a-zA-Z0-9_-]*\s*\(/.test(trimmed)) {
      const atIndex = line.indexOf("@");
      markers.push({
        severity: editorState.monacoRef.MarkerSeverity.Warning,
        message: "Problem: Invalid @ syntax. Use @ directly before an expression call, for example @var(score).",
        code: "t2s.at-format",
        source: "text2scratch",
        startLineNumber: lineNumber,
        startColumn: Math.max(1, atIndex + 1),
        endLineNumber: lineNumber,
        endColumn: Math.max(2, atIndex + 2)
      });
    }
  });

  return markers;
}

function createMarkerFromMessage(text, message, level) {
  const lines = text.split(/\r?\n/);
  const parsedLine = extractLineFromMessage(message);
  const lineNumber = clamp(parsedLine || 1, 1, Math.max(1, lines.length));
  const lineContent = lines[lineNumber - 1] || "";
  const classification = classifyProblemMessage(message, lineContent, level);

  let severity = editorState.monacoRef.MarkerSeverity.Info;
  if (classification.level === "error") {
    severity = editorState.monacoRef.MarkerSeverity.Error;
  } else if (classification.level === "warning") {
    severity = editorState.monacoRef.MarkerSeverity.Warning;
  }

  const range = chooseMarkerRangeFromMessage(message, lineNumber, lineContent);
  const normalizedMessage = classification.prefixProblem && !/^problem:/i.test(message)
    ? `Problem: ${message}`
    : message;

  return {
    severity,
    code: classification.code,
    source: "text2scratch",
    message: normalizedMessage,
    startLineNumber: range.startLineNumber,
    startColumn: range.startColumn,
    endLineNumber: range.endLineNumber,
    endColumn: range.endColumn
  };
}

function classifyProblemMessage(message, lineContent, fallbackLevel) {
  const text = String(message || "");
  const lower = text.toLowerCase();

  if (lower.includes("missing closing \"end\"")) {
    return { code: "t2s.missing-end", level: "error", prefixProblem: true };
  }
  if (lower.includes("\"end\" has no matching block")) {
    return { code: "t2s.unmatched-end", level: "error", prefixProblem: true };
  }
  if (lower.includes("\"else\" has no matching \"if\"") || lower.includes("\"else\" can only")) {
    return { code: "t2s.invalid-else", level: "error", prefixProblem: true };
  }
  if (lower.includes("unknown command")) {
    const trimmed = String(lineContent || "").trim();
    if (trimmed.startsWith("@") && looksExpressionCall(trimmed.slice(1))) {
      return { code: "t2s.expression-standalone", level: "error", prefixProblem: true };
    }
    return { code: "t2s.unknown-command", level: "error", prefixProblem: true };
  }
  if (lower.includes("reporter/boolean expression")) {
    return { code: "t2s.expression-standalone", level: "error", prefixProblem: true };
  }
  if (lower.includes("not available on stage")) {
    return { code: "t2s.stage-incompatible", level: "error", prefixProblem: true };
  }

  if (fallbackLevel === "warning") {
    return { code: "t2s.warning", level: "warning", prefixProblem: true };
  }
  if (fallbackLevel === "error") {
    return { code: "t2s.problem", level: "error", prefixProblem: true };
  }

  return { code: "t2s.info", level: "info", prefixProblem: false };
}

function chooseMarkerRangeFromMessage(message, lineNumber, lineContent) {
  const content = String(lineContent || "");
  const maxColumn = Math.max(2, content.length + 1);
  const unknownCommand = String(message || "").match(/unknown command "([^"]+)"/i);
  if (!unknownCommand) {
    return {
      startLineNumber: lineNumber,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: maxColumn
    };
  }

  const command = unknownCommand[1] || "";
  const index = content.toLowerCase().indexOf(command.toLowerCase());
  if (index < 0) {
    return {
      startLineNumber: lineNumber,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: maxColumn
    };
  }

  return {
    startLineNumber: lineNumber,
    startColumn: index + 1,
    endLineNumber: lineNumber,
    endColumn: index + command.length + 1
  };
}

function extractLineFromMessage(message) {
  if (!message) {
    return 0;
  }

  const direct = message.match(/Line\s+(\d+)/i);
  if (direct) {
    return Number(direct[1]);
  }

  const fallback = message.match(/line\s+(\d+)/i);
  if (fallback) {
    return Number(fallback[1]);
  }

  return 0;
}

function dedupeMarkers(markers) {
  const seen = new Set();
  return markers.filter((marker) => {
    if (!marker) {
      return false;
    }

    const key = [
      marker.startLineNumber,
      marker.startColumn,
      marker.endLineNumber,
      marker.endColumn,
      marker.message
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getBlockingDiagnostics() {
  if (!editorState.monacoRef?.MarkerSeverity) {
    try {
      parseScript(getEditorValue(), blockCatalog);
      return [];
    } catch (error) {
      return [{
        message: String(error?.message || "Syntax error."),
        startLineNumber: extractLineFromMessage(String(error?.message || "")) || 1
      }];
    }
  }

  const markers = buildDiagnostics(getEditorValue(), blockCatalog);
  return markers.filter((marker) => {
    if (!marker) {
      return false;
    }

    if (marker.severity === editorState.monacoRef?.MarkerSeverity?.Error) {
      return true;
    }

    return BLOCKING_DIAGNOSTIC_CODES.has(String(marker.code || ""));
  });
}

function initProfileAuthUi() {
  if (!ui.profileMenuBtn || !ui.profileFlyout || !ui.profileAuthStatus) {
    return;
  }

  ui.profileMenuBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setProfileFlyoutOpen(!profileMenuState.open);
  });

  ui.profileFlyoutClose?.addEventListener("click", () => {
    setProfileFlyoutOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!profileMenuState.open) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("#profileFlyout") || target.closest("#profileMenuBtn")) {
      return;
    }

    setProfileFlyoutOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && profileMenuState.open) {
      setProfileFlyoutOpen(false);
    }
  });

  ui.profileSignOutModalBtn?.addEventListener("click", async () => {
    await onCloudSignOutClick();
    setProfileFlyoutOpen(false);
  });
  ui.profileSendResetBtn?.addEventListener("click", onProfileSendResetForCurrentUser);
  ui.profileDeleteAccountBtn?.addEventListener("click", onProfileDeleteAccount);

  setProfileFlyoutOpen(false);
  if (String(window.location.hash || "").toLowerCase() === "#profile") {
    setProfileFlyoutOpen(true);
  }

  updateProfileUiState();
  if (supabaseState.user) {
    setProfileAuthStatus("Account menu ready.", "success");
  } else {
    setProfileAuthStatus("Use Login or Sign Up to access cloud features.", "info");
  }
}

function setProfileFlyoutOpen(open) {
  if (!ui.profileFlyout) {
    return;
  }

  profileMenuState.open = Boolean(open);
  ui.profileFlyout.hidden = !profileMenuState.open;
  document.body.classList.toggle("profile-flyout-open", profileMenuState.open);
  ui.profileMenuBtn?.setAttribute("aria-expanded", String(profileMenuState.open));

  if (profileMenuState.open) {
    updateProfileUiState();
  } else if (String(window.location.hash || "").toLowerCase() === "#profile") {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
  }
}

function setProfileAuthStatus(message, severity = "info") {
  if (!ui.profileAuthStatus) {
    return;
  }

  ui.profileAuthStatus.textContent = message;
  ui.profileAuthStatus.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.profileAuthStatus.classList.add(`status-${severity}`);
}

function updateProfileUiState() {
  const user = supabaseState.user;
  const signedIn = Boolean(user);

  if (ui.profileGuestView) {
    ui.profileGuestView.hidden = signedIn;
  }
  if (ui.profileUserView) {
    ui.profileUserView.hidden = !signedIn;
  }

  if (signedIn && user) {
    const displayName = getUserDisplayName(user);
    const email = String(user.email || "");
    const avatar = buildAvatarText(displayName || email || "U");

    if (ui.profileUserDisplayName) {
      ui.profileUserDisplayName.textContent = displayName || "User";
    }
    if (ui.profileUserEmail) {
      ui.profileUserEmail.textContent = email || "No email";
    }
    if (ui.profileUserAvatar) {
      ui.profileUserAvatar.textContent = avatar;
    }
    if (ui.profileAvatarBadge) {
      ui.profileAvatarBadge.textContent = avatar;
    }
    if (ui.profileNavLabel) {
      ui.profileNavLabel.textContent = displayName || "Profile";
    }
  } else {
    if (ui.profileAvatarBadge) {
      ui.profileAvatarBadge.textContent = "?";
    }
    if (ui.profileNavLabel) {
      ui.profileNavLabel.textContent = "Profile";
    }
  }
}

async function onProfileSendResetForCurrentUser() {
  if (!ensureCloudSignedIn()) {
    return;
  }

  const email = String(supabaseState.user?.email || "").trim();
  if (!email) {
    setProfileAuthStatus("Current account has no email. Reset cannot be sent.", "warning");
    return;
  }

  try {
    const options = {
      redirectTo: `${getConfirmPageUrl()}?mode=recovery`
    };

    const cachedCaptchaToken = readCachedCaptchaToken();
    if (cachedCaptchaToken) {
      options.captchaToken = cachedCaptchaToken;
    }

    const { error } = await supabaseState.client.auth.resetPasswordForEmail(email, options);
    if (error) {
      throw new Error(formatSupabaseError(error));
    }
    setProfileAuthStatus("Password reset email sent.", "success");
    setStatus("Password reset email sent.", "success");
  } catch (error) {
    setProfileAuthStatus(`Password reset failed: ${error.message}`, "error");
    setStatus(`Password reset failed: ${error.message}`, "error");
  }
}

async function onProfileDeleteAccount() {
  if (!ensureCloudSignedIn()) {
    return;
  }

  const confirmed = window.confirm("Delete your account and all cloud projects permanently?");
  if (!confirmed) {
    return;
  }

  try {
    const { error } = await supabaseState.client.rpc("delete_current_account");
    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    await supabaseState.client.auth.signOut();
    supabaseState.user = null;
    supabaseState.activeProjectId = null;
    setCloudAuthState();
    setCloudControlState(false);
    updateProfileUiState();
    resetShareLink();
    resetCloudProjectList("Sign in to load projects");
    setProfileAuthStatus("Account deleted.", "success");
    setStatus("Account deleted successfully.", "success");
    setProfileFlyoutOpen(false);
  } catch (error) {
    setProfileAuthStatus(`Account deletion failed: ${error.message}`, "error");
    setStatus(`Account deletion failed: ${error.message}`, "error");
  }
}

function getUserDisplayName(user) {
  const fromMeta = String(user?.user_metadata?.username || "").trim();
  if (fromMeta) {
    return fromMeta;
  }

  const email = String(user?.email || "").trim();
  if (email.includes("@")) {
    return email.split("@")[0];
  }

  return "Profile";
}

function buildAvatarText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "?";
  }
  return text[0].toUpperCase();
}

function readCachedCaptchaToken() {
  try {
    const raw = window.localStorage.getItem(CAPTCHA_CACHE_KEY);
    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw);
    const token = String(parsed?.token || "").trim();
    const savedAt = Number(parsed?.savedAt || 0);
    if (!token || !Number.isFinite(savedAt)) {
      return "";
    }

    if (Date.now() - savedAt > CAPTCHA_CACHE_MAX_AGE_MS) {
      return "";
    }

    return token;
  } catch (_error) {
    return "";
  }
}

function hasCloudUi() {
  return Boolean(
    ui.authState &&
    ui.signOut &&
    ui.saveCloud &&
    ui.shareProject &&
    ui.cloudProjects &&
    ui.shareLinkOutput &&
    ui.copyShareLink
  );
}

async function initSupabaseWorkspace() {
  if (!hasCloudUi()) {
    return;
  }

  try {
    supabaseState.client = createSupabaseClient();
  } catch (error) {
    ui.authState.textContent = error.message;
    setCloudControlState(false);
    setProfileAuthStatus(error.message, "error");
    updateProfileUiState();
    return;
  }

  bindCloudEventHandlers();
  await restoreCloudSession();
  setCloudAuthState();
  setCloudControlState(Boolean(supabaseState.user));
  updateProfileUiState();

  await loadSharedProjectFromQuery();

  if (supabaseState.user) {
    await refreshCloudProjectList();
  } else {
    resetCloudProjectList("Sign in to load projects");
  }

  const listenerResult = supabaseState.client.auth.onAuthStateChange(async (_event, session) => {
    supabaseState.user = session?.user || null;
    if (!supabaseState.user) {
      supabaseState.activeProjectId = null;
      resetShareLink();
    }

    if (shareState.active) {
      const isOwner = Boolean(supabaseState.user?.id) && supabaseState.user.id === shareState.ownerId;
      setSharedReadOnly(!isOwner);
    }

    setCloudAuthState();
    setCloudControlState(Boolean(supabaseState.user));
    updateProfileUiState();

    if (supabaseState.user) {
      await refreshCloudProjectList();
    } else {
      resetCloudProjectList("Sign in to load projects");
    }
  });

  supabaseState.authListener = listenerResult?.data?.subscription || null;
}

function bindCloudEventHandlers() {
  ui.signOut.addEventListener("click", onCloudSignOutClick);
  ui.saveCloud.addEventListener("click", onSaveCloudProjectClick);
  ui.shareProject.addEventListener("click", onShareProjectClick);
  ui.copyShareLink.addEventListener("click", onCopyShareLinkClick);
  ui.cloudProjects.addEventListener("change", onCloudProjectSelected);
}

async function restoreCloudSession() {
  if (!supabaseState.client) {
    return;
  }

  const { data, error } = await supabaseState.client.auth.getSession();
  if (error) {
    setStatus(`Cloud auth warning: ${formatSupabaseError(error)}`, "warning");
    return;
  }

  supabaseState.user = data?.session?.user || null;
}

async function onCloudSignOutClick() {
  if (!ensureSupabaseReady()) {
    return;
  }

  const { error } = await supabaseState.client.auth.signOut();
  if (error) {
    setStatus(`Sign-out failed: ${formatSupabaseError(error)}`, "error");
    return;
  }

  supabaseState.user = null;
  supabaseState.activeProjectId = null;
  setCloudAuthState();
  setCloudControlState(false);
  updateProfileUiState();
  resetShareLink();
  resetCloudProjectList("Sign in to load projects");
  setProfileAuthStatus("Signed out.", "success");
  setStatus("Signed out successfully.", "success");
}

async function onSaveCloudProjectClick() {
  await saveProjectToCloud({ announce: true });
}

async function saveProjectToCloud(options = {}) {
  const { announce = true } = options;
  if (!ensureCloudSignedIn()) {
    return null;
  }
  if (shareState.readOnly) {
    setStatus("This shared project is read-only. Fork it first to edit and save.", "warning");
    return null;
  }

  const projectPayload = {
    owner_id: supabaseState.user.id,
    owner_username: getUserDisplayName(supabaseState.user),
    title: getProjectName(),
    source_text: getEditorValue(),
    updated_at: new Date().toISOString()
  };

  let record = null;

  if (supabaseState.activeProjectId) {
    const updateResult = await supabaseState.client
      .from(CLOUD_TABLE)
      .update(projectPayload)
      .eq("id", supabaseState.activeProjectId)
      .eq("owner_id", supabaseState.user.id)
      .select("id,title,share_slug,is_public,updated_at")
      .single();

    if (!updateResult.error) {
      record = updateResult.data;
    } else if (!isMissingRowError(updateResult.error)) {
      setStatus(`Cloud save failed: ${formatSupabaseError(updateResult.error)}`, "error");
      return null;
    } else {
      supabaseState.activeProjectId = null;
    }
  }

  if (!record) {
    const insertResult = await supabaseState.client
      .from(CLOUD_TABLE)
      .insert(projectPayload)
      .select("id,title,share_slug,is_public,updated_at")
      .single();

    if (insertResult.error) {
      setStatus(`Cloud save failed: ${formatSupabaseError(insertResult.error)}`, "error");
      return null;
    }

    record = insertResult.data;
  }

  supabaseState.activeProjectId = record.id;
  setShareLinkBySlug(record.share_slug || "");
  await refreshCloudProjectList();

  if (ui.cloudProjects) {
    ui.cloudProjects.value = record.id;
  }

  if (announce) {
    setStatus(`Saved "${record.title}" to cloud.`, "success");
  }

  return record.id;
}

async function onShareProjectClick() {
  if (!ensureCloudSignedIn()) {
    return;
  }
  if (shareState.readOnly) {
    setStatus("Only the project creator can re-share this link. Fork it to create your own.", "warning");
    return;
  }

  let projectId = supabaseState.activeProjectId;
  if (!projectId) {
    projectId = await saveProjectToCloud({ announce: false });
    if (!projectId) {
      return;
    }
  }

  const shareData = await assignProjectShareSlug(projectId);
  if (!shareData) {
    return;
  }

  setShareLinkBySlug(shareData.share_slug);
  await refreshCloudProjectList();
  window.text2scratchRum?.trackProjectShared({ project_id: projectId, shared: true });
  setStatus("Share link created. Anyone with the link can load this project.", "success");
}

async function assignProjectShareSlug(projectId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = generateShareSlug();
    const result = await supabaseState.client
      .from(CLOUD_TABLE)
      .update({
        is_public: true,
        share_slug: slug,
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId)
      .eq("owner_id", supabaseState.user.id)
      .select("id,share_slug")
      .single();

    if (!result.error) {
      return result.data;
    }

    if (!isDuplicateError(result.error)) {
      setStatus(`Share failed: ${formatSupabaseError(result.error)}`, "error");
      return null;
    }
  }

  setStatus("Share failed: Could not create a unique share slug.", "error");
  return null;
}

async function onCopyShareLinkClick() {
  const link = ui.shareLinkOutput?.value?.trim();
  if (!link) {
    setStatus("No share link is available yet.", "warning");
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    setStatus("Share link copied to clipboard.", "success");
  } catch (_error) {
    ui.shareLinkOutput.focus();
    ui.shareLinkOutput.select();
    setStatus("Clipboard permission blocked. Press Ctrl+C to copy the selected link.", "warning");
  }
}

async function onCloudProjectSelected() {
  if (!ensureCloudSignedIn()) {
    return;
  }

  const projectId = ui.cloudProjects?.value || "";
  if (!projectId) {
    return;
  }

  const { data, error } = await supabaseState.client
    .from(CLOUD_TABLE)
    .select("id,title,source_text,share_slug")
    .eq("id", projectId)
    .eq("owner_id", supabaseState.user.id)
    .single();

  if (error) {
    setStatus(`Load failed: ${formatSupabaseError(error)}`, "error");
    return;
  }

  setEditorValue(data.source_text || "");
  setProjectName(data.title || DEFAULT_PROJECT_NAME);
  supabaseState.activeProjectId = data.id;
  setShareLinkBySlug(data.share_slug || "");
  clearSharedMode();
  setStatus(`Loaded "${data.title}" from cloud.`, "success");
}

async function refreshCloudProjectList() {
  if (!ensureSupabaseReady() || !supabaseState.user) {
    return;
  }

  const { data, error } = await supabaseState.client
    .from(CLOUD_TABLE)
    .select("id,title,updated_at,is_public")
    .eq("owner_id", supabaseState.user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    setStatus(`Could not load cloud projects: ${formatSupabaseError(error)}`, "warning");
    return;
  }

  resetCloudProjectList(data.length > 0 ? "Select a cloud project" : "No cloud projects yet");
  ui.cloudProjects.disabled = false;

  data.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = formatCloudProjectLabel(project);
    ui.cloudProjects.appendChild(option);
  });

  if (supabaseState.activeProjectId) {
    ui.cloudProjects.value = supabaseState.activeProjectId;
  }
}

async function loadSharedProjectFromQuery() {
  if (!ensureSupabaseReady()) {
    return;
  }

  const url = new URL(window.location.href);
  const shareSlug = (url.searchParams.get(SHARE_QUERY_PARAM) || "").trim();
  if (!shareSlug) {
    return;
  }

  const { data, error } = await supabaseState.client
    .from(CLOUD_TABLE)
    .select("id,title,source_text,share_slug,owner_id,owner_username")
    .eq("share_slug", shareSlug)
    .eq("is_public", true)
    .single();

  if (error) {
    setStatus(`Shared project error: ${formatSupabaseError(error)}`, "error");
    return;
  }

  setEditorValue(data.source_text || "");
  setProjectName(data.title || "shared_project");
  supabaseState.activeProjectId = null;
  setShareLinkBySlug(data.share_slug || shareSlug);

  shareState.active = true;
  shareState.ownerId = String(data.owner_id || "");
  shareState.ownerName = String(data.owner_username || "").trim();
  const isOwner = Boolean(supabaseState.user?.id) && supabaseState.user.id === shareState.ownerId;
  setSharedReadOnly(!isOwner);
  renderSharedProjectNotice(data.title || "Untitled");

  const ownerLabel = shareState.ownerName || "Unknown creator";
  if (isOwner) {
    setStatus(`Loaded your shared project "${data.title || "Untitled"}".`, "success");
  } else {
    setStatus(`Loaded shared project "${data.title || "Untitled"}" by ${ownerLabel}. Editing is locked.`, "success");
  }
}

function setSharedReadOnly(readOnly) {
  shareState.readOnly = Boolean(readOnly);
  if (editorState.instance && editorState.usingMonaco) {
    editorState.instance.updateOptions({ readOnly: shareState.readOnly });
  }
  if (ui.input) {
    ui.input.readOnly = shareState.readOnly;
  }
  if (ui.projectName) {
    ui.projectName.readOnly = shareState.readOnly;
  }
  document.body.classList.toggle("shared-readonly", shareState.readOnly);
  setCloudControlState(Boolean(supabaseState.user));
}

function renderSharedProjectNotice(projectTitle) {
  if (!ui.sharedProjectNotice) {
    return;
  }

  const creator = shareState.ownerName || "Unknown creator";
  ui.sharedProjectNotice.hidden = false;
  ui.sharedProjectNotice.classList.toggle("read-only", shareState.readOnly);

  if (shareState.readOnly) {
    ui.sharedProjectNotice.innerHTML = `
      <p><strong>Shared Project:</strong> ${escapeHtml(projectTitle)} by ${escapeHtml(creator)}. This view is read-only.</p>
      <button id="forkSharedProjectBtn" type="button" class="secondary-btn">Fork to Editable Copy</button>
    `;

    const forkBtn = document.getElementById("forkSharedProjectBtn");
    forkBtn?.addEventListener("click", () => {
      clearSharedMode();
      setProjectName(`${sanitizeName(projectTitle, "project")}_fork`);
      setStatus(`Forked "${projectTitle}" to an editable local copy.`, "success");
    });
    return;
  }

  ui.sharedProjectNotice.innerHTML = `<p><strong>Shared Project:</strong> ${escapeHtml(projectTitle)} by ${escapeHtml(creator)}. You are the creator, editing is enabled.</p>`;
}

function clearSharedMode() {
  if (!shareState.active && !shareState.readOnly) {
    return;
  }

  shareState.active = false;
  shareState.readOnly = false;
  shareState.ownerId = "";
  shareState.ownerName = "";

  if (ui.sharedProjectNotice) {
    ui.sharedProjectNotice.hidden = true;
    ui.sharedProjectNotice.innerHTML = "";
  }

  if (editorState.instance && editorState.usingMonaco) {
    editorState.instance.updateOptions({ readOnly: false });
  }
  if (ui.input) {
    ui.input.readOnly = false;
  }
  if (ui.projectName) {
    ui.projectName.readOnly = false;
  }
  document.body.classList.remove("shared-readonly");
  setCloudControlState(Boolean(supabaseState.user));

  const url = new URL(window.location.href);
  if (url.searchParams.has(SHARE_QUERY_PARAM)) {
    url.searchParams.delete(SHARE_QUERY_PARAM);
    window.history.replaceState({}, "", url.toString());
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureSupabaseReady() {
  return Boolean(supabaseState.client);
}

function ensureCloudSignedIn() {
  if (!ensureSupabaseReady()) {
    setStatus("Cloud storage is not ready. Reload the page.", "warning");
    return false;
  }

  if (!supabaseState.user) {
    setStatus("Sign in first from the Account page login links.", "warning");
    return false;
  }

  return true;
}

function setCloudAuthState() {
  if (!ui.authState) {
    return;
  }

  if (supabaseState.user) {
    const displayName = getUserDisplayName(supabaseState.user);
    const email = String(supabaseState.user.email || "").trim();
    ui.authState.textContent = email ? `Signed in as ${displayName} (${email}).` : `Signed in as ${displayName}.`;
    return;
  }

  ui.authState.textContent = "Not signed in. Open Account to log in or sign up.";
}

function setCloudControlState(isSignedIn) {
  if (!hasCloudUi()) {
    return;
  }

  const canWrite = isSignedIn && !shareState.readOnly;
  ui.signOut.disabled = !isSignedIn;
  ui.saveCloud.disabled = !canWrite;
  ui.shareProject.disabled = !canWrite;
  ui.cloudProjects.disabled = !isSignedIn;
  ui.copyShareLink.disabled = !ui.shareLinkOutput.value.trim();
}

function resetCloudProjectList(placeholderText) {
  if (!ui.cloudProjects) {
    return;
  }

  ui.cloudProjects.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholderText;
  ui.cloudProjects.appendChild(option);
  ui.cloudProjects.value = "";
}

function resetShareLink() {
  setShareLinkBySlug("");
}

function setShareLinkBySlug(slug) {
  if (!ui.shareLinkOutput) {
    return;
  }

  if (!slug) {
    ui.shareLinkOutput.value = "";
    ui.copyShareLink.disabled = true;
    return;
  }

  ui.shareLinkOutput.value = buildShareUrl(slug);
  ui.copyShareLink.disabled = false;
}

function generateShareSlug() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 12);
}

function formatCloudProjectLabel(project) {
  const title = String(project?.title || "Untitled").trim() || "Untitled";
  const timestamp = formatTimestamp(project?.updated_at);
  const sharedLabel = project?.is_public ? " shared" : "";
  return `${title}${sharedLabel} (${timestamp})`;
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown time";
  }

  return date.toLocaleString();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensureToastHost() {
  if (toastState.host) {
    return toastState.host;
  }

  const host = document.createElement("div");
  host.className = "toast-stack";
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-atomic", "false");
  document.body.appendChild(host);
  toastState.host = host;
  return host;
}

function showToast(message, severity = "info") {
  const text = String(message || "").trim();
  if (!text) {
    return;
  }

  const host = ensureToastHost();
  const toast = document.createElement("div");
  toast.className = `toast toast-${severity}`;
  toast.setAttribute("role", severity === "error" ? "alert" : "status");
  toast.textContent = text.length > 220 ? `${text.slice(0, 220)}...` : text;
  host.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  window.setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 280);
  }, TOAST_LIFETIME_MS);
}

function setStatus(message, isWarning = false) {
  if (!ui.status) {
    return;
  }

  let severity = "info";

  if (typeof isWarning === "string") {
    severity = isWarning;
  } else if (isWarning === true) {
    severity = /\berror\b/i.test(message) ? "error" : "warning";
  } else if (/^(Created|Saved|Imported)\b/.test(message)) {
    severity = "success";
  }

  if (!["info", "success", "warning", "error"].includes(severity)) {
    severity = "info";
  }

  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
  ui.status.setAttribute("data-severity", severity);
  ui.status.setAttribute("aria-live", severity === "error" ? "assertive" : "polite");

  if (severity !== "info" || /^Ready\./.test(message) === false) {
    showToast(message, severity);
  }
}
