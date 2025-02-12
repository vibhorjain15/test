class ReportTemplatesListPreviewController extends BaseController
  @register 'ReportTemplatesListPreviewController'
  @inject 'ReportTemplateDataservice', '$stateParams', '$state', 'toaster', 'SweetAlert', 'DocumentsService', 'baseUrl', 'ModalFactory', '$scope', 'Utils', 'angularEnabled'

  initialize: ->
    template = @ReportTemplateDataservice.getSelectedReportTemplate()
    is_new_report = if template.is_new_report then true else false
    if template.id
      @getTemplate(template.id, is_new_report)

  getTemplate: (id, is_new_report) ->
    @ReportTemplateDataservice.getTemplate({id: id, is_new_report: is_new_report}).then (response) =>
      @template = response

  editNewTemplate: ->
    @ModalFactory.invokeModal 'add_report_template',
      resolve:
        report : => @template
      success: =>
        @initialize()
        @$scope.$emit("refresh_sidebar", @template.id)

  downloadReport: =>
    url = @baseUrl + "/report_templates/download/" + @$stateParams.templateId
    @DocumentsService.downloadAttachment(url)

  deleteCurrentTemplate: (template) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this report definition?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @ReportTemplateDataservice.deleteReportTemplate({id: template.id, is_new_report: template.is_new_report}).then (response) =>
          @toaster.pop 'success', '', "Report Definition deleted successfully"
          @$state.go 'app.reports.templates.list', null, { reload: true }
        .finally => swal.close()
    })
