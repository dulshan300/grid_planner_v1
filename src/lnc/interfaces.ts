export interface Point {
  x: number;
  y: number;
}
export interface Status {
  isDragging: boolean;
  startX: number;
  startY: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  mouse: Point;
  animationId: null | number;
  objcts: Array<Object>;
}
