angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.meetings',
    url: '/meetings/:Id'
    template: '<ui-view/>'
    abstract: true
    onEnter: ($state,BaseDataService, keywordConstants)=>
      BaseDataService.getPermissionEntityDetails($state.toParams.Id,'Meeting')
      .then (response) =>
        parentState = "app.monitor"
        newParams = angular.copy $state.toParams
        if response.entity_type.toLowerCase() == keywordConstants.Firm.toLowerCase()
          newState = ".firms"
          newParams.firmId = response.entity_id
        else if response.entity_type.toLowerCase() == keywordConstants.Product.toLowerCase()
          newState = ".funds"
          newParams.fundId = response.entity_id
        else if response.entity_type.toLowerCase() == keywordConstants.Strategy.toLowerCase()
          newState = ".firms.strategies"
          newParams.firmId = response.firm_id
          newParams.strategyId = response.entity_id
        childState = $state.next.substr(parentState.length)

        $state.go("app"+newState+childState, newParams)

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.meetings',
    url: '/meetings/:Id'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.funds.meetings',
    url: '/meetings/:Id'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.funds.meetings',
    url: '/meetings/:Id'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms.strategies.meetings',
    url: '/meetings/:Id'
    abstract: true
    template: '<ui-view/>'
