function htmlEscape(text) {
  const p = document.createElement("p");
  p.innerText = text;
  return p.innerHTML;
}
