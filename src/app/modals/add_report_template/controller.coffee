class AddReportTemplateController extends ModalController
    @register 'AddReportTemplateController'

    @inject 'toaster', 'Restangular', 'ReportTemplateDataservice','$state', 'TemplatesDataService', 'Restangular', 'FileHandlerFactory', 'Upload', 'baseUrl', 'ModalFactory', 'report', '$timeout','Utils'

    initialize: ->
      @templateName = "templates-selector"
      @editMode = false
      @templates = []
      if @report
        @editMode = true
        @report_name = @report.name
        @report_templates = JSON.parse(@report.template_details).template_details
      @active_tab = 'word_report'
      @maxLengthReportName = 200
      @drop_files = []
      @params = {}
      @files = []
      @params.name = null
      @attachments = []
      @selected_templates = []
      allowed_file_extensions = @FileHandlerFactory.getFileTypes()
      @maxFileSize = @FileHandlerFactory.getMaxFileSize()
      @getTemplates()
      @templateSelectorDisplayParams ={
        id: 'id'
        name: 'name'
        showQuestionTags: true
      }

    handleUploadError: (response) =>
      @loading = false

    getDocumentUploadResponse: (response) =>
      @toaster.pop 'success', '', 'Document(s) successfully uploaded'
      @loading = false
      @close('refresh')

    filterbyStandardTemplate:(templates) =>
      return _(templates).filter((template)=>
          template.type != "dd_profile"
      )

    getTemplates: ->
      @Restangular.all('templates').getList().then (response) =>
        response = @filterbyStandardTemplate(response)
        @templates = []
        for innerTemplate in response
          @templates.push innerTemplate.templateInfo
        if @report_templates and @report_templates.length
          @selected_templates = []
          selected_temps = _(@report_templates).pluck 'template_id'
          for template in @templates
            if selected_temps.indexOf(template.id) > -1
              template.is_selected = true
              @selected_templates.push template

          @filteredTemps = _(@templates).filter (template) => template.is_selected == true
          @templates = _(@templates).sortBy((template) =>
            template.is_selected
          )
          # for template in @filteredTemps
          #   template.is_selected = true

    viewQuestionTags: (template) =>
      @ModalFactory.invokeModal 'view_question_tags',
        resolve:
          template: => template
        success: (response) =>
          if response == 'close'
            @close()
            @$timeout =>
              @$state.go("app.diligence.template.preview",{templateId: template.id})

    setActiveTab: (type) =>
      @active_tab = type

    deleteFile: (idx) =>
      @files.splice(idx, 1)

    uploadAttachment: (files) ->
      @new_document_uploaded = true
      @files = files

      if files?.length
        @uploaded_file = files[0]


    submit: =>
      if @active_tab == 'dv_report'
        return if @add_report_template_form.$invalid

        @loading = true
        template = @ReportTemplateDataservice.newTemplate(@report_name)

        @toaster.pop 'wait', '', 'Creating...', 500000

        @ReportTemplateDataservice.create(template).then((response) =>
            @$state.go 'app.reports.templates.detail.edit', {
                templateId: response.id
            }
        ).finally(=>
            @loading = false
            @$uibModalInstance.dismiss null
            @toaster.clear()
        )
      else
        if @editMode
          @isSelectedTrueTemplates = []
          @isSelectedTrueTemplates = _(@selected_templates).filter (template) -> template.is_selected
        if !@selected_templates.length
          @toaster.pop 'error', '', 'Please select atleast 1 template'
          return
        if !@files.length and !@editMode
          @toaster.pop 'error', '', 'Please select a file'
          return
        if @report_name
          params = {}
          if @editMode
            if !@isSelectedTrueTemplates.length
              @toaster.pop 'error', '', 'Please select atleast 1 template'
              return
            params.template_ids = _(@isSelectedTrueTemplates).pluck 'id'
          else
            params.template_ids = _(@selected_templates).pluck('id')
          params.template_ids = JSON.stringify(params.template_ids)
          params.report_definition_name = @report_name
          params.report_definition_id = 0
          if @report
            params.report_definition_id = @report.id
          @loading = true
          @ReportTemplateDataservice.addReportDocument(@files[0], params).then ((response) =>
            @loading = false
            keyword = if @editMode then "updated" else "generated"
            @toaster.pop 'success', '', "Report #{keyword} successfully"
            @close()
          ), ((error) =>
            @loading = false
            @toaster.pop 'error', '',error.data if error.data
          )
