class DiligenceTemplateSubcategoryQuestionsController extends BaseController
  @register 'DiligenceTemplateSubcategoryQuestionsController'

  @inject 'Restangular', '$stateParams', 'SweetAlert',
          'TemplatesDataService', 'ModalFactory', 'toaster',
          '$scope','$state','ERROR_CODES', 'Utils', '$rootScope','angularTemplateEnabled'

  initialize: ->
    @subCategoryId = @$stateParams.subcategoryId
    @parentID = @$stateParams.categoryId
    @templateId = @$stateParams.templateId
    @is_investor = @Utils.isInvestor()
    @editQuestionTemplateUrl = 'diligence/template/categories/subcategories/questions/edit-question.html'
    @selectedEntities = []
    @loading = false
    @moveEnabled = false

    @$scope.getTemplate().then (response) =>
      @template = response
      @loadSourceTemplates()
    # @modalOptions =
    #   success: (response) =>
    #     _(response.questions).each (question) =>
    #       @processQuestion(question)
    #
    #       @questions.push question

    @reorder_resource = @Restangular.one('sections', @subCategoryId)
    @loadQuestions()

    deregisterer = @$scope.$watch 'vm.questions.length', (value) =>
      if value?
        @$scope.$emit 'preview:enable'

        deregisterer()

    @$rootScope.$on 'saved:question', (evt, question) =>
      @$rootScope.$emit 'refresh:template'
      @processQuestion(question)

  loadSourceTemplates: =>
    @Restangular.all('templates').getList().then (response) =>
      @sourceTemplates = response

  setUpStandardized: (question) =>
    modalInstance = @ModalFactory.invokeModal 'setup_standardized_text',
      resolve:
        question: -> question
        templateId: => @$stateParams.templateId
        subCategoryId: => @$stateParams.subcategoryId

    modalInstance.result.then (response) =>
      @loadQuestions()
    , (response) =>
      @loadQuestions()

  loadQuestions: =>
    @loading = true
    subCategoryId = @$stateParams.subcategoryId
    @questions = []
    @Restangular
      .all('questions')
      .getList({sectionID: subCategoryId})
      .then ((response) =>
        _(response).each (question) =>
          @processQuestion(question)

        @questions = response
        @loading = false



        # unless response.length
        #   @initializeQuestion()
      )

  processQuestion: (question) ->
    question.can_have_nested_question = @canHaveNestedQuestions(question.responseType)
    question.can_have_formulas = question.responseType in ['Grid']

  canHaveNestedQuestions: (responseType) ->
    responseTypes = ['Bookends', 'Grid', 'CheckBox', 'aumTable',
                     'ReturnTable','Identifier','DynamicGrid', 'Attachment']

    not _(responseTypes).contains(responseType)


  moveQuestion: () ->
    if @selectedEntities.length > 0
      modalInstance = @ModalFactory.invokeModal 'move_question',
        resolve:
          selectedEntities: => @selectedEntities
          templateId: => @$stateParams.templateId
          entityId: => @$stateParams.subcategoryId
          entityType: => 'questions'
          templateVersion: => @$scope.template_version
          soureSectionId: => @$stateParams.subcategoryId
        success: (response)=>
          @loadQuestions()
          @$rootScope.$emit 'refresh:template'
          @selectedEntities = []
          @moveEnabled = false

  toggleMoveMode: =>
    @moveEnabled = !@moveEnabled

  selectQuestions: (question)=>
    if question.selected
      @selectedEntities.push question
    else
      index = @selectedEntities.indexOf question
      @selectedEntities.splice index, 1

    @selectedAllQuestions = false
    if @selectedEntities.length == @questions.length
      @selectedAllQuestions = true

  onSelectAllQuestions : ()=>
    @selectedEntities = []
    _(@questions).each (question)=>
      question.selected = @selectedAllQuestions
      @selectedEntities.push question if @selectedAllQuestions

  openNestingModal: (question) ->
    modalInstance = @ModalFactory.invokeModal 'nested_questions',
      resolve:
        question: -> question
        templateId: => @$stateParams.templateId
        subCategoryId: => @$stateParams.subcategoryId

    modalInstance.result.then (response) =>
      @$rootScope.$emit 'refresh:template'
      @loadQuestions() if response?.reload
    , (response) =>
      @$rootScope.$emit 'refresh:template'
      @loadQuestions() if response?.reload


  openAddQuestionModal: =>
    @parentSubcategory = _(@$scope.$parent.vm.subcategories).findWhere({id: parseInt(@subCategoryId)})
    @parentCategory = _(@$scope.$parent.vm.categories).findWhere({id: parseInt(@parentID)})
    # add_template_questions

    parentName = ""
    if @parentCategory and @parentSubcategory
      parentName = @parentCategory.name + " > " + @parentSubcategory.name
    @ModalFactory.invokeModal 'add_template_questions',
      resolve:
        parentName: => parentName
        existingQuestions: => @questions
      success: (response) =>
        @$rootScope.$emit 'refresh:template'
        _(response.questions).each (question) =>
          @processQuestion(question)

          @questions.push question

  invokeQuestionEditDialog: (question) ->
    if question.isEditable
      modalInstance = @ModalFactory.invokeModal 'edit_question',
        resolve:
          templateId: => @$stateParams.templateId
          question_params: => question

      modalInstance.result.then (questions) =>
        @$rootScope.$emit 'refresh:template'
        _(questions).each (question) =>
          @processQuestion(question)

  removeQuestion: (question) ->
    return if @questions.length is 1
    alertText = if question.has_mapped_questions then 'This question is mapped to other questions. Deleting this would delete the mapping as well.' else ''
    @SweetAlert.confirm({
      title: 'Are you sure you want to delete this question ?'
      text: alertText
      confirmButtonText: 'Yes, delete it!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @TemplatesDataService.deleteQuestion(@$stateParams.subcategoryId, question.id).then (=>
          @toaster.pop 'success', '', "Question deleted successfully"
          @$rootScope.$emit 'refresh:template'
          @questions.splice(@questions.indexOf(question), 1)
        ),(error) =>
          swal.close()
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (confirm) =>
              if confirm.value and confirm.value == true
                @$state.go("app.diligence.template.preview",{templateId: @templateId})
          else if error.data and error.data.message != ""
            @toaster.pop 'error', '', error.data.message
    })


  openQuestionMappingModal: (question)=>
    modalInstance = @ModalFactory.invokeModal 'review_question_mapping',
      resolve:
        question: => question
        template: => @template
        sourceTemplates: => @sourceTemplates

    modalInstance.result.then (response) =>
      @loadQuestions() if response?.reload
    , (response) =>
      @loadQuestions() if response?.reload


  addFormula : (question)=>
    @ModalFactory.invokeModal 'add_formula',
      resolve:
        question: => question
