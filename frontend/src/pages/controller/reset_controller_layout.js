import { resetLayout } from './controller.js';
import Modal from '@/utils/Modal.js';

 export function handleResetBtnClick() {
	const modal = new Modal({
		title: "Reset layout",
		message: "Are you sure you want to reset the layout?",
		buttons: Modal.Buttons.YES_CANCEL,
		onConfirm: resetLayout,
		dataColor: 'red'
	});
	modal.showModal();
}
