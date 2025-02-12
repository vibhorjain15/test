angular.module('diligenceVault').directive 'rbComponentWidth', ()->
  restrict: 'E'
  templateUrl: 'shared/directives/rbComponents/directives/rbComponentWidth/template.html'
  replace: true
  link: (scope, element, attrs, controllers) ->

    lessWidthComponent = [ 'questionnaire_template' ]

    lessLayoutOptions = [
      {
        value: '50'
        label: 'Half'
      }
      {
        value: '100'
        label: 'Full'
      }
    ]

    scope.layoutOptions = [
      {
        value: '33'
        label: 'One-Third'
      }
      {
        value: '50'
        label: 'Half'
      }
      {
        value: '66'
        label: 'Two-Third'
      }
      {
        value: '100'
        label: 'Full'
      }
    ]

    if scope.component.type in lessWidthComponent
      scope.layoutOptions = lessLayoutOptions