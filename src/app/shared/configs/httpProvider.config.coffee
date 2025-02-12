loginUrlEncodingInterceptor = (authenticationUrls, Utils) ->
  "ngInject"
  request: (config) ->
    #verify this!
    if config.url is authenticationUrls.login
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8'
      config.data = Utils.serializeObject(config.data)

    config

unauthorizedRedirectionInterceptor = ($q, $injector, toaster,Utils) ->
  "ngInject"
  'responseError': (rejection) ->
    $rootScope = $injector.get('$rootScope')
    $state = $injector.get('$state')
    RetryService = $injector.get('RetryFactory')
    AuthService = $injector.get('AuthService')
    NotificationsFactory = $injector.get('NotificationsFactory')
    SidebarViewService = $injector.get('SidebarViewService')
    DvAlert = $injector.get('DvAlert')

    is_activate_url = $state.$current.name is 'authentication.activate'
    deferred = $q.defer()
    status = rejection.status

    if status is 500
      responseTimestamp = new Date().getTime()
      totalSeconds = (responseTimestamp - rejection.config.requestTimestamp) / 1000.0
      Utils.logError('Internal Server Error', {
        ui_state: $state.current.name
        api_endpoint: rejection.config.url
        from_state: $state.previous
        to_state: $state.next
        totalTime: totalSeconds
        status: rejection.status
      })
      toaster.pop 'error', 'An internal server error occurred!', 'We are sorry for the inconvenience, our developers are notified of the issue and are working to fix the issue at the earliest.', 5000

    if status is 401 and !rejection.config.skip_auth_failure_redirection and !is_activate_url
      if AuthService.isTokenBeingRefreshed()
        AuthService.queueRequest(rejection.config, deferred)
      else
        AuthService.refreshToken().then null, ->
          otp_required = rejection.headers('X-OTP')
          if !otp_required
            AuthService.logout()
          NotificationsFactory.stopPolling()
          DvAlert.dismissActiveNotification()
          SidebarViewService.closeIfAnyActiveSidebar()

          deferred.reject(rejection)

        AuthService.queueRequest(rejection.config, deferred)
    else
      deferred.reject(rejection)

    deferred.promise

permissionChangeInterceptor = ($q, $injector, toaster,Utils) ->
  "ngInject"
  response: (rejection) ->
    $rootScope = $injector.get('$rootScope')
    $state = $injector.get('$state')
    AuthService = $injector.get('AuthService')
    NotificationsFactory = $injector.get('NotificationsFactory')
    SidebarViewService = $injector.get('SidebarViewService')
    DvAlert = $injector.get('DvAlert')

    deferred = $q.defer()
    status = rejection.status

    if status is 206
      AuthService.refreshToken().then ->
          deferred.resolve(rejection)
        , ->
          otp_required = rejection.headers('X-OTP')
          if !otp_required
            AuthService.logout()
          NotificationsFactory.stopPolling()
          DvAlert.dismissActiveNotification()
          SidebarViewService.closeIfAnyActiveSidebar()
          deferred.reject(rejection)
    else
      deferred.resolve(rejection)

    deferred.promise

badRequestInterceptor = ($injector, $q, Utils) ->
  "ngInject"
  'responseError': (response) ->
    SweetAlert = $injector.get('SweetAlert')
    $state = $injector.get('$state')

    if response.status is 400 and response.data and response.data.message
      if response.data.modelState
        errorJson = response.data.modelState
        errorMessages = _(errorJson).values().join(',')
      else
        errorMessages = ""
      SweetAlert.error({
        title: response.data.message
        text: errorMessages
        confirmButtonText: 'Okay'
      })

    $q.reject response

resourceNotFoundInterceptor = ($injector, $q, Utils) ->
  "ngInject"
  'responseError': (response) ->
    $state = $injector.get('$state')
    toaster = $injector.get('toaster')
    ModalFactory = $injector.get('ModalFactory')

    if response.status is 404
      responseTimestamp = new Date().getTime()
      totalSeconds = (responseTimestamp - response.config.requestTimestamp) / 1000.0
      Utils.logError('Resource Not Found', {
        ui_state: $state.current.name
        api_endpoint: response.config.url
        totalTime: totalSeconds
        status: response.status
      })

    if response.status is 404 and !response.config.skip_404_redirection
      $state.go 'app.home'
      toaster.pop 'warning', '', 'The resource you are looking for cannot be found'
      ModalFactory.closeAllActiveModals()
    $q.reject response

serviceUnavailableInterceptor = ($injector, $q) ->
  "ngInject"
  "responseError": (response) ->
    toaster = $injector.get('toaster')

    if response.status is 503
      toaster.pop 'error', '', 'Service Unavailable! Please try after some time'

    $q.reject response

badGatewayInterceptor = ($injector, $q, Utils) ->
  "ngInject"
  "responseError": (response) ->
    toaster = $injector.get('toaster')
    $state = $injector.get('$state')

    if response.status is 502
      responseTimestamp = new Date().getTime()
      totalSeconds = (responseTimestamp - response.config.requestTimestamp) / 1000.0
      Utils.logError('Bad Gateway', {
        ui_state: $state.current.name
        api_endpoint: response.config.url
        totalTime: totalSeconds
        status: response.status
      })
      toaster.pop 'error', '', 'Bad Gateway! Please try after some time'

    $q.reject response

forbiddenRequestInterceptor = ($injector, $q, Utils) ->
  "ngInject"
  "responseError": (response) ->
    toaster = $injector.get('toaster')
    $state = $injector.get('$state')

    if response.status is 403
      responseTimestamp = new Date().getTime()
      totalSeconds = (responseTimestamp - response.config.requestTimestamp) / 1000.0
      Utils.logError('Not Authorized', {
        ui_state: $state.current.name
        api_endpoint: response.config.url
        totalTime: totalSeconds
        status: response.status
      })
      toaster.pop 'error', '', 'You are not authorised to make this request!'

      if response.config and response.config.method == 'GET'
        $state.go 'app.home'

    $q.reject response

httpRequestInterceptor = ($injector) ->
  "ngInject"
  request: (config) ->
    #the new permission changes requires the entity_Id and entity_type details to be sent in the header, but in most places
    #we have that information in the url, so sending the page url in the header is a better approach.
    $location = $injector.get('$location')
    if not config.headers['page-url']
      config.headers['page-url'] = if $location.path().length > 0 then $location.path() else "app/home"

    config

connectionFailedInterceptor = ($injector, $q, Utils) ->
  "ngInject"
  "responseError": (response) ->
    toaster = $injector.get('toaster')
    $state = $injector.get('$state')
    if response.status is -1 && response.xhrStatus != 'abort'
      responseTimestamp = new Date().getTime()
      totalSeconds = (responseTimestamp - response.config.requestTimestamp) / 1000.0
      Utils.logError('Connection Failed', {
        ui_state: $state.current.name
        api_endpoint: response.config.url
        totalTime: totalSeconds
        status: response.status
      })
      toaster.pop 'error', '', 'Please contact your IT team to whitelist *.diligencevault.com domain. If there are further issues, please contact us at ask@diligencevault.com.',5000

    $q.reject response

tooManyRequestsInterceptor = ($injector, $q, Utils) ->
  "ngInject"
  "responseError": (response) ->
    toaster = $injector.get('toaster')
    $state = $injector.get('$state')

    if response.status is 429
      responseTimestamp = new Date().getTime()
      totalSeconds = (responseTimestamp - response.config.requestTimestamp) / 1000.0
      Utils.logError('Too many requests', {
        ui_state: $state.current.name
        api_endpoint: response.config.url
        totalTime: totalSeconds
        status: response.status
      })
      toaster.pop 'error', '', 'Limit exceeded. Please try after an hour.'

    $q.reject response

angular.module('diligenceVault').config ($httpProvider) ->
  $httpProvider.interceptors.push loginUrlEncodingInterceptor
  $httpProvider.interceptors.push unauthorizedRedirectionInterceptor
  $httpProvider.interceptors.push badRequestInterceptor
  $httpProvider.interceptors.push resourceNotFoundInterceptor
  $httpProvider.interceptors.push serviceUnavailableInterceptor
  $httpProvider.interceptors.push badGatewayInterceptor
  $httpProvider.interceptors.push forbiddenRequestInterceptor
  $httpProvider.interceptors.push httpRequestInterceptor
  $httpProvider.interceptors.push connectionFailedInterceptor
  $httpProvider.interceptors.push permissionChangeInterceptor
  $httpProvider.interceptors.push tooManyRequestsInterceptor

  #Disabling HTTP Cache
  #initialize get if not there
  if !$httpProvider.defaults.headers.get
    $httpProvider.defaults.headers.get = {}
  # Answer edited to include suggestions from comments
  # because previous version of code introduced browser-related errors
  #disable IE ajax request caching
  $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT'
  # extra
  $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache'
  $httpProvider.defaults.headers.get['Pragma'] = 'no-cache'
