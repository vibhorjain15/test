angular.module('diligenceVault').factory 'QuestionnaireResponseSequenceFactory', (DueDiligenceDataservice) ->
  class ResponseSequence
    constructor: (attrs, @section, @diligenceId) ->
      @cid = _.uniqueId('sequence_')
      angular.extend(@, attrs)
      @responsesPaged = []
      @currentPage = 0
      @totalItemsPerPage = 5
      @currentIndex = 0
      
    isNew: -> !@id?

    create: ->
      if @section.attributes.isMultiple
        promise = DueDiligenceDataservice.createSequence(@diligenceId, @section.id)
      else
        promise = DueDiligenceDataservice.ensureSequence(@diligenceId, @section.id)

      promise.then (response) =>
        angular.extend(@, response)
        response

    remove: ->
      DueDiligenceDataservice.removeSequence(@id)

    getResponses : =>
      @currentPage += 1
      while @currentIndex < @totalItemsPerPage * @currentPage and @currentIndex < @responses.length
        if @responses[@currentIndex]
          @responsesPaged.push @responses[@currentIndex]
        @currentIndex++

  new class QuestionnaireResponseSequenceFactory
    $new: (attrs, section, diligenceId) ->
      new ResponseSequence(attrs, section, diligenceId)
