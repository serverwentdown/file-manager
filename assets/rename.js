/* jshint esversion: 6 */

const updateRenameValue = ($inputs, $value) => {
  let files = [];
  $inputs.each((i, ele) => {
    files.push({
      original: $(ele).data("original"),
      new: $(ele).val(),
    });
  });
  $value.val(JSON.stringify(files));
};

$select.on("change-files", (e, files) => {
  if (files.length == 0) {
    $(".rename-files").html(
      `<ul class="list-group"><li class="list-group-item text-muted">No files selected</li></ul>`
    );
    return;
  }
  $(".rename-files").html(
    files
      .map((f) => {
        return `
          <div class="mb-3">
            <label class="form-label">
              <strike>${htmlEscape(f.name)}</strike>
            </label>
            <input
              type="text"
              class="form-control rename-files-input"
              data-original="${htmlEscape(f.name)}"
              value="${htmlEscape(f.name)}">
          </div>
        `;
      })
      .join("")
  );
  $(".rename-files-input").on("keydown", (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
      const $next = $(e.target).parent().nextAll().find("input")[0];
      if ($next) {
        $next.focus();
        if ($next.type == "text") {
          $next.select();
        }
      }
    }
  });
  $(".rename-files").each((i, ele) => {
    const $value = $(ele).parent().find(".rename-files-value");
    const $inputs = $(ele)
      .find(".rename-files-input")
      .on("focus blur change", (e) => {
        updateRenameValue($inputs, $value);
      });
    updateRenameValue($inputs, $value);
  });
});

updateSelected();
