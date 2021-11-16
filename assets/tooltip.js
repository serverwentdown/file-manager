/* jshint esversion: 6 */

document.querySelectorAll("[title]").forEach((element) => {
  new bootstrap.Tooltip(element, {
    delay: 500,
  });
});
