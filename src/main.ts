import { easeOutQuad, getRandomColor, leap } from "./utils/helper";
import { ObjectType, type CanvasObject, type Status } from "./lnc/interfaces";
import "./style.scss";

// we are creating a canvas base grid, which has the abilty to pan and zoom in/out.
const app = window as any;

// get the canvas element from the DOM
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;

// create a 2D rendering context for the canvas
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const state: Status = {
  isDragging: false,
  startX: 0,
  startY: 0,
  zoom: 1,
  gridBlockSize: 50,
  offsetX: 0,
  offsetY: 0,
  mouse: { x: 0, y: 0 },
  animationId: null,
  objects: [],
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

  drawGrid();

  drawCanvasItems();

  // drawPointer();

  ctx.restore();
};




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
  canvas.addEventListener("mousedown", handleMouseDownForObject.bind(this));
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("wheel", handleMouseWheel);
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
};

const drawGrid = () => {

  const blockSize = state.gridBlockSize;

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


function drawCanvasItems() {

  state.objects.forEach((item) => {
    // draw the object

    switch (item.type) {
      case ObjectType.Rectangle:
        // draw a rectangle       

        ctx.beginPath();
        ctx.rect(item.loc.x, item.loc.y, item.meta.width, item.meta.height);
        ctx.fillStyle = item.meta.color;
        ctx.fill()

        if (item.isMouseOn) {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2 / state.zoom;
          ctx.stroke();
        }


        break;

      default:
        break;
    }

  });

}


const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 1) {
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
  }
};

const handleMouseDownForObject = (e: MouseEvent) => {
  e.preventDefault();
  // check if the mouse is over an object
  // if it is, set the object as the selected object
  if (e.button === 0) {

    state.objects.forEach((item, i) => {
      if (item.isMouseOn) {
        state.objectDraging = true;
        state.selectedObjectIndex = i;
      }
    });

  }
}



const handleMouseMove = (e: MouseEvent) => {
  const { gridBlockSize, objects, isDragging, mouse } = state;
  updateMouseLoc(e.clientX, e.clientY);

  // Handle canvas panning
  if (isDragging) {
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    state.offsetX += dx;
    state.offsetY += dy;
    state.startX = e.clientX;
    state.startY = e.clientY;
  }

  // Check for mouse over and handle object dragging
  const mouseX = mouse.x;
  const mouseY = mouse.y;
  let needsRedraw = false;

  for (let i = 0; i < objects.length; i++) {
    const item = objects[i];
    const { x, y } = item.loc;
    const { width, height } = item.meta;

    // Check if mouse is over the object
    const isMouseOver = (
      x < mouseX &&
      x + width > mouseX &&
      y < mouseY &&
      y + height > mouseY
    );

    // Only update if state changed to avoid unnecessary redraws
    if (item.isMouseOn !== isMouseOver) {
      item.isMouseOn = isMouseOver;
      needsRedraw = true;
    }

    // Handle object dragging
    if (i === state.selectedObjectIndex && state.objectDraging) {
      const newX = Math.floor((mouseX - width / 2) / gridBlockSize) * gridBlockSize;
      const newY = Math.floor((mouseY - height / 2) / gridBlockSize) * gridBlockSize;

      // Only update if position changed
      if (item.loc.x !== newX || item.loc.y !== newY) {
        item.loc.x = newX;
        item.loc.y = newY;
        needsRedraw = true;
      }
    }
  }

  // Only redraw if something changed
  if (needsRedraw || isDragging) {
    draw();
  }
};

const handleMouseUp = (e: MouseEvent) => {
  state.isDragging = false;
  state.objectDraging = false;
  state.selectedObjectIndex = undefined;
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


app.addBlock = () => {

  const { gridBlockSize, objects } = state;
  const visibleArea = getVisibleArea();

  // Calculate safe bounds (accounting for block size padding)
  const minX = visibleArea.left + gridBlockSize;
  const maxX = visibleArea.right - gridBlockSize;
  const minY = visibleArea.top + gridBlockSize;
  const maxY = visibleArea.bottom - gridBlockSize;

  // Generate random position snapped to grid
  const randomX = Math.random();
  const randomY = Math.random();

  // need to add a rectangle to the state.objects array
  const newBlock: CanvasObject = {
    type: ObjectType.Rectangle,
    isMouseOn: false,
    loc: {
      x: Math.floor(leap(minX, maxX, randomX) / gridBlockSize) * gridBlockSize,
      y: Math.floor(leap(minY, maxY, randomY) / gridBlockSize) * gridBlockSize
    },
    meta: {
      width: 100,
      height: gridBlockSize,
      color: getRandomColor(),
    }
  };

  objects.push(newBlock);

  draw();
};



