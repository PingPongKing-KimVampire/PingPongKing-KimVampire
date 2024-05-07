const exitButton = document.querySelector('.exitButton');
const exitModal = document.querySelector('.exitModal');
const exitYesButton = document.querySelector('.exitModal .yesButton');
const exitNoButton = document.querySelector('.exitModal .noButton');

exitButton.addEventListener('click', () => {
	exitModal.style.display = 'flex';
})

exitNoButton.addEventListener('click', () => {
	exitModal.style.display = 'none';
})

exitYesButton.addEventListener('click', () => {
	console.log('exit!');
})