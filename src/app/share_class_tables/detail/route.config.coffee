angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.share_class_tables.detail',
    url: '/detail'
    templateUrl: 'share_class_tables/detail/template.html'
    controller: 'ShareClassTablesDetailController'
    controllerAs: 'vm'
