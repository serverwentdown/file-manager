/* jshint esversion: 6 */

$(document).ready(() => {
    let $shell = $("#shell");
    if ($shell.length < 1) {
        return;
    }
    let $close = $("#shell-close");

    Terminal.applyAddon(attach);
    Terminal.applyAddon(fit);

    let term = new Terminal();
    let ws = new WebSocket("ws" + (window.location.protocol === "https:" ? "s" : "") + "://" + window.location.host + "/websocket?path=" + encodeURIComponent($shell.data("path")));
    term.attach(ws, true, true);
    term.open($shell[0]);

	ws.addEventListener("open", () => {

		// resize
		term.on("resize", ({ cols, rows }) => {
			console.log(cols, rows);
			const buf = Uint16Array.of(0, cols, rows);
			ws.send(buf);
		});
		$(window).on("resize", () => {
			term.fit();
		});
		term.fit();

		// close
		let closeTimeout = null;
		$close.on("click", (e) => {
			e.preventDefault();
			if (ws.readyState !== 1) {
				window.location.pathname = window.location.pathname.replace("@shell", "");
			} else {
				ws.close();
			}
		});
		ws.addEventListener("close", () => {
			term.write("\r\n\r\nclosing shell in 2 seconds...");
			closeTimeout = setTimeout(() => {
				window.location.pathname = window.location.pathname.replace("@shell", "");
			}, 2000);
		});
		term.on("data", () => {
			if (closeTimeout != null) {
				clearTimeout(closeTimeout);
				term.write("\r\nkeyboard input detected. timeout canceled");
				closeTimeout = null;
			}
		});
	
	});
});
