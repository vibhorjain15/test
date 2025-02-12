class ProjectRecommendationController extends BaseController

  @register 'ProjectRecommendationController'

  @inject 'BaseDataService', '$stateParams', '$scope', '$state', 'DueDiligenceDataservice', 'toaster'

  initialize: ->
    @preview = false
    @categories = []
    @recommendation = {}
    @diligenceId = @$stateParams.diligenceId

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence

    @BaseDataService.getTeamMembers().then (response) =>
      @team = response
      @setSelectableTeamMembers()

    @BaseDataService.getUserProfile().then (response) =>
      @current_user = response
      @user = @current_user
      @setSelectableTeamMembers()

  setSelectableTeamMembers: ->
    if @team and @current_user # you shouldn't be able to send recommendation to yourself
      @teamMembers = _(@team).filter (teamMember) =>
        teamMember.userName isnt @current_user.basicUserInfo.userName

  isFormValid: ->
    @recommendation_form.$valid and (@recommendation.recipient or []).length

  sendRecommendation: ->
    if @isFormValid()
      @loading = true
      @recommendation.recipient = _(@recommendation.recipient).pluck('userName')

      @DueDiligenceDataservice.sendRecommendation(@recommendation, @diligenceId).then =>
        @loading = false

        @toaster.pop 'success', '', 'Your recommendation has been submitted'
        @$state.transitionTo @$state.$current, @$state.$current.params,
          reload: true
          inherit: true
          notify: true

  filterCategories: (query) ->
    return @teamMembers unless query

    regex = new RegExp(query, 'i')

    _(@teamMembers).filter (teamMember) ->
      _(['firstName', 'lastName', 'userName']).any (key) ->
        regex.test teamMember[key]
