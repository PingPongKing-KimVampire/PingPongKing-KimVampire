class EventHandler {
	constructor() {
		this.observers = {};
	}

	// TODO : 이벤트가 등록되는 객체가 구분이 안 된다 window? button?
	setupEventListeners(eventType) {
		window.addEventListener(eventType, (event) => this.notify(eventType, event));
	}

	subscribe(eventType, observer) {
		if (!this.observers[eventType])
			this.observers[eventType] = [];
		this.observers[eventType].push(observer);
	}

	unsubscibe(eventType, observer) {
		if (!this.observers[eventType])
			return;
		this.observers[eventType] = this.observers[eventType].filter((obs) => obs !== observer);
	}

	notify(eventType, event) {
		this.observers[eventType].forEach((obs => obs.update(event)));
	}
}

export default EventHandler;