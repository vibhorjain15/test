angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.diligence.projects.activity',
    url: '/activity?type'
    views:
      'dd_status_legend':
        templateUrl: 'diligence/projects/activity/views/dd_status_legend/template.html'
        controller: 'ProjectStatusLegendController'
        controllerAs: 'vm'
      '':
        templateUrl: 'diligence/projects/activity/template.html'
        controllerForManager: 'DiligenceProjectsActivityManagerController'
        controllerForInvestor: 'DiligenceProjectsActivityInvestorController'
        controllerAs: 'vm'
