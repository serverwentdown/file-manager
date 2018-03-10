#!/usr/bin/env node

/* jshint esversion: 6 */
/* jshint node: true */
"use strict";

const express = require("express");
const hbs = require("express-handlebars");
const bodyparser = require("body-parser");
const session = require("express-session");
const busboy = require("connect-busboy");
const flash = require("connect-flash");

const archiver = require("archiver");

const notp = require("notp");
const base32 = require("thirty-two");

const fs = require("fs");
const path = require("path");

const filesize = require("filesize");

let app = express();

app.set("views", path.join(__dirname, "views"));
app.engine("handlebars", hbs({
	partialsDir: path.join(__dirname, "views", "partials"),
	layoutsDir: path.join(__dirname, "views", "layouts"),
	defaultLayout: "main",
	helpers: {
		eachpath: (path, options) => {
			if (typeof path != "string") {
				return "";
			}
			let out = "";
			path = path.split("/");
			path.splice(path.length - 1, 1);
			path.unshift("");
			path.forEach((folder, index) => {
				out += options.fn({
					name: folder + "/",
					path: "/" + path.slice(1, index + 1).join("/"),
					current: index === path.length - 1
				});
			});
			return out;
		}
	}
}));
app.set("view engine", "handlebars");

app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/octicons", express.static(path.join(__dirname, "node_modules/octicons/build")));
app.use("/jquery", express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use("/filesize", express.static(path.join(__dirname, "node_modules/filesize/lib")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use(session({
	secret: "meowmeow"	
}));
app.use(flash());
app.use(busboy());
app.use(bodyparser.urlencoded());

// AUTH

const KEY = process.env.KEY ? base32.decode(process.env.KEY.replace(/ /g, "")) : null;

app.get("/@logout", (req, res) => {
	if (KEY) {
		req.session.login = false;
		req.flash("success", "Signed out.");
		res.redirect("/@login");
        return
	}
    req.flash("error", "You were never logged in...");
    res.redirect("back");
});

app.get("/@login", (req, res) => {
	res.render("login", flashify(req, {}));
});
app.post("/@login", (req, res) => {
	let pass = notp.totp.verify(req.body.token.replace(" ", ""), KEY);
	console.log(pass, req.body.token.replace(" ", ""));
	if (pass) {
		req.session.login = true;
		res.redirect("/");
        return;
	}
    req.flash("error", "Bad token.");
    res.redirect("/@login");
});

app.use((req, res, next) => {
	if (!KEY) {
		return next();
	}
	if (req.session.login === true) {
		return next();
	}
    req.flash("error", "Please sign in.");
    res.redirect("/@login");
});

function relative(...paths) {
	return paths.reduce((a, b) => path.join(a, b), process.cwd());
}
function flashify(req, obj) {
	let error = req.flash("error");
	if (error && error.length > 0) {
		if (!obj.errors) {
			obj.errors = [];
		}
		obj.errors.push(error);
	}
	let success = req.flash("success");
	if (success && success.length > 0) {
		if (!obj.successes) {
			obj.successes = [];
		}
		obj.successes.push(success);
	}
	obj.isloginenabled = !!KEY;
	return obj;
}

app.all("/*", (req, res, next) => {
	res.filename = req.params[0];

	let fileExists = new Promise((resolve, reject) => {
		// Check if file exists
		fs.stat(relative(res.filename), (err, stats) => {
			if (err) {
				return reject(err);
			}
			return resolve(stats);
		});
	});

	fileExists.then((stats) => {
		res.stats = stats;
		next();
	}).catch((err) => {
		res.stats = { error: err };
		next();
	});
});

// Currently unused
app.put("/*", (req, res) => {
	if (res.stats.error) {
		req.busboy.on("file", (key, file, filename) => {
			if (key == "file") {
				let save = fs.createWriteStream(relative(res.filename));
				file.pipe(save);
				save.on("close", () => {
					res.flash("success", "File saved. ");
					res.redirect("back");
				});
				save.on("error", (err) => {
					res.flash("error", err);
					res.redirect("back");	
				});
			}
		});
		req.busboy.on("field", (key, value) => {

		});
		req.pipe(req.busboy);
	}
	else {
		req.flash("error", "File exists, cannot overwrite. ");
		res.redirect("back");
	}
});

app.post("/*@upload", (req, res) => {
	res.filename = req.params[0];

	let buff = null;
	let saveas = null;
	req.busboy.on("file", (key, stream, filename) => {
		if (key == "file") {
			let buffs = [];
			stream.on("data", (d) => {
				buffs.push(d);
			});
			stream.on("end", () => {
				buff = Buffer.concat(buffs);
				buffs = null;
			});
		}
	});
	req.busboy.on("field", (key, value) => {
		if (key == "saveas") {
			saveas = value;
		}
	});
	req.busboy.on("finish", () => {
		if (!buff || !saveas) {
			return res.status(400).end();
		}
		let fileExists = new Promise((resolve, reject) => {
			// Check if file exists
			fs.stat(relative(res.filename, saveas), (err, stats) => {
				if (err) {
					return reject(err);
				}
				return resolve(stats);
			});
		});

		fileExists.then((stats) => {
			req.flash("error", "File exists, cannot overwrite. ");
			res.redirect("back");
		}).catch((err) => {
			console.log("saving");
			let save = fs.createWriteStream(relative(res.filename, saveas));
			save.on("close", () => {
				if (buff.length === 0) {
					req.flash("success", "File saved. Warning: empty file.");
				}
				else {
					buff = null;
					req.flash("success", "File saved. ");
				}
				res.redirect("back");
			});
			save.on("error", (err) => {
				req.flash("error", err);
				res.redirect("back");
			});
			save.write(buff);
			save.end();
		});
	});
	req.pipe(req.busboy);
});

app.post("/*@mkdir", (req, res) => {
	res.filename = req.params[0];

	let folder = req.body.folder;
	if (!folder || folder.length < 1) {
		return res.status(400).end();
	}

	let fileExists = new Promise((resolve, reject) => {
		// Check if file exists
		fs.stat(relative(res.filename, folder), (err, stats) => {
			if (err) {
				return reject(err);
			}
			return resolve(stats);
		});
	});

	fileExists.then((stats) => {
		req.flash("error", "Folder exists, cannot overwrite. ");
		res.redirect("back");
	}).catch((err) => {
		fs.mkdir(relative(res.filename, folder), (err) => {
			if (err) {
				req.flash("error", err);
				res.redirect("back");
                return;
			}
			req.flash("success", "Folder created. ");
			res.redirect("back");
		});
	});
});

app.post("/*@delete", (req, res) => {
	res.filename = req.params[0];

	let files = JSON.parse(req.body.files);
	if (!files || !files.map) {
		req.flash("error", "No files selected.");
		res.redirect("back");
		return; // res.status(400).end();
	}

	let promises = files.map(f => {
		return new Promise((resolve, reject) => {
			fs.stat(relative(res.filename, f), (err, stats) => {
				if (err) {
					return reject(err);
				}
				resolve({
					name: f,
					isdirectory: stats.isDirectory(),
					isfile: stats.isFile()
				});
			});
		});
	});
	Promise.all(promises).then((files) => {
		let promises = files.map(f => {
			return new Promise((resolve, reject) => {
				let op = null;
				if (f.isdirectory) {
					op = fs.rmdir;
				}
				else if (f.isfile) {
					op = fs.unlink;
				}
				if (op) {
					op(relative(res.filename, f.name), (err) => {
						if (err) {
							return reject(err);
						}
						resolve();
					});
				}
			});
		});
		Promise.all(promises).then(() => {
			req.flash("success", "Files deleted. ");	
			res.redirect("back");
		}).catch((err) => { // TODO: recursive rmdir https://github.com/isaacs/rimraf
			req.flash("error", "Unable to delete some files: " + err);	
			res.redirect("back");
		});
	}).catch((err) => {
		req.flash("error", err);	
		res.redirect("back");
	});
});

app.get("/*@download", (req, res) => {
	res.filename = req.params[0];
	
	let files = null;
	try {
		files = JSON.parse(req.query.files);
	} catch (e) {}
	if (!files || !files.map) {
		req.flash("error", "No files selected.");
		res.redirect("back");
		return; // res.status(400).end();
	}
	
	let promises = files.map(f => {
		return new Promise((resolve, reject) => {
			fs.stat(relative(res.filename, f), (err, stats) => {
				if (err) {
					return reject(err);
				}
				resolve({
					name: f,
					isdirectory: stats.isDirectory(),
					isfile: stats.isFile()
				});
			});
		});
	});
	Promise.all(promises).then((files) => {
		let zip = archiver.create("zip", {});
		zip.on("error", function(err) {
			res.status(500).send({
				error: err.message
			});
		});

		files.filter(f => f.isfile).forEach((f) => {
			zip.file(relative(res.filename, f.name), { name: f.name });
		});
		files.filter(f => f.isdirectory).forEach((f) => {
			zip.directory(relative(res.filename, f.name), f.name);
		});

		res.attachment("Archive.zip");
		zip.pipe(res);

		zip.finalize();
	}).catch((err) => {
        console.log(err);
		req.flash("error", err);	
		res.redirect("back");
	});
});

app.get("/*", (req, res) => {
	if (res.stats.error) {
		res.render("list", flashify(req, {
            shellable: shellable,
			path: res.filename,
			errors: [
				res.stats.error
			]
		}));
	}
	else if (res.stats.isDirectory()) {
		if (!req.url.endsWith("/")) {
			return res.redirect(req.url + "/");
		}

		let readDir = new Promise((resolve, reject) => {
			fs.readdir(relative(res.filename), (err, filenames) => {
				if (err) {
					return reject(err);
				}
				return resolve(filenames);
			});
		});

		readDir.then((filenames) => {
			let promises = filenames.map(f => {
				return new Promise((resolve, reject) => {
					fs.stat(relative(res.filename, f), (err, stats) => {
						if (err) {
							return reject(err);
						}
						resolve({
							name: f,
							isdirectory: stats.isDirectory(),
							size: filesize(stats.size)
						});
					});
				});
			});

			Promise.all(promises).then((files) => {
				res.render("list", flashify(req, {
                    shellable: shellable,
					path: res.filename,
					files: files,
				}));	
			}).catch((err) => {
				res.render("list", flashify(req, {
                    shellable: shellable,
					path: res.filename,
					errors: [
						err
					]
				}));
			});
		}).catch((err) => {
			res.render("list", flashify(req, {
                shellable: shellable,
				path: res.filename,
				errors: [
					err
				]
			}));
		});
	}
	else if (res.stats.isFile()) {
		res.download(relative(res.filename));
	}
});

// shell

const shellable = process.env.ENABLE_SHELL == "true" ? true : false;

if (shellable) {
    const child_process = require("child_process");

    app.post("/*@cmd", (req, res) => {
        res.filename = req.params[0];

        let cmd = req.body.cmd;
        if (!cmd || cmd.length < 1) {
            return res.status(400).end();
        }

        child_process.exec(cmd, {
            cwd: res.filename,
            timeout: 60 * 1000,
        }, (err, stdout, stderr) => {
            if (err) {
                req.flash("error", "Unable to execute command " + cmd);
                res.redirect("back");
                return;
            }
            res.render("cmd", flashify(req, {
                path: res.filename,
                cmd: cmd,
                stdout: stdout,
                stderr: stderr,
            }));
        });
    });
}

// startup

app.listen(process.env.PORT || 8080);
