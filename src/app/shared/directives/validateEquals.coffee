angular.module('diligenceVault').directive 'validateEquals', ->
  require: 'ngModel'
  link: ($scope, element, attrs, ngModelController) ->
    ngModelController.$validators.validateEquals = (modelValue) ->
      modelValue is $scope.$eval(attrs.validateEquals)

    $scope.$watch attrs.validateEquals, ->
      ngModelController.$validate()
