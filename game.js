const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const welcome = document.getElementById("welcome");
const playButton = document.getElementById("play");
const resetButton = document.getElementById("reset");
const coords = document.getElementById("coords");
const position = document.getElementById("position");
const message = document.getElementById("message");
const fpsLabel = document.getElementById("fps");

const WORLD_W = 1800;
const WORLD_H = 1400;
const TILE = 40;
const keys = new Set();
const player = { x: WORLD_W / 2, y: WORLD_H / 2, w: 22, h: 28, speed: 220, facing: "down", walkTime: 0 };
let started = false;
let lastTime = 0;
let fpsTimer = 0;
let frames = 0;
let shownFps = 60;
let objects = [];
let camera = { x: 0, y: 0 };

function seededObjects() {
  // Fixed positions make the same little world appear on every reload.
  let seed = 8128;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const result = [];
  for (let i = 0; i < 150; i++) {
    const x = 30 + rand() * (WORLD_W - 60);
    const y = 30 + rand() * (WORLD_H - 60);
    if (Math.abs(x - player.x) < 120 && Math.abs(y - player.y) < 120) continue;
    const roll = rand();
    result.push({ x, y, type: roll < .58 ? "tree" : roll < .78 ? "rock" : "flower", size: 10 + rand() * 8 });
  }
  // A little path near spawn.
  for (let i = -3; i <= 3; i++) {
    for (let j = -1; j <= 1; j++) {
      result.push({ x: player.x + i * TILE, y: player.y + j * TILE, type: "path", size: TILE / 2 });
    }
  }
  return result;
}
objects = seededObjects();

function start() {
  started = true;
  welcome.classList.add("hidden");
  canvas.focus();
  message.textContent = "Go explore! The world is yours.";
  lastTime = 0;
  requestAnimationFrame(loop);
}
function reset() {
  player.x = WORLD_W / 2;
  player.y = WORLD_H / 2;
  player.facing = "down";
  player.walkTime = 0;
  message.textContent = "Back at spawn. Where to now?";
  if (!started) draw();
}
playButton.addEventListener("click", start);
resetButton.addEventListener("click", reset);

document.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  keys.add(key);
  if (!started && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)) start();
});
document.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});
window.addEventListener("blur", () => keys.clear());

function update(dt) {
  let dx = 0, dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;
  if (dx !== 0 || dy !== 0) {
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;
    player.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    player.walkTime += dt * 12;
  }
  player.x = Math.max(player.w / 2, Math.min(WORLD_W - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(WORLD_H - player.h / 2, player.y));
  camera.x = Math.max(0, Math.min(WORLD_W - canvas.width, player.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(WORLD_H - canvas.height, player.y - canvas.height / 2));
  coords.textContent = `X: ${Math.round(player.x)} · Y: ${Math.round(player.y)}`;
  position.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
}
function drawGround() {
  ctx.fillStyle = "#78c96a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const startX = Math.floor(camera.x / TILE) * TILE;
  const startY = Math.floor(camera.y / TILE) * TILE;
  for (let y = startY; y < camera.y + canvas.height + TILE; y += TILE) {
    for (let x = startX; x < camera.x + canvas.width + TILE; x += TILE) {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      ctx.fillStyle = ((tx * 7 + ty * 13) % 5 === 0) ? "#73c465" : "#78c96a";
      ctx.fillRect(x - camera.x, y - camera.y, TILE, TILE);
      ctx.fillStyle = "rgba(28, 105, 56, .13)";
      ctx.fillRect(x - camera.x + 5, y - camera.y + 7, 2, 2);
      ctx.fillRect(x - camera.x + 26, y - camera.y + 29, 2, 2);
    }
  }
}
function drawPath(obj) {
  const x = obj.x - camera.x, y = obj.y - camera.y;
  ctx.fillStyle = "#c8ad78";
  ctx.fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
  ctx.fillStyle = "#b99a67";
  ctx.fillRect(x - TILE / 2 + 5, y - TILE / 2 + 8, 4, 3);
  ctx.fillRect(x + 7, y + 8, 3, 3);
}
function drawTree(obj) {
  const x = Math.round(obj.x - camera.x), y = Math.round(obj.y - camera.y);
  ctx.fillStyle = "rgba(26, 66, 40, .22)";
  ctx.fillRect(x - 13, y + 9, 28, 8);
  ctx.fillStyle = "#754b32";
  ctx.fillRect(x - 4, y - 2, 9, 21);
  ctx.fillStyle = "#236c45";
  ctx.fillRect(x - 15, y - 19, 30, 25);
  ctx.fillStyle = "#2f8950";
  ctx.fillRect(x - 10, y - 26, 21, 19);
  ctx.fillStyle = "#49a85d";
  ctx.fillRect(x - 6, y - 22, 8, 8);
}
function drawRock(obj) {
  const x = Math.round(obj.x - camera.x), y = Math.round(obj.y - camera.y);
  ctx.fillStyle = "#6f8280";
  ctx.fillRect(x - 11, y - 7, 22, 14);
  ctx.fillStyle = "#9eb0a3";
  ctx.fillRect(x - 7, y - 7, 10, 4);
  ctx.fillStyle = "#526a68";
  ctx.fillRect(x + 4, y + 1, 7, 6);
}
function drawFlower(obj) {
  const x = Math.round(obj.x - camera.x), y = Math.round(obj.y - camera.y);
  ctx.fillStyle = "#2f8d4d"; ctx.fillRect(x, y, 2, 10);
  ctx.fillStyle = "#ffe98b";
  ctx.fillRect(x - 4, y - 4, 4, 4); ctx.fillRect(x + 2, y - 4, 4, 4);
  ctx.fillRect(x - 1, y - 7, 4, 4); ctx.fillRect(x - 1, y - 1, 4, 4);
  ctx.fillStyle = "#e57db4"; ctx.fillRect(x - 1, y - 3, 4, 4);
}
function drawPlayer() {
  const x = Math.round(player.x - camera.x), y = Math.round(player.y - camera.y);
  const bob = (keys.size && started) ? Math.round(Math.sin(player.walkTime) * 2) : 0;
  // Shadow
  ctx.fillStyle = "rgba(26, 59, 39, .25)";
  ctx.fillRect(x - 10, y + 10, 21, 6);
  // Boots and body
  ctx.fillStyle = "#273a62";
  ctx.fillRect(x - 8, y + 5 + bob, 6, 9); ctx.fillRect(x + 2, y + 5 - bob, 6, 9);
  ctx.fillStyle = "#f0c66d";
  ctx.fillRect(x - 9, y - 8 + bob, 18, 16);
  // Hair
  ctx.fillStyle = "#563a2c";
  ctx.fillRect(x - 9, y - 12 + bob, 18, 7);
  ctx.fillRect(x - 7, y - 15 + bob, 14, 4);
  // Face and eyes, direction-aware
  ctx.fillStyle = "#2b2728";
  if (player.facing === "down") {
    ctx.fillRect(x - 5, y - 2 + bob, 3, 3); ctx.fillRect(x + 3, y - 2 + bob, 3, 3);
  } else if (player.facing === "left") {
    ctx.fillRect(x - 7, y - 2 + bob, 3, 3);
  } else if (player.facing === "right") {
    ctx.fillRect(x + 4, y - 2 + bob, 3, 3);
  }
  // Backpack
  ctx.fillStyle = "#4f9d86";
  if (player.facing === "left") ctx.fillRect(x + 6, y - 4 + bob, 5, 9);
  else ctx.fillRect(x - 11, y - 4 + bob, 5, 9);
}
function draw() {
  drawGround();
  const visible = objects.filter(o => o.x > camera.x - 40 && o.x < camera.x + canvas.width + 40 && o.y > camera.y - 40 && o.y < camera.y + canvas.height + 40);
  visible.filter(o => o.type === "path").forEach(drawPath);
  const things = visible.filter(o => o.type !== "path").sort((a,b) => a.y - b.y);
  let playerDrawn = false;
  for (const o of things) {
    if (!playerDrawn && o.y > player.y) { drawPlayer(); playerDrawn = true; }
    if (o.type === "tree") drawTree(o);
    else if (o.type === "rock") drawRock(o);
    else drawFlower(o);
  }
  if (!playerDrawn) drawPlayer();
}
function loop(timestamp) {
  if (!started) return;
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  update(dt);
  draw();
  frames++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    shownFps = Math.round(frames / fpsTimer);
    fpsLabel.textContent = shownFps;
    frames = 0; fpsTimer = 0;
  }
  requestAnimationFrame(loop);
}
draw();
