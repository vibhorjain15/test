class FormADVRegulatoryMonitorPortfolioController extends BaseController
  @register 'FormADVRegulatoryMonitorPortfolioController'

  @inject 'FormADVFirmResource', 'Restangular', 'Utils', 'toaster','$state','angularEnabled'

  initialize: ->
    @username = @Utils.getCurrentUser().userName

    @Restangular.all('firm_preferences/alert_frequency').customGET().then (response) =>
      @frequency = response


    if @Utils.isFormADVAnalyticsSubscription()
      @resource = @FormADVFirmResource.$new('Analytics')
    else
      @resource = @FormADVFirmResource.$new()

  downloadMyPortfolioToExcel: () =>
    @toaster.pop 'info','','Request being processed. You will receive an email with the excel'
    @Restangular.all('firm_firmcrd_mappings/export').customGET('', {
      recipients: @username
    }).then (response) =>
      @toaster.pop 'success','','Request processed successfully. Please check your email for the portfolio information'
