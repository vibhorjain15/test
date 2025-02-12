angular.module('diligenceVault').directive 'sidebarPopup', ->
  restrict: 'A'
  templateUrl: 'shared/directives/sidebarPopup/template.html'
  transclude: true
  link: (scope, element, attrs) ->
    popup_instance = scope.popup_instance

    scope.toggleMinimize = ->
      scope.minimised = !scope.minimised
      popup_instance.minimised = scope.minimised

    scope.dismiss = ($event) ->
      $event.stopPropagation()
      $event.preventDefault()

      popup_instance.dismiss()
