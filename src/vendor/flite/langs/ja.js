(function () {
	"use strict";
	var langs = ["ja"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "変更の追跡を切り替える",
			flite_TOGGLE_SHOW: "変更の追跡を切り替える",
			flite_ACCEPT_ALL: "全ての変更を許可",
			flite_REJECT_ALL: "全ての変更を拒否",
			flite_ACCEPT_ONE: "変更を許可",
			flite_REJECT_ONE: "変更を拒否",
			flite_START_TRACKING: "変更の追跡を開始",
			flite_STOP_TRACKING: "変更の追跡を中止",
			flite_PENDING_CHANGES: "ドキュメントにいくつかの未決の変更が含まれています。\n変更の追跡をオフにする前にそれらを解決してください。",
			flite_HIDE_TRACKED: "追跡した変更を隠す",
			flite_SHOW_TRACKED: "追跡した変更を表示する",
			flite_CHANGE_TYPE_ADDED: "追加済",
			flite_CHANGE_TYPE_DELETED: "削除済",
			flite_MONTHS: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
			flite_NOW: "今",
			flite_MINUTE_AGO: "1 分前",
			flite_MINUTES_AGO: "%Minutes 分前",
			flite_BY: "まで",
			flite_ON: "に",
			flite_AT: "に",
			flite_USER: "User"
		});
	});
}());