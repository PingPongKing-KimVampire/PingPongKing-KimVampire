class GameResizeObserver {
	constructor(callback) {
		this.callback = callback;
	}

	update(e) {
		this.callback(e);
	}
}

export default GameResizeObserver;