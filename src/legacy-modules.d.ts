declare module "*.js";

declare module "scratchblocks" {
  interface ScratchblocksInstance {
    appendStyles(): void;
    parse(code: string, options?: Record<string, unknown>): unknown;
    render(doc: unknown, options?: Record<string, unknown>): SVGElement;
  }

  export default function scratchblocksFactory(window: Window): ScratchblocksInstance;
}

interface Window {
  text2scratchRum?: {
    trackAccountCreated?: (context?: Record<string, string | number | boolean>) => void;
    trackProjectShared?: (context?: Record<string, string | number | boolean>) => void;
    trackRuntimeError?: (context?: Record<string, string | number | boolean>) => void;
    trackPerformanceMetric?: (context?: Record<string, string | number | boolean>) => void;
  };
}
