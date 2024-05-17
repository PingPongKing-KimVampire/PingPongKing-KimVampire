class Paddle {
	constructor(paddleContainer) {
		this.element = paddleContainer.querySelector('.paddle');
		this.board = paddleContainer;
		this.addEventListeners();
	}

	addEventListeners() {
		document.body.addEventListener('mousemove', this.move.bind(this));
		// TODO : window 아니어도 괜찮을까?
		// TODO : 이건 뭘까? window.addEventListener('mousemove', this.moveHandle.bind(this));
	}

	move(e) {
		const boardRect = this.board.getBoundingClientRect();
		const paddleHeight = this.element.clientHeight;
		const paddleWidth = this.element.clientWidth;
		const boardHeight = this.board.clientHeight;
		const boardWidth = this.board.clientWidth;

		// 마우스 위치에 따라 패들의 새로운 위치 구하기
		this.y = ((e.clientY - boardRect.top - (paddleHeight / 2)) / boardHeight) * 100;
		this.x = ((e.clientX - boardRect.left - (paddleWidth / 2)) / boardWidth) * 100;
		this.display();
	}

	display() {
		const paddleHeight = this.element.clientHeight;
		const paddleWidth = this.element.clientWidth;
		const boardHeight = this.board.clientHeight;
		const boardWidth = this.board.clientWidth;
	
		// 패들이 보드를 벗어나지 않도록 위치 조정하기
		const maxY = ((boardHeight - paddleHeight) / boardHeight) * 100;
		const maxX = ((boardWidth - paddleWidth) / boardWidth) * 100;
		this.y = Math.max(0, Math.min(this.y, maxY));
		this.x = Math.max(0, Math.min(this.x, maxX));
	
		// 실제 패들의 위치 변경하기
		this.element.style.top = `${this.y}%`;
		this.element.style.left = `${this.x}%`;
	}
}

export default Paddle;