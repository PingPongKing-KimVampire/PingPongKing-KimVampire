class ErrorPageManager {
	constructor(app, clientInfo, renderPage) {
		console.log("Error Page!");
		this.app = app;
		this.clientInfo = clientInfo;
		this.renderPage = renderPage;
	}

	connectPage() {}

	clearPage() {}

	initPage() {
		this.app.innerHTML = this._getHTML();
	}

	_getHTML() {
		return `
            <h1>접근할 수 없는 페이지 입니다.</h1>
        `;
	}
}

export default ErrorPageManager;
