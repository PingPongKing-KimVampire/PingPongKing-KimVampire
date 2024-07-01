import windowObservable from '../../WindowObservable.js';

class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log('Friend Management Page!');

		// TODO : 임시 하드 코딩
		this.clientInfo = {
			friendInfo: {
				friendList: [
					{ id: 1, nickname: '조뱀파이어', avatarUrl: 'images/playerA.png' },
					{ id: 2, nickname: '박뱀파이어', avatarUrl: 'images/humanIcon.png' },
					{ id: 3, nickname: '이뱀파이어', avatarUrl: 'images/playerB.png' },
					{ id: 4, nickname: '김뱀파이어', avatarUrl: 'images/playerA.png' },
					{ id: 5, nickname: '최뱀파이어', avatarUrl: 'images/playerA.png' },
					{ id: 6, nickname: '정뱀파이어', avatarUrl: 'images/playerA.png' },
				],
				clientListWhoFriendRequestedMe: [
					{ id: 7, nickname: '이사람', avatarUrl: 'images/humanIcon.png' },
					{ id: 8, nickname: '그사람', avatarUrl: 'images/humanIcon.png' },
					{ id: 9, nickname: '저사람', avatarUrl: 'images/humanIcon.png' },
					{ id: 10, nickname: '다른사람', avatarUrl: 'images/playerA.png' },
					{ id: 11, nickname: '이웃사람', avatarUrl: 'images/playerB.png' },
					{ id: 12, nickname: '친구사람', avatarUrl: 'images/playerA.png' },
				],
				clientListIFriendRequested: [
					{ id: 13, nickname: '마지막사람', avatarUrl: 'images/playerA.png' },
					{ id: 14, nickname: '새로운사람', avatarUrl: 'images/playerA.png' },
					{ id: 15, nickname: '처음사람', avatarUrl: 'images/playerA.png' },
					{ id: 16, nickname: '또다른사람', avatarUrl: 'images/playerA.png' },
					{ id: 17, nickname: '모르는사람', avatarUrl: 'images/playerA.png' },
					{ id: 18, nickname: '알고있는사람', avatarUrl: 'images/playerA.png' },
				],
			},
		};

		this.clientList = [ // TODO : 임시 하드코딩
			...this.clientInfo.friendInfo.friendList,
			...this.clientInfo.friendInfo.clientListWhoFriendRequestedMe,
			...this.clientInfo.friendInfo.clientListIFriendRequested,
			{ id: 19, nickname: "기타1", avatarUrl: "images/humanIcon.png" }
		]

		app.innerHTML = this._getHTML();
		// this.clientInfo = clientInfo;

		this._initPage();
	}

	_initPage() {
		this.searchKeyword = '';
		this._renderSearchClientTab();
		this._setTabButtons();
		this._autoSetScrollTrackColor();
		this._subscribeWindow();
		//모드에 따라 다른 notify 이벤트를 listen해 re render하는 메서드 구현
		this._listenNotifyEvent();
	}

	_listenNotifyEvent() {
		const listener = (messageEvent) => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (this.selectedTab === 'searchClientTab') {
				if (
					event === 'notifyFriendDeleted' ||
					event === 'notifyFriendRequestRejected' ||
					event === 'notifyFriendRequestAccepted' ||
					event === 'notifyFriendRequestCanceled' ||
					event === 'notifyFriendRequestReceive'
				) {
					this._renderTabByCurrentMode();
				}
			} else if (this.selectedTab === 'friendRequestListTab') {
				if (
					event === 'notifyFriendRequestReceive' ||
					event === 'notifyFriendRequestCanceled'
				) {
					this._renderTabByCurrentMode();
				}
			} else if (this.selectedTab === 'friendListTab') {
				if (
					event === 'notifyFriendDeleted' ||
					event === 'notifyFriendRequestAccepted'
				) {
					this._renderTabByCurrentMode();
				}
			}
		};
		//페이지 이동시 remove해야함
		// this.clientInfo.socket.addEventListener('message', listener);
	}

	_renderTabByCurrentMode() {
		if (this.selectedTab === 'searchClientTab') {
			this._renderSearchedClientList();
		}
		else if (this.selectedTab === 'friendRequestListTab') {
			this._renderFriendRequestList();
		}
		else if (this.selectedTab === 'friendListTab') {
			this._renderFriendList();
		}
	}

	_setTabButtons() {
		document
			.querySelector('#searchClientButton') // 유저 검색 탭
			.addEventListener('click', () => {
				this._renderSearchClientTab();
			});
		document
			.querySelector('#friendRequestButton') // 친구 요청 목록 탭
			.addEventListener('click', () => {
				this._renderFriendRequestList();
			});
		document
			.querySelector('#myFriendButton') // 내 친구 관리 탭
			.addEventListener('click', () => {
				this._renderFriendList();
			});
		// document
		// 	.querySelector('#blockClientButton') // 차단 유저 관리 탭
		// 	.addEventListener('click');
	}

	_renderSearchClientTab() { // 초기 유저 검색 탭 전체를 렌더링
		this.selectedTab = 'searchClientTab';
		const innerContentContainer = document.querySelector('#innerContentContainer');
		innerContentContainer.innerHTML = `
			${this._getSearchContainerHTML()}
			<div class="clientListContainer">
			</div>
		`;
		this._setSearchInput();
		this._renderSearchedClientList();
	}

	_setSearchInput() {
		this.searchInput = document.querySelector('#clientSearchInput');
		this.searchInput.addEventListener('input', async () => {
			this.searchKeyword = this.searchInput.value;
			this._renderSearchedClientList();
		});
	}
	_renderSearchedClientList = () => { // 유저 검색 탭에서 clientListContainer 내부만 리렌더링
		let searchedClientList = [];
		if (this.searchKeyword) {
			searchedClientList = this._getSearchedClientList();
		}
		const clientListContainer = document.querySelector('.clientListContainer');
		// TODO : 차단된 유저 제외하고 표시하기
		clientListContainer.innerHTML = this._getSearchedClientListHTML(searchedClientList);
		this._setClientManagementButtons();
		this._autoSetScrollTrackColor();
	}

	_getSearchedClientList() {
		const searchClientMessage = {
			event: "searchClient",
			content: { keyword: this.searchKeyword }
		}
		// this.clientInfo.socket.send(JSON.stringify(searchClientMessage));
		// const searchedClientList = await new Promise((resolve) => {
		// 	this.clientInfo.socket.addEventListener('message', (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (event === 'searchClientResponse') {
		// 			resolve(content.clientList);
		// 		}
		// 	})
		// });
		// return searchedClientList;
		return this.clientList;
	}

	_renderFriendRequestList() {
		this.selectedTab = 'friendRequestListTab';
		const innerContentContainer = document.querySelector(
			'#innerContentContainer'
		);
		innerContentContainer.innerHTML = this._getFriendRequestListContainerHTML();
		this._setClientManagementButtons();
	}

	_renderFriendList() {
		this.selectedTab = 'friendListTab';
		const innerContentContainer = document.querySelector(
			'#innerContentContainer'
		);
		innerContentContainer.innerHTML = this._getFriendListContainerHTML();
		this._setClientManagementButtons();
	}

	async _acceptFriendRequest(id) {
		// const acceptFriendRequestMessage = {
		// 	event: 'acceptFriendRequest',
		// 	content: {
		// 		clientInfo: {
		// 			id,
		// 		},
		// 	},
		// };
		// this.clientInfo.socket.send(JSON.stringify(acceptFriendRequestMessage));
		// await new Promise((resolve) => {
		// 	const listener = (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (
		// 			event === 'acceptFriendRequestResponse' &&
		// 			content.message === 'OK'
		// 		) {
		// 			socket.removeEventListener('message', listener);
		// 			resolve();
		// 		}
		// 	};
		// });
		const newFriendClient =
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.find(
				(client) => client.id === id
			);
		if (newFriendClient) {
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe =
				this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.filter(
					(client) => client.id !== newFriendClient.id
				);
			this.clientInfo.friendInfo.friendList.push(newFriendClient);
			this._renderTabByCurrentMode();
		}
	}

	async _rejectFriendRequest(id) {
		// const rejectFriendRequestMessage = {
		// 	event: 'rejectFriendRequest',
		// 	content: {
		// 		clientInfo: {
		// 			id,
		// 		},
		// 	},
		// };
		// this.clientInfo.socket.send(JSON.stringify(rejectFriendRequestMessage));
		// this.clientInfo.socket.send(JSON.stringify(acceptFriendRequestMessage));
		// await new Promise((resolve) => {
		// 	const listener = (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (
		// 			event === 'acceptFriendRequestResponse' &&
		// 			content.message === 'OK'
		// 		) {
		// 			socket.removeEventListener('message', listener);
		// 			resolve();
		// 		}
		// 	};
		// });
		const rejectedClient =
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.find(
				(client) => client.id === id
			);
		if (rejectedClient) {
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe =
				this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.filter(
					(client) => client.id !== rejectedClient.id
				);
			this._renderTabByCurrentMode();
		}
	}

	async _deleteFriend(id) {
		// const deleteFriendMessage = {
		// 	event: 'deleteFriend',
		// 	content: {
		// 		clientInfo: {
		// 			id,
		// 		},
		// 	},
		// };
		// this.clientInfo.socket.send(JSON.stringify(deleteFriendMessage));
		// await new Promise((resolve) => {
		// 	const listener = (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (
		// 			event === 'deleteFriendResponse' &&
		// 			content.message === 'OK'
		// 		) {
		// 			socket.removeEventListener('message', listener);
		// 			resolve();
		// 		}
		// 	};
		// });
		const deletedClient = this.clientInfo.friendInfo.friendList.find(
			(client) => client.id === id
		);
		if (deletedClient) {
			this.clientInfo.friendInfo.friendList =
				this.clientInfo.friendInfo.friendList.filter(
					(client) => client.id !== deletedClient.id
				);
			this._renderTabByCurrentMode();
		}
	}
	// TODO : clientListContainer에 접근하려면 render 이후여야 함
	_setClientListContainerHeight(visible) {
		const clientListContainer = document.querySelector('.clientListContainer');
		if (visible) {
			clientListContainer.style.height = '91%';
		} else {
			clientListContainer.style.height = '100%';
		}
	}

	// TODO : 다른 탭에서도 동일하게 이 함수를 쓸 수 있지 않을까 싶음.
	// 각 탭에서 기능이 겹치는 버튼의 클래스 이름을 통일시키면 가능할 듯. 
	_setClientManagementButtons() { // 클라이언트 아이템의 세부 버튼에 이벤트 리스너 장착
		const clientListContainer = document.querySelector('.clientListContainer');

		clientListContainer
			.querySelectorAll('.clientManagementButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const clientItem = event.target.closest('.clientItem');
					const id = parseInt(clientItem.dataset.id);
					if (event.target.classList.contains('requestButton')) { // 친구 요청 버튼
						const clientData = {
							id,
							nickname: clientItem.querySelector('.nickname').textContent,
							avatarUrl: clientItem.querySelector('.avatarImg').src // TODO : data-src?
						};
						this._friendRequest(clientData);
					} else if (event.target.classList.contains('acceptButton')) {
						this._acceptFriendRequest(id);
					} else if (event.target.classList.contains('rejectButton')) {
						this._rejectFriendRequest(id);
					} else if (event.target.classList.contains('cancelRequestButton')) {
						this._cancelFriendRequest(id);
					} else if (event.target.classList.contains('deleteButton')) {
						this._deleteFriend(id);
					}
					// TODO : blockButton에 대해서도 이벤트 등록
				});
			});
	}

	async _friendRequest(clientData) {
		const friendRequestMessage = {
			event: "sendFriendRequest",
			content: { clientInfo: { id: clientData.id } }
		}
		// this.clientInfo.socket.send(JSON.stringify(friendRequestMessage));
		// await new Promise((resolve) => {
		// 	this.clientInfo.socket.addEventListener('message', (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (event === 'sendFriendRequestResponse' && content.message === 'OK') {
		// 			resolve();
		// 		}
		// 	});
		// });
		this.clientInfo.friendInfo.clientListIFriendRequested.push(clientData);
		this._renderTabByCurrentMode();
	}

	async _cancelFriendRequest(id) {
		const cancelRequestMessage = {
			event: "cancelFriendRequest",
			content: { clientInfo: { id } }
		}
		// this.clientInfo.socket.send(JSON.stringify(cancelRequestMessage));
		// await new Promise((resolve) => {
		// 	this.clientInfo.socket.addEventListener('message', (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (event === 'cancelFriendRequestResponse' && content.message === 'OK') {
		// 			resolve();
		// 		}
		// 	});
		// });
		this.clientInfo.friendInfo.clientListIFriendRequested =
			this.clientInfo.friendInfo.clientListIFriendRequested.filter(
				(client) => client.id !== id
			);
		this._renderTabByCurrentMode();
	}

	_getSearchedClientListHTML(clientList) {
		const { friendList,
			clientListWhoFriendRequestedMe,
			clientListIFriendRequested } = this.clientInfo.friendInfo;

		const getClientItemHTML = (client) => {
			let buttonKoTitle = '친구 요청';
			let buttonEnTitle = 'requestButton';
			let buttonState = 'activatedButton';
			if (friendList.some((friend) => friend.id === client.id)) {
				// 이미 친구인 유저 -> 반응 X
				buttonState = 'disabledButton';
				buttonEnTitle = '';
			} else if (clientListWhoFriendRequestedMe.some((friend) => friend.id === client.id)) {
				// 내게 친구 요청을 보낸 유저 -> 친구 요청 수락
				buttonKoTitle = '친구 수락';
				buttonEnTitle = 'acceptButton';
			} else if (clientListIFriendRequested.some((friend) => friend.id === client.id)) {
				// 내가 친구 요청을 보낸 유저 -> 친구 요청 취소
				buttonKoTitle = '요청 취소';
				buttonEnTitle = 'cancelRequestButton';
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
		}
		let clientListHTML = '';
		if (clientList !== null) {
			clientListHTML = clientList.reduce((acc, current) => {
				return acc + getClientItemHTML(current);
			}, '');
		}
		return clientListHTML;
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
		const clientListContainer = document.querySelector('.clientListContainer');
		if (
			clientListContainer.scrollHeight >
			clientListContainer.clientHeight
		) {
			clientListContainer.classList.add('transparent-scrolltrack');
			clientListContainer.classList.remove('scrollbar-scrolltrack');
		} else {
			clientListContainer.classList.remove('transparent-scrolltrack');
			clientListContainer.classList.add('scrollbar-scrolltrack');
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
				<button class="tabButton" id="searchClientButton">유저 검색</button>
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

	_getFriendRequestListContainerHTML() {
		const getfriendRequestItemHtml = (client) => {
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
		const clientRequestListHTML =
			this.clientInfo.friendInfo.clientListWhoFriendRequestedMe.reduce(
				(acc, current) => {
					return acc + getfriendRequestItemHtml(current);
				},
				''
			);
		return `
			<div class="clientListContainer">
				${clientRequestListHTML}
			</div>
		`;
	}

	_getFriendListContainerHTML() {
		const getfriendItemHtml = (requestClient) => {
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
		const clientListHTML = this.clientInfo.friendInfo.friendList.reduce(
			(acc, current) => {
				return acc + getfriendItemHtml(current);
			},
			''
		);
		return `
			<div class="clientListContainer">
				${clientListHTML}
			</div>
		`;
	}
}

export default FriendManagementPageManager;
