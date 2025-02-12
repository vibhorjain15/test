angular.module('diligenceVault').directive 'listGroupMenuItem', ($state, $rootScope, $stateParams) ->
  restrict: 'E'
  replace: true
  templateUrl: 'shared/directives/listGroupMenu/listGroupMenuItem/template.html'
  link: (scope, element, attrs) ->
    previous_active_value = null
    state = scope.state
    element.attr 'href', $state.href state.name, state.params

    doesParamsMatch = (toParams) ->
      return true unless state.params?

      _(state.params).all (val, key) ->
        String(toParams[key]) is String(val)

    checkIfActive = (toState, toParams) ->
      if state.matcher
        state.active = state.matcher.test(toState.name)
      else
        state.active = state.name is toState.name and doesParamsMatch(toParams)

      if previous_active_value isnt state.active
        scope.$emit 'subState:toggle'
        previous_active_value = state.active

    $rootScope.$on '$stateChangeSuccess', (event, toState, toParams) ->
      checkIfActive(toState, toParams)

    checkIfActive($state.$current, $stateParams)
