angular.module('diligenceVault').directive 'rbNotSupported', ($sce, Utils, $rootScope, $compile)->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->
    scope.$render = ->
      element.html $compile('<p class="text-center text-muted"><b> <i> This widget does not support firm </i></b></p>')(scope)
    scope.$render()
