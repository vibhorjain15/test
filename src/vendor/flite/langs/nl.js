(function () {
	"use strict";
	var langs = ["nl"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "Wijzigingen bijhouden inschakelen",
			flite_TOGGLE_SHOW: "Schakelen van gevolgd zichtbaarheid van wijzigingen",
			flite_ACCEPT_ALL: "Accepteer alle wijzigingen",
			flite_REJECT_ALL: "Weiger alle wijzigingen",
			flite_ACCEPT_ONE: "Accepteer wijziging",
			flite_REJECT_ONE: "Weiger wijziging",
			flite_START_TRACKING: "Begin met het bijhouden van wijzigingen",
			flite_STOP_TRACKING: "Stop met het volgen van wijzigingen",
			flite_PENDING_CHANGES: "Uw document bevat uitstekende wijzigingen. Verwerk deze alsjeblieft voordat het bijhouden van wijzigingen is uitgeschakeld.",
			flite_HIDE_TRACKED: "Verberg wijzigingen bijhouden",
			flite_SHOW_TRACKED: "Wijzigingen tonen",
			flite_CHANGE_TYPE_ADDED: "toegevoegd",
			flite_CHANGE_TYPE_DELETED: "verwijderd",
			flite_MONTHS: ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
			flite_NOW: "nu",
			flite_MINUTE_AGO: "1 minuut geleden",
			flite_MINUTES_AGO: "%Minutes minuten geleden",
			flite_BY: "door",
			flite_ON: "op",
			flite_AT: "om",
			flite_USER: "Gebruiker"
		});
	});
}());