angular.module('diligenceVault').directive 'searchQuestionForm', (forumDataService) ->
  restrict: 'E'
  replace: true
  templateUrl: 'shared/directives/searchQuestionForm/template.html'
  scope:
    'submit': '&onSubmit'
    'filters': '='
  link: ($scope) ->
    available_categories = forumDataService.getCategories()
    available_funds = ['fund1', 'fund2', 'fund3']

    stopPropagation = ($event) -> $event.stopPropagation()

    filterCategories = (query) -> #better move it to a separate service
      return available_categories unless query

      regex = new RegExp(query, 'i')

      _(available_categories).filter (category) -> regex.test category

    filterFunds = (query) ->
      return available_funds unless query

      regex = new RegExp(query, 'i')

      _(available_funds).filter (fund) -> regex.test fund.text

    resetFilters = ->
      $scope.filters.category = []
      $scope.filters.fund = []

    setCategoryPlaceholder = ->
      if $scope.filters.category and $scope.filters.category.length > 0
        $scope.category_placeholder = ' '
      else
        $scope.category_placeholder = 'Start typing a category'

    setFundPlaceholder = ->
      if $scope.filters.fund and $scope.filters.fund.length > 0
        $scope.fund_placeholder = ' '
      else
        $scope.fund_placeholder = 'Start typing a fund type'

    $scope.stopPropagation = stopPropagation
    $scope.filterCategories = filterCategories
    $scope.filterFunds = filterFunds
    $scope.resetFilters = resetFilters
    $scope.setCategoryPlaceholder = setCategoryPlaceholder
    $scope.setFundPlaceholder = setFundPlaceholder

    setCategoryPlaceholder()
    setFundPlaceholder()
