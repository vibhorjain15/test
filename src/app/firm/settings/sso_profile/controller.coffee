class FirmSettingsSsoController extends BaseController
  @register 'FirmSettingsSsoController'

  @inject '$scope', 'toaster', 'Restangular', 'Utils', '$tinymceToolbar1', '$tinymceToolbar2', '$tinymcePlugins', 'ModalFactory','angularEnabled'

  initialize: ->
    firmId = @Utils.getCurrentFirm().id
    @ssoObject = {}
    @verification_type = {}
    @useMetaUrl = false
    @isNew = false

    @responseSignatures = [
      {id: 1, api_id: 0, name: "Response"}
      {id: 2, api_id: 1, name: "Assertion"}
      {id: 3, api_id: 2, name: "Response and Assertion"}
    ]
    @verification_type = @responseSignatures[0]

    @getSsoData()

  getSsoData: =>
    @Restangular.all('saml/configuration').doGET().then (response) =>
      @ssoObject = response
      @isNew = true if not @ssoObject
      if @ssoObject.metadata_file
        @useMetaUrl = true

  ViewServiceProviderDetails: =>
    @ModalFactory.invokeModal 'view_service_provider'

  submit: ->
    if @sso_form.$valid
      if @useMetaUrl
        @ssoObject.login_url = null
        @ssoObject.entity_id = null
        @ssoObject.signature_certificate = null
        @ssoObject.logout_url = null
      else
        @ssoObject.metadata_file = null

      params = angular.copy @ssoObject
      params.verification_type = @verification_type.api_id
      @saving = true
      if @isNew
        promise = @Restangular.all('saml/configuration').post(params)
      else
        promise = @Restangular.all('saml/configuration').customPUT(params)

      promise.then ((response) =>
        @saving = false
        message = 'SSO disabled'
        if @ssoObject.enable_saml
          message = 'SSO enabled'
        @toaster.pop 'success', '', message
        @ssoObject = angular.copy response
        @isNew = false
      ), (error) =>
        @saving = false
