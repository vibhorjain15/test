angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project',
    url: '/projects/:diligenceId'
    abstract: true
    templateUrl: 'diligence/project/template.html'
    controller: 'DiligenceProjectController'
    controllerAs: 'vm'
    onEnter: ($state,BaseDataService,keywordConstants)=>
      BaseDataService.getPermissionEntityDetails($state.toParams.diligenceId,'Duediligence')
      .then (diligence) =>
        #generate new route
        parentState = "app.diligence"               #parent state of the route
        newParams = angular.copy $state.toParams
        if diligence.entity_type.toLowerCase() == keywordConstants.Product.toLowerCase() && !diligence.linked_duediligence_id          #if diligence type is fund then go to firms.funds route
          newState = ".firms.funds"
          newParams.fromfirmId = diligence.fromfirm_id
          newParams.tofirmId = diligence.tofirm_id
          newParams.fundId = diligence.entity_id
        if diligence.entity_type.toLowerCase() == keywordConstants.Strategy.toLowerCase()          #if diligence type is fund then go to firms.funds route
          newState = ".firms.strategies"
          newParams.fromfirmId = diligence.fromfirm_id
          newParams.tofirmId = diligence.tofirm_id
          newParams.strategyId = diligence.entity_id
        else if diligence.entity_type.toLowerCase() == keywordConstants.Firm.toLowerCase()        #else if it is a firm diligence then go to firms route
          newState = ".firms"
          newParams.fromfirmId = diligence.fromfirm_id
          newParams.tofirmId = diligence.entity_id
        else if diligence.entity_type.toLowerCase() == keywordConstants.Vehicle.toLowerCase()
          newState = ".firms.funds.vehicles"
          newParams.fromfirmId = diligence.fromfirm_id
          newParams.tofirmId = diligence.tofirm_id
          newParams.fundId = diligence.parent_entity_id
          newParams.vehicleId = diligence.entity_id
        else if diligence.entity_type.toLowerCase() == keywordConstants.Product.toLowerCase() && diligence.linked_duediligence_id
          newState = ".firms.strategies.funds"
          newParams.fromfirmId = diligence.fromfirm_id
          newParams.tofirmId = diligence.tofirm_id
          newParams.fundId = diligence.entity_id
          newParams.strategyId = diligence.parent_entity_id

        childState = $state.next.substr(parentState.length)     #get the tostate from the $state and append to the new route
        
        if newState                                             #redirect only if there is a new state, otherwise stay
          $state.go(parentState+newState+childState, newParams)

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms',
    url: '/:fromfirmId/firms/:tofirmId'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project',
    url: '/projects/:diligenceId'
    abstract: true
    templateUrl: 'diligence/project/template.html'
    controller: 'DiligenceProjectController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds',
    url: '/funds/:fundId'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project',
    url: '/projects/:diligenceId'
    abstract: true
    templateUrl: 'diligence/project/template.html'
    controller: 'DiligenceProjectController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles',
    url: '/vehicles/:vehicleId'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project',
    url: '/projects/:diligenceId'
    abstract: true
    templateUrl: 'diligence/project/template.html'
    controller: 'DiligenceProjectController'
    controllerAs: 'vm'

    # Strategy Routes

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies',
    url: '/strategies/:strategyId'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project',
    url: '/projects/:diligenceId'
    abstract: true
    templateUrl: 'diligence/project/template.html'
    controller: 'DiligenceProjectController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds',
    url: '/funds/:fundId'
    abstract: true
    template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project',
    url: '/projects/:diligenceId'
    abstract: true
    templateUrl: 'diligence/project/template.html'
    controller: 'DiligenceProjectController'
    controllerAs: 'vm'