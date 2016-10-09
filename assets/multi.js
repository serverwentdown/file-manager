/* jshint esversion: 6 */

$(document).ready(() => {
	let $select = $(".multi-select");

	let setSelected = (files) => {
		$(".multi-files-value").val(JSON.stringify(files));
		$(".multi-files").html(
			files.map(f => {
				return `<li class="list-group-item">${f}</li>`;
			}).join("")
		);
	};

	$select.on("change", () => {
		let $selected = $(".multi-select:checked");
		let files = [];
		$selected.each((i, ele) => {
			files.push($(ele).data("select"));
		});

		setSelected(files);
	});
});
