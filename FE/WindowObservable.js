import Observerble from "./Observerble.js";

class WindowObserverble extends Observerble {
	constructor() {
		super();
		this._setupWindowEventListener("resize");
		this._setupWindowEventListener("mousedown");
		this._setupWindowEventListener("mousemove");
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

	//subscribeResizeEvent로 이름 변경하기
	subscribeResize(observer) {
		this._subscribe("resize", observer);
	}
	subscribeMousedown(observer) {
		this._subscribe("mousedown", observer);
	}
	subscribeMousemove(observer) {
		this._subscribe("mousemove", observer);
	}
	subscribeOrientationChange(observer) {
		this._subscribe("orientationChange", observer);
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
}

const windowObservable = new WindowObserverble();

export default windowObservable;
