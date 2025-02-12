angular.module('diligenceVault').component 'ddEditableOnlyScore',{
  bindings:{
    score: '='
    total: '<'
    show_total: '<'
    keep_watcher_on: '<'
    ratingScale: '='
    naValue: '='
    readonly: '<'
    diligenceId: '<'
    ratingId: '<'
    disableSave: '<'
  }
  templateUrl: 'shared/components/ddEditableOnlyScore/template.html'
  controller: 'ddEditableOnlyScoreController'
  controllerAs: 'vm'
}