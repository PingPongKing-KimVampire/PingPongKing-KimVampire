const exitButton = document.querySelector(".exitButton");
const exitModal = document.querySelector(".exitModal");
const exitYesButton = document.querySelector(".exitModal .yesButton");
const exitNoButton = document.querySelector(".exitModal .noButton");

exitButton.addEventListener("click", () => {
  exitModal.style.display = "flex";
});

exitNoButton.addEventListener("click", () => {
  exitModal.style.display = "none";
});

exitYesButton.addEventListener("click", () => {
  console.log("exit!");
});

const paddle = document.querySelector(".paddle");
const body = document.querySelector("body");
const board = document.querySelector("#playBoard");

body.addEventListener("mousemove", (e) => {
  const boardStyle = window.getComputedStyle(board);
  const boardBorderLeftWidth = parseFloat(boardStyle.borderLeftWidth, 10);
  const boardBorderTopWidth = parseFloat(boardStyle.borderTopWidth, 10);

  console.log(boardBorderLeftWidth, boardBorderTopWidth);

  const boardRect = board.getBoundingClientRect();

  const paddleHeight = paddle.clientHeight;
  const paddleWidth = paddle.clientWidth;
  const boardHeight = board.clientHeight;
  const boardWidth = board.clientWidth;

  let paddleNextTop = e.clientY - boardRect.top;
  let paddleNextLeft = e.clientX - boardRect.left;

  paddleNextTop = Math.max(
    0,
    Math.min(boardHeight - paddleHeight, paddleNextTop)
  );

  paddleNextLeft = Math.max(
    0,
    Math.min(boardWidth - paddleWidth, paddleNextLeft)
  );

  paddle.style.top = `${paddleNextTop}px`;
  paddle.style.left = `${paddleNextLeft}px`;
});

let ballX = 100;
let ballY = 100;
let angle = 45;

function makeBall() {
  const myBall = document.createElement("div");
  myBall.style.width = "40px";
  myBall.style.height = "40px";
  myBall.style.backgroundColor = "white";
  myBall.style.borderRadius = "50%";
  myBall.style.position = "absolute";
  myBall.style.top = `${ballY}px`;
  myBall.style.left = `${ballX}px`;
  return myBall;
}

function calculateMovement(distance, angle) {
  const angleRadians = (angle * Math.PI) / 180;
  const dx = Math.cos(angleRadians) * distance;
  const dy = Math.sin(angleRadians) * distance;

  return { dx, dy };
}

function calculateNextPoint() {
  const expectY = ballY - dy;
  const expectX = ballX + dx;
  return { expectY, expectX };
}

let { dx, dy } = calculateMovement(2, 30);

function detectWall() {
  const boardHeight = board.clientHeight;
  const boardWidth = board.clientWidth;
  const ballHeight = ball.clientHeight;
  const ballWidth = ball.clientWidth;

  let { expectY, expectX } = calculateNextPoint();

  //ballY와 ballX가 모두 닿았을때 처리 필요
  if (expectY + ballHeight > boardHeight || expectY < 0) {
    dy = -dy;
  } else if (expectX + ballWidth > boardWidth || expectX < 0) {
    dx = -dx;
  }

  ballY = Math.max(0, Math.min(expectY, boardHeight - ballHeight));
  ballX = Math.max(0, Math.min(expectX, boardWidth - ballWidth));
}

function detectPaddle() {
  // 공의 위치와 크기 가져오기
  const ballRect = ball.getBoundingClientRect();
  // 패들의 위치와 크기 가져오기
  const paddleRect = paddle.getBoundingClientRect();

  // 패들의 각면과 공의 위치 비교
  if (
    ballRect.bottom >= paddleRect.top &&
    ballRect.top < paddleRect.top &&
    ballRect.right > paddleRect.left &&
    ballRect.left < paddleRect.right
  ) {
    dy = -dy;
    console.log("Collision on the top side of the paddle.");
  } else if (
    ballRect.top <= paddleRect.bottom &&
    ballRect.bottom > paddleRect.bottom &&
    ballRect.right > paddleRect.left &&
    ballRect.left < paddleRect.right
  ) {
    dy = -dy;
    console.log("Collision on the bottom side of the paddle.");
  } else if (
    ballRect.right >= paddleRect.left &&
    ballRect.left < paddleRect.left &&
    ballRect.top < paddleRect.bottom &&
    ballRect.bottom > paddleRect.top
  ) {
    dx = -dx;
    console.log("Collision on the left side of the paddle.");
  } else if (
    ballRect.left <= paddleRect.right &&
    ballRect.right > paddleRect.right &&
    ballRect.top < paddleRect.bottom &&
    ballRect.bottom > paddleRect.top
  ) {
    dx = -dx;
    console.log("Collision on the right side of the paddle.");
  }
  let { expectY, expectX } = calculateNextPoint(dy, dx);
  ballY = expectY;
  ballX = expectX;

  let point = calculateNextPoint(dy, dx);
  ballY = point.expectY;
  ballX = point.expectX;
}

function moveBall(ball) {
  return () => {
    detectWall();
    detectPaddle();

    const boardHeight = board.clientHeight;
    const boardWidth = board.clientWidth;
    const ballHeight = ball.clientHeight;
    const ballWidth = ball.clientWidth;

    ballY = Math.max(0, Math.min(ballY, boardHeight - ballHeight));
    ballX = Math.max(0, Math.min(ballX, boardWidth - ballWidth));
    ball.style.top = `${ballY}px`;
    ball.style.left = `${ballX}px`;
  };
}

const ball = makeBall();
let isInit = false;
board.append(ball);

board.addEventListener("mousedown", () => {
  if (!isInit) {
    setInterval(moveBall(ball), 5);
  }
  isInit = true;
});
