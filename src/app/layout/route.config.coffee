viewTemplateFor = ((view) -> "layout/views/#{view}/template.html")


StateProvider = ($stateProvider) ->
  "ngInject"
  $stateProvider.state('app',
    abstract: true
    url: '/app?from_extension&from_office_extension'
    views:
      'topnav':
        templateUrl: viewTemplateFor('topnav')
        controller: 'TopNavController'
        controllerAs: 'vm'
      'feedback':
        templateUrl: viewTemplateFor('feedback')
        controller: 'FeedbackController'
        controllerAs: 'vm'
      '':
        controller: 'ApplicationController'
        template: '<ui-view/>'
    resolve: currentUser: ($rootScope, baseData, $q) =>
      $q.all([$rootScope.currentUserPromise, $rootScope.subscriptionLimitsPromise, $rootScope.email_notificationsPromise]).finally =>
        $rootScope.$emit 'app_initialized'

      $rootScope.currentUserPromise

  ).state('app.home',
    url: '/?redirectId'
    controller: 'HomeController'
  )


UrlRouterProvider = ($urlRouterProvider) ->
  "ngInject"
  $urlRouterProvider.otherwise ($injector) ->
    $state = $injector.get('$state')

    $state.go('app.home')


angular
  .module('diligenceVault')
  .config(StateProvider)
  .config(UrlRouterProvider)
