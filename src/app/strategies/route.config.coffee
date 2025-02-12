angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies',
    url: '/strategies/:strategyId'
    template: '<ui-view/>'
    abstract: true
    onEnter: ($state,BaseDataService)=>
      BaseDataService.getPermissionEntityDetails($state.toParams.strategyId,'Strategy')
      .then (response) =>
        parentState = "app"
        childState = $state.next.substr(parentState.length)
        newState = ".firms"
        newParams = angular.copy $state.toParams
        newParams.firmId = response.entity_id 
        $state.go(parentState+newState+childState, newParams)

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies',
    url: '/strategies/:strategyId'
    abstract: true
    template: '<ui-view/>'