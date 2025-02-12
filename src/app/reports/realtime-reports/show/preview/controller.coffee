class RealtimeReportsListPreviewController extends BaseController
  @register 'RealtimeReportsListPreviewController'
  @inject 'ReportTemplateDataservice', '$stateParams', '$state', 'toaster', 'SweetAlert', 'baseUrl', 'DocumentsService', '$http','angularEnabled'

  initialize: =>
    @getReport(@$stateParams.reportId)

  getReport: (id) ->
    @ReportTemplateDataservice.getReport(id).then (response) =>
      @report = response
      @options =
        fund_id: response.fund_id
        parent_entity_id: response.firm_id

  downloadReport: =>
    url = @baseUrl + "/reports/download/" + @$stateParams.reportId
    @DocumentsService.downloadAttachment(url)


  deleteNewReport: (id) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this report?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @ReportTemplateDataservice.deleteNewReport(id).then (response) =>
          @toaster.pop 'success', '', "Report deleted successfully"
          @$state.go 'app.reports.realtime-reports.list', null, { reload: true }
        .finally => swal.close()
    })

  emailReport: (entity) =>
    @$http.get(@baseUrl + '/reports/new/'+entity.id+'/email').then (response) =>
      @toaster.pop 'success', '', "Report emailed successfully"

  deleteCurrentReport: (id) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this report?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @ReportTemplateDataservice.deleteRealtimeReport(id).then (response) =>
          @toaster.pop 'success', '', "Report deleted successfully"
          @$state.go 'app.reports.realtime-reports.list', null, { reload: true }
        .finally => swal.close()
    })
