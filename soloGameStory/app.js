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

const secondPlayBoard = document.querySelector('.subPlayBoard:nth-of-type(2)');
const paddle = {
	element: document.querySelector('.subPlayBoard:nth-of-type(2) .paddle')
};

function displayPaddle() {
	const paddleHeight = paddle.element.clientHeight;
	const paddleWidth = paddle.element.clientWidth;
	const boardHeight = secondPlayBoard.clientHeight;
	const boardWidth = secondPlayBoard.clientWidth;

	// 패들이 보드를 벗어나지 않도록 위치 조정하기
	const maxY = ((boardHeight - paddleHeight) / boardHeight) * 100;
	const maxX = ((boardWidth - paddleWidth) / boardWidth) * 100;
	paddle.y = Math.max(0, Math.min(paddle.y, maxY));
	paddle.x = Math.max(0, Math.min(paddle.x, maxX));

	// 실제 패들의 위치 변경하기
	paddle.element.style.top = `${paddle.y}%`;
	paddle.element.style.left = `${paddle.x}%`;
}

window.addEventListener('mousemove', (e) => {
	const paddleHeight = paddle.element.clientHeight;
	const paddleWidth = paddle.element.clientWidth;
	const boardHeight = secondPlayBoard.clientHeight;
	const boardWidth = secondPlayBoard.clientWidth;
	
	// 마우스 위치를 기준으로 패들의 새로운 위치 구하기
	const secondBoardRect = secondPlayBoard.getBoundingClientRect();
	paddle.y = ((e.clientY - secondBoardRect.top - (paddleHeight / 2)) / boardHeight) * 100;
	paddle.x = ((e.clientX - secondBoardRect.left - (paddleWidth / 2)) / boardWidth) * 100;

	displayPaddle(); // 패들 표시하기
})

// 탁구공 움직이기

function calculateMovement(distance, angle) {
	const angleRadians = (angle * Math.PI) / 180;
	const dx = Math.cos(angleRadians) * distance;
	const dy = Math.sin(angleRadians) * distance;
	return { dx, dy };
}

// TODO : left, right 왔다갔다하지 말고, left를 반전시키는 방법은?

const playBoard = document.querySelector('#playBoard');
const ball = {
	element: document.querySelector('#playBoard #ball'),
	init() {
		this.angle = 20;
		this.speed = 1;
		const movement = calculateMovement(this.speed, this.angle);
		this.dx = movement.dx;
		this.dy = movement.dy;

		const radiusX = ((this.element.clientWidth / 2) / playBoard.clientWidth) * 100;
		const radiusY = ((this.element.clientHeight / 2) / playBoard.clientHeight) * 100;
		this.cx = 50 - radiusX;
		this.cy = 50 - radiusY;
		if (isPortrait) {
			this.element.style.left = '';
			this.element.style.right = `${this.cy}%`;
			this.element.style.top = `${this.cx}%`;
		} else {
			this.element.style.right = '';
			this.element.style.left = `${this.cx}%`;
			this.element.style.top = `${this.cy}%`;
		}
	},
	changeRandomAngle() {
		let rand = Math.floor(Math.random() * 100) - 50; // -15 ~ 15도 사이에서 이동 방향 변화
		ball.angle = Math.max(0, Math.min(45, ball.angle + rand)); // 최소 각도 0, 최대 각도 45
	},
	reversalRandomDx() {
		this.changeRandomAngle();
		const movement = calculateMovement(ball.speed, ball.angle);
		ball.dx = ball.dx < 0 ? movement.dx : -movement.dx; // dx는 부호 반전
		ball.dy = ball.dy < 0 ? -movement.dy : movement.dy; // dy는 부호 유지
	}
};

let isPlaying = false;
let isMyTurn = true;
let isPortrait;
let ballMoveIntervalID;

function startGame(ball) {
	isPlaying = true;
	isMyTurn = true;
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

	// 공이 플레이어 편 벽과 충돌한 경우 (게임 중단 & 실점)
	// if ((isPortrait && boardRect.bottom <= ballRect.bottom) ||
	// 	(!isPortrait && boardRect.right <= ballRect.right)) {
	// 	stopGame(ball);
	// 	return;
	// }

	// 공이 플레이어 반대편 벽과 충돌한 경우 (턴 전환)
	if ((isPortrait && ballRect.top <= boardRect.top) ||
		(!isPortrait && ballRect.left <= boardRect.left)) {
		isMyTurn = true;
	}

	// 위, 아래쪽 벽과 충돌 시 dy 반전
	if ((isPortrait && (ballRect.left <= boardRect.left || boardRect.right <= ballRect.right)) ||
		(!isPortrait && (ballRect.top <= boardRect.top || boardRect.bottom <= ballRect.bottom))) {
		ball.dy = -ball.dy;
	}
	// 왼, 오른쪽 벽과 충돌 시 dx 반전
	if ((isPortrait && (ballRect.top <= boardRect.top || boardRect.bottom <= ballRect.bottom)) ||
		!isPortrait && (ballRect.left <= boardRect.left || boardRect.right <= ballRect.right)) {
		ball.dx = -ball.dx;
	}
}

function detectPaddle() {
	const ballRect = ball.element.getBoundingClientRect();
	const paddleRect = paddle.element.getBoundingClientRect();

	if (
		isPortrait === false &&
		ballRect.right >= paddleRect.left &&
		ballRect.left < paddleRect.left &&
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
		ball.reversalRandomDx();
		isMyTurn = false;
	}
}

function moveBall() {
	if (isPortrait) {
		ball.cy += ball.dx;
		ball.cx += ball.dy;
		ball.element.style.left = '';
		ball.element.style.right = `${ball.cx}%`;
	} else {
		ball.cy += ball.dy;
		ball.cx += ball.dx;
		ball.element.style.right = '';
		ball.element.style.left = `${ball.cx}%`;
	}
	ball.element.style.top = `${ball.cy}%`;

	detectWall();
	if (isMyTurn) {
		detectPaddle();
	}
}

// orienration이 바뀔 때마다 공의 위치 변경
function changeOrientation(e) {

	let temp = ball.cx;
	ball.cx = ball.cy;
	ball.cy = temp;

	ball.element.style.top = `${ball.cy}%`;
	if (e.matches) {
		isPortrait = true;
	} else {
		isPortrait = false;
	}
	if (!isPlaying) {
		ball.init(); // TODO : 볼 초기화를 했는데도 왜 방향을 바꾸고 새로고침하면 공이 살짝 이동할까?
	}
	displayPaddle();
}
const portraitQuery = window.matchMedia('(orientation: portrait)');
portraitQuery.addEventListener('change', changeOrientation);
changeOrientation(portraitQuery);

ball.init();

document.body.addEventListener('mousedown', () => {
	if (isPlaying) {
		stopGame(ball);
	} else {
		startGame(ball);
	}
})