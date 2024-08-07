class ChattingPageManager {
	constructor(clientInfo, renderPage) {
		console.log("Chatting Page!");

		this.clientInfo = clientInfo;
		this.renderPage = renderPage;
		this._appendChatButton();

		this._initPage();
	}

	_appendChatButton() {
		this.totalUnreadCount = document.querySelector(".totalUnreadCount");
		this._renderTotalUnreadMessageCount();
		this.clientInfo.socket.addEventListener("message", messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if (event === "notifyMessageArrive" || event === "notifyFriendDeleted" || event === "deleteFriendResponse") {
				setTimeout(() => {
					this._renderTotalUnreadMessageCount();
				}, 0);
			}
		});
	}
	_renderTotalUnreadMessageCount() {
		const count = this.clientInfo.friendInfo.friendList.reduce((acc, current) => {
			return acc + current.chat.unreadMessageCount;
		}, 0);
		if (count === 0) {
			this.totalUnreadCount.classList.add("invisible");
		} else {
			this.totalUnreadCount.classList.remove("invisible");
			this.totalUnreadCount.textContent = count > 999 ? "999+" : count;
		}
	}

	_initPage() {
		this.isOpened = false;
		this.readingFriendId = null;

		document.querySelector(".chatButton").addEventListener("click", event => {
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
		window.addEventListener("click", event => {
			event.stopPropagation();
			if (this.isOpened && event.target.closest(".chatContainer") === null) {
				this._closeChatContainer();
			}
		});
	}

	_openNoFriendChatContainer() {
		this._noFriendContainerOpened = true;
		this.noFriendContainer = document.createElement("div");
		this.noFriendContainer.className = "noFriendContainer";
		document.body.appendChild(this.noFriendContainer);

		const noFriendTitleContainer = document.createElement("div");
		noFriendTitleContainer.className = "noFriendTitleContainer";
		noFriendTitleContainer.textContent = "친구가 없어서 슬픈 뱀파이어";
		this.noFriendContainer.appendChild(noFriendTitleContainer);

		const noFriendImageContainer = document.createElement("div");
		noFriendImageContainer.className = "noFriendImageContainer";
		this.noFriendContainer.appendChild(noFriendImageContainer);

		const noFriendTextContainer = document.createElement("div");
		noFriendTextContainer.className = "noFriendTextContainer";
		noFriendTextContainer.innerHTML = `친구가 없어서 슬픈 뱀파이어다.<br>친구를 사귀고 싶다.`;
		this.noFriendContainer.appendChild(noFriendTextContainer);
		this.noFriendContainerWindowClickListener = event => {
			event.stopPropagation();
			if (event.target.closest(".noFriendContainer") === null) {
				this._closeNoFriendChatContainer();
			}
		};
		window.addEventListener("click", this.noFriendContainerWindowClickListener);

		// 친구가 새로 생긴경우
		this.noFriendAndGetFriendListener = messageEvent => {
			const { event, content } = JSON.parse(messageEvent.data);
			if ((event === "acceptFriendRequestResponse" && content.message === "OK") || event === "notifyFriendRequestAccepted") {
				this._closeNoFriendChatContainer();
				this._openChatContainer();
			}
		};
		this.clientInfo.socket.addEventListener("message", this.noFriendAndGetFriendListener);
	}

	_closeNoFriendChatContainer() {
		window.removeEventListener("click", this.noFriendContainerWindowClickListener);
		this.clientInfo.socket.removeEventListener("message", this.noFriendAndGetFriendListener);
		this._noFriendContainerOpened = false;
		this.noFriendContainer.remove();
		this.noFriendContainer = null;
	}

	async _openChatContainer() {
		this.isOpened = true;
		this.chatContainer = document.createElement("div");
		this.chatContainer.className = "chatContainer";
		this.chatContainer.innerHTML = this._getChatContainerHTML();
		document.body.appendChild(this.chatContainer);

		const firstFriendId = this._getSortedFriendList()[0].id;

		this.messageListContainer = document.querySelector(".messageListContainer");
		await this._renderEntireMessage(firstFriendId);
		this._setInputButton();

		this._renderFriendList(); // TODO : FriendListContainer div 비워주기, 정렬된 데이터를 가지고 렌더링

		this._setMessageArriveListener();
	}
	async _closeChatContainer() {
		this.isOpened = false;
		this.chatContainer.remove();
		if (this.readingFriendId) {
			await this._sendStopReadingMessage();
		}
		this.clientInfo.socket.removeEventListener("message", this._messageArriveListener);
	}

	_getSortedFriendList() {
		// 최근에 대화한 순으로 정렬
		return this.clientInfo.friendInfo.friendList.slice().sort((friend1, friend2) => {
			return new Date(friend2.chat.recentTimestamp) - new Date(friend1.chat.recentTimestamp);
		});
	}

	_setInputButton() {
		const sendMessage = () => {
			const messageContent = this.inputBox.value.trim();
			if (messageContent === "") return;
			const sendMessageObj = {
				event: "sendMessage",
				content: {
					clientId: this.readingFriendId,
					message: messageContent,
				},
			};
			this.clientInfo.socket.send(JSON.stringify(sendMessageObj));
			this.inputBox.value = "";
		};

		this.inputBox = document.querySelector(".inputBox");
		const inputButton = document.querySelector(".inputButton");

		inputButton.addEventListener("click", sendMessage);

		let isComposing = false;

		this.inputBox.addEventListener("compositionstart", () => {
			isComposing = true;
		});

		this.inputBox.addEventListener("compositionend", () => {
			isComposing = false;
		});

		this.inputBox.addEventListener("keydown", e => {
			if (e.key === "Enter" && !isComposing) {
				e.preventDefault();
				sendMessage();
			}
		});
	}

	_setFriendItems() {
		// TODO : 리렌더링 시 호출
		document.querySelectorAll(".friendItem").forEach(item => {
			item.addEventListener("click", async event => {
				event.stopPropagation();
				if (event.target.classList.contains("inviteButton") && !event.target.classList.contains("disabledInviteButton")) {
					this._inviteGame(parseInt(item.dataset.id));
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

	async _inviteGame(clientId) {
		const roomId = this.clientInfo.gameInfo.roomId;
		const sendGameInviteRequestMessage = {
			event: "sendGameInviteRequest",
			content: {
				clientId,
				roomId,
			},
		};
		this.clientInfo.socket.send(JSON.stringify(sendGameInviteRequestMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "sendGameInviteResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
	}

	async _sendStopReadingMessage() {
		const stopReadingChatMessage = {
			event: "stopReadingChat",
			content: {
				clientId: this.readingFriendId,
			},
		};
		this.readingFriendId = null;
		this.clientInfo.socket.send(JSON.stringify(stopReadingChatMessage));
		await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "stopReadingChatResponse" && content.message === "OK") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve();
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
	}

	_setSelectedFriendItem(friendItem) {
		//기존에 선택된게 있다면 선택되었을때의 CSS를 해제한다.
		if (this.selectedFriendItem) {
			this.selectedFriendItem.classList.remove("selectedFriendItem");
			this.selectedInviteButton.classList.add("invisible");
		}
		this.selectedFriendItem = friendItem;
		this.selectedInviteButton = friendItem.querySelector(".inviteButton");
		this.selectedFriendItem.classList.add("selectedFriendItem");
		if (this.clientInfo.currentPage === "waitingRoom") this.selectedInviteButton.classList.remove("invisible");
	}

	_renderFriendList() {
		const friendListContainer = document.querySelector(".FriendListContainer");
		friendListContainer.innerHTML = this._getFriendListHTML();
		friendListContainer.querySelectorAll(".friendItem").forEach(friendItem => {
			const id = friendItem.dataset.id;
			friendItem.querySelector(".avatarImg").addEventListener("click", e => {
				e.stopPropagation();
				this.renderPage("profile", { id });
				//프로필 페이지로 이동
				//채팅 인터페이스 닫음
				// this.renderPage()
				this._closeChatContainer();
			});
		});
		const friendItems = Array.from(document.querySelectorAll(".friendItem"));
		const readingItem = friendItems.find(item => {
			return parseInt(item.dataset.id) === this.readingFriendId;
		});
		this._setSelectedFriendItem(readingItem);
		this._setFriendItems();
	}

	async _renderEntireMessage(id) {
		//id로 조회
		const getTotalChatDataMessage = {
			event: "getTotalChatData",
			content: {
				clientId: id,
			},
		};
		this.clientInfo.socket.send(JSON.stringify(getTotalChatDataMessage));
		const messageList = await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getTotalChatDataResponse") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve(content.messageList);
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});

		this.readingFriendId = id;
		const friend = this.clientInfo.friendInfo.friendList.find(friend => friend.id === id);
		if (friend) {
			friend.chat.unreadMessageCount = 0;
			this._renderFriendList();
			this._renderTotalUnreadMessageCount();
		}

		const messageListHTML = messageList.reduce((acc, message) => {
			const senderSide = message.senderId === this.clientInfo.id ? "rightSender" : "leftSender";
			const messageHTML = `<div class="messageBubble ${senderSide}">${message.content}</div>`;
			return messageHTML + acc;
		}, "");
		this.messageListContainer.innerHTML = messageListHTML;
		this.messageListContainer.scrollTop = this.messageListContainer.scrollHeight;
	}

	_setMessageArriveListener() {
		this.clientInfo.socket.addEventListener("message", this._messageArriveListener);
	}
	_messageArriveListener = messageEvent => {
		const { event, content } = JSON.parse(messageEvent.data);
		if (event === "notifyMessageArrive") {
			if (this.readingFriendId === content.sendClientId || this.readingFriendId === content.receiveClientId) {
				const messageElement = document.createElement("div");
				const senderSide = content.sendClientId === this.clientInfo.id ? "rightSender" : "leftSender";
				messageElement.classList.add("messageBubble", senderSide);
				messageElement.textContent = content.message;
				this.messageListContainer.append(messageElement);
				const friend = this.clientInfo.friendInfo.friendList.find(friend => friend.id === content.sendClientId || friend.id === content.receiveClientId);
				friend.chat.unreadMessageCount = 0;
				//스크롤 내리기
				this.messageListContainer.scrollTop = this.messageListContainer.scrollHeight;
			}
		}
		if (event === "notifyFriendDeleted") {
			if (this.readingFriendId === content.clientInfo.id) {
				document.querySelector(".messageInputContainer").classList.add("disabledMessageInputContainer");
				const inputBox = document.querySelector(".inputBox");
				inputBox.placeholder = "더 이상 대화할 수 없습니다.";
				inputBox.disabled = true;
			}
		}
		if (
			event === "acceptFriendRequestResponse" ||
			event === "notifyFriendRequestAccepted" ||
			event === "deleteFriendResponse" ||
			event === "notifyFriendDeleted" ||
			event === "blockClientResponse" ||
			event === "notifyMessageArrive" ||
			event === "notifyFriendActiveStateChange"
		) {
			this._renderFriendList();
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
                        <div class="activeState ${friend.activeState === "ACTIVE" ? "" : "invisible"}"></div>
                    </div>
                    <div class="infoBox">
                        <div class="nickname">${friend.nickname}</div>
                        <div class="recentMessage">${friend.chat?.recentMessage ? friend.chat.recentMessage : ""}</div>
                    </div>
                    <div class="inviteButton invisible ${friend.activeState === "ACTIVE" ? "" : "disabledInviteButton"}">초대</div>
					<div class="unreadCount ${!friend.chat?.unreadMessageCount ? "invisible" : ""}">${getUnreadCount(friend)}</div>
                </button>
            `;
		};
		const getUnreadCount = function (friend) {
			return friend.chat.unreadMessageCount > 999 ? "999+" : `${friend.chat.unreadMessageCount}`;
		};
		const friendListHTML = this._getSortedFriendList().reduce((acc, currnet) => {
			return acc + getFriendItemHTML(currnet);
		}, "");
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
