angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.not_approval_reasons',
    url: '/not_approval_reasons'
    templateUrl: 'diligence/project/not_approval_reasons/template.html'
    controller: 'ProjectNotApprovalReasonsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.not_approval_reasons',
    url: '/not_approval_reasons'
    templateUrl: 'diligence/project/not_approval_reasons/template.html'
    controller: 'ProjectNotApprovalReasonsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.not_approval_reasons',
    url: '/not_approval_reasons'
    templateUrl: 'diligence/project/not_approval_reasons/template.html'
    controller: 'ProjectNotApprovalReasonsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.not_approval_reasons',
    url: '/not_approval_reasons'
    templateUrl: 'diligence/project/not_approval_reasons/template.html'
    controller: 'ProjectNotApprovalReasonsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.not_approval_reasons',
    url: '/not_approval_reasons'
    templateUrl: 'diligence/project/not_approval_reasons/template.html'
    controller: 'ProjectNotApprovalReasonsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.not_approval_reasons',
    url: '/not_approval_reasons'
    templateUrl: 'diligence/project/not_approval_reasons/template.html'
    controller: 'ProjectNotApprovalReasonsController'
    controllerAs: 'vm'