angular.module('diligenceVault').directive 'stopEventPropagation', ->
  restrict: 'A'
  link: ($scope, element, attributes) ->
    event_name = attributes.stopEventPropagation or 'click'
    prevent_default = angular.isDefined(attributes.preventDefault)

    element.on event_name, (e) ->
      e.stopPropagation()

      e.preventDefault() if prevent_default
