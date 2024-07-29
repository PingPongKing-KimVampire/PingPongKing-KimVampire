import windowObservable from "../../WindowObservable.js";
import { LobbyConnectionError, isSocketConnected } from "../Error/Error.js";

class WaitingTournamentPageManager {
	constructor(app, clientInfo, renderPage) {
		console.log("WaitingTournament Page!");
		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;
		this.renderPage = renderPage;
	}

	async connectPage() {
		if (isSocketConnected(this.clientInfo?.lobbySocket)) throw new LobbyConnectionError();
	}

	clearPage() {
		this._unsubscribeWindow();
		if (this.clientInfo.nextPage === "lobby") {
			this._removePageListener();
			return;
		}
		this.clientInfo.lobbySocket.close();
		this.clientInfo.lobbySocket = null;
	}

	async initPage() {
		this._adjustButtonSize();
		this._listenNotifyMatchMakingComplete();
		this._setLeaveWaitingTournamentButton();
	}

	//어떠한 경우에도 listener를 remove하는 메서드 필요(페이지 이동 시 호출)
	_removePageListener() {
		this.clientInfo.lobbySocket.removeEventListener("click", this.NotifyMatchMakingCompleteListener);
	}

	_listenNotifyMatchMakingComplete() {
		const lobbySocket = this.clientInfo.lobbySocket;
		this.NotifyMatchMakingCompleteListener = async messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (event === "notifyMatchMakingComplete") {
				console.log("매치매이킹 성공!");
				const tournamentId = content.tournamentId;
				this.clientInfo.tournamentInfo = {
					isInit: false,
					tournamentId,
				};
				this.renderPage("tournament");
			}
		};
		lobbySocket.addEventListener("message", this.NotifyMatchMakingCompleteListener);
	}

	_setLeaveWaitingTournamentButton() {
		const leaveWaitingTournamentButton = document.querySelector(".leaveWaitingTournamentButton");
		leaveWaitingTournamentButton.addEventListener("click", async () => {
			const cancelMatchMakingMessage = {
				event: "cancelMatchMaking",
				content: {},
			};
			this.clientInfo.lobbySocket.send(JSON.stringify(cancelMatchMakingMessage));
			await new Promise(resolve => {
				const listener = messageEvent => {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "cancelMatchMakingResponse" && content.message === "OK") {
						this.clientInfo.lobbySocket.removeEventListener("message", listener);
						resolve();
					}
				};
				this.clientInfo.lobbySocket.addEventListener("message", listener);
			});
			history.back();
		});
	}

	_subscribeWindow() {
		this._adjustButtonSizeRef = this._adjustButtonSize.bind(this);
		windowObservable.subscribeResize(_adjustButtonSizeRef);
	}

	_unsubscribeWindow() {
		windowObservable.unsubscribeResize(this._adjustButtonSizeRef);
	}

	_adjustButtonSize() {
		const leaveWaitingTournamentButton = document.querySelector(".leaveWaitingTournamentButton");
		const viewWidth = window.innerWidth;
		const viewHeight = window.innerHeight;

		if (viewWidth < viewHeight) {
			leaveWaitingTournamentButton.style.height = "4vh";
			leaveWaitingTournamentButton.style.width = "calc(4vh * 5 / 1)";
		} else {
			leaveWaitingTournamentButton.style.width = "20vw";
			leaveWaitingTournamentButton.style.height = "calc(20vw * 1 / 4)";
		}
	}

	_getHTML() {
		return `
        <div class="waitingTournament">
            <div class="waitingTournamentContainer">
                ${this._getLeaveWaitingTournamentButtonHtml()}
                ${this.getWaitingQueueContainer()}
            </div>
        </div>
        `;
	}

	_getLeaveWaitingTournamentButtonHtml() {
		return `
            <div class="leaveWaitingTournamentButton">
                토너먼트에서 도망치기
            </div>
            `;
	}

	getWaitingQueueContainer() {
		return `
            <div class="waitingQueueContainer">
                <img class="findQueueImage" src="images/runningVampire2.png">
                <div class="findQueueText">대결 찾는 중...</div>
            </div>
            `;
	}
}

export default WaitingTournamentPageManager;
