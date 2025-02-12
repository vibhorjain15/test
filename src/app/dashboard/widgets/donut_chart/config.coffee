angular.module('diligenceVault').config (DashboardFactoryProvider) ->
  DashboardFactoryProvider.registerWidget 'donut_chart',
    controller: 'DonutChartController'
    controllerAs: 'vm'
    template: '<c3-chart config="vm.c3Config"></c3-chart>'
