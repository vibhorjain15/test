angular.module('diligenceVault').directive 'rbText', ($sce, Utils, $rootScope)->
  restrict: 'E'
  template: '<p class="report-paragraph"></p>'
  replace: true
  link: (scope, element) ->
    scope.$render = ->
      options = scope.component.options
      element.html(Utils.supplant(options.content, options))
    scope.$render()
