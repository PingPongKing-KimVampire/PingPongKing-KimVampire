import windowObservable from '../../WindowObservable.js';

class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log('Friend Management Page!');

		// TODO : 임시 하드 코딩
		this.clientList = [
			{
				id: 3,
				nickname: '김뱀파이어어어어어어어어어어어어어',
				avatarUrl: 'images/playerA.png',
			},
			{ id: 3, nickname: '이뱀파이어', avatarUrl: 'images/playerB.png' },
			{ id: 3, nickname: '박뱀파이어', avatarUrl: 'images/humanIcon.png' },
			{ id: 3, nickname: '조뱀파이어', avatarUrl: 'images/playerA.png' },
			{ id: 3, nickname: '양뱀파이어', avatarUrl: 'images/vampireIcon.png' },
			{ id: 3, nickname: '박뱀파이어', avatarUrl: 'images/playerB.png' },
			{ id: 3, nickname: '박뱀파이어', avatarUrl: 'images/humanIcon.png' },
			{ id: 3, nickname: '박뱀파이어', avatarUrl: 'images/playerB.png' },
			{ id: 3, nickname: '조뱀파이어', avatarUrl: 'images/playerA.png' },
			{ id: 3, nickname: '양뱀파이어', avatarUrl: 'images/vampireIcon.png' },
		];
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
					{ id: 13, nickname: '마지막사람', avatarUrl: 'images/playerK.png' },
					{ id: 14, nickname: '새로운사람', avatarUrl: 'images/playerL.png' },
					{ id: 15, nickname: '처음사람', avatarUrl: 'images/playerM.png' },
					{ id: 16, nickname: '또다른사람', avatarUrl: 'images/playerN.png' },
					{ id: 17, nickname: '모르는사람', avatarUrl: 'images/playerO.png' },
					{ id: 18, nickname: '알고있는사람', avatarUrl: 'images/playerP.png' },
				],
			},
		};

		app.innerHTML = this._getHTML();
		// this.clientInfo = clientInfo;

		this._initPage();
	}

	_initPage() {
		this._setTabButtons();
		this._autoSetScrollTrackColor();
		this._subscribeWindow();
		//모드에 따라 다른 notify 이벤트를 listen해 re render하는 메서드 구현
		this._listenNotifyEvent();
	}

	_listenNotifyEvent() {
		const listener = (messageEvent) => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (this.selectedTab === 'friendRequestListTab') {
				if (
					event === 'notifyFriendRequestReceive' ||
					event === 'notifyFriendRequestCanceled'
				) {
					this._renderFriendRequestList();
				}
			} else if (this.selectedTab === 'friendListTab') {
				if (
					event === 'notifyFriendDeleted' ||
					event === 'notifyFriendRequestAccepted'
				) {
					this._renderFriendList();
				}
			}
		};
		//페이지 이동시 remove해야함
		// this.clientInfo.socket.addEventListener('message', listener);
	}

	_setTabButtons() {
		this.searchContainer = document.querySelector('#searchContainer');
		this.userListContainer = document.querySelector('.userListContainer');
		document
			.querySelector('#searchUserButton') // 유저 검색 탭
			.addEventListener('click', this._setSearchContainer.bind(this, true));
		document
			.querySelector('#friendRequestButton') // 친구 요청 목록 탭
			.addEventListener('click', () => {
				this._setSearchContainer(false);
				this._renderFriendRequestList();
			});
		document
			.querySelector('#myFriendButton') // 내 친구 관리 탭
			.addEventListener('click', () => {
				this._setSearchContainer(false);
				this._renderFriendList();
			});
		document
			.querySelector('#blockUserButton') // 차단 유저 관리 탭
			.addEventListener('click', this._setSearchContainer.bind(this, false));
	}

	_renderFriendRequestList() {
		const innerContentContainer = document.querySelector(
			'#innerContentContainer'
		);
		innerContentContainer.innerHTML = this._getFriendRequestListContainerHTML();
		innerContentContainer
			.querySelectorAll('.acceptButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const id = parseInt(event.target.closest('.userItem').dataset.id);
					this._acceptFriendRequest(id);
				});
			});

		innerContentContainer
			.querySelectorAll('.rejectButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const id = parseInt(event.target.closest('.userItem').dataset.id);
					this._rejectFriendRequest(id);
				});
			});
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
			this._renderFriendRequestList();
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
			this._renderFriendRequestList();
		}
	}

	_renderFriendList() {
		const innerContentContainer = document.querySelector(
			'#innerContentContainer'
		);
		innerContentContainer.innerHTML = this._getFriendListContainerHTML();
		innerContentContainer
			.querySelectorAll('.deleteButton')
			.forEach((button) => {
				button.addEventListener('click', (event) => {
					const id = parseInt(event.target.closest('.userItem').dataset.id);
					this._deleteFriend(id);
				});
			});
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
			this._renderFriendList();
		}
	}

	_setSearchContainer(visible) {
		if (visible) {
			this.searchContainer.classList.add('visible');
			this.searchContainer.classList.remove('invisible');
			this.userListContainer.style.height = '91%';
		} else {
			this.searchContainer.classList.remove('visible');
			this.searchContainer.classList.add('invisible');
			this.userListContainer.style.height = '100%';
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
		// TODO : 표시되는 리스트가 업데이트될 때도 호출해줘야 하지 않을까? 로비에서도?
		const userListContainier = document.querySelector('.userListContainer');
		if (userListContainier.scrollHeight > userListContainier.clientHeight) {
			userListContainier.classList.add('transparent-scrolltrack');
			userListContainier.classList.remove('scrollbar-scrolltrack');
		} else {
			userListContainier.classList.remove('transparent-scrolltrack');
			userListContainier.classList.add('scrollbar-scrolltrack');
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
						${this._getUserListContainerHTML()}
					</div>
				</div>
		</div>
		`;
	}
	_getTabContainerHTML() {
		return `
			<div id="tabContainer">
				<button class="tabButton" id="searchUserButton">유저 검색</button>
				<button class="tabButton" id="friendRequestButton">친구 요청 목록</button>
				<button class="tabButton" id="myFriendButton">내 친구 관리</button>
				<button class="tabButton" id="blockUserButton">차단 유저 관리</button>
			</div>
		`;
	}
	_getSearchContainerHTML() {
		return `
			<div id="searchContainer" class="visible">
				<input id="userSearchInput" placeholder="닉네임을 입력하세요.">
			</div>
		`;
	}
	_getUserListContainerHTML() {
		const userItemsHTML = this.clientList.reduce((acc, current) => {
			return acc + this._getUserItemHTML(current);
		}, '');
		return `
			<div class="userListContainer">
				${userItemsHTML}
			</div>
		`;
	}
	_getUserItemHTML(user) {
		return `
			<div class="userItem">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${user.avatarUrl}">
				</div>
				<div class="nickname">${user.nickname}</div>
				<div class="buttonGroup">
					<div class="userManagementButton friendRequestButtton activatedButton">친구 요청</div>
					<div class="userManagementButton userBlockButtton activatedButton">차단</div>
				</div>
			</div>
		`;
	}

	_getFriendRequestListContainerHTML() {
		const getfriendRequestItemHtml = (client) => {
			return `
			<div class="userItem" data-id="${client.id}">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${client.avatarUrl}">
				</div>
				<div class="nickname">${client.nickname}</div>
				<div class="buttonGroup">
					<div class="userManagementButton acceptButton activatedButton">수락</div>
					<div class="userManagementButton rejectButton activatedButton">거절</div>
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
			<div class="userListContainer">
				${clientRequestListHTML}
			</div>
		`;
	}

	_getFriendListContainerHTML() {
		const getfriendItemHtml = (requestClient) => {
			return `
			<div class="userItem" data-id="${requestClient.id}">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${requestClient.avatarUrl}">
				</div>
				<div class="nickname">${requestClient.nickname}</div>
				<div class="buttonGroup">
					<div class="userManagementButton deleteButton activatedButton">친구 삭제</div>
					<div class="userManagementButton blockButton activatedButton">차단</div>
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
			<div class="userListContainer">
				${clientListHTML}
			</div>
		`;
	}
}

export default FriendManagementPageManager;
