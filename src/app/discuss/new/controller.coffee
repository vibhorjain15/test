class NewDiscussionController extends BaseController

  @register 'NewDiscussionController'

  @inject '$timeout', '$scope', '$sce', 'Restangular', 'toaster', '$state'

  available_funds = ['Hedge fund', 'PE fund', 'Equity fund']

  initialize: ->
    @discussion =
      author:
        anonymous: false

    @funds = []
    @max_title_char_length = 300

    @Restangular.all('discussion_categories').getList().then (response) =>
      @categories = response

    @Restangular.all('fund_types').getList().then (response) =>
      @fund_types = response

    _loadSimilarQuestions = _.debounce((=>
      @Restangular.all('discussions').customGET('', {q: @discussion.text}).then (response) =>
        primary_matcher = new RegExp(@discussion.text, 'ig')

        @similar_discussions = response.results
        @loading_similar_discussions = false
    ), 500)

    @$scope.$watch 'vm.is_generic_discussion', (value) =>
      if (value)
        @discussion.categories = []
        @discussion.fund_types = []

    @$scope.$watch 'vm.discussion.text', (newValue, oldValue) =>
      if !newValue or !newValue.trim()
        @similar_discussions = []
        @loading_similar_discussions = false

        return

      if newValue isnt oldValue
        if newValue.length > @max_title_char_length
          @discussion.text = newValue.slice(0, @max_title_char_length)

        @loading_similar_discussions = true

        _loadSimilarQuestions()

    @$scope.$watch 'vm.discussion.categories.length', (value) =>
      @category_placeholder = if value > 0 then ' ' else 'Start typing a category'

    @$scope.$watch 'vm.discussion.fund_types.length', (value) =>
      @fund_placeholder = if value > 0 then ' ' else 'Start typing a fund type'

  saveDiscussion: ->
    @saving_discussion = true
    params = angular.copy(_(@discussion).omit('fund_types'))

    params.categories = _(@discussion.categories).concat(@discussion.fund_types)
    params.categories = _(params.categories).pluck('value')

    @Restangular
      .all('discussions')
      .post(params)
      .then (response) =>
        message = 'Your discussion has started!'

        @$state.go 'app.discuss.detail',
          discussionId: response.id
          slug: response.slug

        @toaster.pop 'success', '', message, 5000
      .finally =>
        @saving_discussion = false

  highlight: (text) ->
    matcher = new RegExp(@discussion.text.replace(/\?/g, '\\?'), 'ig')

    @$sce.trustAsHtml(text.replace(matcher, '<b>$&</b>'))

  filterCategories: (query) ->
    return @categories unless query

    regex = new RegExp(query, 'i')

    _(@categories).filter((category) -> regex.test(category.value))

  filterFunds: (query) ->
    return @fund_types unless query

    regex = new RegExp(query, 'i')

    _(@fund_types).filter((fund) -> regex.test(fund.value))
