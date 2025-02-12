(function () {
	"use strict";
	var langs = ["pt_BR", "pt_PT", "pt"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "Alternar marcas de revisão",
			flite_TOGGLE_SHOW: "Alternar marcas de revisão",
			flite_ACCEPT_ALL: "Aceitar todas as modificações",
			flite_REJECT_ALL: "Rejeitar todas as modificações",
			flite_ACCEPT_ONE: "Aceitar modificação",
			flite_REJECT_ONE: "Rejeitar modificação",
			flite_START_TRACKING: "Começar a marcar as modificações",
			flite_STOP_TRACKING: "Parar de marcar as modificações",
			flite_PENDING_CHANGES: "Seu documento contém algumas modificações pendentes de confirmação.\nFavor resolvê-las antes de desligar as marcas de revisão.",
			flite_HIDE_TRACKED: "Ocultar marcas de revisão",
			flite_SHOW_TRACKED: "Mostrar marcas de revisão",
			flite_CHANGE_TYPE_ADDED: "acrescentado",
			flite_CHANGE_TYPE_DELETED: "excluído",
			flite_MONTHS: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
			flite_NOW: "agora",
			flite_MINUTE_AGO: "há 1 minuto atrás",
			flite_MINUTES_AGO: "há %Minutes minutos atrás",
			flite_BY: "por",
			flite_ON: "em",
			flite_AT: "há",
			flite_USER: "Utilizador"
		});
	});
}());