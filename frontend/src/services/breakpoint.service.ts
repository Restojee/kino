import { Service } from "../core/Service";

export type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

const BREAKPOINTS: Record<BreakpointName, number> = {
  xs: 480,
  sm: 640,
  md: 1280,
  lg: 1440,
  xl: 1600,
  xxl: 1920,
};

class BreakpointServiceClass extends Service {
  private width = window.innerWidth;

  constructor() {
    super();
    window.addEventListener("resize", () => {
      const w = window.innerWidth;
      if (w !== this.width) {
        this.width = w;
        this.emit();
      }
    });
  }

  /** True when viewport < breakpoint (matches SCSS `@include breakpoint($name)`) */
  below(name: BreakpointName): boolean {
    return this.width < BREAKPOINTS[name];
  }

  /** True when viewport >= breakpoint (matches SCSS `@include breakpoint-up($name)`) */
  above(name: BreakpointName): boolean {
    return this.width >= BREAKPOINTS[name];
  }

  get isMobile(): boolean {
    return this.below("md");
  }
}

export const BreakpointService = new BreakpointServiceClass();
