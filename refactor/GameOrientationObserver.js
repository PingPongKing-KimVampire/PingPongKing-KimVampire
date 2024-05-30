class GameOrientationObserver {
	constructor(callback) {
		this.callback = callback;
	}

	update(e) {
		this.callback(e);
	}
}

export default GameOrientationObserver;