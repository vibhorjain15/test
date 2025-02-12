class RealtimeReportsListController extends BaseController
  @register 'RealtimeReportsListController'
  @inject 'ReportTemplateDataservice', '$state' , 'ReportsManager', 'baseUrl', 'DocumentsService', '$stateParams', 'SweetAlert', 'toaster', '$timeout', '$http', 'Utils','angularEnabled'

  initialize: ->
    @getAllReports()

  getAllReports: ->
    if @reports
      delete @reports
    @$timeout =>
      @reports = @ReportsManager.$new()

  downloadReport: (entity) =>
    url = @baseUrl + "/reports/download/" + entity.id
    @DocumentsService.downloadAttachment(url)

  deleteReport: (entity) =>
    if entity.entity_type == 'Review'
      @deleteNewReport(entity.id)
    else
      @deleteCurrentReport(entity.id)

  deleteNewReport: (id) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this report?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @ReportTemplateDataservice.deleteNewReport(id).then (response) =>
          @toaster.pop 'success', '', "Report deleted successfully"
          @getAllReports()
        .finally => swal.close()
    })


  deleteCurrentReport: (id) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this report?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @ReportTemplateDataservice.deleteRealtimeReport(id).then (response) =>
          @toaster.pop 'success', '', "Report deleted successfully"
          @getAllReports()
        .finally => swal.close()
    })

  emailReport: (entity) =>
    @$http.get(@baseUrl + '/reports/new/'+entity.id+'/email').then (response) =>
      @toaster.pop 'success', '', "Report emailed successfully"

  editReport: (entity) =>
    @$state.go 'app.reports.realtime-reports.detail.edit', { reportId: entity.id}

  openRow: (row,col) =>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && !@previewClicked && col.field != 'action'
      @$state.go("app.reports.realtime-reports.show.preview",{reportId: row.entity.id})

  redirectToNewReport: ->
    @$state.go 'app.reports.realtime-reports.new'
