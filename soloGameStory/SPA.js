class SPA {
	constructor() {
		this.appElement = document.querySelector('#app');
	}

	render(page) {
		this.appElement.innerHTML = page.getHTML();
	}
}

export default SPA;