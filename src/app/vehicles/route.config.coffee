angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles',
    url: '/vehicles/:vehicleId'
    abstract: true
    template: '<ui-view/>'
    onEnter: ($state,BaseDataService)=>
      BaseDataService.getPermissionEntityDetails($state.toParams.vehicleId,'Vehicle')
      .then (response) =>
        parentState = "app"
        childState = $state.next.substr(parentState.length)
        newState = ".firms.funds"
        newParams = angular.copy $state.toParams
        newParams.firmId = response.firm_id
        newParams.fundId = response.fund_id
        $state.go(parentState+newState+childState, newParams)

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles',
    url: '/vehicles/:vehicleId'
    abstract: true
    template: '<ui-view/>'