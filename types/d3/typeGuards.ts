export const isElement = (baseType: d3.BaseType): baseType is Element =>
  !!(baseType as Element).id;
