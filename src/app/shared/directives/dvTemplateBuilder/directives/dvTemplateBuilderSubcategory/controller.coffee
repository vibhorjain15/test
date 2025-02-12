class DVTemplateBuilderSubcategoryController extends BaseController
  @register 'DVTemplateBuilderSubcategoryController'

  @inject '$attrs', '$scope', 'TemplatesDataService', 'toaster',
          'SweetAlert', 'OrderService', 'DDDocumentUploadDataservice',
          'uiSortableMultiSelectionMethods', 'Restangular'

  initialize: ->
    @subcategory = @$scope.$parent.$eval(@$attrs.subcategory)
    @sortableOptions = @uiSortableMultiSelectionMethods.extendOptions
      connectWith: '.js-questions-container'
      placeholder: 'sortable-placeholder'

      update: (evt, ui) =>
        ###
        This is an array
        questions = ui.item.sortableMultiSelect.selectedModels
        ###

        questions = []
        question_item = ui.item.sortable.model
        questions.push(question_item)
        sourceModel = ui.item.sortable.sourceModel
        droptargetModel = ui.item.sortable.droptargetModel

        if sourceModel is @subcategory.questions
          if sourceModel is droptargetModel
            @updateOrdering(ui)
          else if !ui.item.sortable.droptarget.hasClass('js-subcategory-questions')
            @removeQuestionAssignmentsWithSection(questions)
        else
          @associateQuestion(questions)

    @getQuestions()

  updateOrdering: (ui) ->
    resource =  @Restangular
                  .one('sections', @subcategory.id)
                  .one('questions', ui.item.sortable.model.id)
    @OrderService.performOrdering({
      items: @subcategory.questions
      ui: ui
      order_attribute: 'order'
      resource: resource
    })


  getQuestions: ->
    @TemplatesDataService.getQuestions(sectionID: @subcategory.id).then (response) =>
      @subcategory.questions = response

  saveSubcategory: ->
    @TemplatesDataService.updateSection(@subcategory.id, {
      name: @subcategory.name
    }).then =>
      @toaster.pop 'success', '', 'Updated section name'

  moveUp: (subcategory, idx)->
    @$scope.$emit 'move_up:subcategory', subcategory, idx

  moveDown: (subcategory, idx)->
    @$scope.$emit 'move_down:subcategory', subcategory, idx

  confirmSubsectionRemoval: ->
    @SweetAlert.confirm({
      title: "Are you sure you want to delete \"#{@subcategory.name}\" ?"
      confirmButtonText: 'Yes, delete it!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @TemplatesDataService.removeSection(@subcategory.id).then =>
          @$scope.$emit 'remove:subcategory', @subcategory
        .finally => swal.close()
    })

  associateQuestion: (questions) =>
    @DDDocumentUploadDataservice
      .associateQuestionsWithSection(@subcategory, questions)

  removeQuestionAssignmentsWithSection: (questions) ->
    @DDDocumentUploadDataservice
      .removeQuestionAssignmentsWithSection(@subcategory, questions)
