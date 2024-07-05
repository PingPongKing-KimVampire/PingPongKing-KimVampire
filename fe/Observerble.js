class Observerble {
	constructor() {
		this.observers = {};
	}

	_subscribe(eventType, observer) {
		if (!this.observers[eventType]) this.observers[eventType] = [];
		this.observers[eventType].push(observer);
	}

	_unsubscibe(eventType, observer) {
		if (!this.observers[eventType]) return;
		this.observers[eventType] = this.observers[eventType].filter(obs => obs !== observer);
	}

	_notify(eventType, event) {
		if (!this.observers[eventType]) return;
		this.observers[eventType].forEach(obs => obs(event));
	}
}

export default Observerble;
