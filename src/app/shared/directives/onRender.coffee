angular.module('diligenceVault').directive 'onRender', ($timeout) ->
  link: ($scope, element, attrs) ->
    isList = angular.isDefined(attrs.ngRepeat or attrs.dataNgRepeat)

    if !isList or $scope.$last
      $timeout -> $scope.$eval attrs.onRender
