angular.module('diligenceVault').directive 'nestedListGroup', ($compile) ->
  restrict: 'E'
  replace: true
  templateUrl: 'shared/directives/listGroupMenu/nestedListGroup/template.html'
  link: (scope, element, attrs) ->
    state = scope.state
    $container = element.find('.list-group')

    angular.forEach scope.state.subStates, (subState) ->
      directive = '<list-group-menu-item></list-group-menu-item>'
      childScope = scope.$new()

      childScope.state = subState

      $container.append $compile(directive)(childScope)

    emitStateExpandedEvent = ->
      scope.$emit 'nestedState:expanded', state

    scope.toggleStateCollapse = ->
      state.expanded = !state.expanded

      emitStateExpandedEvent() if state.expanded

    scope.$on 'subState:toggle', ->
      state.expanded = _(state.subStates).any (subState) -> subState.active

      emitStateExpandedEvent() if state.expanded
