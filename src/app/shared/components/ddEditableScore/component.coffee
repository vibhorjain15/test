angular.module('diligenceVault').component 'ddEditableScore',{
  bindings:{
    selection: '='
    total: '<'
    show_total: '<'
    keep_watcher_on: '<'
    ratingScale: '='
    naValue: '='
    readonly: '<'
    reviewEnabled: '<'
    enableTrackChanges: '<'
    diligenceId: '<'
    ratingId: '<'
    disableSave: '<'
    responseId: '='
    functions: '<'
    assignedFunctions: '<'
  }
  templateUrl: 'shared/components/ddEditableScore/template.html'
  controller: 'ddEditableScoreController'
  controllerAs: 'vm'
}