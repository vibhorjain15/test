angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds',
    url: '/funds/:fundId'
    template: '<ui-view/>'
    abstract: true
    onEnter: ($state,BaseDataService)=>
      BaseDataService.getPermissionEntityDetails($state.toParams.fundId,'Fund')
      .then (response) =>
        parentState = "app"
        childState = $state.next.substr(parentState.length)
        newState = ".firms"
        newParams = angular.copy $state.toParams
        newParams.firmId = response.entity_id 
        $state.go(parentState+newState+childState, newParams)

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds',
    url: '/funds/:fundId'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.funds',
    url: '/funds/:fundId'
    abstract: true
    template: '<ui-view/>'