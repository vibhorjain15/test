class DiscussExploreController extends BaseController

  @register 'DiscussExploreController'

  @inject '$timeout', '$state', 'forumDataService', '$stateParams', '$sce', 'Restangular', 'toaster'

  initialize: ->
    @discussions = []
    @current_page = 0
    @sort = @$stateParams.sort
    @filters = _(@$stateParams).pick('q', 'category')
    @applied_filters = angular.copy(@filters)

    @Restangular.all('discussion_categories').getList().then (response) =>
      @discussion_categories = response

    @Restangular.all('fund_types').getList().then (response) =>
      @fund_types = response

    @Restangular.all('discussions').customGET('', {
      isOpen: true
    }).then (response) => @open_discussions = response.results

    if @filters.category
      @filters.category = [@filters.category] unless _.isArray(@filters.category)

      @filters.category = _(@filters.category).map((category_name) ->
        { text: category_name }
      )

  highlight: (text) ->
    matcher = new RegExp(@applied_filters.q, 'ig')
    @$sce.trustAsHtml text.replace(matcher, '<span class="highlight-match">$&</span>')

  performSearch: (filters) ->
    query_params = angular.extend({}, @$stateParams, filters)

    if _.isArray(query_params.category)
      query_params.category = _(query_params.category).pluck('text')

    @$state.go 'app.discuss.explore', query_params

  loadNextPage: ->
    if @is_loading_discussions || @current_page is @total_pages
      return

    @current_page += 1
    @is_loading_discussions = true

    @Restangular.all('discussions').customGET('', {
      pageNumber: @current_page,
      sort: @sort,
      category: @applied_filters.category,
      query: @applied_filters.q
    }).then (response) =>
      _(response.results).each (discussion) => @discussions.push discussion

      @total_pages = response.meta.totalPages
      @data_length = response.meta.totalRecords
      @is_loading_discussions = false
