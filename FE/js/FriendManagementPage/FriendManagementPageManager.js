import windowObservable from "../../WindowObservable.js"

class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log('Friend Management Page!');

		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;
		// TODO : 임시 하드 코딩
		this.clientInfo.friendInfo = {
			friendList: [
				{ id: 1, nickname: '친구1', avatarUrl: 'images/playerA.png' },
				{ id: 2, nickname: '친구2', avatarUrl: 'images/playerA.png' },
				{ id: 3, nickname: '친구3', avatarUrl: 'images/playerA.png' },
			],
			clientListWhoFriendRequestedMe: [
				{ id: 4, nickname: '내게 요청1', avatarUrl: "images/playerB.png" },
				{ id: 5, nickname: '내게 요청2', avatarUrl: "images/playerB.png" },
				{ id: 6, nickname: '내게 요청3', avatarUrl: "images/playerB.png" },
			],
			clientListIFriendRequested: [
				{ id: 7, nickname: '내가 요청1', avatarUrl: "images/vampireIcon.png" },
				{ id: 8, nickname: '내가 요청2', avatarUrl: "images/vampireIcon.png" },
				{ id: 9, nickname: '내가 요청3', avatarUrl: "images/vampireIcon.png" },
			],
		}
		
		this._initPage();
	}
	
	_initPage() {
		this._renderSearchClientTab(null);
		this._setTabButtons();
		this._autoSetScrollTrackColor();
		this._subscribeWindow();
	}

	_setTabButtons() {
		document.querySelector('#searchClientButton') // 유저 검색 탭
			.addEventListener('click', this._setClientListContainerHeight.bind(this, true));
		document.querySelector('#friendRequestButton') // 친구 요청 목록 탭
			.addEventListener('click', this._setClientListContainerHeight.bind(this, false));
		document.querySelector('#myFriendButton') // 내 친구 관리 탭
			.addEventListener('click', this._setClientListContainerHeight.bind(this, false));
		document.querySelector('#blockClientButton') // 차단 유저 관리 탭
			.addEventListener('click', this._setClientListContainerHeight.bind(this, false));
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

	_renderSearchClientTab(clientList) { // 초기 유저 검색 탭 전체를 렌더링
		const innerContentContainer = document.querySelector('#innerContentContainer');
		innerContentContainer.innerHTML = `
			${this._getSearchContainerHTML()}
			<div class=clientListContainer>
				${this._getSearchedClientListHTML(clientList)}
			</div>
		`;
		this._setSearchInput(); // Search API
		this._setClientManagementButtons();
	}
	_setSearchInput() {
		this.searchInput = document.querySelector('#clientSearchInput');
		this.searchInput.addEventListener('input', async () => {
			const searchClientMessage = {
				event: "searchClient",
				content: { keyword: this.searchInput.value }
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
			const searchedClientList = [ // TODO : 임시 하드코딩
				...this.clientInfo.friendInfo.friendList,
				...this.clientInfo.friendInfo.clientListWhoFriendRequestedMe,
				...this.clientInfo.friendInfo.clientListIFriendRequested,
				{ id: 10, nickname: "기타1", avatarUrl: "images/humanIcon.png" }
			];
			this._renderSearchedClientList(searchedClientList);
		});
	}
	_renderSearchedClientList(clientList) { // 유저 검색 탭에서 clientListContainer 내부만 리렌더링
		const clientListContainer = document.querySelector('.clientListContainer');
		clientListContainer.innerHTML = this._getSearchedClientListHTML(clientList);
		this._setClientManagementButtons();
	}
	// TODO : 다른 탭에서도 동일하게 이 함수를 쓸 수 있지 않을까 싶음.
	// 각 탭에서 기능이 겹치는 버튼의 클래스 이름을 통일시키면 가능할 듯. 
	_setClientManagementButtons() { // 클라이언트 아이템의 세부 버튼에 이벤트 리스너 장착
		const clientListContainer = document.querySelector('.clientListContainer');
		
		clientListContainer
			.querySelectorAll('.friendManagementButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const clientItem = event.target.closest('.clientItem');
					const clientId = clientItem.dataset.id;
					if (event.target.classList.contains('requestButton')) { // 친구 요청 버튼
						const clientData = {
							id: clientId,
							nickname: clientItem.querySelector('.nickname').textContent,
							avatarUrl: clientItem.querySelector('.avatarImg').src // TODO : data-src?
						};
						this._friendRequest(clientData);
					} else if (event.target.classList.contains('acceptButton')) { // 친구 수락 버튼
						// this._acceptFriendRequest(id); // 조영우씨 코드
					} else if (event.target.classList.contains('cancelRequestButton')) { // 요청 취소 버튼
						this._cancelFriendRequest(id);
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
		this.clientInfo.friendInfo.clientListIFriendRequested = 
			this.clientInfo.friendInfo.clientListIFriendRequested.filter(
				(client) => client.id !== id
			);
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
	_unsubscribeWindow() { // TODO : 페이지 나갈 시 호출
		windowObservable.unsubscribeResize(this._autoSetScrollTrackColorRef);
	}

	_autoSetScrollTrackColor() { // TODO : 표시되는 리스트가 업데이트될 때도 호출해줘야 하지 않을까? 로비에서도?
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
	// 		<div class="clientItem" data-id="${client.id}">
	// 			<div class="avatarImgFrame">
	// 				<img class="avatarImg" src="${client.avatarUrl}">
	// 			</div>
	// 			<div class="nickname">${client.nickname}</div>
	// 			<div class="buttonGroup">
	// 				<div class="clientManagementButton friendRequestButtton activatedButton">친구 요청</div>
	// 				<div class="clientManagementButton clientBlockButtton activatedButton">차단</div>
	// 			</div>
	// 		</div>
	// 	`;
	// }
}

export default FriendManagementPageManager;