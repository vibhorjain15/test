angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.project.summary',
    url: '/summary'
    templateForInvestor: 'diligence/project/summary/investor-template.html'
    templateForManager: 'diligence/project/summary/manager-template.html'
    controllerForInvestor: 'ProjectSummaryInvestorController'
    controllerForManager: 'ProjectSummaryManagerController'
    controllerAs: 'vm'
    
angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.firms.project.summary',
    url: '/summary'
    templateForInvestor: 'diligence/project/summary/investor-template.html'
    templateForManager: 'diligence/project/summary/manager-template.html'
    controllerForInvestor: 'ProjectSummaryInvestorController'
    controllerForManager: 'ProjectSummaryManagerController'
    controllerAs: 'vm'
    
angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.firms.funds.project.summary',
    url: '/summary'
    templateForInvestor: 'diligence/project/summary/investor-template.html'
    templateForManager: 'diligence/project/summary/manager-template.html'
    controllerForInvestor: 'ProjectSummaryInvestorController'
    controllerForManager: 'ProjectSummaryManagerController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.firms.funds.vehicles.project.summary',
    url: '/summary'
    templateForInvestor: 'diligence/project/summary/investor-template.html'
    templateForManager: 'diligence/project/summary/manager-template.html'
    controllerForInvestor: 'ProjectSummaryInvestorController'
    controllerForManager: 'ProjectSummaryManagerController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.firms.strategies.project.summary',
    url: '/summary'
    templateForInvestor: 'diligence/project/summary/investor-template.html'
    templateForManager: 'diligence/project/summary/manager-template.html'
    controllerForInvestor: 'ProjectSummaryInvestorController'
    controllerForManager: 'ProjectSummaryManagerController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.firms.strategies.funds.project.summary',
    url: '/summary'
    templateForInvestor: 'diligence/project/summary/investor-template.html'
    templateForManager: 'diligence/project/summary/manager-template.html'
    controllerForInvestor: 'ProjectSummaryInvestorController'
    controllerForManager: 'ProjectSummaryManagerController'
    controllerAs: 'vm'