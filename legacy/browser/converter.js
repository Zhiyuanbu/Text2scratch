/**
 * Deprecated legacy demo converter.
 * The production workspace lives in `src/legacy/workspace/app.js`; this file
 * remains only as a constrained fallback for older static experiments.
 */
document.addEventListener("DOMContentLoaded", () => {
  const inputText = document.getElementById("inputText");
  const convertButton = document.getElementById("convertButton");
  const outputText = document.getElementById("outputText");

  if (!(convertButton instanceof HTMLButtonElement) || !(inputText instanceof HTMLTextAreaElement) || !(outputText instanceof HTMLElement)) {
    return;
  }

  convertButton.addEventListener("click", () => {
    const text = sanitizeLegacyConverterInput(inputText.value);
    outputText.textContent = `say "${text}" for 2 seconds`;
  });
});

function sanitizeLegacyConverterInput(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, 500)
    .replace(/"/g, '\\"');
}
