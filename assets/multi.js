/* jshint esversion: 6 */

$(document).ready(() => {
	let $select = $(".multi-select");

	let setSelected = (files) => {
		$(".multi-files-value").val(JSON.stringify(files.map(f => f.name)));
		$(".multi-files").html(
			files.map(f => {
				return `<li class="list-group-item d-flex align-items-start justify-content-between"><span class="name">${f.name}</span> <span class="badge badge-pill badge-secondary">${f.size}</span></li>`;
			}).join("")
		);
	};

    let updateSelected = () => {
		let $selected = $(".multi-select:checked");
		let files = [];
		$selected.each((i, ele) => {
			files.push({
                name: $(ele).data("select"),
                size: $(ele).data("select-size")
            });
		});

		setSelected(files);
	}

	$select.on("change", updateSelected);
    updateSelected();
});
