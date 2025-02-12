angular.module 'diligenceVault', [
  'ui.router'
  'ui.bootstrap'
  'checklist-model'
  'infinite-scroll'
  'ui.tinymce'
  'ngTagsInput'
  'angularMoment'
  'satellizer'
  'toaster'
  'ngResource'
  'ngAnimate'
  'ui.grid'
  'ui.grid.pagination'
  'ui.grid.selection'
  'ui.grid.exporter'
  'restangular'
  'ngFileUpload'
  'uiSwitch'
  'ngSanitize'
  'localytics.directives'
  'monospaced.elastic'
  'duScroll'
  'ngclipboard'
  'ui.utils.masks'
  'ui.grid.grouping',
  'mentio',
  'ngOnboard',
  'uiCropper',
  'ui.router.state.events',
  'minicolors',
  'ui.select',
  'daterangepicker',
  'ngOrderObjectBy',
  'ui.grid.saveState',
  'ui.grid.resizeColumns',
  'ui.grid.moveColumns',
  'vcRecaptcha'
]

angular.module('diligenceVault').run ($rootScope, $state, $auth, loader, $location, BaseDataService, Utils,
                                      baseData, userservice, AuthService, ChardinService, $q, $window) ->
  $rootScope.$state = $state

  BaseDataService.loadBaseData() if $auth.isAuthenticated()

  $rootScope.$on '$stateChangeStart', (event, toState, toParams, fromState, fromParams) ->
    if toState.name.indexOf(fromState.name) < 0
      $rootScope.fromState = fromState
      $rootScope.fromParams = fromParams

    if toState.data
      $rootScope.title = toState.data.title
    else
      $rootScope.title = null

    if fromState.name == 'app.diligence.word_to_template' or fromState.name == 'app.diligence.excel_to_template'
        $.contextMenu('destroy')

    ChardinService.hide()

    if toState.name is 'authentication.activate'
      AuthService.logout(false)
      return

    if (toState.name is 'authentication.login' || toState.skip_authorization) and !$auth.isAuthenticated()
      BaseDataService.flushBaseData()

      return

    if toState.name is 'authentication.confirm_password_reset'
      if $auth.isAuthenticated()
        AuthService.logout()

      return

    if toState.skip_authorization and $auth.isAuthenticated()
      event.preventDefault()
      $state.go 'app.home', toParams

      return

    unless $auth.isAuthenticated()
      event.preventDefault()

      redirectToState = undefined
      redirectToParams = undefined

      if toState.name != 'app.home'
        if toState
          redirectToState = toState.name
        if toParams
          redirectToParams = JSON.stringify(toParams)
      $state.go 'authentication.login', {redirectToState: redirectToState, redirectToParams: redirectToParams}

      return

    unless Utils.getCurrentUser() and Utils.getSubscriptionType()
      event.preventDefault()

      $q.all([$rootScope.currentUserPromise, $rootScope.subscriptionLimitsPromise, $rootScope.email_notificationsPromise]).then =>
        # AngularDataService.setUserData(baseData)
        if toParams.from_extension or toParams.from_office_extension
          access_token = $window.localStorage?.getItem('dv_access_token')
          refresh_token = $window.localStorage?.getItem('dv_refresh_token')
          firmName = Utils.getCurrentFirm().display_name

          if access_token and refresh_token
            if toParams.from_extension
              $('#extension-data #extensionAT').val(access_token)
              $('#extension-data #extensionRT').val(refresh_token)
              $('#extension-data #extensionFN').val(firmName)
            else if toParams.from_office_extension
              try
                tokens =
                  ACCESS_TOKEN: access_token
                  REFRESH_TOKEN: refresh_token
                  FIRM_NAME: firmName if firmName
                jsonMessage = JSON.stringify(tokens)
                Office.context.ui.messageParent jsonMessage
              catch err
                # Create the outcome message and send it to the task pane.
                messageObject =
                  outcome: 'failure'
                  error: err.message
                jsonMessage = JSON.stringify(messageObject)
                # Tell the task pane about the outcome.
                Office.context.ui.messageParent 'message to parent ' + jsonMessage
        $state.go toState, toParams

      return

    sendUserData = =>
      heapidentity = heap.identity
      if !heapidentity
        obj = Utils.getCurrentUser()
        heap.identify(obj.id)
        if Utils.isFreeSubscription()
          heap.addUserProperties({'subscription': 'free' , 'type': obj.type , "username" : obj.userName, 'firm': obj.firm_name, 'firstname': obj.firstName, 'lastname':obj.lastName, 'accesslevel': obj.firmwide_role})
        else
          heap.addUserProperties({'subscription': 'premium' , 'type': obj.type , "username" : obj.userName, 'firm': obj.firm_name, 'firstname': obj.firstName, 'lastname':obj.lastName, 'accesslevel': obj.firmwide_role})

    heapScript = document.getElementById("heapScript")
    if !heapScript
      script = '<script id="heapScript">window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=t.forceSSL||"https:"===document.location.protocol,a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=(r?"https:":"http:")+"//cdn.heapanalytics.com/js/heap-"+e+".js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n);for(var o=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],c=0;c<p.length;c++)heap[p[c]]=o(p[c])},heap.load("3544100948");</script>'
      jQuery("head").append(script)
      sendUserData()
    else
      sendUserData()


    if Utils.isFirstLogin() and !$rootScope.welcome_screen_shown
      $rootScope.welcome_screen_shown = true
      if toState.name != 'app.home'
        if toState
          redirectToState = toState.name
        if toParams
          redirectToParams = JSON.stringify(toParams)

      if toState.name == 'app.euc'
        params = JSON.parse(redirectToParams)
        redirectToState = params.redirectToState
        redirectToParams = params.redirectToParams

      event.preventDefault()
      if redirectToState == 'app.inbound.review_request'
        $state.go redirectToState, JSON.parse(redirectToParams)
      else if Utils.isManager() && !Utils.getSkipIntro()
        $state.go 'app.welcome_to_dv', {redirectToState: redirectToState, redirectToParams: redirectToParams}
      else
        $state.go 'app.welcome', {redirectToState: redirectToState, redirectToParams: redirectToParams}

      return

    if toState.name is 'app.discuss_euc' and Utils.discussAgreementAccepted()
      event.preventDefault()
      $state.go 'app.discuss.explore'
      return

    if /app.discuss\..*/.test(toState.name) and not Utils.discussAgreementAccepted()
      event.preventDefault()
      $state.go 'app.discuss_euc'
      return

    if toState.name is 'app.euc' and Utils.endUserAgreementAccepted()
      event.preventDefault()
      if toState.name != 'app.home'
        if toState
          redirectToState = toState.name
        if toParams
          redirectToParams = JSON.stringify(toParams)

        if toState.name == 'app.euc'
          params = JSON.parse(redirectToParams)
          redirectToState = params.redirectToState
          redirectToParams = params.redirectToParams

      if redirectToState == 'app.inbound.review_request'
        $state.go redirectToState, JSON.parse(redirectToParams)
      else if Utils.isManager() && !Utils.getSkipIntro()
        $state.go 'app.welcome_to_dv', {redirectToState: redirectToState, redirectToParams: redirectToParams}
      else
        $state.go 'app.welcome', {redirectToState: redirectToState, redirectToParams: redirectToParams}

      return

    if $auth.isAuthenticated()
      if toState.name isnt 'app.euc' and not Utils.endUserAgreementAccepted()
        event.preventDefault()
        if toState
          redirectToState = toState.name
        if toParams
          redirectToParams = JSON.stringify(toParams)
        $state.go 'app.euc', {redirectToState: redirectToState, redirectToParams: redirectToParams}

  $rootScope.$on 'app_initialized', ->
    # Using ng-if on the loader was halting the canvas animation, hence manually removing the loader
    loader.remove()
    $rootScope.app_initialized = true
