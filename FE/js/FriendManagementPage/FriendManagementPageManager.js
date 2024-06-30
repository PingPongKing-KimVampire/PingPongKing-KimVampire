import windowObservable from "../../WindowObservable.js"

class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log('Friend Management Page!');

		// TODO : 임시 하드 코딩
		this.clientList = [
			{ id: 3, nickname: "김뱀파이어어어어어어어어어어어어어", avatarUrl: "images/playerA.png" },
			{ id: 3, nickname: "이뱀파이어", avatarUrl: "images/playerB.png" },
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/humanIcon.png" },
			{ id: 3, nickname: "조뱀파이어", avatarUrl: "images/playerA.png" },
			{ id: 3, nickname: "양뱀파이어", avatarUrl: "images/vampireIcon.png" },
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/playerB.png" },
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/humanIcon.png" },
			{ id: 3, nickname: "박뱀파이어", avatarUrl: "images/playerB.png" },
			{ id: 3, nickname: "조뱀파이어", avatarUrl: "images/playerA.png" },
			{ id: 3, nickname: "양뱀파이어", avatarUrl: "images/vampireIcon.png" }
		];

		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;
		
		this._initPage();
	}
	
	_initPage() {
		this._setTabButtons();
		this._setSearchInput();
		this._renderClientList();
		this._autoSetScrollTrackColor();
		this._subscribeWindow();
	}

	_setTabButtons() {
		this.searchContainer = document.querySelector('#searchContainer');
		this.clientListContainer = document.querySelector('.clientListContainer');
		document.querySelector('#searchClientButton') // 유저 검색 탭
			.addEventListener('click', this._setSearchContainer.bind(this, true));
		document.querySelector('#friendRequestButton') // 친구 요청 목록 탭
			.addEventListener('click', this._setSearchContainer.bind(this, false));
		document.querySelector('#myFriendButton') // 내 친구 관리 탭
			.addEventListener('click', this._setSearchContainer.bind(this, false));
		document.querySelector('#blockClientButton') // 차단 유저 관리 탭
			.addEventListener('click', this._setSearchContainer.bind(this, false));
	}

	_setSearchContainer(visible) {
		if (visible) {
			this.searchContainer.classList.add('visible');
			this.searchContainer.classList.remove('invisible');
			this.clientListContainer.style.height = '91%';
		} else {
			this.searchContainer.classList.remove('visible');
			this.searchContainer.classList.add('invisible');
			this.clientListContainer.style.height = '100%';
		}
	}

	_setSearchInput() {
		this.innerContentContainer = document.querySelector('#innerContentContainer');
		console.log(this.innerContentContainer);
		this.searchInput = document.querySelector('#clientSearchInput');
		this.searchInput.addEventListener('input', async () => {
			const searchClientMessage = {
				event: "searchClient",
				content: {
					keyword: this.searchInput.value
				}
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
			// TODO : 차단된 유저 제외하고 표시하기
			this._renderSearchClientTab(searchedClientList);
		});
	}

	_renderSearchClientTab(clientList) {
		const innerContentContainer = document.querySelector('#innerContentContainer');
		innerContentContainer.innerHTML = `
			${this._getSearchContainerHTML()}
			${this._getSearchedClientListContainerHTML(clientList)}
		`;
		innerContentContainer
			.querySelectorAll('requestButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const clientItem = event.target.closest('.clientItem');
					const clientData = {
						id: clientItem.dataset.id,
						nickname: clientItem.querySelector('.nickname').textContent,
						avatarUrl: clientItem.querySelector('.avatarImg').src // TODO : data-src?
					};
					this._friendRequest(clientData);
				});
			});
		
		innerContentContainer
			.querySelectorAll('acceptButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const id = event.target.closest('.clientItem').dataset.id;
					// this._acceptFriendRequest(id); // 조영우씨 코드
				});
			});

		innerContentContainer
			.querySelectorAll('cancelRequestButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const id = event.target.closest('.clientItem').dataset.id;
					this._cancelFriendRequest(id);
				})
			})
		
		// TODO : blockButton에 대해서도 이벤트 등록
	}

	async _friendRequest(clientData) {
		const friendRequestMessage = {
			event: "sendFriendRequest",
			content: { clientInfo: { id: clientData.id } }
		}
		this.clientInfo.socket.send(JSON.stringify(friendRequestMessage));
		await new Promise((resolve) => {
			this.clientInfo.socket.addEventListener('message', (messageEvent) => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === 'sendFriendRequestResponse' && content.message === 'OK') {
					resolve();
				}
			});
		});
		console.log('친구 요청', clientData);
		this.clientInfo.friendInfo.clientListIFriendRequested.push(clientData);
	}

	async _cancelFriendRequest(id) {
		const cancelRequestMessage = {
			event: "cancelFriendRequest",
			content: { clientInfo: { id } }
		}
		this.clientInfo.socket.send(JSON.stringify(cancelRequestMessage));
		await new Promise((resolve) => {
			this.clientInfo.socket.addEventListener('message', (messageEvent) => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === 'cancelFriendRequestResponse' && content.message === 'OK') {
					resolve();
				}
			});
		});
		console.log('친구 요청 취소', id);
		this.clientInfo.friendInfo.clientListIFriendRequest = 
			this.clientInfo.friendInfo.clientListIFriendRequest.filter(
				(client) => client.id !== id
			);
	}

	_getSearchedClientListContainerHTML(clientList) {
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
						<div class="clientManagementButton ${buttonEnTitle} ${buttonState}">${buttonKoTitle}</div>
						<div class="clientManagementButton blockButton activatedButton">차단</div>
					</div>
				</div>
			`;
		}
		const clientListHTML = clientList.reduce((acc, current) => {
			return acc + getClientItemHTML(current);
		}, '');
		return `<div class=clientListContainer>${clientListHTML}</div>`;
	}

	_subscribeWindow() {
		this._autoSetScrollTrackColorRef = this._autoSetScrollTrackColor.bind(this);
		windowObservable.subscribeResize(this._autoSetScrollTrackColor);
	}
	_unsubscribeWindow() { // TODO : 페이지 나갈 시 호출
		windowObservable.unsubscribeResize(this._autoSetScrollTrackColorRef);
	}

	_autoSetScrollTrackColor() { // TODO : 표시되는 리스트가 업데이트될 때도 호출해줘야 하지 않을까? 로비에서도?
		if (
			this.clientListContainer.scrollHeight >
			this.clientListContainer.clientHeight
		) {
			this.clientListContainer.classList.add('transparent-scrolltrack');
			this.clientListContainer.classList.remove('scrollbar-scrolltrack');
		} else {
			this.clientListContainer.classList.remove('transparent-scrolltrack');
			this.clientListContainer.classList.add('scrollbar-scrolltrack');
		}
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				${this._getTabContainerHTML()}
				<div id="contentContainer">
					<div id="innerContentContainer">
						${this._getSearchContainerHTML()}
						${this._getClientListContainerHTML()}
					</div>
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
				<input id="clientSearchInput" placeholder="닉네임을 입력하세요.">
			</div>
		`;
	}
	// _getClientListContainerHTML() {
	// 	const clientItemsHTML = this.clientList.reduce((acc, current) => {
	// 		return acc + this._getClientItemHTML(current);
	// 	}, "");
	// 	return `
	// 		<div class="clientListContainer">
	// 			${clientItemsHTML}
	// 		</div>
	// 	`;
	// }
	// _getClientItemHTML(client) {
	// 	return `
			// <div class="clientItem" data-id="${client.id}">
			// 	<div class="avatarImgFrame">
			// 		<img class="avatarImg" src="${client.avatarUrl}">
			// 	</div>
			// 	<div class="nickname">${client.nickname}</div>
			// 	<div class="buttonGroup">
			// 		<div class="clientManagementButton friendRequestButtton activatedButton">친구 요청</div>
			// 		<div class="clientManagementButton clientBlockButtton activatedButton">차단</div>
			// 	</div>
			// </div>
	// 	`;
	// }
}

export default FriendManagementPageManager;