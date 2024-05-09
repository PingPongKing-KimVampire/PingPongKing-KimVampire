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


// 패들 움직이기

const leftPlayBoard = document.querySelector('.subPlayBoard:nth-of-type(1)');
const firstPaddle = document.querySelector('.subPlayBoard:nth-of-type(1) .paddle');

let firstPaddleY;
let firstPaddleX;

document.body.addEventListener('mousemove', (e) => {
	// leftPlayBoard의 뷰포트 위치 받기
	const rect = leftPlayBoard.getBoundingClientRect();

	// 마우스 위치를 기준으로 패들의 새로운 위치 구하기
	const paddleHeight = firstPaddle.clientHeight;
	const paddleWidth = firstPaddle.clientWidth;
	let newY = e.clientY - rect.top - paddleHeight / 2;
	let newX = e.clientX - rect.left - paddleWidth / 2;

	// 패들이 보드를 벗어나지 않도록 위치 조정하기
	const boardHeight = leftPlayBoard.clientHeight;
	const boardWidth = leftPlayBoard.clientWidth;
	firstPaddleY = Math.max(0, Math.min(newY, boardHeight - paddleHeight));
	firstPaddleX = Math.max(0, Math.min(newX, boardWidth - paddleWidth));

	// 실제 패들의 위치를 변경하기
	firstPaddle.style.top = `${firstPaddleY}px`;
	firstPaddle.style.left = `${firstPaddleX}px`;
})


// 탁구공 움직이기

const ball = document.querySelector('#playBoard #ball');
const playBoard = document.querySelector('#playBoard');

let ballRadius = ball.clientWidth / 2;
let ballX = playBoard.clientWidth / 2;
let ballY = playBoard.clientHeight / 2;
let ballXSpeed = 3;
let ballYSpeed = 3;

ball.style.top = `${ballY}px`;
ball.style.left = `${ballX}px`;

function ballMove() {
	ballY += ballYSpeed;
	ballX += ballXSpeed;

	// 벽과 충돌
	if (ballY < 0 || playBoard.clientHeight - ball.clientHeight < ballY)
		ballYSpeed = -ballYSpeed;
	if (ballX < 0 || playBoard.clientWidth - ball.clientWidth < ballX)
		ballXSpeed = -ballXSpeed;

	// 패들과 충돌
	if (firstPaddleY < ballY && ballY + ball.clientHeight < firstPaddleY + firstPaddle.clientHeight) {
		if (ballX <= firstPaddleX + firstPaddle.clientWidth && firstPaddleX < ballX)
			ballXSpeed = -ballXSpeed;
		else if (firstPaddleX <= ballX + ball.clientWidth && ballX + ball.clientWidth < firstPaddleX + firstPaddle.clientWidth)
			ballXSpeed = -ballXSpeed;
	} else if (firstPaddleX < ballX + ball.clientWidth/2 && ballX + ball.clientWidth/2 < firstPaddleX + firstPaddle.clientWidth) {
		if (firstPaddleY <= ballY + ball.clientHeight && ballY + ball.clientHeight < firstPaddleY + firstPaddle.clientHeight)
			ballYSpeed = -ballYSpeed;
		else if (ballY <= firstPaddleY + firstPaddle.clientHeight && firstPaddleY < ballY)
			ballYSpeed = -ballYSpeed;
	}

	ball.style.left = `${ballX}px`;
	ball.style.top = `${ballY}px`;
}

const ballMoveIntervalID = setInterval(ballMove, 1);

document.body.addEventListener('mousedown', () => {
	clearInterval(ballMoveIntervalID);
})