const leftPingpongBoard = document.querySelector("#leftPingpongBoard");

//왼쪽 패들을 정확하게 감지하는 방법 추가 필요
const leftPaddle = document.querySelector(".paddle");
// leftPaddle.style.pointerEvents = "none";
// console.log(leftPaddle.style.pointerEvents);

leftPingpongBoard.addEventListener("mousemove", (e) => {
  
  //leftPingpongBoard의 
  const rect = leftPingpongBoard.getBoundingClientRect();

  // 패들 중앙을 기준으로 마우스 위치를 조정합니다.
  const paddleHeight = leftPaddle.clientHeight;
  const paddleWidth = leftPaddle.clientWidth;
  const boardHeight = leftPingpongBoard.clientHeight;
  const boardWidth = leftPingpongBoard.clientWidth;


  let newY = e.clientY - rect.top - paddleHeight / 2;
  let newX = e.clientX - rect.left - paddleWidth / 2;


  // 패들이 보드를 벗어나지 않도록 위치를 조정합니다.
  // 보드를 벗어난다면 가장 끝 자리로 함
  newY = Math.max(0, Math.min(newY, boardHeight - paddleHeight));
  newX = Math.max(0, Math.min(newX, boardWidth - paddleWidth));

  // 위치가 변경될 때만 업데이트하도록 최적화합니다.

  leftPaddle.style.top = `${newY}px`;
  leftPaddle.style.left = `${newX}px`;
});

//안하면 깜빡인다 왜 와이?
//leftPingpongBoard의 하위 요소이므로 마우스가 leftPaddle에 위치했을때 이벤트가 일어난다.
//이벤트 버블링으로 상위요소에 전파되는데, 이는 leftPingpongBoard의 이벤트 처리에서 leftPaddle이 target인 경우를 처리함을 의미함
//그렇다면 offset을 leftPingpongBoard가 아닌 leftPaddle을 기준으로 판단해 순간적으로 패들이 왼쪽 상단으로 올라간다.
//그러므로 stopPropagation을 통해 이벤트 버블링을 막아야한다.
leftPaddle.addEventListener("mousemove", (e) => {
  // leftPingpongBoard에서 이벤트 처리되도록 전달하지 않음
  // e.stopPropagation();
});

const myBall = document.createElement("div");
const pingpongBoard = document.querySelector("#pingpongBoard");

let ballX = 100;
myBall.style.width = "40px";
myBall.style.height = "40px";
myBall.style.backgroundColor = "blue";
myBall.style.borderRadius = "50%";
myBall.style.position = "absolute";
myBall.style.top = "70%";
myBall.style.left = `${ballX}px`;

pingpongBoard.append(myBall);

let moveInterval = null;
let next = "plus";

function moveBall() {
  if (next === "plus") ballX += 10;
  if (next === "minus") ballX -= 10;
  if (ballX > pingpongBoard.clientWidth) next = "minus";
  if (ballX < 0) next = "plus";
  // myBall.style.left = `${(ballX += 10)}px`;
  myBall.style.left = `${ballX}px`;
}

pingpongBoard.addEventListener("mousedown", () => {
  moveInterval = setInterval(moveBall, 3);
});

pingpongBoard.addEventListener("mouseup", () => {
  clearInterval(moveInterval);
  moveInterval = null;
});

pingpongBoard.addEventListener("mouseleave", () => {
  clearInterval(moveInterval);
  moveInterval = null;
});
