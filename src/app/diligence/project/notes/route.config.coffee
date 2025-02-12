angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.notes',
    url: '/notes'
    templateUrl: 'diligence/project/notes/template.html'
    controller: 'ProjectNotesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.notes',
    url: '/notes'
    templateUrl: 'diligence/project/notes/template.html'
    controller: 'ProjectNotesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.notes',
    url: '/notes'
    templateUrl: 'diligence/project/notes/template.html'
    controller: 'ProjectNotesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.notes',
    url: '/notes'
    templateUrl: 'diligence/project/notes/template.html'
    controller: 'ProjectNotesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.notes',
    url: '/notes'
    templateUrl: 'diligence/project/notes/template.html'
    controller: 'ProjectNotesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.notes',
    url: '/notes'
    templateUrl: 'diligence/project/notes/template.html'
    controller: 'ProjectNotesController'
    controllerAs: 'vm'