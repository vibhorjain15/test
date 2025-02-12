class FirmSettingsExportOptionsController extends BaseController
  @register 'FirmSettingsExportOptionsController'

  @inject '$scope', 'Restangular', 'toaster', 'Utils','angularEnabled'

  initialize: ->
    @$scope.getFirmProfile().then (firm_profile) =>
      @firm_profile = firm_profile

    @getExportOptionList()

  getExportOptionList: ->
    @loadingExportOptions = true

    @Restangular.all('excel_reports').getList()
    .then((response) =>
      @excelReports = response
    )
    .finally(=>
      @loadingExportOptions = false
    )

  generateReportLink: (id) ->
    @toaster.pop 'info','','Request being processed. You will receive an email with the report.'
    @Restangular.one('excel_reports', id).one('generate_report', '').customGET()
    .then((response) =>
      @toaster.pop 'success','','Request processed successfully. Please check your email'
    )
    .finally(=>
    )
