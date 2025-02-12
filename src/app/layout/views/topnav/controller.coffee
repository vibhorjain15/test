class TopNavController extends BaseController

  @register 'TopNavController'

  @inject 'LayoutUtils', 'Utils', 'AuthService', 'NotificationsFactory', 'InviteUserService',
          '$interval', '$state', '$rootScope', '$timeout', 'ModalFactory','USER_ROLES'

  initialize: ->
    @toggleFeedbackPanel = @LayoutUtils.toggleFeedbackPanel
    @allReleaseViewed = true
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @is_admin = @Utils.isAdmin()
    @isAdminOnly = @Utils.isAdminOnly()
    @is_security_admin = @Utils.isSecurityAdmin()
    @has_multiple_accounts = @Utils.hasMultipleAccounts()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @currentUser = @Utils.getCurrentUser()
    invisibleTopNavRoutes = [ 'app.releases.notes','app.premium' ]
    restrictedRouteStates = [ 'app.diligence.project.questionnaire', 'app.diligence.project.questionnaire.category' ]
    @routeState = @$state.current.name
    if @routeState in invisibleTopNavRoutes then @showTopNav = false else @showTopNav = true
    if @routeState in restrictedRouteStates then @showPageHelp = false else @showPageHelp = true

    @$rootScope.$on '$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) =>
      if toState.name in invisibleTopNavRoutes then @showTopNav = false else @showTopNav = true
      if toState.name in restrictedRouteStates then @showPageHelp = false else @showPageHelp = true

    @NotificationsFactory.onload (response) =>
      @setNotificationCount(response.count)

    @NotificationsFactory.getUnreadNotificationCount()

    @$rootScope.$on 'questionnaire:render', =>
      @showPageHelp = true

    @$rootScope.$on 'read:notification', ($event, response) =>
      @NotificationsFactory.getUnreadNotificationCount (response) =>
        @setNotificationCount(response.count)

    @$rootScope.$on 'read_all:notifications', =>
      @NotificationsFactory.getUnreadNotificationCount (response) =>
        @setNotificationCount(response.count)

    angular.element(document).ready () =>
      # the timeout is needed to ensure that the navbar height is computed after the logo is rendered
      setTimeout () =>
        if @showTopNav
          navbar_height = document.getElementById("dv-navbar").offsetHeight
          if navbar_height > 40
            # dynamically setting the body padding-top based on actual navbar height - DV-2949
            document.body.style.paddingTop = navbar_height + 'px'
      , 1000
      window.addEventListener 'resize', () =>
        if @showTopNav
          navbar_height = document.getElementById("dv-navbar").offsetHeight
          if navbar_height > 40
            # dynamically setting the body padding-top based on actual navbar height - DV-2949
            document.body.style.paddingTop = navbar_height + 'px'

  addTeamMembers: =>
    source = "navbar"
    @ModalFactory.invokeModal 'new_user',
      resolve:
        existing_user: => false
        source: => source
      success: (user)=>
        @InviteUserService.inviteState(user)
        @$state.go 'app.firm.settings.employees'

  setNotificationCount: (count) ->
    @previous_notification_count = @unread_notification_count
    @unread_notification_count = count

    unless count is @previous_notification_count
      @platform_activity.refreshNotifications()

  productTour: =>
    redirectToState = @$state.current.name
    redirectToParams = JSON.stringify(@$state.params)

    @$state.go "app.welcome_to_dv", {redirectToState: redirectToState, redirectToParams: redirectToParams}

  logout: ->
    @AuthService.logoutViaRequest()
    if heap?
      heap.resetIdentity()
    return

  closeMenu: ->
    $('.navbar-collapse').collapse('hide')

  closeReleaseNotePanel: -> 
    $( "#release-toggle" ).trigger( "click" )

  checkForUnSeenNotes: (value) ->
    @allReleaseViewed = value

  triggerHelp: ->
    @LayoutUtils.triggerHelp()

    return #because http://errors.angularjs.org/1.4.10/$parse/isecdom?p0=vm.triggerHelp(

  getUnreadNotifications: =>
    @NotificationsFactory.getUnreadNotificationCount()
