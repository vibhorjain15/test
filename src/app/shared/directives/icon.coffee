angular.module('diligenceVault').directive 'icon', ->
  restrict: 'E'
  template: '<i class="dvi"></i>'
  replace: true
  scope:
    name: '@'
    size: '@'
  link: ($scope, element, attrs) ->
    if $scope.name
      element.addClass "dvi-#{$scope.name}"

    if $scope.size
      element.addClass "fa-#{$scope.size}"

    if angular.isDefined(attrs.colored)
      element.addClass 'colored'
