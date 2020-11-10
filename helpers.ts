const getStringAsNumberOrNull = (param: string | null): number | null =>
  Number.isNaN(Number(param)) ? null : Number(param);

const setElementDisplayValue = (
  el: HTMLElement | null,
  value: string
): void => {
  if (el?.style?.display) {
    el.style.display = value;
  }
};

const defineSelection = (
  coast: boolean,
  port: boolean,
  river: boolean
): Burg[] => {
  const cells = pack.cells;
  const burgs = pack.burgs.slice(1) as Burg[];

  if (port && river) {
    return burgs.filter((burg) => burg.port && cells.r[burg.cell]);
  }

  if (!port && coast && river) {
    return burgs.filter(
      (b) => !b.port && cells.t[b.cell] === 1 && cells.r[b.cell]
    );
  }

  if (!coast && !river) {
    return burgs.filter((b) => cells.t[b.cell] !== 1 && !cells.r[b.cell]);
  }

  if (!coast && river) {
    return burgs.filter((b) => cells.t[b.cell] !== 1 && cells.r[b.cell]);
  }

  if (coast && river) {
    return burgs.filter((b) => cells.t[b.cell] === 1 && cells.r[b.cell]);
  }

  return [];
};
