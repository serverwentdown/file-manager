/* jshint esversion: 6 */

let $select = $(".multi-select");

$select.on("change-files", (e, files) => {
  $(".multi-files-value").val(JSON.stringify(files.map((f) => f.name)));
  if (files.length == 0) {
    $(".multi-files").html(
      `<li class="list-group-item text-muted">No files selected</li>`
    );
    return;
  }
  $(".multi-files").html(
    files
      .map((f) => {
        const badge = `<span class="badge rounded-pill bg-secondary badge-alignment">
          ${filesize(f.size)}
        </span>`;
        return `
          <li class="list-group-item d-flex align-items-start justify-content-between">
            <span class="name">${htmlEscape(f.name)}</span>
            ${f.type == "directory" ? `` : badge}
          </li>
        `;
      })
      .join("")
  );
  const hasDirectory = files.reduce(
    (a, f) => a || f.type == "directory",
    false
  );
  const totalSize = files.map((f) => f.size).reduce((a, b) => a + b);
  if (hasDirectory) {
    $(".multi-files-total").val("");
  } else {
    $(".multi-files-total").val(filesize(totalSize));
  }
});

const updateSelected = () => {
  let $selected = $(".multi-select:checked");
  let files = [];
  $selected.each((i, ele) => {
    files.push({
      name: $(ele).data("select"),
      type: $(ele).data("select-type"),
      size: $(ele).data("select-size"),
    });
  });

  $select.trigger("change-files", [files]);
};

$select.on("change", updateSelected);
updateSelected();
