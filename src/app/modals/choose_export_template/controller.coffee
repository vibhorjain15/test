class ChooseExportTemplateController extends ModalController
  @register 'ChooseExportTemplateController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout','Utils', '$scope', 'diligence'

  initialize: ->
    @activeView = "word"
    @isInvestor = @Utils.isInvestor()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @questionSelectorDisplayParams ={
      id: 'id'
      name: 'text'
    }
    @selectedQuestions = []
    @excelPrefs = {

    }
    @firm_preferences_copy = {
      report_template_id : null
      exclude_empty_response: false,
      exclude_comments: false,
      enable_grid_numbering: false,
      enable_question_instructions_export: false,
      enable_category_instructions_export: false
      enable_internal_notes_export: false
      enable_followups_export: false
      include_question_only_export: false
      include_project_documents: false
      include_ratings_word_export: false
      include_scores_word_export: false
      include_flags_word_export: false
    }

    @Restangular.all('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @firm_preferences_copy.include_question_only_export = @firm_preferences.include_question_only_export
      @excelPrefs.include_responses_excel_export = response.include_responses_excel_export
      @excelPrefs.include_comments_excel_export = response.include_comments_excel_export
      @excelPrefs.include_ratings_excel_export = response.include_ratings_excel_export
      @excelPrefs.include_scores_excel_export = response.include_scores_excel_export
      @excelPrefs.split_comments = response.split_comments
      @excelPrefs.include_internal_key = response.include_internal_key
      @excelPrefs.transpose_excel_columns = response.transpose_excel_columns
      @excelPrefs.include_flags_excel_export = response.include_flags_excel_export
      @initDefaultValues()
      @getExportTemplates()
      @getQuestions()

  initDefaultValues: =>
    if @firm_preferences_copy.include_question_only_export
      @firm_preferences_copy.report_template_id = false
      @firm_preferences_copy.exclude_empty_response = false
      @firm_preferences_copy.exclude_comments = false
      @firm_preferences_copy.enable_grid_numbering = false
      @firm_preferences_copy.enable_question_instructions_export = false
      @firm_preferences_copy.enable_category_instructions_export = false
      @firm_preferences_copy.enable_internal_notes_export = false
      @firm_preferences_copy.enable_followups_export = false
      @firm_preferences_copy.include_project_documents = false
      @firm_preferences_copy.include_ratings_word_export = false
      @firm_preferences_copy.include_scores_word_export = false
      @firm_preferences_copy.include_flags_word_export = false
    else
      @firm_preferences_copy.report_template_id = @firm_preferences.default_document_export_template_id
      @firm_preferences_copy.exclude_empty_response = @firm_preferences.exclude_empty_response
      @firm_preferences_copy.exclude_comments = @firm_preferences.exclude_comments
      @firm_preferences_copy.enable_grid_numbering = @firm_preferences.enable_grid_numbering
      @firm_preferences_copy.enable_question_instructions_export = @firm_preferences.enable_question_instructions_export
      @firm_preferences_copy.enable_category_instructions_export = @firm_preferences.enable_category_instructions_export
      @firm_preferences_copy.enable_internal_notes_export = @firm_preferences.enable_internal_notes_export
      @firm_preferences_copy.enable_followups_export = @firm_preferences.enable_followups_export
      @firm_preferences_copy.include_project_documents = @firm_preferences.include_project_documents
      @firm_preferences_copy.include_ratings_word_export = @firm_preferences.include_ratings_word_export
      @firm_preferences_copy.include_scores_word_export = @firm_preferences.include_scores_word_export
      @firm_preferences_copy.include_flags_word_export = @firm_preferences.include_flags_word_export

  getExportTemplates: ->
    @Restangular.all('DocumentExportTemplates').customGET().then (response) =>
      @templates = response
      @getDefaultSystemTemplate()
      @setDefaultTemplate()

  getDefaultSystemTemplate: =>
    @defaultSystemTemplate = _(@templates).find (template)=>
      template.is_system_template

  setDefaultTemplate: =>
    _(@templates).each (template)=>
      if @firm_preferences.default_document_export_template_id
        if template.id == @firm_preferences.default_document_export_template_id
          @firm_preferences_copy.report_template_id = template.id
      else if @defaultSystemTemplate
        @firm_preferences_copy.report_template_id = @defaultSystemTemplate.id
      

  getTemplateName: (id) =>
    if @templates and @templates.length and id
      selected_template = _(@templates).find((template) => template.id == id)
      selected_template.name


  getQuestions: =>
    filter_params = {
      project_id: @diligence.id,
      template_id: @diligence.template_id
    }
    @Restangular.all('service/excel_services/diligence_questions').post(filter_params).then (response) =>
      @questions = response.plain()

  redirectToTemplateDefinitions: =>
    @$uibModalInstance.close()
    @$timeout =>
      @$state.go 'app.firm.settings.export_preferences'


  onPreferenceChange: =>
    found = false
    for key, value of @firm_preferences_copy
      if key != "include_question_only_export" and value == true
        found  = true
        break
    if found
      @firm_preferences_copy.include_question_only_export = false


  setActiveView: (view) =>
    @activeView = view

  exportOnlyQuestionCheck: =>
    objCopy = angular.copy @firm_preferences
    report_template_id = @firm_preferences_copy.report_template_id
    if @firm_preferences_copy.include_question_only_export
      @firm_preferences_copy = _(objCopy).pick "include_question_only_export"
      @firm_preferences_copy.include_question_only_export = true
    else
      @firm_preferences_copy.include_question_only_export = false
      @initDefaultValues()
    @firm_preferences_copy.report_template_id = report_template_id

  onSelectQuestionsCheckboxChanged: =>
    if @selectQuestions
      @excelPrefs.include_responses_excel_export = false
      @excelPrefs.include_comments_excel_export = false
      @excelPrefs.include_ratings_excel_export = false
      @excelPrefs.include_scores_excel_export = false
      @excelPrefs.split_comments = false
      @excelPrefs.include_internal_key = false
      @excelPrefs.transpose_excel_columns = false
      @excelPrefs.include_flags_excel_export = false
    else
      @excelPrefs.include_responses_excel_export = @firm_preferences.include_responses_excel_export
      @excelPrefs.include_comments_excel_export = @firm_preferences.include_comments_excel_export
      @excelPrefs.include_ratings_excel_export = @firm_preferences.include_ratings_excel_export
      @excelPrefs.include_scores_excel_export = @firm_preferences.include_scores_excel_export
      @excelPrefs.split_comments = @firm_preferences.split_comments
      @excelPrefs.include_internal_key = @firm_preferences.include_internal_key
      @excelPrefs.transpose_excel_columns = @firm_preferences.transpose_excel_columns
      @excelPrefs.include_flags_excel_export = @firm_preferences.include_flags_excel_export

  choose: ->
    @firm_preferences_copy.activeView = @activeView
    if @activeView == 'excel'
      if @selectQuestions and @selectedQuestions.length == 0
        @toaster.pop 'error','','Please select questions to export'
        return
      params = {
        questions: @selectedQuestions
        preferences: if @selectQuestions then {} else @excelPrefs
        excelView: true
      }
      @close(params)
    else
        if !@is_freeSubscription and (!@choose_template_form.$valid)
          return
        @saving = true
        params = @firm_preferences_copy
        if @firm_preferences_copy.report_template_id
          if @defaultSystemTemplate and @firm_preferences_copy.report_template_id == @defaultSystemTemplate.id
            params.report_template_id = null
            params.report_template_name = null
          else
            params.report_template_name = @getTemplateName(@firm_preferences_copy.report_template_id)
        @close(params)

  gotoPremium: =>
    if !@isInvestor
      @$state.go 'app.premium'
      @close()