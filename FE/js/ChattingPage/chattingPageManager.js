class ChattingPageManager {
	constructor(chat, clientInfo) {
		console.log('Chatting Page!');

		this.clientInfo = clientInfo;
		//추후 삭제해야함
		this.clientInfo = {
			id: 1,
			friendInfo: {},
		};
		// TODO : 임시 하드코딩
		this.clientInfo.friendInfo.friendList = [{
			id: 1, nickname: '조뱀파이어어어어어어', avatarUrl: 'images/playerA.png', activeState: "ACTIVE",
			chat: { recentMessage: "하이하이하이하이하이하이하이하이", recentTimestamp: "2024-07-02T14:30:00Z", unreadMessageCount: 1 }
		}, {
			id: 2, nickname: '박뱀파이어', avatarUrl: 'images/humanIcon.png', activeState: "ACTIVE",
			chat: { recentMessage: "하이하이하이하이하이하이하이하이", recentTimestamp: "2024-07-02T14:30:00Z", unreadMessageCount: 3 }
		}, {
			id: 3, nickname: '이뱀파이어', avatarUrl: 'images/playerB.png', activeState: "INACTIVE",
			chat: { recentMessage: "하이하이하이하이하이하이하이하이", recentTimestamp: "2024-07-02T14:30:00Z", unreadMessageCount: 0 }
		}, {
			id: 4, nickname: '김뱀파이어', avatarUrl: 'images/playerA.png', activeState: "ACTIVE",
			chat: { recentMessage: "하이하이하이하이하이하이하이하이", recentTimestamp: "2024-07-02T14:30:00Z", unreadMessageCount: 2 }
		}, {
			id: 5, nickname: '최뱀파이어', avatarUrl: 'images/playerA.png', activeState: "ACTIVE",
			chat: { recentMessage: "하이하이하이하이하이하이하이하이", recentTimestamp: "2024-07-02T14:30:00Z", unreadMessageCount: 0 }
		}, {
			id: 6, nickname: '정뱀파이어', avatarUrl: 'images/playerA.png', activeState: "INACTIVE",
			chat: { recentMessage: "하이하이하이하이하이하이하이하이", recentTimestamp: "2024-07-02T14:30:00Z", unreadMessageCount: 1000 }
		},
		];
		this._appendChatButton();

		this._initPage();
	}

	_appendChatButton() {
		const button = document.createElement('button');
		button.className = 'chatButton';

		this.totalUnreadCount = document.createElement('div');
		this.totalUnreadCount.className = 'totalUnreadCount';
		button.append(this.totalUnreadCount);

		document.body.appendChild(button);
		this._renderTotalUnreadMessageCount();
		// this.clientInfo.socket.addEventListener('message', (messageEvent) => {
		// 	const { event, content } = JSON.parse(messageEvent.data);
		// 	if (event === 'notifyMessageArrive') {
		// 		this._renderTotalUnreadMessageCount();
		// 	}
		// })
	}
	_renderTotalUnreadMessageCount() {
		const count = this.clientInfo.friendInfo.friendList.reduce((acc, current) => {
			return acc + current.chat.unreadMessageCount;
		}, 0);
		if (count === 0) {
			this.totalUnreadCount.classList.add('invisible');
		} else {
			this.totalUnreadCount.classList.remove('invisible');
			this.totalUnreadCount.textContent = count > 999 ? '999+' : count;
		}
	}

	_initPage() {
		this.isOpened = false;
		this.readingFriendId = null;

		document.querySelector('.chatButton').addEventListener('click', (event) => {
			event.stopPropagation();
			if (this.isOpened) {
				this._closeChatContainer();
			} else {
				//친구가 없다면
				if (this.clientInfo.friendInfo.friendList.length === 0) {
					if (this._noFriendContainerOpened) {
						this._closeNoFriendChatContainer();
					} else {
						this._openNoFriendChatContainer();
					}
					return;
				}
				//친구가 있다면
				this._openChatContainer();
			}
		});
		window.addEventListener('click', (event) => {
			event.stopPropagation();
			if (this.isOpened && event.target.closest('.chatContainer') === null) {
				this._closeChatContainer();
			}
		});
	}

	_openNoFriendChatContainer() {
		this._noFriendContainerOpened = true;
		this.noFriendContainer = document.createElement('div');
		this.noFriendContainer.className = 'noFriendContainer';
		document.body.appendChild(this.noFriendContainer);

		const noFriendTitleContainer = document.createElement('div');
		noFriendTitleContainer.className = 'noFriendTitleContainer';
		noFriendTitleContainer.textContent = '친구가 없어서 슬픈 뱀파이어';
		this.noFriendContainer.appendChild(noFriendTitleContainer);

		const noFriendImageContainer = document.createElement('div');
		noFriendImageContainer.className = 'noFriendImageContainer';
		this.noFriendContainer.appendChild(noFriendImageContainer);

		const noFriendTextContainer = document.createElement('div');
		noFriendTextContainer.className = 'noFriendTextContainer';
		noFriendTextContainer.innerHTML =
			`친구가 없어서 슬픈 뱀파이어다.<br>친구를 사귀고 싶다.`;
		this.noFriendContainer.appendChild(noFriendTextContainer);
		this.noFriendContainerWindowClickListener = (event) => {
			event.stopPropagation();
			if (event.target.closest('.noFriendContainer') === null) {
				this._closeNoFriendChatContainer();
			}
		};
		window.addEventListener('click', this.noFriendContainerWindowClickListener);

		// 친구가 새로 생긴경우
		// this.noFriendAndGetFriendListener = (messageEvent) => {
		// 	const { event, content } = JSON.parse(messageEvent.data);
		// 	if (
		// 		(event === 'acceptFriendRequestResponse' && content.message === 'OK') ||
		// 		event === 'notifyFriendRequestAccepted'
		// 	) {
		// 		this._closeNoFriendChatContainer();
		// 		this._openChatContainer();
		// 	}
		// };
		// this.clientInfo.socket.addEventListener(
		// 	'message',
		// 	this.noFriendAndGetFriendListener
		// );
	}

	_closeNoFriendChatContainer() {
		window.removeEventListener(
			'click',
			this.noFriendContainerWindowClickListener
		);
		// this.clientInfo.socket.removeEventListener(
		// 	'message',
		// 	this.noFriendAndGetFriendListener
		// );
		this._noFriendContainerOpened = false;
		this.noFriendContainer.remove();
		this.noFriendContainer = null;
	}

	_openChatContainer() {
		this.isOpened = true;
		this.chatContainer = document.createElement('div');
		this.chatContainer.className = 'chatContainer';
		this.chatContainer.innerHTML = this._getChatContainerHTML();
		document.body.appendChild(this.chatContainer);

		const firstFriendId = this._getSortedFriendList()[0].id;

		this.messageListContainer = document.querySelector('.messageListContainer');
		this._renderEntireMessage(firstFriendId);
		this._setInputButton();

		this._renderFriendList(); // TODO : FriendListContainer div 비워주기, 정렬된 데이터를 가지고 렌더링

		// this._setMessageArriveListener();
	}
	async _closeChatContainer() {
		this.isOpened = false;
		this.chatContainer.remove();
		if (this.readingFriendId) {
			await this._sendStopReadingMessage();
		}
		// this.clientInfo.socket.removeEventListener('message', this._messageArriveListener);
	}

	_getSortedFriendList() {
		// 최근에 대화한 순으로 정렬
		return this.clientInfo.friendInfo.friendList
			.slice()
			.sort((friend1, friend2) => {
				return (
					new Date(friend2.chat.recentTimestamp) -
					new Date(friend1.chat.recentTimestamp)
				);
			});
	}

	_setInputButton() {
		this.inputBox = document.querySelector('.inputBox');
		document.querySelector('.inputButton').addEventListener('click', () => {
			if (this.inputBox.value === '') return;
			// const sendMessage= {
			// 	event: "sendMessage",
			// 	content: {
			// 		clientId: this.readingFriendId,
			// 		message: this.inputBox.value
			// 	}
			// }
			// this.clientInfo.socket.send(JSON.stringify(sendMessage));
			this.inputBox.value = '';
		});
	}

	_setFriendItems() {
		// TODO : 리렌더링 시 호출
		document.querySelectorAll('.friendItem').forEach((item) => {
			item.addEventListener('click', async (event) => {
				event.stopPropagation();
				if (event.target.classList.contains('inviteButton')) {
					console.log('초대 버튼 클릭');
					// TODO : 초대 버튼 클릭 시 구현
					return;
				}
				if (this.readingFriendId) {
					await this._sendStopReadingMessage();
				}
				this._setSelectedFriendItem(item);
				this._renderEntireMessage(parseInt(item.dataset.id));
			});
		});
	}

	async _sendStopReadingMessage() {
		const stopReadingChatMessage = {
			event: 'stopReadingChat',
			content: {
				clientId: this.readingFriendId,
			},
		};
		this.readingFriendId = null;
		// this.clientInfo.socket.send(JSON.stringify(stopReadingChatMessage));
		// await new Promise((resolve) => {
		// 	const listener = (messageEvent) => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (event === 'stopReadingChatResponse' && content.message === 'OK') {
		// 			this.clientInfo.socket.removeEventListener('message', listener);
		// 			resolve();
		// 		}
		// 	}
		// 	this.clientInfo.socket.addEventListener('message', listener);
		// });
	}

	// TODO : 대기실 페이지일 때만 초대 버튼 표시하기
	_setSelectedFriendItem(friendItem) {
		if (this.selectedFriendItem) {
			this.selectedFriendItem.classList.remove('selectedFriendItem');
			this.selectedInviteButton.classList.add('invisible');
		}
		this.selectedFriendItem = friendItem;
		this.selectedInviteButton = friendItem.querySelector('.inviteButton');
		this.selectedFriendItem.classList.add('selectedFriendItem');
		this.selectedInviteButton.classList.remove('invisible');
	}

	_renderFriendList() {
		document.querySelector('.FriendListContainer').innerHTML =
			this._getFriendListHTML();
		const friendItems = Array.from(document.querySelectorAll('.friendItem'));
		const readingItem = friendItems.find((item) => {
			return parseInt(item.dataset.id) === this.readingFriendId;
		});
		this._setSelectedFriendItem(readingItem);
		this._setFriendItems();
	}

	async _renderEntireMessage(id) {
		//id로 조회
		// const getTotalChatDataMessage = {
		// 	event: "getTotalChatData",
		// 	content: {
		// 		clientId: 3
		// 	}
		// }
		// this.clientInfo.socket.send(JSON.stringify(getTotalChatDataMessage));
		// const messageList = await new Promise((resolve) => {
		// const listener = (messageEvent) => {
		// 	const { event, content } = JSON.parse(messageEvent.data);
		// 	if (event === 'getTotalChatDataResponse') {
		// 		this.clientInfo.socket.removeEventListener('message', listener);
		// 		resolve(content.messageList);
		// 	}
		// }
		// 	this.clientInfo.socket.addEventListener('message', listener);
		// });

		this.readingFriendId = id;
		const friend = this.clientInfo.friendInfo.friendList.find((friend) => friend.id === id);
		if (friend) {
			friend.chat.unreadMessageCount = 0;
			this._renderFriendList();
			this._renderTotalUnreadMessageCount();
		}

		const messageList = [
			{ senderId: 1, content: '오늘 한 판 고고?' },
			{ senderId: 2, content: '너 개못하잖아' },
			{ senderId: 1, content: '까부네 ㅋㅋ' },
			{ senderId: 2, content: '드루와라' },
			{
				senderId: 2,
				content:
					'늘 저녁 뭐 먹을까? 치킨이 땡기는데, 네 생각은 어때? 우리 동네에 새로 생긴 치킨집이 있다던데, 거기 한번 가볼까? 맛있다는 평이 많아서 기대돼. 어떤 메뉴 먹고 싶어? 양념치킨? 후라이드치킨? 아니면 반반치킨? 나는 반반치킨이 좋아. 다양한 맛을 즐길 수 있어서 좋아. 7시에 만나서 같이 먹자. 너도 그때까지 배고프지 않게 간단한 간식 먹고 있어. 그럼 이따 보자!',
			},
		];

		const messageListHTML = messageList.reduce((acc, message) => {
			const senderSide =
				message.senderId === this.clientInfo.id ? 'rightSender' : 'leftSender';
			const messageHTML = `<div class="messageBubble ${senderSide}">${message.content}</div>`;
			return acc + messageHTML;
		}, '');
		this.messageListContainer.innerHTML = messageListHTML;
		window.onload = function () {
			const messageListContainer = document.querySelector(
				'.messageListContainer'
			);
			messageListContainer.scrollTop = messageListContainer.scrollHeight;
		};
	}

	_setMessageArriveListener() {
		this.clientInfo.socket.addEventListener(
			'message',
			this._messageArriveListener
		);
	}
	_messageArriveListener = (messageEvent) => {
		const { event, content } = JSON.parse(messageEvent.data);
		if (event === 'notifyMessageArrive') {
			if (
				this.readingFriendId === content.sendClientId ||
				this.readingFriendId === content.receiveClientId
			) {
				const messageElement = document.createElement('div');
				const senderSide =
					content.sendClientId === this.clientInfo.id
						? 'rightSender'
						: 'leftSender';
				messageElement.classList.add('messageBubble', senderSide);
				messageElement.textContent = content.message;
				this.messageListContainer.append(messageElement);
				// TODO : 스크롤 내리기
				const friend = this.clientInfo.friendInfo.friendList.find(
					(friend) =>
						friend.id === content.sendClientId ||
						friend.id === content.receiveClientId
				);
				friend.chat.unreadMessageCount = 0;
			}
		}
		if (event === 'notifyFriendDeleted') {
			if (this.readingFriendId === content.clientInfo.id) {
				document.querySelector('.messageInputContainer').classList.add('disabledMessageInputContainer');
				const inputBox = document.querySelector('.inputBox')
				inputBox.placeholder = '더 이상 대화할 수 없습니다.';
				inputBox.disabled = true;
			}
		}
		if (event === 'acceptFriendRequestResponse'
			|| event === 'notifyFriendRequestAccepted'
			|| event === 'deleteFriendResponse'
			|| event === 'notifyFriendDeleted'
			|| event === 'blockClientResponse'
			|| event === 'notifyMessageArrive'
			|| event === 'notifyFriendActiveStateChange'
		) {
			this._renderFriendList();
			this._renderTotalUnreadMessageCount();
		}
	};

	_getChatContainerHTML() {
		return `
            <div class="FriendListContainer"></div>
            ${this._getMessageBoxContainerHTML()}
        `;
	}
	_getFriendListHTML() {
		const getFriendItemHTML = function (friend) {
			return `
                <button class="friendItem" data-id="${friend.id}">
                    <div class="avatarContainer">
                        <div class="avatarImgFrame">
                            <img class="avatarImg" src="${friend.avatarUrl}">
                        </div>
                        <div class="activeState ${
													friend.activeState === 'ACTIVE' ? '' : 'invisible'
												}"></div>
                    </div>
                    <div class="infoBox">
                        <div class="nickname">${friend.nickname}</div>
                        <div class="recentMessage">${
													friend.chat.recentMessage
												}</div>
                    </div>
                    <div class="inviteButton invisible ${friend.activeState === 'ACTIVE' ? '' : 'disabledInviteButton'}">초대</div>
					<div class="unreadCount ${friend.chat.unreadMessageCount === 0 ? 'invisible' : ''}">${getUnreadCount(friend)}</div>
                </button>
            `;
		}
		const getUnreadCount = function (friend) {
			return friend.chat.unreadMessageCount > 999 ? '999+' : `${friend.chat.unreadMessageCount}`;
		}
		const friendListHTML = this._getSortedFriendList().reduce((acc, currnet) => {
			return acc + getFriendItemHTML(currnet);
		}, '');
		return friendListHTML;
	}

	_getMessageBoxContainerHTML() {
		return `
        <div class="messageBoxContainer">
            <div class="messageListContainer">
            </div>
            <div class="messageInputContainer">
                <input type="text", class="inputBox" spellcheck="false">
                <div class="inputButton">
                    <img class="sendImage" src="images/sendIcon.png"></img>
                </div>
            </div>
        </div>
        `;
	}
}

export default ChattingPageManager;
