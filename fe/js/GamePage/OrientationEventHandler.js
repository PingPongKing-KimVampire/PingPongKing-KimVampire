class OrientationEventHandler {
	constructor() {
		this.observers = [];
		
		this.portraitQuery = window.matchMedia('(orientation: portrait)');
		this.portraitQuery.addEventListener('change', this.notify.bind(this));
	}

	subscribe(observer) {
		this.observers.push(observer);
	}

	unsubscibe(observer) {
		this.observers = this.observers.filter((obs) => obs !== observer);
	}

	notify() {
		const orientation = this.portraitQuery.matches ? 'portrait' : 'landscape';
		this.observers.forEach((obs => obs.update(orientation)));
	}
}

export default OrientationEventHandler;