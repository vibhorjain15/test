angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.meetings.detail',
    url: '/detail'
    templateUrl: 'monitor/meetings/detail/template.html'
    controller: 'MeetingDetailController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.meetings.detail',
    url: '/detail'
    templateUrl: 'monitor/meetings/detail/template.html'
    controller: 'MeetingDetailController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.meetings.detail',
    url: '/detail'
    templateUrl: 'monitor/meetings/detail/template.html'
    controller: 'MeetingDetailController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.meetings.detail',
    url: '/detail'
    templateUrl: 'monitor/meetings/detail/template.html'
    controller: 'MeetingDetailController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.meetings.detail',
    url: '/detail'
    templateUrl: 'monitor/meetings/detail/template.html'
    controller: 'MeetingDetailController'
    controllerAs: 'vm'
