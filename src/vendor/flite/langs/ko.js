(function () {
	"use strict";
	var langs = ["ko_KR", "ko"];
	langs.forEach(function (lang) {
		tinymce.addI18n(lang, {
			flite_TOGGLE_TRACKING: "변경 내용 추적 토글",
			flite_TOGGLE_SHOW: "변경 내용 추적 토글",
			flite_ACCEPT_ALL: "표시된 변경 내용 모두 적용",
			flite_REJECT_ALL: "표시된 변경 내용 모두 취소",
			flite_ACCEPT_ONE: "변경 내용 적용",
			flite_REJECT_ONE: "변경 내용 취소",
			flite_START_TRACKING: "변경 내용 추적 시작",
			flite_STOP_TRACKING: "변경 내용 추적 중단",
			flite_PENDING_CHANGES: "문서에 보류 중인 변경 사항이 있습니다.\n변경 내용 추적을 해제하기 전에 이를 해결하십시오.",
			flite_HIDE_TRACKED: "변경 내용 추적 숨기기",
			flite_SHOW_TRACKED: "변경 내용 추적 표시",
			flite_CHANGE_TYPE_ADDED: "추가 완료",
			flite_CHANGE_TYPE_DELETED: "삭제 완료",
			flite_MONTHS: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
			flite_NOW: "지금",
			flite_MINUTE_AGO: "1분 전",
			flite_MINUTES_AGO: "%분 전",
			flite_BY: "시점까지",
			flite_ON: "시점",
			flite_AT: "장소",
			flite_USER: "User"
		});
	});
}());