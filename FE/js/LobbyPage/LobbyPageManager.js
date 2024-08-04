import windowObservable from "../../WindowObservable.js";

import { SERVER_ADDRESS } from "../PageRouter.js";
import { SERVER_PORT } from "../PageRouter.js";
import { AccessTokenNotFoundError, isSocketConnected } from "../Error/Error.js";

class LobbyPageManager {
	constructor(app, clientInfo, renderPage) {
		console.log("Lobby Page!");

		this.clientInfo = clientInfo;
		this.renderPage = renderPage;
		this.app = app;
	}

	async connectPage() {
		async function connectLobbySocket(accessToken) {
			if (!accessToken) {
				throw new AccessTokenNotFoundError();
			}
			const lobbySocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby`, ["authorization", accessToken]);
			await new Promise(resolve => {
				lobbySocket.addEventListener("open", () => {
					resolve();
				});
			});
			return lobbySocket;
		}
		// //이미 로비 페이지에 연결되어 있는 경우
		if (!isSocketConnected(this.clientInfo?.lobbySocket)) {
			this.clientInfo.lobbySocket = await connectLobbySocket(this.clientInfo.accessToken);
		}
		this.waitingRoomInfoList = await this._getWaitingRoomList();
	}

	async clearPage() {
		this._unsubscribeWindow();
		if (this.clientInfo.nextPage === "waitingRoomCreation" || this.clientInfo.nextPage === "waitingTournament") return;
		this.clientInfo.lobbySocket.close();
		this.clientInfo.lobbySocket = null;
	}

	initPage() {
		//새로고침 방지 -> 추후 활성화
		// window.addEventListener("beforeunload", event => {
		// 	event.returnValue = `나가지마,,`;
		// });
		app.innerHTML = this._getHTML();
		this._setTournamentJoinButton();
		this._setCreateWaitingRoomButton();

		this.enterRoomModal = document.querySelector(".questionModal");
		this.enterYesButton = document.querySelector(".questionModal .activatedButton:nth-of-type(1)");
		this.enterNoButton = document.querySelector(".questionModal .activatedButton:nth-of-type(2)");
		this.enterModalTitle = document.querySelector(".questionModal .title");
		this.waitingRoomListContainer = document.querySelector(".waitingRoomListContainer");

		this.allWaitingRoomElement = {};
		this._renderWaitingRoom(this.waitingRoomInfoList);
		this._listenWaitingRoomUpdate();

		this._autoSetScollTrackColor();
		this._adjustButtonSize();

		this._setFriendManagementButton();
		this._setProfileButton();
	}

	_setFriendManagementButton() {
		this.friendManagementButton = document.querySelector("#friendManagementButton");
		this.friendManagementButton.addEventListener("click", () => {
			this.renderPage("friendManagement");
		});
	}

	_setProfileButton() {
		this.profileButton = document.querySelector("#profileButton");
		this.profileButton.addEventListener("click", () => {
			this.renderPage("profile", { id: this.clientInfo.id });
		});
	}

	_listenWaitingRoomUpdate() {
		const lobbySocket = this.clientInfo.lobbySocket;
		lobbySocket.addEventListener("message", messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (event === "notifyWaitingRoomCreated") {
				const { roomId, title, leftMode, rightMode, currentPlayerCount, maxPlayerCount } = content.waitingRoomInfo;
				const newWaitingRoomElement = this._getWaitingRoomElement(roomId, leftMode, rightMode, title, currentPlayerCount, maxPlayerCount);
				this.allWaitingRoomElement[roomId] = {
					element: newWaitingRoomElement,
					maxPlayerCount,
				};
				this.waitingRoomListContainer.appendChild(newWaitingRoomElement);
			} else if (event === "notifyWaitingRoomClosed") {
				const { roomId } = content.waitingRoomInfo;
				if (this.allWaitingRoomElement[roomId]) {
					this.allWaitingRoomElement[roomId].element.remove();
					delete this.allWaitingRoomElement[roomId];
				}
			} else if (event === "notifyCurrentPlayerCountChange") {
				const { roomId, currentPlayerCount } = content;
				if (this.allWaitingRoomElement[roomId]) {
					const waitingRoomElement = this.allWaitingRoomElement[roomId].element;
					const maxPlayerCount = this.allWaitingRoomElement[roomId].maxPlayerCount;
					for (const children of waitingRoomElement.children) {
						if (children.className === "matchPlayerCount") children.textContent = `${currentPlayerCount} / ${maxPlayerCount}`;
					}
				}
			}
		});
	}

	async _getWaitingRoomList() {
		const getWaitingRoomListMessage = {
			event: "getWaitingRoomList",
			content: {},
		};
		this.clientInfo.lobbySocket.send(JSON.stringify(getWaitingRoomListMessage));
		const waitingRoomList = await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getWaitingRoomResponse") {
					this.clientInfo.lobbySocket.removeEventListener("message", listener);
					resolve(content.waitingRoomInfoList);
				}
			};
			this.clientInfo.lobbySocket.addEventListener("message", listener);
		});
		return waitingRoomList;
	}

	_subscribeWindow() {
		this._adjustButtonSizeRef = this._adjustButtonSize.bind(this);
		// TODO : _adjustButtonSizeRef에 this가 안 붙음. 잘 안 되고 있을 듯?
		windowObservable.subscribeResize(_adjustButtonSizeRef);
		this._autoSetScollTrackColorRef = this._autoSetScollTrackColor.bind(this);
		windowObservable.subscribeResize(_autoSetScollTrackColorRef);
	}

	_unsubscribeWindow() {
		windowObservable.unsubscribeResize(this._adjustButtonSizeRef);
		windowObservable.unsubscribeResize(this._autoSetScollTrackColorRef);
	}

	_setTournamentJoinButton() {
		const tournamentJoinButton = document.querySelector(".tournamentJoinButton");
		tournamentJoinButton.addEventListener("click", async () => {
			const startMatchMakingMessage = {
				event: "startMatchMaking",
				content: {},
			};
			this.clientInfo.lobbySocket.send(JSON.stringify(startMatchMakingMessage));
			await new Promise(resolve => {
				const listener = messageEvent => {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "startMatchMakingResponse" && content.message === "OK") {
						this.clientInfo.lobbySocket.removeEventListener("message", listener);
						resolve();
					}
				};
				this.clientInfo.lobbySocket.addEventListener("message", listener);
			});
			this.renderPage("waitingTournament");
		});
	}

	_setCreateWaitingRoomButton() {
		const createWaitingRoomButton = document.querySelector(".createWaitingRoomButton");
		createWaitingRoomButton.addEventListener("click", () => {
			this.renderPage("waitingRoomCreation");
		});
	}

	_renderWaitingRoom(waitingRoomList) {
		waitingRoomList.forEach(waitingRoom => {
			const { roomId, title, leftMode, rightMode, currentPlayerCount, maxPlayerCount } = waitingRoom;
			const newWaitingRoomElement = this._getWaitingRoomElement(roomId, leftMode, rightMode, title, currentPlayerCount, maxPlayerCount);
			this.allWaitingRoomElement[roomId] = {
				element: newWaitingRoomElement,
				maxPlayerCount: maxPlayerCount,
			};
			this.waitingRoomListContainer.appendChild(newWaitingRoomElement);
			this.waitingRoomListContainer.appendChild(newWaitingRoomElement);
		});
	}

	_adjustButtonSize() {
		const createWaitingRoomButton = document.querySelector(".createWaitingRoomButton");
		const createTournamentJoinButton = document.querySelector(".tournamentJoinButton");
		const viewWidth = window.innerWidth;
		const viewHeight = window.innerHeight;

		if (viewWidth < viewHeight) {
			createWaitingRoomButton.style.height = "4vh";
			createWaitingRoomButton.style.width = "calc(4vh * 4 / 1)";
			createTournamentJoinButton.style.height = "4vh";
			createTournamentJoinButton.style.width = "calc(4vh * 4 / 1)";
		} else {
			createWaitingRoomButton.style.width = "16vw";
			createWaitingRoomButton.style.height = "calc(16vw * 1 / 4)";
			createTournamentJoinButton.style.width = "16vw";
			createTournamentJoinButton.style.height = "calc(16vw * 1 / 4)";
		}
	}

	_autoSetScollTrackColor() {
		const waitingRoomListContainer = this.waitingRoomListContainer;
		if (waitingRoomListContainer.scrollHeight > waitingRoomListContainer.clientHeight) {
			waitingRoomListContainer.classList.remove("scrollbar-scrolltrack");
			waitingRoomListContainer.classList.add("transparent-scrolltrack");
		} else {
			waitingRoomListContainer.classList.add("scrollbar-scrolltrack");
			waitingRoomListContainer.classList.remove("transparent-scrolltrack");
		}
	}

	_getWaitingRoomElement(roomId, leftMode, rightMode, title, currendPlayerCount, maxPlayerCount) {
		const waitingRoomContainer = document.createElement("div");
		waitingRoomContainer.className = "waitingRoomContainer";

		const gameTypeContainer = document.createElement("div");
		gameTypeContainer.className = "gameTypeContainer";

		const teamName1 = document.createElement("span");
		teamName1.className = "teamName";
		if (leftMode === "human") teamName1.textContent = "인간";
		else if (leftMode === "vampire") teamName1.textContent = "뱀파이어";

		const vsName = document.createElement("span");
		vsName.className = "vsName";
		vsName.textContent = "vs";

		const teamName2 = document.createElement("span");
		teamName2.className = "teamName";

		if (rightMode === "human") teamName2.textContent = "인간";
		else if (rightMode === "vampire") teamName2.textContent = "뱀파이어";

		gameTypeContainer.appendChild(teamName1);
		gameTypeContainer.appendChild(vsName);
		gameTypeContainer.appendChild(teamName2);

		const matchName = document.createElement("div");
		matchName.className = "matchName";

		const gameName = document.createElement("div");
		gameName.className = "gameName";
		gameName.textContent = title;

		const matchPlayerCount = document.createElement("div");
		matchPlayerCount.className = "matchPlayerCount";
		matchPlayerCount.textContent = `${currendPlayerCount} / ${maxPlayerCount}`;

		waitingRoomContainer.appendChild(gameTypeContainer);
		waitingRoomContainer.appendChild(matchName);
		waitingRoomContainer.appendChild(gameName);
		waitingRoomContainer.appendChild(matchPlayerCount);

		waitingRoomContainer.addEventListener("click", async () => {
			this.enterModalTitle.innerText = `"${title}"`;
			this.enterRoomModal.style.display = "flex";
			const enterRoomListenerRef = e => {
				e.stopPropagation();
				this.enterRoomModal.style.display = "none";
				this._enterWaitingRoom(roomId, title, leftMode, rightMode, 1, maxPlayerCount - 1);
			};
			const hideModalLisenerRef = e => {
				e.stopPropagation();
				this.enterRoomModal.style.display = "none";
				this.enterYesButton.removeEventListener("click", enterRoomListenerRef);
				this.enterNoButton.removeEventListener("click", hideModalLisenerRef);
			};

			this.enterYesButton.addEventListener("click", enterRoomListenerRef);
			this.enterNoButton.addEventListener("click", hideModalLisenerRef);
		});
		return waitingRoomContainer;
	}

	async _enterWaitingRoom(roomId, title, teamLeftMode, teamRightMode, teamLeftTotalPlayerCount, teamRightTotalPlayerCount) {
		const gameInfo = {
			roomId,
			title,
			teamLeftMode,
			teamRightMode,
			teamLeftTotalPlayerCount,
			teamRightTotalPlayerCount,
		};
		this.clientInfo.gameInfo = gameInfo;
		this.renderPage("waitingRoom");
	}

	_getHTML() {
		return `
    <div id="friendTest">
	  <button id="profileButton">프로필 관리 페이지</button>
      <button id="friendManagementButton">친구 관리 페이지</button>
      <span id="friendRequestCount">1</span>
    </div>
    <div class="lobby">
      <div class="lobbyInner">
		<div class="lobbyTab">
			${this._getTournamentJoinButtonHtml()}
			${this._getWaitingRoomCreationButtonHtml()}
		</div>
        ${this._getWaitingRoomListContainerHtml()}
      </div>
    </div>
    ${this._getEnterWaitingRoomModalHTML()}
  `;
	}

	_getTournamentJoinButtonHtml() {
		return `<button class="tournamentJoinButton">토너먼트 참가하기</button>`;
	}

	_getWaitingRoomCreationButtonHtml() {
		return `<button class="createWaitingRoomButton">탁구장 생성하기</button>`;
	}

	_getWaitingRoomListContainerHtml() {
		return `<div class="outerContainer">
    <div class="waitingRoomListContainer">

    </div>
  </div>
  `;
	}

	_getEnterWaitingRoomModalHTML() {
		return `
			<div class="questionModal">
				<div class="questionBox">
          			<div class="title"></div>
					<div class="question">입장 하시겠습니까?</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
				</div>
			</div>
		`;
	}
}

export default LobbyPageManager;
