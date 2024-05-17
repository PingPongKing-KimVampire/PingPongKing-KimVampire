class Paddle {
	constructor(paddleContainer) {
		this.element = paddleContainer.querySelector('.paddle');
		this.board = paddleContainer;
		this.updateOnResize();
		this.addEventListeners();
	}

	addEventListeners() {
		document.body.addEventListener('mousemove', this.move.bind(this));
		window.addEventListener('resize', this.updateOnResize.bind(this));
	}

	updateOnResize() {
		this.paddleHeight = this.element.clientHeight;
		this.paddleWidth = this.element.clientWidth;
		this.boardRect = this.board.getBoundingClientRect();
		this.boardHeight = this.board.clientHeight;
		this.boardWidth = this.board.clientWidth;
		this.maxY = ((this.boardHeight - this.paddleHeight) / this.boardHeight) * 100;
		this.maxX = ((this.boardWidth - this.paddleWidth) / this.boardWidth) * 100;
	}

	move(e) {
		// 마우스 위치에 따라 패들의 새로운 위치 구하기
		const yPos = e.clientY - this.boardRect.top - (this.paddleHeight / 2);
		const xPos = e.clientX - this.boardRect.left - (this.paddleWidth / 2);
		this.y = (yPos / this.boardHeight) * 100;
		this.x = (xPos / this.boardWidth) * 100;
		this.display();
	}

	display() {
		// 패들이 보드를 벗어나지 않도록 위치 조정하기
		this.y = Math.max(0, Math.min(this.y, this.maxY));
		this.x = Math.max(0, Math.min(this.x, this.maxX));
		// 실제 패들의 위치 변경하기
		this.element.style.top = `${this.y}%`;
		this.element.style.left = `${this.x}%`;
	}
}

export default Paddle;