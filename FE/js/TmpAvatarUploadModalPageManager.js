class TmpAvatarUploadModalPageManager {
  constructor(app, clientInfo) {
    console.log("TMP Page!");
    this.app = app;
    this._settingDefaultAvatart();
    app.innerHTML = this._getHTML();
    this.clientInfo = clientInfo;
    this.avatarSelectionModal = document.querySelector(".avatarSelectionModal");
    this._setModal();
  }

  async _settingDefaultAvatart() {
    this._addDefaultAvatar("images/playerA.png");
    this._addDefaultAvatar("images/vampireIcon.png");
    this._addDefaultAvatar("images/playerA.png");
    this._addDefaultAvatar("images/humanIcon.png");
    this._addDefaultAvatar("images/playerB.png");
  }

  _setModal() {
    const modalInitButton = document.querySelector("#modalInitButton");
    modalInitButton.addEventListener("click", this._renderModal.bind(this));
    // this._setDefaultAvatarFrame()
    this._setUploadFrame();
  }

  _setUploadFrame() {
    const uploadFrame = document.querySelector("#uploadFrame");
    const fileInput = document.querySelector("#fileInput");
    uploadFrame.addEventListener("click", () => {
      fileInput.click();
    });
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        //파일을 this에 등록해 사용자가 확인버튼을 누르면 전송한다.
        this.uploadImage = file;
        //파일을 화면에 렌더링한다.
        const img = document.createElement("img");
        img.file = file;
        this.app.appendChild(img);
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log(e.target.result);
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        this._closeModal.call(this);
      }
    });
  }

  _renderModal() {
    this.avatarSelectionModal.style.display = "flex";
    this.avatarSelectionModal.addEventListener("click", (e) => {
      if (e.target.className.includes("avatarSelectionModal"))
        this._closeModal.call(this);
    });
  }

  _closeModal() {
    this.avatarSelectionModal.style.display = "none";
  }

  _getHTML() {
    return `
			<button id="modalInitButton">모달 띄우기</button>
    ${this._getAvatarSectionModalHTML()}
		`;
  }

  _addDefaultAvatar(avatarPath) {
    if (!this._defaultAvatarPathList) this._defaultAvatarPathList = [];
    this._defaultAvatarPathList.push(avatarPath);
  }

  _getAvatarSectionModalHTML() {
    if (!this._defaultAvatarPathList) this._defaultAvatarPathList = [];
    const avatarPathListHtml = this._defaultAvatarPathList.reduce(
      (acc, path) =>
        acc +
        `<div class="selectionAvatarFrame">
            <img class="selectionAvatarImage" src="${path}">
          </div>`,
      ""
    );
    return `
      <div class="avatarSelectionModal">
        ${avatarPathListHtml}
        <div class="selectionAvatarFrame" id="uploadFrame">
            <img class="uploadIconImage" src="images/uploadIcon.png">
            <input type="file" id="fileInput" style="display: none;" accept="image/*">
        </div>
      </div>
      `;
  }
}

export default TmpAvatarUploadModalPageManager;
