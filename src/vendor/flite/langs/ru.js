(function () {
	"use strict";
	var langs = ["ru"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "Включить/выключить отслеживание изменений",
			flite_TOGGLE_SHOW: "Включить/выключить отслеживание изменений",
			flite_ACCEPT_ALL: "Принять все изменения",
			flite_REJECT_ALL: "Отклонить все изменения",
			flite_ACCEPT_ONE: "Принять изменение",
			flite_REJECT_ONE: "Отклонить изменение",
			flite_START_TRACKING: "Начать отслеживать изменения",
			flite_STOP_TRACKING: "Прекратить отслеживать изменения",
			flite_PENDING_CHANGES: "Ваш документ содержит неподтвержденные изменения.\nУдалите их до выключения отслеживания измненений.",
			flite_HIDE_TRACKED: "Скрыть отслеживаемые изменения",
			flite_SHOW_TRACKED: "Показать остлеживаемые изменения",
			flite_CHANGE_TYPE_ADDED: "добавлено",
			flite_CHANGE_TYPE_DELETED: "удалено",
			flite_MONTHS: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
			flite_NOW: "сейчас",
			flite_MINUTE_AGO: "1 минуту назад",
			flite_MINUTES_AGO: "%Minutes минут(-ы) назад",
			flite_BY: "к",
			flite_ON: "в",
			flite_AT: "в",
			flite_USER: "Пользователь"
		});
	});
}());