import "./style.scss";

// we are creating a canvas base grid, which has the abilty to pan and zoom in/out.
const app = window as any;

// get the canvas element from the DOM
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;

// create a 2D rendering context for the canvas
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

interface Point {
  x: number;
  y: number;
}

interface Status {
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

const state: Status = {
  isDragging: false,
  startX: 0,
  startY: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  mouse: { x: 0, y: 0 },
  animationId: null,
  objcts: [],
};

const init = () => {
  resizeCanvas();
  addEventListener();
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.zoom, state.zoom);

  drawGrid(50);

  drawCanvasItems();

  drawPointer();

  ctx.restore();
};

function drawCanvasItems() {
  // Blue square
  ctx.fillStyle = "blue";
  ctx.fillRect(50, 50, 100, 100);

  // Red circle
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(250, 150, 70, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Pan Me!", 100, 280);
  ctx.fillText("(0,0) is here", 0, 0);
}

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  state.offsetX = canvas.width / 2;
  state.offsetY = canvas.height / 2;

  draw();
};

const addEventListener = () => {
  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("wheel", handleMouseWheel);
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
};

const drawGrid = (blockSize: number) => {
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;

  const { bottom, left, right, top } = getVisibleArea();

  // draw horizontal lines
  const startY = Math.floor(state.offsetY / state.zoom / blockSize) * blockSize;
  for (let i = -startY; i <= bottom; i += blockSize) {
    ctx.beginPath();
    ctx.moveTo(left, i);
    ctx.lineTo(right, i);
    ctx.stroke();
  }

  // draw vertical lines
  const startX = Math.floor(state.offsetX / state.zoom / blockSize) * blockSize;
  for (let i = -startX; i <= right; i += blockSize) {
    ctx.beginPath();
    ctx.moveTo(i, top);
    ctx.lineTo(i, bottom);
    ctx.stroke();
  }

  // draw x,y with blue color at 0,0
  ctx.strokeStyle = "skyblue";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-state.offsetX / state.zoom, 0);
  ctx.lineTo((canvas.width - state.offsetX) / state.zoom, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -state.offsetY / state.zoom);
  ctx.lineTo(0, (canvas.height - state.offsetY) / state.zoom);
  ctx.stroke();
  ctx.setLineDash([])
}


const drawPointer = () => {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(state.mouse.x, state.mouse.y, 10 / state.zoom, 0, Math.PI * 2);
  ctx.fill();
};

const getVisibleArea = () => {
  const rect = canvas.getBoundingClientRect();
  const left = -state.offsetX / state.zoom;
  const right = (rect.right - state.offsetX) / state.zoom;
  const top = -state.offsetY / state.zoom;
  const bottom = (rect.bottom - state.offsetY) / state.zoom;
  return { bottom, left, right, top };
};

function updateMouseLoc(clientX: number, clientY: number) {
  state.mouse.x = (clientX - state.offsetX) / state.zoom;
  state.mouse.y = (clientY - state.offsetY) / state.zoom;
}

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 1) {
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
  }
};
const handleMouseMove = (e: MouseEvent) => {
  updateMouseLoc(e.clientX, e.clientY);

  if (state.isDragging) {
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    state.offsetX += dx;
    state.offsetY += dy;

    state.startX = e.clientX;
    state.startY = e.clientY;
  }

  draw();
};

const handleMouseUp = (e: MouseEvent) => {
  state.isDragging = false;
};

function handleMouseWheel(this: HTMLCanvasElement, e: WheelEvent) {
  e.preventDefault();

  const delta = -Math.sign(e.deltaY) * 0.1;

  state.zoom = Math.max(0.1, Math.min(1, state.zoom + delta));

  updateMouseLoc(e.clientX, e.clientY);

  draw();
}

init();

// ui functions
app.addBlock = () => {
  console.log("block added");
};

app.resetView = () => {

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }

  const startTime = performance.now();
  const duration = 500;
  const startOffsetX = state.offsetX;
  const startOffsetY = state.offsetY;
  const startZoom = state.zoom;

  const animate = (now: any) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = easeOutQuad(progress);

    state.offsetX = startOffsetX + (canvas.width / 2 - startOffsetX) * easedProgress;
    state.offsetY = startOffsetY + (canvas.height / 2 - startOffsetY) * easedProgress;
    state.zoom = startZoom + (1 - startZoom) * easedProgress;

    

    draw();

    if (progress < 1) {
      state.animationId = requestAnimationFrame(animate);
    }
  };

  state.animationId = requestAnimationFrame(animate);

};

function easeOutQuad(t: number) {
  return t * (2 - t);
}
