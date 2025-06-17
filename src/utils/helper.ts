export const easeOutQuad = (t: number) => {
  return t * (2 - t);
};

export const leap = (start: number, end: number, t: number): number => {
  return start + t * (start - end);
};
