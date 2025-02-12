angular.module('diligenceVault').directive 'dashboard', ->
  restrict: 'EA'
  templateUrl: 'dashboard/directives/dashboard/template.html'
  scope: true
  link: (scope, element, attrs) ->
    deregisterer = scope.$watch attrs.config, (value) ->
      if value?
        scope.config = value
        deregisterer()
