import windowObservable from "../../WindowObservable.js";

class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log("Friend Management Page!");

		// TODO : 임시 하드 코딩
		// this.clientInfo = {
		// 	friendInfo: {
		// 		friendList: [
		// 			{ id: 1, nickname: '조뱀파이어', avatarUrl: 'images/playerA.png' },
		// 			{ id: 2, nickname: '박뱀파이어', avatarUrl: 'images/humanIcon.png' },
		// 			{ id: 3, nickname: '이뱀파이어', avatarUrl: 'images/playerB.png' },
		// 			{ id: 4, nickname: '김뱀파이어', avatarUrl: 'images/playerA.png' },
		// 			{ id: 5, nickname: '최뱀파이어', avatarUrl: 'images/playerA.png' },
		// 			{ id: 6, nickname: '정뱀파이어', avatarUrl: 'images/playerA.png' },
		// 		],
		// 		clientListWhoFriendRequestedMe: [
		// 			{ id: 7, nickname: '이사람', avatarUrl: 'images/humanIcon.png' },
		// 			{ id: 8, nickname: '그사람', avatarUrl: 'images/humanIcon.png' },
		// 			{ id: 9, nickname: '저사람', avatarUrl: 'images/humanIcon.png' },
		// 			{ id: 10, nickname: '다른사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 11, nickname: '이웃사람', avatarUrl: 'images/playerB.png' },
		// 			{ id: 12, nickname: '친구사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 31, nickname: '차단한 사람1', avatarUrl: 'images/playerA.png' },
		// 		],
		// 		clientListIFriendRequested: [
		// 			{ id: 13, nickname: '마지막사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 14, nickname: '새로운사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 15, nickname: '처음사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 16, nickname: '또다른사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 17, nickname: '모르는사람', avatarUrl: 'images/playerA.png' },
		// 			{ id: 18, nickname: '알고있는사람', avatarUrl: 'images/playerA.png' },
		// 		],
		// 		clientListIBlocked: [
		// 			{ id: 31, nickname: '차단한 사람1', avatarUrl: 'images/playerA.png' },
		// 			{ id: 32, nickname: '차단한 사람2', avatarUrl: 'images/playerA.png' },
		// 			{ id: 33, nickname: '차단한 사람3', avatarUrl: 'images/playerA.png' },
		// 			{ id: 34, nickname: '차단한 사람4', avatarUrl: 'images/playerA.png' },
		// 			{ id: 35, nickname: '차단한 사람5', avatarUrl: 'images/playerA.png' },
		// 		],
		// 	},
		// };

		// this.clientList = [
		// 	// TODO : 임시 하드코딩
		// 	...this.clientInfo.friendInfo.friendList,
		// 	...this.clientInfo.friendInfo.clientListWhoFriendRequestedMe,
		// 	...this.clientInfo.friendInfo.clientListIFriendRequested,
		// 	...this.clientInfo.friendInfo.clientListIBlocked,
		// 	{ id: 19, nickname: '기타1', avatarUrl: 'images/humanIcon.png' },
		// ];

		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;

		this._initPage();
	}

	_initPage() {
		this.searchKeyword = "";
		this._setTabButtons();
		this._renderSearchClientTab();
		this._listenNotifyEvent();
		this._autoSetScrollTrackColor();
		this._subscribeWindow();
	}

	_setTabButtons() {
		this.prevTabButton = document.querySelector("#searchClientButton");
		const tabButtons = document.querySelectorAll(".tabButton");
		tabButtons.forEach(button => {
			button.addEventListener("click", event => {
				// 탭 버튼 스타일 변경
				if (this.prevTabButton) this.prevTabButton.classList.remove("selectedTabButton");
				event.target.classList.add("selectedTabButton");
				// 탭 렌더링
				if (event.target.id === "searchClientButton") {
					this._renderSearchClientTab();
				} else if (event.target.id === "friendRequestButton") {
					this._renderFriendRequestListTab();
				} else if (event.target.id === "myFriendButton") {
					this._renderFriendListTab();
				} else if (event.target.id === "blockClientButton") {
					this._renderBlockListManagementTab();
				}
				this.prevTabButton = event.target;
			});
		});
	}

	// 클라이언트 검색 탭 렌더링
	_renderSearchClientTab() {
		// 초기 유저 검색 탭 전체를 렌더링
		this.selectedTab = "searchClientTab";
		const innerContentContainer = document.querySelector("#innerContentContainer");
		innerContentContainer.innerHTML = `
			${this._getSearchContainerHTML()}
			<div class="clientListContainer"></div>
		`;
		this._setSearchInput();
		this._renderSearchedClientList();
	}
	_setSearchInput() {
		this.searchInput = document.querySelector("#clientSearchInput");
		this.searchInput.addEventListener("input", async () => {
			this.searchKeyword = this.searchInput.value;
			this._renderSearchedClientList();
		});
	}
	_renderSearchedClientList = async () => {
		// 유저 검색 탭에서 clientListContainer 내부만 리렌더링
		const getSearchedClientList = async () => {
			const searchClientMessage = {
				event: "searchClient",
				content: { keyword: this.searchKeyword },
			};
			this.clientInfo.socket.send(JSON.stringify(searchClientMessage));
			const searchedClientList = await new Promise(resolve => {
				const listener = messageEvent => {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "searchClientResponse") {
						this.clientInfo.socket.removeEventListener("message", listener);
						resolve(content.clientList);
					}
				};
				this.clientInfo.socket.addEventListener("message", listener);
			});
			return searchedClientList;
		};
		let searchedClientList = this.searchKeyword ? await getSearchedClientList() : [];
		searchedClientList = searchedClientList
			.filter(searchedClient => this.clientInfo.id !== searchedClient.id) //자기자신 제거
			.filter(searchedClient => {
				// 차단된 클라리언트 제거
				return this.clientInfo.friendInfo.clientListIBlocked.every(blockedClient => blockedClient.id !== searchedClient.id);
			});
		const clientListContainer = document.querySelector(".clientListContainer");
		clientListContainer.innerHTML = this._getSearchedClientListHTML(searchedClientList);
		this._setClientManagementButtons();
		this._autoSetScrollTrackColor();
	};

	// 친구 요청 목록 탭 렌더링
	_renderFriendRequestListTab() {
		this.selectedTab = "friendRequestListTab";
		const innerContentContainer = document.querySelector("#innerContentContainer");
		innerContentContainer.innerHTML = this._getFriendRequestListContainerHTML();
		this._setClientManagementButtons();
	}

	// 내 친구 관리 탭 렌더링
	_renderFriendListTab() {
		this.selectedTab = "friendListTab";
		const innerContentContainer = document.querySelector("#innerContentContainer");
		innerContentContainer.innerHTML = this._getFriendListContainerHTML();
		this._setClientManagementButtons();
	}

	//차단 목록 관리 탭
	_renderBlockListManagementTab() {
		this.selectedTab = "blockListManagementTab";
		const innerContentContainer = document.querySelector("#innerContentContainer");
		innerContentContainer.innerHTML = this._getBlockListManagementContainerHTML();
		this._setClientManagementButtons();
	}

	_listenNotifyEvent() {
		const listener = messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (this.selectedTab === "searchClientTab") {
				if (event === "notifyFriendDeleted" || event === "notifyFriendRequestRejected" || event === "notifyFriendRequestAccepted" || event === "notifyFriendRequestCanceled" || event === "notifyFriendRequestReceive") {
					this._renderTabByCurrentMode();
				}
			} else if (this.selectedTab === "friendRequestListTab") {
				if (event === "notifyFriendRequestReceive" || event === "notifyFriendRequestCanceled") {
					this._renderTabByCurrentMode();
				}
			} else if (this.selectedTab === "friendListTab") {
				if (event === "notifyFriendDeleted" || event === "notifyFriendRequestAccepted") {
					this._renderTabByCurrentMode();
				}
			}
		};
		this.clientInfo.socket.addEventListener("message", listener);
		//페이지 이동시 remove해야함
		// this.clientInfo.socket.addEventListener('message', listener);
	}

	_renderTabByCurrentMode() {
		if (this.selectedTab === "searchClientTab") {
			this._renderSearchedClientList();
		} else if (this.selectedTab === "friendRequestListTab") {
			this._renderFriendRequestListTab();
		} else if (this.selectedTab === "friendListTab") {
			this._renderFriendListTab();
		} else if (this.selectedTab === "blockListManagementTab") {
			this._renderBlockListManagementTab();
		}
	}

	_setClientManagementButtons() {
		// 클라이언트 아이템의 세부 버튼에 이벤트 리스너 장착
		const clientListContainer = document.querySelector(".clientListContainer");

		clientListContainer.querySelectorAll(".clientManagementButton").forEach(button => {
			button.addEventListener("click", event => {
				const clientItem = event.target.closest(".clientItem");
				const clientData = {
					id: parseInt(clientItem.dataset.id),
					nickname: clientItem.querySelector(".nickname").textContent,
					avatarUrl: clientItem.querySelector(".avatarImg").src, // TODO : data-src?
				};
				if (event.target.classList.contains("requestButton")) {
					// 친구 요청 버튼
					this._friendRequest(clientData);
				} else if (event.target.classList.contains("acceptButton")) {
					this._acceptFriendRequest(clientData.id);
				} else if (event.target.classList.contains("rejectButton")) {
					this._rejectFriendRequest(clientData.id);
				} else if (event.target.classList.contains("cancelRequestButton")) {
					this._cancelFriendRequest(clientData.id);
				} else if (event.target.classList.contains("deleteButton")) {
					this._deleteFriend(clientData.id);
				} else if (event.target.classList.contains("blockButton")) {
					this._blockClient(clientData);
				} else if (event.target.classList.contains("unblockButton")) {
					this._unblockClient(clientData.id);
				}
			});
		});
	}

	async _friendRequest(clientData) {
		const friendRequestMessage = {
			event: "sendFriendRequest",
			content: { clientInfo: { id: clientData.id } },
		};
		this.clientInfo.socket.send(JSON.stringify(friendRequestMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "sendFriendRequestResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		this.clientInfo.friendInfo.clientListIFriendRequested.push(clientData);
		this._renderTabByCurrentMode();
	}

	async _acceptFriendRequest(id) {
		const acceptFriendRequestMessage = {
			event: "acceptFriendRequest",
			content: { clientInfo: { id } },
		};
		this.clientInfo.socket.send(JSON.stringify(acceptFriendRequestMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "acceptFriendRequestResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		const newFriendClient = this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.find(client => client.id === id);
		if (newFriendClient) {
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe = this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.filter(client => client.id !== newFriendClient.id);
			this.clientInfo.friendInfo.friendList.push(newFriendClient);
			this._renderTabByCurrentMode();
		}
	}

	async _rejectFriendRequest(id) {
		const rejectFriendRequestMessage = {
			event: "rejectFriendRequest",
			content: { clientInfo: { id } },
		};
		this.clientInfo.socket.send(JSON.stringify(rejectFriendRequestMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "rejectFriendRequestResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		const rejectedClient = this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.find(client => client.id === id);
		if (rejectedClient) {
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe = this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.filter(client => client.id !== rejectedClient.id);
			this._renderTabByCurrentMode();
		}
	}

	async _cancelFriendRequest(id) {
		const cancelRequestMessage = {
			event: "cancelFriendRequest",
			content: { clientInfo: { id } },
		};
		this.clientInfo.socket.send(JSON.stringify(cancelRequestMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "cancelFriendRequestResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		this.clientInfo.friendInfo.clientListIFriendRequested = this.clientInfo.friendInfo.clientListIFriendRequested.filter(client => client.id !== id);
		this._renderTabByCurrentMode();
	}

	async _deleteFriend(id) {
		const deleteFriendMessage = {
			event: "deleteFriend",
			content: { clientInfo: { id } },
		};
		this.clientInfo.socket.send(JSON.stringify(deleteFriendMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "deleteFriendResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		const deletedClient = this.clientInfo.friendInfo.friendList.find(client => client.id === id);
		if (deletedClient) {
			this.clientInfo.friendInfo.friendList = this.clientInfo.friendInfo.friendList.filter(client => client.id !== deletedClient.id);
			this._renderTabByCurrentMode();
		}
	}

	async _blockClient(clientData) {
		const blockClientMessage = {
			event: "blockClient",
			content: { clientInfo: { id: clientData.id } },
		};
		this.clientInfo.socket.send(JSON.stringify(blockClientMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "blockClientResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		this.clientInfo.friendInfo.friendList = // 친구인 클라이언트 차단
			this.clientInfo.friendInfo.friendList.reduce((acc, friend) => {
				if (friend.id !== clientData.id) acc.push(friend);
				return acc;
			}, []);
		this.clientInfo.friendInfo.clientListIFriendRequested = // 내가 친구 요청한 클라이언트 차단
			this.clientInfo.friendInfo.clientListIFriendRequested.reduce((acc, client) => {
				if (client.id !== clientData.id) acc.push(client);
				return acc;
			}, []);
		this.clientInfo.friendInfo.clientListIBlocked.push(clientData);
		this._renderTabByCurrentMode();
	}

	async _unblockClient(id) {
		const unblockClientMessage = {
			event: "unblockClient",
			content: { clientInfo: { id } },
		};
		this.clientInfo.socket.send(JSON.stringify(unblockClientMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "unblockClientResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
		const unblockClient = this.clientInfo.friendInfo.clientListIBlocked.find(client => client.id === id);
		if (unblockClient) {
			this.clientInfo.friendInfo.clientListIBlocked = this.clientInfo.friendInfo.clientListIBlocked.filter(client => client.id !== unblockClient.id);
			this._renderTabByCurrentMode();
		}
	}

	_subscribeWindow() {
		this._autoSetScrollTrackColorRef = this._autoSetScrollTrackColor.bind(this);
		windowObservable.subscribeResize(this._autoSetScrollTrackColor);
	}
	_unsubscribeWindow() {
		// TODO : 페이지 나갈 시 호출
		windowObservable.unsubscribeResize(this._autoSetScrollTrackColorRef);
	}

	_autoSetScrollTrackColor() {
		const clientListContainer = document.querySelector(".clientListContainer");
		if (clientListContainer.scrollHeight > clientListContainer.clientHeight) {
			clientListContainer.classList.add("transparent-scrolltrack");
			clientListContainer.classList.remove("scrollbar-scrolltrack");
		} else {
			clientListContainer.classList.remove("transparent-scrolltrack");
			clientListContainer.classList.add("scrollbar-scrolltrack");
		}
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				${this._getTabContainerHTML()}
				<div id="contentContainer">
					<div id="innerContentContainer"></div>
				</div>
		</div>
		`;
	}
	_getTabContainerHTML() {
		return `
			<div id="tabContainer">
				<button class="tabButton selectedTabButton" id="searchClientButton">유저 검색</button>
				<button class="tabButton" id="friendRequestButton">친구 요청 목록</button>
				<button class="tabButton" id="myFriendButton">내 친구 관리</button>
				<button class="tabButton" id="blockClientButton">차단 유저 관리</button>
			</div>
		`;
	}

	_getSearchContainerHTML() {
		return `
			<div id="searchContainer" class="visible">
				<input id="clientSearchInput" placeholder="닉네임을 입력하세요." value="${this.searchKeyword}">
			</div>
		`;
	}
	_getSearchedClientListHTML(clientList) {
		const { friendList, clientListWhoFriendRequestedMe, clientListIFriendRequested } = this.clientInfo.friendInfo;

		const getClientItemHTML = client => {
			let buttonKoTitle = "친구 요청";
			let buttonEnTitle = "requestButton";
			let buttonState = "activatedButton";
			if (friendList.some(friend => friend.id === client.id)) {
				// 이미 친구인 유저 -> 반응 X
				buttonState = "disabledButton";
				buttonEnTitle = "";
			} else if (clientListWhoFriendRequestedMe.some(friend => friend.id === client.id)) {
				// 내게 친구 요청을 보낸 유저 -> 친구 요청 수락
				buttonKoTitle = "친구 수락";
				buttonEnTitle = "acceptButton";
			} else if (clientListIFriendRequested.some(friend => friend.id === client.id)) {
				// 내가 친구 요청을 보낸 유저 -> 친구 요청 취소
				buttonKoTitle = "요청 취소";
				buttonEnTitle = "cancelRequestButton";
			}
			return `
				<div class="clientItem" data-id="${client.id}">
					<div class="avatarImgFrame">
						<img class="avatarImg" src="${client.avatarUrl}">
					</div>
					<div class="nickname">${client.nickname}</div>
					<div class="buttonGroup">
						<div class="clientManagementButton ${buttonEnTitle} ${buttonState}" ${buttonState === "disabledButton" ? "disabled" : ""}>${buttonKoTitle}</div>
						<div class="clientManagementButton blockButton activatedButton">차단</div>
					</div>
				</div>
			`;
		};
		let clientListHTML = "";
		if (clientList !== null) {
			clientListHTML = clientList.reduce((acc, current) => {
				return acc + getClientItemHTML(current);
			}, "");
		}
		return clientListHTML;
	}

	_getFriendRequestListContainerHTML() {
		const getfriendRequestItemHtml = client => {
			return `
			<div class="clientItem" data-id="${client.id}">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${client.avatarUrl}">
				</div>
				<div class="nickname">${client.nickname}</div>
				<div class="buttonGroup">
					<div class="clientManagementButton acceptButton activatedButton">수락</div>
					<div class="clientManagementButton rejectButton activatedButton">거절</div>
				</div>
			</div>
			`;
		};
		const clientRequestListHTML = this.clientInfo.friendInfo.clientListWhoFriendRequestedMe
			.filter(client => {
				return this.clientInfo.friendInfo.clientListIBlocked.every(blockClient => blockClient.id !== client.id);
			})
			.reduce((acc, current) => {
				return acc + getfriendRequestItemHtml(current);
			}, "");
		return `
			<div class="clientListContainer">
				${clientRequestListHTML}
			</div>
		`;
	}

	_getFriendListContainerHTML() {
		const getfriendItemHtml = requestClient => {
			return `
			<div class="clientItem" data-id="${requestClient.id}">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${requestClient.avatarUrl}">
				</div>
				<div class="nickname">${requestClient.nickname}</div>
				<div class="buttonGroup">
					<div class="clientManagementButton deleteButton activatedButton">친구 삭제</div>
					<div class="clientManagementButton blockButton activatedButton">차단</div>
				</div>
			</div>
			`;
		};
		const clientListHTML = this.clientInfo.friendInfo.friendList.reduce((acc, current) => {
			return acc + getfriendItemHtml(current);
		}, "");
		return `
			<div class="clientListContainer">
				${clientListHTML}
			</div>
		`;
	}

	_getBlockListManagementContainerHTML() {
		const getfriendItemHtml = requestClient => {
			return `
			<div class="clientItem" data-id="${requestClient.id}">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${requestClient.avatarUrl}">
				</div>
				<div class="nickname">${requestClient.nickname}</div>
				<div class="buttonGroup">
					<div></div>
					<div class="clientManagementButton unblockButton activatedButton">차단 해제</div>
				</div>
			</div>
			`;
		};
		const clientListHTML = this.clientInfo.friendInfo.clientListIBlocked.reduce((acc, current) => {
			return acc + getfriendItemHtml(current);
		}, "");
		return `
			<div class="clientListContainer">
				${clientListHTML}
			</div>
		`;
	}
}

export default FriendManagementPageManager;
