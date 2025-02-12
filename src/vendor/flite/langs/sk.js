(function () {
	"use strict";
	var langs = ["sk"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "Prepnúť záznam",
			flite_TOGGLE_SHOW: "Prepnúť zobrazenie",
			flite_ACCEPT_ALL: "Prijať všetky zmeny",
			flite_REJECT_ALL: "Zrušiť všetky zmeny",
			flite_ACCEPT_ONE: "Prijať zmenu",
			flite_REJECT_ONE: "Zrušiť zmenu",
			flite_START_TRACKING: "Zapnúť záznam zmien",
			flite_STOP_TRACKING: "Vypnúť záznam zmien",
			flite_CHANGE_TYPE_ADDED: "vložené",
			flite_CHANGE_TYPE_DELETED: "zmazané",
			flite_PENDING_CHANGES: "Dokument obsahuje zaznamenané zmeny.\nPred ukončením režimu záznamu zmien treba všetky zmeny prijať alebo zrušiť.",
			flite_HIDE_TRACKED: "Skryť zaznamenané zmeny",
			flite_SHOW_TRACKED: "Zobraziť zaznamenané zmeny",
			flite_MONTHS: ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"],
			flite_NOW: "teraz",
			flite_MINUTE_AGO: "pred 1 minútou",
			flite_MINUTES_AGO: "pred %Minutes minútami",
			flite_BY: "",
			flite_ON: "",
			flite_AT: "",
			flite_USER: "Používateľ"
		});
	});
}());