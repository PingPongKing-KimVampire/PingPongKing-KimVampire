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
const paddle = {
	element: document.querySelector('.subPlayBoard:nth-of-type(1) .paddle')
};

document.body.addEventListener('mousemove', (e) => {
	const paddleHeight = paddle.element.clientHeight;
	const paddleWidth = paddle.element.clientWidth;
	const boardHeight = leftPlayBoard.clientHeight;
	const boardWidth = leftPlayBoard.clientWidth;
	
	// 마우스 위치를 기준으로 패들의 새로운 위치 구하기
	const leftBoardRect = leftPlayBoard.getBoundingClientRect();
	paddle.y = ((e.clientY - leftBoardRect.top - (paddleHeight / 2)) / boardHeight) * 100;
	paddle.x = ((e.clientX - leftBoardRect.left - (paddleWidth / 2)) / boardWidth) * 100;

	// 패들이 보드를 벗어나지 않도록 위치 조정하기
	const maxY = ((boardHeight - paddleHeight) / boardHeight) * 100;
	const maxX = ((boardWidth - paddleWidth) / boardWidth) * 100;
	paddle.y = Math.max(0, Math.min(paddle.y, maxY));
	paddle.x = Math.max(0, Math.min(paddle.x, maxX));

	// 실제 패들의 위치를 변경하기
	paddle.element.style.top = `${paddle.y}%`;
	paddle.element.style.left = `${paddle.x}%`;
})


// 탁구공 움직이기

function calculateMovement(distance, angle) {
	const angleRadians = (angle * Math.PI) / 180;
	const dx = Math.cos(angleRadians) * distance;
	const dy = Math.sin(angleRadians) * distance;
	return { dx, dy };
}

const playBoard = document.querySelector('#playBoard');
const ball = {
	element: document.querySelector('#playBoard #ball'),
	init() {
		const radiusX = ((this.element.clientWidth / 2) / playBoard.clientWidth) * 100;
		const radiusY = ((this.element.clientHeight / 2) / playBoard.clientHeight) * 100;
		this.cx = 50 - radiusX;
		this.cy = 50 - radiusY;
		this.angle = 30;
		this.speed = 0.3;
		const movement = calculateMovement(this.speed, this.angle);
		this.dx = movement.dx;
		this.dy = movement.dy;
		this.element.style.left = `${this.cx}%`;
		this.element.style.top = `${this.cy}%`;
	},
	changeRandomAngle() {
		let rand = Math.floor(Math.random() * 21) - 10; // -10 ~ 10도 사이에서 이동 방향 변화
		ball.angle = Math.max(0, Math.min(45, ball.angle + rand)); // 최소 각도 0, 최대 각도 45
	},
	reversalRandomDx() {
		this.changeRandomAngle();
		const movement = calculateMovement(ball.speed, ball.angle);
		ball.dx = ball.dx < 0 ? movement.dx : -movement.dx; // dx는 부호 반전
		ball.dy = ball.dy < 0 ? -movement.dy : movement.dy; // dy는 부호 유지
	},
	reversalRandomDy() {
		this.changeRandomAngle();
		const movement = calculateMovement(ball.speed, ball.angle);
		ball.dx = ball.dx < 0 ? -movement.dx : movement.dx; // dx는 부호 유지
		ball.dy = ball.dy < 0 ? movement.dy : -movement.dy; // dy는 부호 반전
	}
};

let isPlaying = false;
let isMyTurn = false;
let isPortrait = false;
let ballMoveIntervalID;

function startGame(ball) {
	isPlaying = true;
	isMyTurn = false;
	ballMoveIntervalID = setInterval(moveBall, 1);
	ball.init();
}

function stopGame(ball) {
	isPlaying = false;
	clearInterval(ballMoveIntervalID);
	ball.init();
}

function detectWall() {
	const ballRect = ball.element.getBoundingClientRect();
	const boardRect = playBoard.getBoundingClientRect();

	if (isPortrait) {

	} else {
		if (ballRect.left <= boardRect.left) {
			// stopGame(ball);
			// return;
			ball.dx = -ball.dx;
		}
		if (ballRect.top <= boardRect.top || boardRect.bottom <= ballRect.bottom) {
			ball.dy = -ball.dy;
		}
		if (boardRect.right <= ballRect.right) {
			isMyTurn = true; // 공이 오른쪽 벽과 만나면 턴 전환
			ball.dx = -ball.dx;
		}
	}
}

function detectPaddle() {
	const ballRect = ball.element.getBoundingClientRect();
	const paddleRect = paddle.element.getBoundingClientRect();

	if (
		isPortrait === false &&
		ballRect.left <= paddleRect.right && 
		ballRect.right > paddleRect.right &&
		ballRect.bottom > paddleRect.top &&
		ballRect.top < paddleRect.bottom
	) {
		ball.reversalRandomDx();
		isMyTurn = false;
	}

	if (
		isPortrait === true &&
		ballRect.top <= paddleRect.bottom &&
		ballRect.bottom > paddleRect.bottom &&
		ballRect.right > paddleRect.left &&
		ballRect.left < paddleRect.right
	) {
		ball.reversalRandomDy();
		isMyTurn = false;
	}
}

function moveBall() {
	ball.cy += ball.dy;
	ball.cx += ball.dx;

	ball.element.style.top = `${ball.cy}%`;
	if (isPortrait) {
		ball.element.style.right = `${ball.cx}`;
	} else {
		ball.element.style.left = `${ball.cx}%`;
	}

	detectWall();
	if (isMyTurn) {
		detectPaddle();
	}
}

// orienration이 바뀔 때마다 공의 위치 변경

// const portraitQuery = window.matchMedia('(orientation: portrait)');

// function changeOrientation(e) {
// 	if (e.matches) {
// 		isPortrait = true;
// 	} else {
// 		isPortrait = false;
// 	}
// }

// portraitQuery.addEventListener('change', changeOrientation);

// changeOrientation(portraitQuery);

ball.init();

document.body.addEventListener('mousedown', () => {
	if (isPlaying) {
		stopGame(ball);
	} else {
		startGame(ball);
	}
})