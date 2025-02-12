class MyAccountsController extends BaseController
  @register 'MyAccountsController'

  @inject '$scope', '$window','baseData' ,'MyAccountsResource', 'Utils' , '$state' , '$timeout', 'Restangular', 'SweetAlert', 'toaster', 'authSettings', 'AuthService', '$q', 'BaseDataService', '$rootScope', 'MentionsFactory','angularEnabled'

  initialize: ->
    @selectedFirm = {}
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @user = {grant_type: 'password'}
    @allUsers = []
    @firmSwitching = false
    @getMyAccountsData()

  goBack: =>
    @$window.history.back()

  getMyAccountsData: (type)=>
    @loading = true
    delete @myAccountsData
    @$timeout =>
      @myAccountsData = @MyAccountsResource.$new({user_id: @current_user.id})
      @loading = false

  isCurrentFirm: (entry) =>
    is_current = false
    if entry.firm_id == @current_user.firmInfo.id
      is_current = true
    is_current

  removeFirmAccess: (entity) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this firm?"
      confirmButtonText: 'Yes Please'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeFirmAccessOnConfirm(entity)
    })

  removeFirmAccessOnConfirm: (entity) =>
    @Restangular.one('users', entity.id).one('associated_firms', entity.firm_id).remove().then ((response) =>
      swal.close()
      @toaster.pop 'success', '', "Firm Association Removed"
      @$timeout =>
        @getMyAccountsData()
    ), (error) =>
      swal.close()

  switchToFirmAccount: (entity) =>
    if entity.status == 'Active' and @currentFirmId != entity.firm_id
      @firmSwitching = true
      @Restangular.one('users', 'my-profile').get().then ((response) =>
        # calling API as to avoid sending the expired JWT token as API call will update the token in LocalStorage if expired.
        @selectedFirm = entity
        @user.userName = entity.userName
        params = angular.extend({}, @user, @authSettings)
        params.username = params.userName
        params.jwt = @$window.localStorage.getItem('jwt')
        params.firm_id = entity.firm_id
        delete params.userName
        delete params.password
        @AuthService.login(params).then @handleFirmLoginSuccess, @handleFirmSwitchFailure
      )

  handleFirmSwitchFailure: =>
    @toaster.pop 'error', '', "Something went wrong, Please try again!"
    @firmSwitching = false

  checkSamlConnection: (entity) ->
    @Restangular.all('saml/login').customGET('',{email: entity.userName, firm_id: entity.firm_id}).then ((response) =>
      if response.saml_enabled == false
        @switchToFirmAccount(entity)
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

  handleFirmLoginSuccess: =>
    @BaseDataService.loadBaseData()
    @MentionsFactory.clearTeamMembersCache()
    @$q.all([@$rootScope.currentUserPromise, @$rootScope.subscriptionLimitsPromise]).then ( =>
      # @AngularDataService.setUserData(@baseData)
      @current_user = @Utils.getCurrentUser()
      @MentionsFactory.getTeamMembers()
      @firmSwitching = false
      @$state.reload()
    ), ((error) =>
      @firmSwitching = false
    )

  requestApproval: (entity) =>
    params =
      id: entity.id
    @Restangular.all('users/approve').customPUT(params).then (response) =>
      @toaster.pop 'success', '', "User successfully approved!"
      @getMyAccountsData()

  activateFirmAccess: (entity) =>
    user_clone = $.extend(true, {}, entity)
    @Restangular.all('users/resend_activation').customPUT(user_clone).then (response) =>
      @toaster.pop 'success', '', "Activation link resent"
      @getMyAccountsData()
