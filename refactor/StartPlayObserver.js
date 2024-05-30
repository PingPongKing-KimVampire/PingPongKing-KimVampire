class StartPlayObserver {
	constructor(callback) {
		this.callback = callback;
	}

	update() {
		this.callback();
	}
}

export default StartPlayObserver;