angular.module('diligenceVault').config (DashboardFactoryProvider) ->
  DashboardFactoryProvider.registerWidget 'full_calendar',
    controller: 'FullCalendarController'
    controllerAs: 'vm'
    resolve:
      calendar_events: (options) ->
        options.resource.get().then (response) -> response.eventArray
