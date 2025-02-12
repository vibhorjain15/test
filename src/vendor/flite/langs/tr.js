(function () {
	"use strict";
	var langs = ["tr", "tr_TR"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "Değişiklikleri İzlemeyi Değiştir",
			flite_TOGGLE_SHOW: "Değişiklikleri İzlemeyi Değiştir",
			flite_ACCEPT_ALL: "Tüm değişiklikleri kabul et",
			flite_REJECT_ALL: "Tüm değişiklikleri reddet",
			flite_ACCEPT_ONE: "Değişikliği Kabul Et",
			flite_REJECT_ONE: "Değişikliği Reddet",
			flite_START_TRACKING: "Değişiklikleri izlemeyi başlat",
			flite_STOP_TRACKING: "Değişiklikleri izlemeyi durdur",
			flite_PENDING_CHANGES: "Belgeniz bazı bekleyen değişiklikler içeriyor.\nDeğişiklik izlemeyi kapatmadan önce lütfen bu değişiklikleri tamamlayın.",
			flite_HIDE_TRACKED: "İzlenen değişiklikleri gizle",
			flite_SHOW_TRACKED: "İzlenen değişiklikleri göster",
			flite_CHANGE_TYPE_ADDED: "eklendi",
			flite_CHANGE_TYPE_DELETED: "silindi",
			flite_MONTHS: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
			flite_NOW: "şimdi",
			flite_MINUTE_AGO: "1 dakika önce",
			flite_MINUTES_AGO: "%Minutes dakika önce",
			flite_BY: "şu kişi tarafından:",
			flite_ON: "tarihi:",
			flite_AT: "saati:",
			flite_USER: "Kullanıcı"
		});
	});
}());