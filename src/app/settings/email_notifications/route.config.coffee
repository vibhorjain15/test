angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.settings.email_notifications',
    url: '/email_notifications'
    templateUrl: 'settings/email_notifications/template.html'
    controller: 'EmailNotificationSettingsController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
