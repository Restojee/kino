export interface StylesFunction {
  (modifier?: string): string;
  mod(modifier: string): string;
}

export function getStyles(componentName: string): StylesFunction {
  const cx: StylesFunction = ((modifier?: string): string => {
    if (!modifier) return componentName;
    return `${componentName} ${componentName}_${modifier}`;
  }) as StylesFunction;

  cx.mod = (modifier: string): string => `${componentName}_${modifier}`;
  return cx;
}
