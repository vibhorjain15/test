angular.module('diligenceVault').directive 'authorizedView', (Utils) ->
  restrict: 'A'
  compile: (element, attrs) ->
    element.hide()

    (scope, lElem) ->
      grant_map = Utils.getGrantMap()
      accessible_to = attrs.accessibleTo
      hidden_from = attrs.hiddenFrom

      if accessible_to?
        accessible_to = _(accessible_to.split(',')).map (item) ->
          item.trim()

      if hidden_from?
        hidden_from = _(hidden_from.split(',')).map (item) ->
          item.trim()

      if Utils.isAuthorized(grant_map, accessible_to, hidden_from)
        lElem.show()
