angular.module('diligenceVault').directive 'dvOptionSelector', ($timeout) ->
  restrict: 'E'
  templateUrl: 'modals/add_template_questions/directives/dvOptionSelector/template.html'
  scope: true
  controller: 'DVOptionSelectorController'
  controllerAs: 'vm'
  link: (scope, element, attrs) ->
    scope.focusLastOptionField = ->
      $timeout ->
        element.find('.js-option-text:last').select()
