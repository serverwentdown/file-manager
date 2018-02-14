/* jshint esversion: 6 */

$(document).ready(() => {
	let $form = $("form[action='@upload']");
	let $file = $("#upload-file");
	
	$(".upload-unhide").fadeOut();
	
	$file.on("change", () => {
		let file = $file[0].files[0];
		let fnElement = $file.parent().find(".custom-file-label");
		fnElement.addClass("file-selected");
		fnElement.text(file.name);

		$form.find("#upload-file-size").val(filesize(file.size));
		$form.find("[name=saveas]").val(file.name);
		$(".upload-unhide").fadeIn();
	});

	$form.on("submit", () => {
		let putresource = $form.find("[name=saveas]").val();
		// TODO: do XHR to PUT at putresource
	});
});
