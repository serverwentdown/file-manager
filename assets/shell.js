/* jshint esversion: 6 */

$(document).ready(() => {
	let $shell = $("#shell");
    if (!$shell) {
        return;
    }

    let closeTimeout = null;

    // excerpt from wetty

    let socket = io("?path=" + encodeURIComponent($shell.data("path")));
    let term = null;
    let buf = "";

    function Wetty(argv) {
        this.argv_ = argv;
        this.io = null;
        this.pid_ = -1;
    }
    Wetty.prototype.run = function () {
        this.io = this.argv_.io.push();

        this.io.onVTKeystroke = this.sendString_.bind(this);
        this.io.sendString = this.sendString_.bind(this);
        this.io.onTerminalResize = this.onTerminalResize.bind(this);
    };
    Wetty.prototype.sendString_ = function (str) {
        socket.emit("input", str);

        // cancel close timeout
        if (closeTimeout != null) {
            clearTimeout(closeTimeout);
            term.io.writeUTF16("\r\nkeyboard input detected. timeout canceled");
            closeTimeout = null;
        }
    };
    Wetty.prototype.onTerminalResize = function (col, row) {
        socket.emit("resize", { col: col, row: row });
    };

    socket.on("connect", () => { 
        console.log("socket.io connection established");
        lib.init(() => {
            hterm.defaultStorage = new lib.Storage.Local();
            term = new hterm.Terminal();
            window.term = term;
            term.decorate(document.getElementById("shell"));
            // force custom size
            $shell.find("iframe").css("height", "calc(100% - 52px * 2)");

            term.setCursorPosition(0, 0);
            term.setCursorVisible(true);
            term.prefs_.set("ctrl-c-copy", true);
            term.prefs_.set("ctrl-v-paste", true);
            term.prefs_.set("use-default-window-copy", true);

            term.runCommandClass(Wetty);
            socket.emit("resize", {
                col: term.screenSize.width,
                row: term.screenSize.height,
            });

            if (buf && buf != "") {
                term.io.writeUTF16(buf);
                buf = "";
            }
        });
    });

    socket.on("output", (data) => {
        if (!term) {
            buf += data;
            return;
        }
        term.io.writeUTF16(data);
    });

    socket.on("disconnect", () => {
        console.log("socket.io connection closed");
    });

    // end excerpt from wetty

    socket.on("disconnect", () => {
        term.io.writeUTF16("\r\n\r\nclosing shell in 2 seconds...");
        closeTimeout = setTimeout(() => {
            window.location.pathname = window.location.pathname.replace("@shell", "");
        }, 2000);
    });

});
