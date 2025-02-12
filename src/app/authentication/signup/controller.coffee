class SignupController extends BaseController

  @register 'SignupController'

  @inject '$state', 'toaster', '$timeout', '$stateParams', 'AuthDataService', 'Firm', 'FirmDataservice','$auth', 'Restangular', '$scope','ModalFactory', 'Utils','SecureStorageFactory'

  initialize: ->
    # @siteKey = "6Le18uIeAAAAAFETJrSsdtSI0RUL-5Ay7TgOJvS7";
    # @passwordElementType = 'password'
    # @passwordElementType2 = 'password'
    # @duplicateFirmsStr = ''
    # @user = {firmInfo: null}
    # @firmDisabled = false
    # if @$stateParams.username
    #   @user.userName = @$stateParams.username
    # else
    #   params =
    #     redirectId: @$stateParams.redirectId if @$stateParams.redirectId
    #   @$state.go 'authentication.login', params
    # if @$auth.isAuthenticated()
    #   @$state.go 'app.inbound.review_request', {redirectId: @$stateParams.redirectId}


  getAllFirms: () =>
    @Restangular.all('firms/activation_list').doGET('',{email: @$stateParams.username}).then (response)=>
      @allFirms = []
      _(response.plain()).each (val,key)=>
        @allFirms.push
          id: val
          name: key

  submit: =>
    if @signupForm.$valid and @myRecaptchaResponse
      @saving = true
      if @user.firmInfo.id
        @submitUser()
      else
        @checkForFirmDuplicates()

  checkForFirmDuplicates:=>
    @Restangular.all('firms/activation_list').doGET('',{name: @user.firmInfo.name}).then (response)=>
      @duplicateFirms = _(response).map (firm)=>
        firm.websiteUrl = if firm.website and firm.website.startsWith('http') then firm.website else 'https://'+firm.website
        firm
      @duplicateFirmsStr = @Utils.convert_number(@duplicateFirms.length)
      if @duplicateFirms.length == 0
        @submitUser()
      else
        @saving = false

  saveNewFirm: =>
    if @signupForm.$valid and @myRecaptchaResponse
      @submitUser()

  submitUser: =>
    params = angular.copy @user
    params.Referral_data = {
      redirectId: @$stateParams.redirectId,
    }
    if params.password
      params.password = params.confirmPassword = @SecureStorageFactory.encrypt(params.password)
    params.RecaptchaToken = @myRecaptchaResponse
    @saving = true
    @Restangular.all('account/signup').post(params).then () =>
      @toaster.pop 'success', 'You account is successfully created.'
      @saving = false
      params =
        redirectId: @$stateParams.redirectId if @$stateParams.redirectId
      @$state.go 'authentication.login', params
    , (error)=>
      @saving = false

  handleSignupFailure: (response) =>
    errorMsg = "We are unable to process your account request. Please contact us at ask@diligencevault.com"
    if response.data and response.data.error_description
      errorMsg = response.data.error_description
    @showMessage(errorMsg)
    @loading = false

  createFirm: (firm)=>
    newFirm = {name: firm}
    @allFirms.push newFirm
    @user.firmInfo = newFirm

  goBackToLogin: =>
    params =
      redirectId: @$stateParams.redirectId if @$stateParams.redirectId
    @$state.go 'authentication.login', params

  openDuplicateFirmsModal: =>
    @ModalFactory.invokeModal 'view_duplicate_firms',
      resolve:
        duplicateFirms: => @duplicateFirms
        source: => 'signup'
      success: (response)=>
        @user.firmInfo = {
          name: response.name,
          id: response.id
        }
        if @allFirms.length > 0
          @allFirms.push @user.firmInfo
        @firmDisabled = true
