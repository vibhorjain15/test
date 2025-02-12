angular.module('diligenceVault').factory 'HistoryDataService', () ->

  new class HistoryDataService
    
    savedQuestionData = null
    questionsGridState = null

    getSavedQuestionData : =>
      savedQuestionData

    setSavedQuestionData : (data)=>
      savedQuestionData = data

    saveQuestionsGridState: (state)=>
      questionsGridState = state

    getQuestionsGridState: =>
      questionsGridState

    clearQuestionsGridState: =>
      questionsGridState = null