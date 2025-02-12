angular.module('diligenceVault').factory 'QuestionnaireCacheFactory', ($cacheFactory) ->
  new class QuestionnaireCacheFactory
    constructor: ->
      @cache = $cacheFactory('questionnaire-info')

    clear: ->
      @cache.removeAll()

    get: (key) ->
      @cache.get(key)

    put: (key, value)->
      @cache.put(key, value)
