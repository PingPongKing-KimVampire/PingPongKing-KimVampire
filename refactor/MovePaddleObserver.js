class MovePaddleObserver {
	constructor(callback) {
		this.callback = callback;
	}

	update(e) {
		this.callback(e);
	}
}

export default MovePaddleObserver;