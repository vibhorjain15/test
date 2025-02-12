###*
 * @ngdoc directive
 * @name searchInput
 * @restrict E
 *
 * @param {string=} routerState `<search-input router-state="app.content.documents"></search-input>`
 * This should be valid router state. When the search query is entered in the search input box and submitted,
 * the above router state will be used for redirection with two extra state params `Status` and `q`. `Status` will
 * have the hardcoded value of `Search` and `q` will have the value of actual search text.
 *
 * @description
 * A directive which can be used to maintain consistent search boxes across the entire app. It should be used when we
 * are trying to pass the search text as a query string to the API with refreshing the entire view. It takes the search
 * string and appends to the router state, which can then be used to pass to appropriate API.
 *
 * @example
 * ## A search input box with router state as `app.content.documents`
 *
 * `<search-input router-state="app.content.documents"></search-input>`
 *
 ###

angular.module('diligenceVault').directive 'searchInput', ->
  restrict: 'E'
  templateUrl: 'shared/directives/searchInput/template.html'
  controllerAs: 'vm'
  controller: 'DVSearchInputController'
  require: ['routerState']
  scope:
    routerState: '@'