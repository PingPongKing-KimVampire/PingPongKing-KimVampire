const usernameInput = document.querySelector("#usernameInput");
const passwordInput = document.querySelector("#passwordInput");
const passwordConfirmInput = document.querySelector("#passwordConfirmInput");
const nicknameInput = document.querySelector("#nicknameInput");

const usernameWarning = document.querySelector("#usernameWarning");
const passwordWarning = document.querySelector("#passwordWarning");
const passwordConfirmWarning = document.querySelector(
  "#passwordConfirmWarning"
);
const nicknameWarning = document.querySelector("#nicknameWarning");

const confirmButton = document.querySelector("#confirmButton");

let usernameValidState = false;
let passwordValidState = false;
let passwordConfirmValidState = false;
let nicknameValidState = false;
updateConfirmButton();

usernameInput.addEventListener("input", () => {
  checkUsername();
  updateConfirmButton();
});
passwordInput.addEventListener("input", () => {
  checkPassword();
  checkPasswordConfirm();
  updateConfirmButton();
});
passwordConfirmInput.addEventListener("input", () => {
  checkPasswordConfirm();
  updateConfirmButton();
});
nicknameInput.addEventListener("input", () => {
  checkNickname();
  updateConfirmButton();
});

function checkUsername() {
  const username = usernameInput.value;
  if (!validateUsername(username)) {
    const invalidUsernameMessage = "1에서 20자의 영문, 숫자만 사용 가능합니다.";
    usernameWarning.textContent = invalidUsernameMessage;
    usernameValidState = false;
    return;
  }
  //아이디 중복검사
  usernameValidState = true;
  usernameWarning.textContent = "";
}

function checkPassword() {
  const password = passwordInput.value;
  if (!validatePassword(password)) {
    const invalidPasswordMessage =
      "8에서 20자의 영문, 숫자, 1개 이상의 특수문자만 사용 가능합니다.";
    passwordWarning.textContent = invalidPasswordMessage;
    passwordValidState = false;
    return;
  }
  passwordValidState = true;
  passwordWarning.textContent = "";
}

function checkPasswordConfirm() {
  const password = passwordInput.value;
  const passwordConfirm = passwordConfirmInput.value;

  if (!validatePasswordConfirm(password, passwordConfirm)) {
    const invalidPasswordConfirmMessage = "비밀번호와 일치하지 않습니다.";
    passwordConfirmWarning.textContent = invalidPasswordConfirmMessage;
    passwordConfirmValidState = false;
    return;
  }
  passwordConfirmValidState = true;
  passwordConfirmWarning.textContent = "";
}

function checkNickname() {
  const nickname = nicknameInput.value;
  if (!validateNickname(nickname)) {
    const invalidNicknameMessage =
      "1에서 20자의 영문, 숫자, 한글만 사용 가능합니다.";
    nicknameWarning.textContent = invalidNicknameMessage;
    nicknameValidState = false;
    return;
  }
  //아이디 중복검사
  nicknameValidState = true;
  nicknameWarning.textContent = "";
}

function validateUsername(username) {
  const regex = /^[A-Za-z0-9]{1,20}$/;
  return regex.test(username);
}

function validateNickname(nickname) {
  const regex = /^[A-Za-z가-힣0-9]{1,20}$/;
  return regex.test(nickname);
}

function validatePassword(password) {
  const regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:">?<,\-./;'[\]\\|])[A-Za-z\d!@#$%^&*()_+{}:">?<,\-./;'[\]\\|]{8,20}$/;
  return regex.test(password);
}

function validatePasswordConfirm(password, passwordConfirm) {
  return password === passwordConfirm;
}

function updateConfirmButton() {
  if (
    usernameValidState &&
    passwordValidState &&
    passwordConfirmValidState &&
    nicknameValidState
  ) {
    confirmButton.disabled = false;
  } else confirmButton.disabled = true;
}
