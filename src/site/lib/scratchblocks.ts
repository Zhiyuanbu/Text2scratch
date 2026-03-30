import scratchblocksFactory from "scratchblocks";

let scratchblocks: ReturnType<typeof scratchblocksFactory> | null = null;
let stylesAttached = false;

export function renderScratchblocksInto(
  element: HTMLElement,
  code: string,
  options: { inline?: boolean; scale?: number } = {}
) {
  const inline = options.inline ?? false;
  const source = code.trim();

  element.replaceChildren();
  element.classList.toggle("scratchblocks-host-inline", inline);

  if (!source) {
    return;
  }

  try {
    const instance = getScratchblocks();
    const doc = instance.parse(source, { inline, languages: ["en"] });
    const svg = instance.render(doc, {
      inline,
      languages: ["en"],
      scale: options.scale ?? 1,
      style: "scratch3"
    });

    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", source.replace(/\s+/g, " ").trim());
    svg.style.display = "block";
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";

    element.appendChild(svg);
  } catch (error) {
    const fallback = document.createElement(inline ? "span" : "div");
    fallback.className = "scratchblocks-fallback";
    fallback.textContent = source;
    fallback.title = error instanceof Error ? error.message : "Could not render scratchblocks preview.";
    element.appendChild(fallback);
  }
}

export { renderScratchblocksInto as renderScratchblocksToElement };

function getScratchblocks() {
  if (!scratchblocks) {
    scratchblocks = scratchblocksFactory(window);
  }

  if (!stylesAttached) {
    scratchblocks.appendStyles();
    stylesAttached = true;
  }

  return scratchblocks;
}
