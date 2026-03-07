import { VALIDATOR_SAMPLE, validateText2Scratch } from "./lib/validator";

const ui = {
  codeInput: document.getElementById("apiCodeInput") as HTMLTextAreaElement | null,
  validateButton: document.getElementById("apiValidateBtn") as HTMLButtonElement | null,
  sampleButton: document.getElementById("apiSampleBtn") as HTMLButtonElement | null,
  copyButton: document.getElementById("apiCopyBtn") as HTMLButtonElement | null,
  summary: document.getElementById("apiSummary") as HTMLDivElement | null,
  output: document.getElementById("apiJsonOutput") as HTMLPreElement | null
};

init();

function init() {
  if (!ui.codeInput || !ui.output || !ui.summary) {
    return;
  }

  ui.validateButton?.addEventListener("click", runValidation);
  ui.sampleButton?.addEventListener("click", () => {
    ui.codeInput!.value = VALIDATOR_SAMPLE;
    runValidation();
  });
  ui.copyButton?.addEventListener("click", () => void copyResult());

  const params = new URLSearchParams(window.location.search);
  const prefill = params.get("code");
  if (prefill) {
    ui.codeInput.value = prefill;
  } else {
    ui.codeInput.value = VALIDATOR_SAMPLE;
  }

  runValidation();
}

function runValidation() {
  if (!ui.codeInput || !ui.output || !ui.summary) {
    return;
  }

  const result = validateText2Scratch(ui.codeInput.value);
  ui.output.textContent = JSON.stringify(result, null, 2);
  ui.summary.innerHTML = "";

  const pills = [
    {
      label: result.ok ? "Status: valid" : "Status: issues found",
      className: result.ok ? "status-success" : "status-warning"
    },
    {
      label: `Errors: ${result.summary.errors}`,
      className: result.summary.errors > 0 ? "status-error" : "status-info"
    },
    {
      label: `Warnings: ${result.summary.warnings}`,
      className: "status-info"
    },
    {
      label: `Lines: ${result.summary.lineCount}`,
      className: "status-info"
    }
  ];

  pills.forEach((pill) => {
    const node = document.createElement("span");
    node.className = `pill ${pill.className}`;
    node.textContent = pill.label;
    ui.summary?.appendChild(node);
  });
}

async function copyResult() {
  if (!ui.output?.textContent) {
    return;
  }

  try {
    await navigator.clipboard.writeText(ui.output.textContent);
    ui.copyButton!.textContent = "Copied";
    window.setTimeout(() => {
      if (ui.copyButton) {
        ui.copyButton.textContent = "Copy JSON";
      }
    }, 1200);
  } catch (_error) {
    ui.copyButton!.textContent = "Copy failed";
    window.setTimeout(() => {
      if (ui.copyButton) {
        ui.copyButton.textContent = "Copy JSON";
      }
    }, 1200);
  }
}
