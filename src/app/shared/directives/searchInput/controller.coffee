class DVSearchInputController extends BaseController
  @register 'DVSearchInputController'
  @inject '$scope', '$state','Utils'

  initialize: ->
    @searchText = @$state.params.q || ''
    @searchTextNew = @$state.params.q || ''
    @statusFilter = @$state.params.status || 'default'

  searchDocuments: () =>
    if @searchTextNew.length
      @searchText = @searchTextNew
      @statusFilter = 'Search'
      @$state.go @$scope.routerState, {status: 'Search', q: @searchTextNew}

  resetFilter: ->
    @searchText = ''
    @searchTextNew = ''
    @statusFilter = 'default'
    @$state.go @$scope.routerState, {status: null, q: null}