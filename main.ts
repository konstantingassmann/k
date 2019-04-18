import vert from "./shader.vert";
import frag from "./shader.frag";

import {
  rect,
  createShader,
  createProgram,
  getAttribs,
  getUniforms,
  drawImage,
  createTexture,
  createTexCoordBuffer,
  createBuffer
} from "../utils";
import { debounce } from "lodash";
import tex from "./tex.jpg";
import lerp from "lerp";

const canvas = document.getElementById("paper") as HTMLCanvasElement;
const gl = canvas.getContext("webgl");

const textCanvas = document.getElementById("text") as HTMLCanvasElement;
const ctx = textCanvas.getContext("2d");

const cursorCanvas = document.getElementById("cursor") as HTMLCanvasElement;
const cursorCtx = cursorCanvas.getContext("2d");

const size = Math.min(window.innerWidth, window.innerHeight);

let texWidth = size * 0.75;
let texHeight = size * 0.75;
const image = new Image();
let textures = [];

const setCanvasSize = () => {
  const size = Math.min(window.innerWidth, window.innerHeight);

  texWidth = size * 0.75;
  texHeight = size * 0.75;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  textCanvas.width = texWidth;
  textCanvas.height = texHeight;

  cursorCanvas.width = window.innerWidth;
  cursorCanvas.height = window.innerHeight;
};

window.addEventListener(
  "resize",
  debounce(() => {
    setCanvasSize();

    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    ctx.fillText("K", textCanvas.width / 2, textCanvas.height / 2);
  }, 100)
);

let mouseX = 0;
let mouseY = 0;
let velocityX = 0;
let velocityY = 0;

window.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener("mouseenter", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

setCanvasSize();

ctx.beginPath();
ctx.textAlign = "left";
ctx.textBaseline = "middle";
ctx.textAlign = "center";
ctx.strokeStyle = "#3434ff";
ctx.lineWidth = 4;
ctx.font = `${texHeight}px sans-serif`;
ctx.strokeText("K", textCanvas.width / 2, textCanvas.height / 2);

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vert);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, frag);

const program = createProgram(gl, vertexShader, fragmentShader);

const attributes = getAttribs(gl, program, ["position", "texCoord"]);
const uniforms = getUniforms(gl, program, [
  "matrix",
  "image",
  "letter",
  "velocity",
  "image_matrix"
]);

const [imgBuffer, imageQuadLength] = createBuffer(gl, 8, 8);
const [letterBuffer] = createBuffer(gl);

gl.disable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

let backgroundX = 0;
let backgroundY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseScale = 0;
let currentMouseScale = 1;

const draw = () => {
  requestAnimationFrame(draw);

  if (
    mouseX < 10 ||
    mouseY < 10 ||
    mouseX > window.innerWidth - 10 ||
    mouseY > window.innerHeight - 10
  ) {
    currentMouseScale = 0;
  } else {
    currentMouseScale = 1;
  }

  velocityX = lerp(velocityX, lastMouseX - mouseX, 0.1);
  velocityY = lerp(velocityY, lastMouseY - mouseY, 0.1);
  mouseScale = lerp(mouseScale, currentMouseScale, 0.5);

  backgroundX = lerp(backgroundX, mouseX, 0.1);
  backgroundY = lerp(backgroundY, mouseY, 0.1);

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // draw the mouse circle
  cursorCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  cursorCtx.beginPath();
  cursorCtx.strokeStyle = "#3434ff";
  cursorCtx.lineWidth = 2;
  cursorCtx.arc(mouseX, mouseY, 10 * mouseScale, 0, Math.PI * 2);
  cursorCtx.stroke();

  gl.useProgram(program);

  // draw the image
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.uniform2fv(uniforms.velocity, [velocityX, velocityY]);

  drawImage({
    gl,
    x: backgroundX - image.width / 2,
    y: backgroundY - image.height / 2,
    w: image.width,
    h: image.height,
    positionBuffer: imgBuffer,
    texcoordBuffer: imgBuffer,
    matrixLocation: uniforms.matrix,
    textureLocation: uniforms.image,
    texLocation: attributes.texCoord,
    positionLocation: attributes.position
  });

  gl.drawArrays(gl.TRIANGLES, 0, imageQuadLength / 2);

  // draw the letter K
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  gl.uniform2fv(uniforms.velocity, [0, 0]);

  drawImage({
    gl,
    x: gl.canvas.width / 2 - texWidth / 2,
    y: gl.canvas.height / 2 - texHeight / 2,
    w: texWidth * 0.5,
    h: texHeight * 0.5,
    positionBuffer: letterBuffer,
    texcoordBuffer: letterBuffer,
    matrixLocation: uniforms.matrix,
    textureLocation: uniforms.image,
    texLocation: attributes.texCoord,
    positionLocation: attributes.position
  });

  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

image.onload = () => {
  mouseX = window.innerWidth / 2 + image.width / 2;
  mouseY = window.innerHeight / 2;

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  backgroundX = mouseX;
  backgroundY = mouseY;

  textures = [createTexture(gl, image), createTexture(gl, ctx.canvas)];
  requestAnimationFrame(draw);
};
image.src = tex;
