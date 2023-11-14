jQuery.noConflict();
var $ = jQuery.noConflict();
$(document).ready(() => {
	if (window.location.pathname == "/" || "/index.html" || "/index.htm") {
		$.get(window.location.origin + "/dist/json/version.json", (result) => {
			$.each(result, function (i, field) {
				$("#login_version").text(`Version ${field}`);
				$("#ver_log").text(`Version ${field}`);
			});
		});
	} else {
		$.get(window.location.origin + "/dist/json/version.json", (result) => {
			$.each(result, function (i, field) {
				$(".ver").text(`BonziWORLD Enhanced  v${field} `);
			});
		});
	}
});