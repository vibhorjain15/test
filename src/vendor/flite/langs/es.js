(function () {
	"use strict";
	var langs = ["es", "es_MX"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "Activar y desactivar el seguimiento de cambios",
			flite_TOGGLE_SHOW: "Activar y desactivar el seguimiento de cambios",
			flite_ACCEPT_ALL: "Aceptar todos los cambios",
			flite_REJECT_ALL: "Descartar todos los cambios",
			flite_ACCEPT_ONE: "Aceptar el cambio",
			flite_REJECT_ONE: "Descartar el cambio",
			flite_START_TRACKING: "Iniciar el seguimiento de cambios",
			flite_STOP_TRACKING: "Detener el seguimiento de cambios",
			flite_PENDING_CHANGES: "Su documento tiene algunos cambios pendientes.\nPor favor, resuélvalos antes de desactivar el seguimiento de cambios.",
			flite_HIDE_TRACKED: "Ocultar el seguimiento de cambios",
			flite_SHOW_TRACKED: "Mostrar el seguimiento de cambios",
			flite_CHANGE_TYPE_ADDED: "agregado",
			flite_CHANGE_TYPE_DELETED: "borrado",
			flite_MONTHS: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", " Ago", "Sep", "Oct", "Nov", "Dic"],
			flite_NOW: "ahora",
			flite_MINUTE_AGO: "hace 1 minuto",
			flite_MINUTES_AGO: "Hace %Minutes minutos",
			flite_BY: "por",
			flite_ON: "sobre",
			flite_AT: "en",
			flite_USER: "Usuario"
		});
	});
}());