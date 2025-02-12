class WelcomeToDVController extends BaseController
  @register 'WelcomeToDVController'

  @inject '$stateParams', 'Utils', '$state', 'OnboardingFactory', 'ngOnboard', 'ModalFactory', 'BaseDataService', 'toaster', 'Restangular', '$window', '$scope'

  initialize: ->

    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @is_admin = @Utils.isAdmin()
    if @is_investor
      @lead_text = 'DiligenceVault allows you to Monitor, Analyze & Manage your investments through an interactive, secure and centralized platform.'
    else
      @lead_text = 'DiligenceVault empowers you to collaborate with your team, and reuse centralized content library to address investor DDQ / RFP / RFIs and Surveys.'

    @spinner_text = 'Loading the tutorial'

    if @Utils.isFirstLogin()
      @BaseDataService.updateFirstLogin().then =>
        return

    @welcome_mask = $("<div class='chardinjs-overlay fixed welcome-mask'></div>")
    $('body').append(@welcome_mask)

    if @$stateParams.redirectToState
      @redirectToState = @$stateParams.redirectToState

    if @$stateParams.redirectToParams
      @redirectToParams = JSON.parse(@$stateParams.redirectToParams)

    @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
      event.preventDefault()
      
      @removeWelcomeMask()
      @route_change_nagger()
      @$state.go(toState, toParams)

  removeWelcomeMask: =>
    @welcome_mask.remove()
    $('.welcome_to_dv').addClass('z-index-1000')

  inviteTeamMember: =>
    @removeWelcomeMask()
    @ModalFactory.invokeModal 'new_user',
      resolve:
        existing_user: => false
      success: (new_user) =>  
        @toaster.pop 'success', '', '{{new_user.fullName}} invited successfully'
  
  exploreDV: =>
    if @is_manager
      @loadingTour = true
      @OnboardingFactory.getProductTourConfig()
      .then (response) =>
        @ngOnboard.start('body', response)
        @removeWelcomeMask()
        @loadingTour = false
      , (error) =>
        @loadingTour = false
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'

  skipTutorial: =>
    @removeWelcomeMask()
    if !@Utils.getSkipIntro()
      @Restangular.all('users/skip_tour').customPUT({skip_tour: true})
      .then (response) =>
        @$state.go "app.home"
      , (response) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        if @redirectToState
          @$state.go @redirectToState, @redirectToParams
        else
          @$state.go 'app.home'
    else
      if @redirectToState
        @$state.go @redirectToState, @redirectToParams
      else
        @$state.go 'app.home'

