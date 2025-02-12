class FirmSettingsOutlookIntegrationController extends BaseController
  @register 'FirmSettingsOutlookIntegrationController'

  @inject 'Restangular','angularEnabled'

  initialize: ->
    @Restangular.all('integrations').getList(type: 'Outlook').then (response) => 
      @outlook_plugins = response