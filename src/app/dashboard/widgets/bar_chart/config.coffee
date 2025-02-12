angular.module('diligenceVault').config (DashboardFactoryProvider) ->
  DashboardFactoryProvider.registerWidget 'bar_chart',
    controller: 'BarchartController'
    controllerAs: 'vm'
    template: '<c3-chart config="vm.c3Config"></c3-chart>'
