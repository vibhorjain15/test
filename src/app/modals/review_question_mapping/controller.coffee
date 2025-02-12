class ReviewQuestionMappingController extends ModalController

  @register 'ReviewQuestionMappingController'

  @inject '$uibModalInstance', 'Restangular', '$timeout', 'toaster', 'Utils', 'question', 'template','SweetAlert','$http','baseUrl','TemplatesDataService','sourceTemplates'

  initialize: ->
    @mappedQuestions = {}
    @getQuestionMapping()

  groupQuestions: (questions)=>
    @mappedQuestions = {}
    _(questions).each (mapping)=>
      if @mappedQuestions["template_"+mapping.mapped_template_id]
        @mappedQuestions["template_"+mapping.mapped_template_id].questions.push mapping
      else
        @mappedQuestions["template_"+mapping.mapped_template_id] = {
          questions: [mapping]
          mapped_template_id: mapping.mapped_template_id
          mapped_template_name: mapping.mapped_template_name
          mapped_template_version: mapping.mapped_template_version
          isOpen: false
        }

  getQuestionMapping: =>
    @loading_questions = true
    @TemplatesDataService.getMappedQuestions(@template.templateInfo.id, @question.id).then (response)=>
      @unGroupedQuestions = response
      @groupQuestions(response)
      @revealAddMappingPanel() if response.length == 0
      @loading_questions = false
    ,(error)=>
      @loading_questions = false

  revealAddMappingPanel: ->
    @slide_toggle = true

  hideAddMappingPanel: ->
    @slide_toggle = false

  onMappingSave: (questions)=>
    @has_changes = true
    _(questions).each (mapping)=>
      if @mappedQuestions["template_"+mapping.mapped_template_id]
        @mappedQuestions["template_"+mapping.mapped_template_id].questions.push mapping
      else
        @mappedQuestions["template_"+mapping.mapped_template_id] = 
          questions: [mapping]
          mapped_template_id: mapping.mapped_template_id
          mapped_template_name: mapping.mapped_template_name
          mapped_template_version: mapping.mapped_template_version
          isOpen: false

    @hideAddMappingPanel()

  onMappingDelete: =>
    @has_changes = true

  close: ->
    if @has_changes
      super(reload: true)
    else
      super()