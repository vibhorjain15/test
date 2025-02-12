###
    Each section has subsections, and this directive corresponds to subsections
    Each subsection has an array of questions & it has two modes edit/read-only
    The resposibility of subsections is to render appropriate widget for each question based
    on the edit/read-only mode.
    Each question is going to have a read-only/read-write version of template.
    Each subsection besides rendering widgets questions has to switch all the widgets based on the mode
    One way to go about this is to have two ng-repeats with ng-if on top it to toggle modes but that is
    very expensive when we have so many subsections & widgets due to angualar's dirty checking.
    Hence we are manually compiling directives & appending using jquery
###
angular.module('diligenceVault').directive 'diligenceDetailSection', ($compile, Utils, DueDiligenceDataservice) ->
  diligenceSectionLinker = (scope, element, attrs) ->
    section = scope.$eval(attrs.section)
    is_internal = scope.$eval(attrs.isInternal)

    scope.teamMembers = scope.$eval(attrs.teamMembers)
    scope.section = section
    scope.diligenceId = attrs.diligenceId
    scope.isEditable = !scope.$eval(attrs.dueDiligenceIsLocked)

    setMode = (value) ->
      return unless angular.isDefined(value)

      scope.mode = if value then 'ro' else 'rw' #ro = readonly, rw = read-write


    addSequence = (sequence) ->
      questions = section.questions

      if sequence.responses.length is questions.length
        _(sequence.responses).each (response) ->
          unless response.question?
            response.question = _(questions).findWhere(id: response.questionID)
          unless response.sequenceID?
            response.sequenceID = sequence.id

        scope.sequences.push
          id: sequence.id
          responses: sequence.responses

        return

      responses = _(questions).map((question) ->
        response = _(sequence.responses or []).findWhere(questionID: question.id)

        if !response
          response = sequenceID: sequence.id
          # If no response exists initialize a new one

        response.question = question
        response
      )

      sequence.responses = responses

      scope.sequences.push
        id: sequence.id
        responses: responses

    initializeSequences = ->
      sequences = section.sequences
      scope.sequences = []

      if sequences.length
        _(sequences).each addSequence
        scope.sequencesInitialized = true
      else
        scope.addNewSequence().then ->
          scope.sequencesInitialized = true

    scope.addNewSequence = ->
      scope.saving_sequence = true

      DueDiligenceDataservice.createSequence(scope.diligenceId, scope.section.id).then((response) ->
        section.sequences.push response
        addSequence response
      ).finally ->
        scope.saving_sequence = false

    scope.removeLastSequence = ->
      if scope.sequences.length > 1
        sequence = _(scope.sequences).last()

        DueDiligenceDataservice.removeSequence(sequence.id).then ->
          _([section.sequences, scope.sequences]).each (collection) ->
            collection.splice collection.length - 1, 1

    scope.assignUser = (user) ->
      scope.assigning_user = true

      DueDiligenceDataservice.assignUserToSection(scope.section, user, scope.diligenceId).then ->
        scope.assigning_user = false
        #temporary thing, eventually pick user from the response
        scope.assignedUser = user

    if scope.isEditable
      if Utils.isInvestor()
        setMode !is_internal
      else
        setMode false
    else
      setMode true

    if scope.section.assignedTo
      scope.assignedUser = _(scope.teamMembers).findWhere(id: scope.section.assignedTo)

    scope.$watch 'mode', (newValue, oldValue) ->
      if newValue and newValue != oldValue
        initializeSequences()

    initializeSequences()


  templateSectionLinker = (scope, element, attrs) ->
    section = scope.$eval(attrs.section)

    scope.section = section
    scope.isEditable = attrs.mode == 'edit'
    scope.mode = attrs.mode
    scope.section.sequences = []


    scope.addNewSequence = ->
      section.sequences.push questions: section.questions

    scope.removeLastSequence = ->
      if section.sequences.length > 1
        section.sequences.splice section.sequences.length - 1, 1

    scope.addNewSequence()

  {
    restrict: 'E'
    replace: true

    templateUrl: (element, attrs) ->
      if angular.isDefined(attrs.diligenceId)
        'diligence/directives/diligenceDetailSection/detail-section.html'
      else
        'diligence/directives/diligenceDetailSection/detail-section-preview.html'

    compile: (element, attrs) ->
      if angular.isDefined(attrs.diligenceId)
        diligenceSectionLinker
      else
        templateSectionLinker

    controller: ($scope, DueDiligenceDataservice) ->
      @deleteResponse = (response) ->
        params = _(response).omit('question')
        DueDiligenceDataservice.deleteResponse(params).then ->
          response.id = null
          response

      @saveResponse = (response) ->
        params =
          duediligence_id: Number($scope.diligenceId)
          SectionID: $scope.section.id
          questionID: response.questionID or response.question.id
          response: _(response).omit('question')

        if params.response.listValueID and !_.isArray(params.response.listValueID)
          params.response.listValueID = [ params.response.listValueID ]

        DueDiligenceDataservice.saveResponse params
  }
