class ParserQuestionValidationController extends ModalController
    @register 'ParserQuestionValidationController'

    @inject 'toaster', 'Restangular','$state', 'ModalFactory', '$timeout', 'SweetAlert', 'TemplatesDataService', 'data'

    initialize: ->
      @allMappedQuestions = []
      @dd_params = @TemplatesDataService.getDiligenceParams()
      @template_params = @TemplatesDataService.getTemplateParams()
      @requestTrackerParams = @TemplatesDataService.getRequestTrackerParams()
      @selected_response_type = {}
      @excludedResponseTypes = ["aumTable" , "DynamicGrid", "Grid", "CheckBox", "Bookends", "NoPlus", "BooleanPlus", "ReturnTable"]
      @TemplatesDataService.getResponseTypes().then (responseTypes) =>
        @responseTypes = _(responseTypes).filter (resType) => @excludedResponseTypes.indexOf(resType.text) == -1

    getTotal: =>
      total = 0
      for section in @data.sections
        for subSection in section.subSections
          for question in subSection.questions
            if question.is_selected
              total += 1
      total
