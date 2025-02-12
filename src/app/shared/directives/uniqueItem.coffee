angular.module('diligenceVault').directive 'uniqueItem', ->
  require: 'ngModel'
  link: ($scope, element, attrs, ngModelController) ->
    list = null

    deregisterer = $scope.$watch attrs.uniqueItem, (value) ->
      if value?
        list = value
        deregisterer()

    ngModelController.$validators.uniqueItem = (modelValue) ->
      return true unless modelValue
      return unless list

      if attrs.valueAttr?
        _(list).pluck(attrs.valueAttr).indexOf(modelValue) < 0
      else
        list.indexOf(modelValue) < 0
