angular.module('diligenceVault').directive 'dvSentToContactSelector', ->
  restrict: 'E'
  replace: true
  scope:
    diligence: '='
    sentToContactsList: '='
    onChange: '&'
  bindToController: true
  templateUrl: 'shared/directives/dvSentToContactSelector/template.html'
  controller: 'DvSentToContactSelectorController'
  controllerAs: 'vm'
