(function () {
	"use strict";
	var langs = ["zh_CN", "zh_TW", "zh"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "切换跟踪变更",
			flite_TOGGLE_SHOW: "切换跟踪变更",
			flite_ACCEPT_ALL: "接受所有变更",
			flite_REJECT_ALL: "拒绝所有变更",
			flite_ACCEPT_ONE: "接受变更",
			flite_REJECT_ONE: "拒绝变更",
			flite_START_TRACKING: "开始跟踪变更",
			flite_STOP_TRACKING: "停止跟踪变更",
			flite_PENDING_CHANGES: "您的文档包含一些待处理的变更。\n请在关闭变更跟踪之前解决这些变更",
			flite_HIDE_TRACKED: "隐藏已跟踪的变更",
			flite_SHOW_TRACKED: "显示已跟踪的变更",
			flite_CHANGE_TYPE_ADDED: "已添加",
			flite_CHANGE_TYPE_DELETED: "已删除",
			flite_MONTHS: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
			flite_NOW: "现在",
			flite_MINUTE_AGO: "1 分钟前",
			flite_MINUTES_AGO: "%Minutes 分钟前",
			flite_BY: "变更人：",
			flite_ON: "时间：",
			flite_AT: "时间：",
			flite_USER: "User"
		});
	});
}());