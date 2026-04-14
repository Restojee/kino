export const isString = (v: unknown): v is string => typeof v === "string";
export const isNumber = (v: unknown): v is number => typeof v === "number";
export const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
export const isNil = (v: unknown): v is null | undefined => v == null;
