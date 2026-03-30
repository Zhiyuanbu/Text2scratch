declare module "*.js";

declare module "scratchblocks" {
  interface ScratchblocksInstance {
    appendStyles(): void;
    parse(code: string, options?: Record<string, unknown>): unknown;
    render(doc: unknown, options?: Record<string, unknown>): SVGElement;
  }

  export default function scratchblocksFactory(window: Window): ScratchblocksInstance;
}
