angular.module('diligenceVault').factory 'QuestionnaireSectionFactory', (DueDiligenceDataservice, QuestionnaireResponseSequenceFactory, QuestionnaireResponseFactory) ->
  class Section
    constructor: (attrs, @diligenceId) ->
      angular.extend(@, attrs)
      @sequences = [] unless attrs.sequences
      @sequenceDidChange()

    toggleReadonly: ->
      @readonly = !@readonly

    assignTeamMember: (teamMember) ->
      DueDiligenceDataservice.assignUserToSection(@, teamMember, @diligenceId).then =>
        @assignedUser = teamMember

    addNewSequenceBelow: (sequence, idx) ->
      unless idx?
        idx = @sequences.indexOf(sequence) + 1

      new_sequence = QuestionnaireResponseSequenceFactory.$new({}, @, @diligenceId)
      new_sequence.responses = _(@questions).map (question) =>
        QuestionnaireResponseFactory.$new({}, new_sequence, question, @diligenceId)

      @sequences.splice(idx, 0, new_sequence)
      @sequenceDidChange()

      new_sequence

    addNewSequence: ->
      @addNewSequenceBelow(null, @sequences.length)

    removeSequence: (sequence) ->
      if @sequences.length > 1
        @sequences.splice(@sequences.indexOf(sequence), 1)

        @sequenceDidChange()

        sequence

    sequenceDidChange: ->
      return unless @onSequenceChange?

      @onSequenceChange(@sequences.length)

  new class QuestionnaireSectionFactory
    $new: (attrs, diligenceId) ->
      new Section(attrs, diligenceId)
