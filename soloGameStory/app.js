const exitButton = document.querySelector('.exitButton');
const exitModal = document.querySelector('.exitModal');
const exitYesButton = document.querySelector('.exitModal .yesButton');
const exitNoButton = document.querySelector('.exitModal .noButton');

exitButton.addEventListener('click', () => {
	exitModal.style.display = 'flex';
})

exitNoButton.addEventListener('click', () => {
	exitModal.style.display = 'none';
})

exitYesButton.addEventListener('click', () => {
	console.log('exit!');
})

console.log("으아아앙");

// 패들 움직이기

const leftPlayBoard = document.querySelector('.subPlayBoard:nth-of-type(1)');
const paddle = {
	element: document.querySelector('.subPlayBoard:nth-of-type(1) .paddle')
};

document.body.addEventListener('mousemove', (e) => {
	const paddleHeight = paddle.element.clientHeight;
	const paddleWidth = paddle.element.clientWidth;
	const boardHeight = leftPlayBoard.clientHeight;
	const boardWidth = leftPlayBoard.clientWidth;

	// leftPlayBoard의 뷰포트 위치 받기
	const rect = leftPlayBoard.getBoundingClientRect();

	// 마우스 위치를 기준으로 패들의 새로운 위치 구하기
	paddle.y = e.clientY - rect.top - paddleHeight / 2;
	paddle.x = e.clientX - rect.left - paddleWidth / 2;

	// 패들이 보드를 벗어나지 않도록 위치 조정하기
	paddle.y = Math.max(0, Math.min(paddle.y, boardHeight - paddleHeight));
	paddle.x = Math.max(0, Math.min(paddle.x, boardWidth - paddleWidth));

	// 실제 패들의 위치를 변경하기
	paddle.element.style.top = `${paddle.y}px`;
	paddle.element.style.left = `${paddle.x}px`;
})


// 탁구공 움직이기

function calculateMovement(distance, angle) {
	const angleRadians = (angle * Math.PI) / 180;
	const dx = Math.cos(angleRadians) * distance;
	const dy = Math.sin(angleRadians) * distance;
	return { dx, dy };
}

function initBall(ball) {
	ball.cx = playBoard.clientWidth/2 - ball.element.clientWidth/2;
	ball.cy = playBoard.clientHeight/2 - ball.element.clientWidth/2;
	ball.angle = 45;
	ball.speed = 3;
	const movement = calculateMovement(ball.speed, ball.angle);
	ball.dx = movement.dx;
	ball.dy = movement.dy;
	ball.element.style.top = `${ball.cy}px`;
	ball.element.style.left = `${ball.cx}px`;
}

const playBoard = document.querySelector('#playBoard');
const ball = {
	element: document.querySelector('#playBoard #ball'),
	angle: 45,
	speed: 3
};
initBall(ball);

function detectWall() {
	const boardH = playBoard.clientHeight;
	const boardW = playBoard.clientWidth;
	const ballH = ball.element.clientHeight;
	const ballW = ball.element.clientWidth;

	// 공이 왼쪽 벽과 만나면 초기 위치로 리셋
	if (ball.cx <= 0) {
		isPlaying = false;
		clearInterval(ballMoveIntervalID);
		initBall(ball);
		return;
	}
	// 공이 위, 아래, 오른쪽 벽과 만나면 이동 방향 전환
	if (ball.cy < 0 || boardH - ballH < ball.cy)
		ball.dy = -ball.dy;
	if (boardW - ballW < ball.cx)
		ball.dx = -ball.dx;
}

function detectPaddle() {
	const ballRect = ball.element.getBoundingClientRect();
	const paddleRect = paddle.element.getBoundingClientRect();
	if (
		ballRect.left <= paddleRect.right && 
		ballRect.right > paddleRect.right &&
		ballRect.bottom > paddleRect.top &&
		ballRect.top < paddleRect.bottom
	) {
		ball.dx = -ball.dx;
	}
}

function moveBall() {
	ball.cy += ball.dy;
	ball.cx += ball.dx;
	ball.element.style.top = `${ball.cy}px`;
	ball.element.style.left = `${ball.cx}px`;
	detectWall();
	detectPaddle();
}

let isPlaying = false;
let ballMoveIntervalID;

document.body.addEventListener('mousedown', () => {
	if (isPlaying) {
		isPlaying = false;
		clearInterval(ballMoveIntervalID);
		initBall(ball);
	} else {
		isPlaying = true;
		ballMoveIntervalID = setInterval(moveBall, 1);
	}
})