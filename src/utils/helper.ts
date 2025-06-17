export const easeOutQuad = (t: number) => {
  return t * (2 - t);
};

export const leap = (start: number, end: number, t: number): number => {
  return start + t * (end - start);
};


export const getRandomColor = () => {
  const hue = 290 + Math.random() * 260;
  return "hsl(" + hue + ", 100%, 60%)";
}
