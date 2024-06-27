class FriendManagementPageManager {
	constructor(app, clientInfo) {
		console.log('Friend Management Page!');

		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;
	}

	_getHTML() {
		return `
			친구 관리 페이지입니다.
		`;
	}
}

export default FriendManagementPageManager;