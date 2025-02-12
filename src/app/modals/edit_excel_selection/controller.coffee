class EditExcelSelectionController extends ModalController
    @register 'EditExcelSelectionController'

    @inject 'toaster', 'Restangular','$state', 'baseUrl', 'ModalFactory' ,'$timeout', '$q', 'selection', 'params'

    initialize: ->
      @selectionData = []
      @selectionData = @selection
      # if @params.type and @params.type == 'Question'
      #   if @selection.Question and @selection.Question.length
      #       @selectionData = @selection.Question
      # if @params.type and @params.type == 'Section'
      #   if @selection.Section and @selection.Section.length
      #       @selectionData = @selection.Section
      # console.log "@selectionData" , @selectionData

    submit: =>
      @close(@selectionData)
