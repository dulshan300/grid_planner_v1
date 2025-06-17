export interface Point {
  x: number;
  y: number;
}
export interface Status {
  isDragging: boolean;
  startX: number;
  startY: number;
  zoom: number;
  gridBlockSize: number;
  offsetX: number;
  offsetY: number;
  mouse: Point;
  animationId: null | number;
  objectDraging?: boolean;
  selectedObjectIndex?: number;
  objects: Array<CanvasObject>;

}

export enum ObjectType {
  Circle,
  Rectangle,
  Line
}


export interface CanvasObject {
  type: ObjectType;
  loc: Point
  meta: Object | any;
  isMouseOn?: boolean;
};
