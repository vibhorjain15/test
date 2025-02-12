angular.module('diligenceVault').directive 'listGroupMenu', ($compile)->
  restrict: 'EA'
  template: '<div class="list-group list-group-menu"></div>'
  replace: true
  link: (scope, element, attrs) ->
    init = (states) ->
      nestedStates = []

      angular.forEach states, (state) ->
        if state.subStates
          directive = '<nested-list-group></nested-list-group>'
          nestedStates.push state
        else
          directive = '<list-group-menu-item></list-group-menu-item>'

        childScope = scope.$new()
        childScope.state = state

        element.append $compile(directive)(childScope)

      scope.$on 'nestedState:expanded', (event, state) ->
        angular.forEach nestedStates, (nestedState) ->
          nestedState.expanded = false if nestedState isnt state

    deregisterer = scope.$watch attrs.states, (states) ->
      if states?
        init(states)
        deregisterer()
