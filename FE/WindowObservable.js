import Observerble from "./Observerble.js";

class WindowObserverble extends Observerble {
	constructor() {
		super();
		this._setupWindowEventListener("resize");
		this._setupWindowEventListener("mousemove");
		this._setupWindowEventListener("touchmove");
		this._setupWindowEventListener("touchstart");
		this._setupWindowEventListener("keydown");
		this._setupWindowEventListener("keyup");
		this._setupPortraitChangeQueryListener();
	}

	_setupWindowEventListener(eventType) {
		window.addEventListener(eventType, event => this._notify(eventType, event));
	}

	getOrientation() {
		const orientation = this.portraitQuery.matches ? "portrait" : "landscape";
		return orientation;
	}

	_setupPortraitChangeQueryListener() {
		this.portraitQuery = window.matchMedia("(orientation: portrait)");
		this.portraitQuery.addEventListener("change", () => {
			const orientation = this.portraitQuery.matches ? "portrait" : "landscape";
			this._notify("orientationChange", orientation);
		});
	}

	subscribeResize(observer) {
		this._subscribe("resize", observer);
	}
	subscribeMousemove(observer) {
		this._subscribe("mousemove", observer);
	}
	subscribeOrientationChange(observer) {
		this._subscribe("orientationChange", observer);
	}
	subscribeTouchmove(observer) {
		this._subscribe("touchmove", observer);
	}
	subscribeTouchstart(observer) {
		this._subscribe("touchstart", observer);
	}
	subscribeKeyup(observer) {
		this._subscribe("keyup", observer);
	}
	subscribeKeydown(observer) {
		this._subscribe("keydown", observer);
	}
	unsubscribeResize(observer) {
		this._unsubscibe("resize", observer);
	}
	unsubscribeMousemove(observer) {
		this._unsubscibe("mousemove", observer);
	}
	unsubscribeOrientationChange(observer) {
		this._unsubscibe("orientationChange", observer);
	}
	unsubscribeTouchmove(observer) {
		this._unsubscibe("touchmove", observer);
	}
	unsubscribeTouchstart(observer) {
		this._unsubscibe("touchstart", observer);
	}
	unsubscribeKeyup(observer) {
		this._unsubscibe("keyup", observer);
	}
	unsubscribeKeydown(observer) {
		this._unsubscibe("keydown", observer);
	}
}

const windowObservable = new WindowObserverble();

export default windowObservable;
