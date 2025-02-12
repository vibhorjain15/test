angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.search_n_review_questions',
    url: '/search_n_review_questions/:searchString/:filterType'
    templateUrl: 'diligence/project/search_n_review_questions/template.html'
    controller: 'ProjectSearchAndReviewQuestionsController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.search_n_review_questions',
    url: '/search_n_review_questions/:searchString/:filterType'
    templateUrl: 'diligence/project/search_n_review_questions/template.html'
    controller: 'ProjectSearchAndReviewQuestionsController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.search_n_review_questions',
    url: '/search_n_review_questions/:searchString/:filterType'
    templateUrl: 'diligence/project/search_n_review_questions/template.html'
    controller: 'ProjectSearchAndReviewQuestionsController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.search_n_review_questions',
    url: '/search_n_review_questions/:searchString/:filterType'
    templateUrl: 'diligence/project/search_n_review_questions/template.html'
    controller: 'ProjectSearchAndReviewQuestionsController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null


angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.search_n_review_questions',
    url: '/search_n_review_questions/:searchString/:filterType'
    templateUrl: 'diligence/project/search_n_review_questions/template.html'
    controller: 'ProjectSearchAndReviewQuestionsController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.search_n_review_questions',
    url: '/search_n_review_questions/:searchString/:filterType'
    templateUrl: 'diligence/project/search_n_review_questions/template.html'
    controller: 'ProjectSearchAndReviewQuestionsController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null