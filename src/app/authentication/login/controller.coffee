class LoginController extends BaseController
  @register 'LoginController'

  @inject '$timeout','$rootScope','AuthService', '$stateParams', '$state', '$location', 'BaseDataService', 'Utils', 'authSettings','$q', 'Restangular', '$window', 'toaster', 'MentionsFactory', 'baseData','SecureStorageFactory'

  initialize: ->
    # make this flag true when login success
    @passwordElementType = 'password'
    @showNudges = false
    @user = {grant_type: 'password'}
    @subscription = null
    @showLoginWithPass = false
    @messageShown = false
    @current_user = {}
    @disableEmail = false
    @requestAccess = false
    @isSamlLogin = false
    @passwordNotVisible = true
    @isInboundRequest = false
    @showAccountCreationButton = false
    @samlLoginErrorMsg = @BaseDataService.getEmailErrorMessage()
    if @$stateParams.from_extension or @$stateParams.from_office_extension
      @from_extension = true

    if @$stateParams.redirectId
      @isInboundRequest = true
      @Restangular.all('InboundConfigurations').doGET('',{redirect_id: @$stateParams.redirectId}).then (response)=>
        @inboundLogo = response.logo_link

    @userFilter = {
      All: 'All',
      Inactive: 'Deleted',
      Invited: 'Invited',
      Locked: 'Locked'
      Pending: 'PendingApproval'
      Active: 'Active'
    }

    if @$stateParams.redirectToState
      @redirectToState = @$stateParams.redirectToState

    # This will be coming in url as a param when saml login fails
    if @samlLoginErrorMsg
      @showMessage(@samlLoginErrorMsg)

    if @$stateParams.error_message
      @showMessage(@$stateParams.error_message)

    if @$stateParams.token and @$stateParams.email
      @user.saml_token = @$stateParams.token
      @user.userName = @$stateParams.email
      @user.password = null
      @isSamlLogin = true
      @disableEmail = true
      @showLoginWithPass = true
      if @$stateParams.firm_id
        @user.firm_id = @$stateParams.firm_id
      @$timeout =>
        @login_form.$setSubmitted(true)
        @login()
    else if @$stateParams.email
      @user.userName = @$stateParams.email

    if @$stateParams.redirectToParams
      @redirectToParams = JSON.parse(@$stateParams.redirectToParams)

  goBackToEnterEmail: =>
    @showLoginWithPass = false
    @disableEmail = false
    @isSamlLogin = false
    @$state.go '.', @$state.params

  checkSamlConnection: ->
    if @sso_login_form.$valid
      @loading = true
      params = angular.copy @user
      queryParams =
        email: params.userName

      queryParams.redirectToState = @redirectToState if @redirectToState
      queryParams.redirectToParams = JSON.stringify(@redirectToParams) if @redirectToParams
      queryParams.from_extension = @$stateParams.from_extension if @$stateParams.from_extension
      queryParams.from_office_extension = @$stateParams.from_office_extension if @$stateParams.from_office_extension
      queryParams.redirectId = @$stateParams.redirectId if @$stateParams.redirectId

      @Restangular.all('saml/login').customGET('',queryParams).then ((response) =>
        @hideMessage()
        if response.saml_enabled == false
          @loading = false
          @user.userName = params.userName
          @showLoginWithPass = true
          @disableEmail = true
        else
          @toaster.pop
            type: 'info'
            title: "Please wait.."
          url = response.url
          if url
            @$window.open(url, "_self")
        @showAccountCreationButton = false
      ), (error) =>
        @loading = false
        if error.data
          if error.data.error_code == 'NOT_FOUND' and @isInboundRequest
            @sendVerificationCode()
          else if error.data.error_description
            @showMessage(error.data.error_description)

  sendVerificationCode: =>
    @Restangular.all('account/generatesignupcode').post('',email: @user.userName).then (response)=>
      @$state.go "authentication.signup",{redirectId: @$stateParams.redirectId, username: @user.userName}

  checkFirmSamlConnection: (firm) ->
    @loading = true
    @settingUpFirm = true
    params = angular.copy @user

    queryParams =
      email: params.userName
      firm_id: firm.firm_id

    queryParams.redirectToState = @redirectToState if @redirectToState
    queryParams.redirectToParams = JSON.stringify(@redirectToParams) if @redirectToParams
    queryParams.from_extension = @$stateParams.from_extension if @$stateParams.from_extension
    queryParams.from_office_extension = @$stateParams.from_office_extension if @$stateParams.from_office_extension
    queryParams.redirectId = @$stateParams.redirectId if @$stateParams.redirectId

    @Restangular.all('saml/login').customGET('',queryParams).then ((response) =>
      if response.saml_enabled == false
        @loginWithSelectedFirm(firm)
      else
        @toaster.pop
          type: 'info'
          title: "Please wait.."
        url = response.url
        if url
          Promise.resolve().then(() =>
            @$window.localStorage.removeItem('dv_access_token')
            @$window.localStorage?.removeItem('dv_refresh_token')
          )
          @$window.open(url, "_self")
    ), (error) =>
      @loading = false
      @settingUpFirm = false

  setSelectedfirm: (firm) =>
    if firm.firm_id == @current_user.firmInfo.id
      if @from_extension
        access_token = @$window.localStorage?.getItem('dv_access_token')
        refresh_token = @$window.localStorage?.getItem('dv_refresh_token')
        @loginFromExtensionSuccess({
          access_token: access_token
          refresh_token: refresh_token
          firm_display_name: firm.firm_name
        })
      else
        if !@Utils.isFirstLogin()
          @getNudge()
        else
          @goToRequiredState()
    else
      @selectedFirm = firm
      @checkFirmSamlConnection(firm)

  login: ->
    if @login_form.$valid
      @loading = true
      params = angular.extend({}, @user, @authSettings)
      if params.password
        params.password = @SecureStorageFactory.encrypt(params.password)
        params.is_encrypted = true
      if params.firm_id
        params.jwt = @$window.localStorage.getItem('jwt')
      @hideMessage()
      @AuthService.login(params).then @handleLoginSuccess, @handleLoginFailure

  loginWithSelectedFirm: (firm) ->
    params = angular.extend({}, @user, @authSettings)
    params.username = params.userName
    params.jwt = @$window.localStorage.getItem('jwt')
    params.firm_id = firm.firm_id
    delete params.userName
    delete params.password
    if !firm.saml_enabled
      delete params.saml_token
    @AuthService.login(params).then @handleFirmLoginSuccessIntercept, @handleLoginFailure

  handleFirmLoginSuccessIntercept: (response)=>
    response.data.firm_display_name = @selectedFirm.firm_name
    @handleFirmLoginSuccess(response)

  resendActivation: (firm) ->
    params = angular.copy firm
    @Restangular.all('users/resend_activation').customPUT(params).then (response) =>
      @toaster.pop 'success', '', "Activation link resent to #{@current_user.userName}", 5000

  handleLoginFailure: (response) =>
    otp_required = angular.isDefined(response.headers('X-OTP'))

    if response.status is 401 and otp_required
      @otp_mode = true
      @login_form.$setPristine()
    else if response.status is 400
      if !@otp_mode
        @user.password = ''
      @login_form.$setPristine()
      @login_form.$setUntouched()
      @requestAccess = true
      if @isSamlLogin
        # Store the error message in service because we will lose it from controler when we go back to 1st screen
        @BaseDataService.setEmailErrorMessage(response.data.error_description)
        @showMessage(response.data.error_description)
        @$timeout =>
          @goBackToEnterEmail()
      else
        @showMessage(response.data.error_description)
    else if response.status is -1
      @showMessage('Your internal policies are blocking access to DiligenceVault. Please contact your IT team to whitelist *.diligencevault.com domain. If there are further activation issues, please contact us at ask@diligencevault.com.')

    @loading = false


  appendScripts: (obj) =>
    heapScript = document.getElementById("heapScript")
    if !heapScript
      script = '<script id="heapScript">window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=t.forceSSL||"https:"===document.location.protocol,a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=(r?"https:":"http:")+"//cdn.heapanalytics.com/js/heap-"+e+".js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n);for(var o=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],c=0;c<p.length;c++)heap[p[c]]=o(p[c])},heap.load("3544100948");</script>'
      jQuery("head").append(script)
    heap.identify(obj.id)
    if @Utils.isFreeSubscription()
      heap.addUserProperties({'subscription': 'free' , 'type': obj.type , "username" : obj.userName, 'firm': obj.firm_name, 'firstname': obj.firstName, 'lastname':obj.lastName, 'accesslevel': obj.accessLevel})
    else
      heap.addUserProperties({'subscription': 'premium' , 'type': obj.type , "username" : obj.userName, 'firm': obj.firm_name, 'firstname': obj.firstName, 'lastname':obj.lastName, 'accesslevel': obj.accessLevel})

  removeHeapScripts: =>
    # For HTTP
    heapCdnUrlForHttp = "http://cdn.heapanalytics.com/js/heap-3544100948.js"
    # For HTTPS
    heapCdnUrlForHttps = "https://cdn.heapanalytics.com/js/heap-3544100948.js"

    heapCdnScriptHttp = jQuery('script[src="'+heapCdnUrlForHttp+'"]')
    heapCdnScriptHttps = jQuery('script[src="'+heapCdnUrlForHttps+'"]')
    heapScript = jQuery("#heapScript")
    if heapCdnScriptHttp
      heapCdnScriptHttp.remove()
    if heapCdnScriptHttps
      heapCdnScriptHttps.remove()
    if heapScript
      heapScript.remove()

  getNudge: =>
    @Restangular.all("nudges").doGET().then ((response) =>
      if response and response.length
        @selectedNudge = response[0]
        @$rootScope.selectedNudge = response[0]
        @logNudge(id: @selectedNudge.id)
      @showNudges = true
      @$timeout (=>
        @goToRequiredState()
      ), 3000
    ),(error) =>
      @showNudges = false
      @goToRequiredState()

  logNudge: (params) =>
    @Restangular.all("nudges/log").post(params)

  checkUserFirmAssociation: (user, token_details) ->
    @Restangular.one('users',user.id).all('associated_firms').doGET().then ((response) =>
      sorted_firms = response.sort (a, b) ->
        if a.firm_id == user.firmInfo.id
          -1
        else if b.firm_id == user.firmInfo.id
          1
        else
          if a.firm_name.toLowerCase() < b.firm_name.toLowerCase() then -1 else if a.firm_name.toLowerCase() > b.firm_name.toLowerCase() then 1 else 0
          
      @user_firms = sorted_firms
      if @user_firms.length > 1
        @showFirmSelection = true
        @loading = false
        @loggedInTokenDetails = token_details
      else
        @loading = false
        if @from_extension
          token_details.firm_display_name = user.firm_name
          @loginFromExtensionSuccess(token_details)
        else
          # If subscription is free go to monitoring dash
          if !@Utils.isFirstLogin()
            @getNudge()
          else
            @goToRequiredState()
    ),(error) =>
      @loading = false
      # If subscription is free go to monitoring dash
      if !@Utils.isFirstLogin()
        @getNudge()
      else
        @goToRequiredState()

  goToRequiredState: =>
    currentUser = @Utils.getCurrentUser()
    if @from_extension
      @loggedInTokenDetails.firm_display_name = currentUser.firmInfo.name
      @loginFromExtensionSuccess(@loggedInTokenDetails)
    else if @$stateParams.redirectId
      @$state.go 'app.inbound.review_request', {redirectId: @$stateParams.redirectId}
    else
      if @Utils.isFreeSubscription()
        # Promise.resolve().then(() =>
        #   @removeHeapScripts()
        # )
        @$state.go 'app.dash', {dashType: 'Monitor'}
      else
        obj=
          firmName: currentUser.firmInfo.name
          type: currentUser.type
          username: currentUser.userName
          firstName: currentUser.firstName
          lastName: currentUser.lastName
          accessLevel: currentUser.firmwide_role

        Promise.resolve().then(() =>
          @appendScripts(obj)
        )
        if @redirectToState
          @$state.go @redirectToState, @redirectToParams
        else
          @$state.go 'app.home'

  loginFromExtensionSuccess : (response)=>
    if @$stateParams.from_extension
      $('#extension-data #extensionAT').val(response.access_token)
      $('#extension-data #extensionRT').val(response.refresh_token)
      $('#extension-data #extensionFN').val(response.firm_display_name)
    else if @$stateParams.from_office_extension
      try
        tokens =
          ACCESS_TOKEN: response.access_token
          REFRESH_TOKEN: response.refresh_token
          FIRM_NAME: response.firm_display_name
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

    @toaster.pop 'success','','Logged in successfully'
    @loading = false
    @settingUpFirm = false

  getRandomColor: (member) =>
    lum = -0.25
    hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '')
    if hex.length < 6
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    rgb = '#'
    c = undefined
    i = undefined
    i = 0
    while i < 3
      c = parseInt(hex.substr(i * 2, 2), 16)
      c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16)
      rgb += ('00' + c).substr(c.length)
      i++
    member.style = "background-color:"+ rgb

  # This function is called when we get success from api after submit
  handleLoginSuccess: (response)=>
    if @from_extension and @$stateParams.firm_id
      @loginFromExtensionSuccess(response.data)
    else
      @hideMessage()
      @BaseDataService.flushBaseData()
      # We load basic user data as in subscriptioon level, current user and team members
      @BaseDataService.loadBaseData()
      #resolve the current user and subscription limits before proceeding.
      @MentionsFactory.clearTeamMembersCache()
      @$q.all([@$rootScope.currentUserPromise, @$rootScope.subscriptionLimitsPromise]).then ( =>
        # @AngularDataService.setUserData(@baseData)
        @current_user = @Utils.getCurrentUser()
        @MentionsFactory.getTeamMembers()
        @loading = false
        if @$stateParams.firm_id
          @getNudge()
        else
          @checkUserFirmAssociation(@Utils.getCurrentUser(), response.data)
      ), ((error) =>
        @loading = false
      )

  handleFirmLoginSuccess: (response)=>
    if @from_extension
      @loginFromExtensionSuccess(response.data)
    else
      @hideMessage()
      @BaseDataService.flushBaseData()
      @BaseDataService.loadBaseData()
      @MentionsFactory.clearTeamMembersCache()
      @$q.all([@$rootScope.currentUserPromise, @$rootScope.subscriptionLimitsPromise]).then ( =>
        # @AngularDataService.setUserData(@baseData)
        @current_user = @Utils.getCurrentUser()
        @MentionsFactory.getTeamMembers()
        @loading = false
        @settingUpFirm = false
        if !@Utils.isFirstLogin()
          @getNudge()
        else
          @goToRequiredState()
      ), ((error) =>
        @loading = false
        @settingUpFirm = false
      )

  showMessage: (message)=>
    @alertMessage = message.split('. ')
    @messageShown = true

  hideMessage: =>
    @messageShown = false

  showPasswordToggle: =>
    @passwordNotVisible = !@passwordNotVisible
    if @passwordElementType == 'password'
      @passwordElementType = 'text'
    else
      @passwordElementType = 'password'
