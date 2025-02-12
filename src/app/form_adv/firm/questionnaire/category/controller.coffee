class FormADVQuestionnaireCategoryController extends BaseController
  @register 'FormADVQuestionnaireCategoryController'

  @inject '$stateParams', 'Restangular', '$scope', 'Utils', 'QuestionnaireResponseSequenceFactory',
          'QuestionnaireSectionFactory', 'QuestionnaireResponseFactory',
          '$state', '$timeout'

  initialize: ->
    categoryId = @$stateParams.categoryId
    firmCRD = @$stateParams.firmCRD
    @isMultiple = (@$stateParams.isMultiple == 'true')

    if @isMultiple
      params =
        firmId: @$stateParams.firmCRD
      @Restangular.all('formadv_responses/private_funds').customGET('', params).then (response) =>
        @viewingForList = response
        @viewingFor = @viewingForList[0].id
        @fetchSequenceSections(@viewingForList[0].id)

    else
      @loadChildSections(categoryId, firmCRD)

  loadChildSections: (categoryId, firmCRD) ->
    @loadingSequenceSections = true
    params =
      firmCRD: firmCRD
      parentId: categoryId
      filter: @$state.params.filter

    @Restangular.all('formadv_sections').customGET('', params).then (response) =>
      @initializeSections(response)

  fetchSequenceSections: (sequence_id) =>
    @loadingSequenceSections = true
    params =
      firmCRD: @$stateParams.firmCRD
      parentId: @$stateParams.categoryId
      filter: @$state.params.filter
      sequence_id: sequence_id

    @Restangular.all('formadv_sections').customGET('', params).then (response) =>
      @initializeSections(response)


  separateEntities: (entities) ->
    entity_types = ['questions', 'responses', 'sequences']

    _(entity_types).each (type) =>
      @[type] = @Utils.filterOut entities, (entity) ->
        entity.type is type

  initializeSections: (response) =>
    @sections = []

    @separateEntities(response.included)

    @sequences = _(@sequences).map (sequence_attrs) =>
      @QuestionnaireResponseSequenceFactory.$new(sequence_attrs)

    _(response.data).each (attrs) =>
      section = @QuestionnaireSectionFactory.$new(attrs)

      sequences = @Utils.filterOut @sequences, (sequence) =>
        sequence.attributes.sectionID is section.id

      if sequences.length is 0
        sequences.push @QuestionnaireResponseSequenceFactory.$new(attributes: {
            sectionID: section.id
        })

      section.questions = @Utils.filterOut @questions, (question) =>
        question.attributes.sectionID is section.id

      if section.questions.length
        @sections.push section
      else
        return

      section.sequences = _(sequences).map (sequence) =>
        sequence.section = section

        sequence.responses = _(section.questions).map (question) =>
          response_attrs = @Utils.filterOut(@responses, (response) =>
            response.attributes.sequenceID is sequence.id and response.attributes.questionID is question.id
          )[0] # there will be only one response per sequence & question combination

          @QuestionnaireResponseFactory.$new(response_attrs, sequence, question)

        sequence

    @$timeout =>
      @loadingSequenceSections = false
    , 500
