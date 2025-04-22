export default class Modal {
	static Buttons = Object.freeze({
		YES_NO_CANCEL: 'YES_NO_CANCEL',
		YES_NO: 'YES_NO',
		YES_CANCEL: 'YES_CANCEL',
		CONFIRM_ONLY: 'CONFIRM_ONLY',
		CANCEL_ONLY: 'CANCEL_ONLY'
	});

	constructor({
		title = "Are you sure?",
		message = "Do you want to proceed?",
		onConfirm = () => {},
		onCancel = () => {},
		customHTML = '',
		buttons = Modal.Buttons.YES_NO_CANCEL,
		yesBtnText = "Yes",
		noBtnText = "No",
		cancelBtnText = "Cancel"
	}) {
		this.title = title;
		this.message = message;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
		this.customHTML = customHTML;
		this.buttons = buttons;
		this.modalElement = null;
		this.yesBtnText = yesBtnText;
		this.noBtnText = noBtnText;
		this.cancelBtnText = cancelBtnText;
	}

	_createButtons() {
		const buttons = {
			YES: `<button class="btn" id="modal-yes">${this.yesBtnText}</button>`,
			NO: `<button class="btn" id="modal-no">${this.noBtnText}</button>`,
			CANCEL: `<button class="btn" id="modal-cancel">${this.cancelBtnText}</button>`,
		};

		// For some reason, there is no gap when the \n isn't included
		switch (this.buttons) {
			case Modal.Buttons.YES_NO:
				return buttons.YES + '\n' + buttons.NO;
			case Modal.Buttons.YES_CANCEL:
				return buttons.YES + '\n' + buttons.CANCEL;
			case Modal.Buttons.CONFIRM_ONLY:
				return buttons.YES;
			case Modal.Buttons.CANCEL_ONLY:
				return buttons.CANCEL;
			case Modal.Buttons.YES_NO_CANCEL:
			default:
				return buttons.YES + '\n' + buttons.NO + '\n' + buttons.CANCEL;
		}
	}

	createModal() {
		this.modalElement = document.createElement('div');
		this.modalElement.classList.add('modal');
		this.modalElement.innerHTML = `
			<div class="modal-content block">
				<h2>${this.title}</h2>
				<p>${this.message}</p>
				${this.customHTML}
				<div>
					${this._createButtons()}
				</div>
			</div>
		`;

		document.body.appendChild(this.modalElement);

		const yesBtn = document.getElementById('modal-yes');
		if (yesBtn) yesBtn.addEventListener('click', () => {
			this.onConfirm();
			this.destroyModal();
		});

		const noBtn = document.getElementById('modal-no');
		if (noBtn) noBtn.addEventListener('click', () => {
			this.onCancel();
			this.destroyModal();
		});

		const cancelBtn = document.getElementById('modal-cancel');
		if (cancelBtn) cancelBtn.addEventListener('click', () => {
			this.onCancel();
			this.destroyModal();
		});
	}

	showModal() {
		this.createModal();
		this.modalElement.style.display = 'flex';
		document.body.style.overflow = 'hidden';
	}

	destroyModal() {
		if (this.modalElement) {
			this.modalElement.remove();
			this.modalElement = null;
		}
		document.body.style.overflow = '';
	}
}
