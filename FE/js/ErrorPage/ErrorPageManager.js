import { isSocketConnected } from "../Error/Error.js";

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
		this.errorMessage = this.clientInfo.errorInfo?.message;
		this.clientInfo.errorInfo = null;
		this.app.innerHTML = this._getHTML();
		if (!isSocketConnected(this.clientInfo?.socket)) {
			if (this.clientInfo?.lobbySocket && isSocketConnected(this.clientInfo?.socket)) {
				this.clientInfo.lobbySocket.close();
			}
			if (this.clientInfo?.gameInfo?.pingpongRoomSocket && isSocketConnected(this.clientInfo?.socket)) {
				this.clientInfo?.gameInfo.pingpongRoomSocket.close();
			}
			if (this.clientInfo?.tournamentInfo?.tournamentSocket && isSocketConnected(this.clientInfo?.tournamentInfo?.tournamentSocket)) {
				this.clientInfo.tournamentInfo.tournamentSocket.close();
			}
			this.clientInfo = {};
		}
		this.clientInfo.errorInfo = null;
		this.setButtons();
	}

	setButtons() {
		const backButtonElement = document.querySelector("#backButton");
		backButtonElement.addEventListener("click", () => {
			history.back();
		});
		const homeButtonElement = document.querySelector("#homeButton");
		homeButtonElement.addEventListener("click", () => {
			if (isSocketConnected(this.clientInfo?.socket)) this.renderPage("lobby");
			else this.renderPage("login");
		});
	}

	_getHTML() {
		return `
			<div id="errorContainer">
				<div id="errorTitle">에러페이지입니다</div>
				<div id="errorCause">에러 이유 : ${this.errorMessage ? this.errorMessage : "접근할 수 없는 페이지"}</div>
				<div id="errorImage"></div>
				<div id="buttonContainer">
					<button id="backButton">뒤로 가기</button>
					<button id="homeButton">첫화면 가기</button>
				</div>
			</div>
        `;
	}
}

export default ErrorPageManager;
