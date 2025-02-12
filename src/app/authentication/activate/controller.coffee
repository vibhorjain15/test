class ActivateController extends BaseController

  @register 'ActivateController'

  @inject '$state', 'toaster', '$timeout', '$stateParams',
          'AuthDataService', 'AccountsService', 'Firm', 'FirmDataservice','SecureStorageFactory'

  initialize: ->
    # token = decodeURIComponent(@$stateParams.token)
    # @enable_firm_selection = false
    # @passwordElementType = 'password'
    # @passwordElementType2 = 'password'
    # @messageShown = false
    # if token?
    #   params =
    #     token: token

    #   @AuthDataService.activate(params).then (response) =>
    #     # @getAllFirms()
    #     @user = response
    #   , @handleInvalidCredentials
    # else
    #   @handleInvalidCredentials()

  getAllFirms: () =>
    @FirmDataservice.getAllFirmsOnDV().then (response) =>
      @firms = response

  activate: ->
    @activation_form.$setSubmitted true
    if @activation_form.$valid
      params = angular.copy @user
      if params.password
        params.password = params.confirmPassword = @SecureStorageFactory.encrypt(params.password)
      @loading = true
      @hideMessage()
      @AccountsService.activate(params).then @handleSignupSuccess, @handleSignupFailure

  enableFirmSelection: ->
      @enable_firm_selection = true

  handleSignupFailure: (response) =>
    errorMsg = "Something is wrong with your account activation. Please contact us at ask@diligencevault.com"
    if response.data and response.data.error_description
      errorMsg = response.data.error_description
    @showMessage(errorMsg)
    @loading = false

  handleInvalidCredentials: (response) =>
    @loading = false

    if response.status is -1
      @toaster.pop 'error', '', 'Please contact your IT team to whitelist *.diligencevault.com domain. If there are further activation issues, please contact us at ask@diligencevault.com.',5000
    else
      @toaster.pop
        type: 'error'
        title: 'Something is wrong with your account activation. Please contact us at ask@diligencevault.com'
    @redirectToLogin()

  redirectToLogin: ->
    @$state.go 'authentication.login'

  handleSignupSuccess: =>
    message = "Your account has been successfully activated, Please login using your credentials"

    @loading = false
    @hideMessage()
    @toaster.pop 'success', '', message, 5000

    @redirectToLogin()


  showMessage: (message)=>
    @alertMessage = message
    @messageShown = true

  hideMessage: =>
    @messageShown = false

  showPasswordToggle: =>
    @passwordNotVisible = !@passwordNotVisible
    if @passwordElementType == 'password'
      @passwordElementType = 'text'
    else
      @passwordElementType = 'password'

  showPasswordToggle2: =>
    @passwordNotVisible2 = !@passwordNotVisible2
    if @passwordElementType2 == 'password'
      @passwordElementType2 = 'text'
    else
      @passwordElementType2 = 'password'
