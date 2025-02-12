angular.module('diligenceVault').directive 'emptyState', ->
  restrict: 'E'
  templateUrl: 'shared/directives/emptyState/template.html'
  scope:
    iconName: '@'
    message: '@'
    action: '&'
    actionLabel: '@'
