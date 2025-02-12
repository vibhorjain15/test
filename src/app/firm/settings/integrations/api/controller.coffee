class FirmSettingsIntegrationsAPIController extends BaseController
  @register 'FirmSettingsIntegrationsAPIController'

  @inject '$scope', 'Restangular','SweetAlert', 'Utils','angularEnabled'

  initialize: ->
    @loading_api_key = true
    @Restangular.all('api_keys').customGET().then (response) =>
      @api_key = response
    .finally => @loading_api_key = false

  generateAPIKey: ->
    @generating_api_key = true

    @Restangular.all('api_keys').customPUT().then (response) =>
      @api_key = response
    .finally =>
      @generating_api_key = false
      swal.close()

  regenerateAPIKey: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to reset the api key?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @generateAPIKey()
    })
