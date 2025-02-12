angular.module('diligenceVault').directive 'subForm', ->
  restrict: 'A'
  require: ['form', '^^form']
  link: (scope, element, attrs, controllers) ->
    ngFormController = controllers[0]
    formController = controllers[1]

    if !formController.$subForms
      formController.$subForms = []

    formController.$subForms.push ngFormController
