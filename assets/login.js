/* jshint esversion: 6 */

$(document).ready(() => {
	let $token = $("#login-token");
	let cleanup = () => {
		let val = $token.val();
		val = val.replace(/[^0-9 ]/, "");
		val = val.split("");
		if (val.length > 3 && val[3] != " ") {
			val.splice(3, 0, " ");
		}
		val.splice(7);
		val = val.join("");
		$token.val(val);
	};
	$token.on("keyup", cleanup);
	$token.on("keydown", cleanup);
	$token.on("change", cleanup);
});
