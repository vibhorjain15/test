angular.module('diligenceVault').factory 'TemplatesDataService', (Restangular, $http, baseUrl) ->

  new class TemplatesDataService
    excel_parser_data = []
    word_parser_data = {}
    selectedSheets = []
    excel_file = {}
    word_file = []
    templateParams = {}
    requestTrackerParams = {}
    diligenceParams = {}
    permissionsParams = {}
    source = ""

    createNewTemplate: (params) ->
      Restangular.all('templates').post params

    setExcelParcerData: (data) ->
      excel_parser_data = data

    setParserSource: (src) ->
      source = src

    getParserSource: ->
      source

    setOriginalExcelFile: (file) ->
      excel_file = file

    getOriginalExcelFile: ->
      excel_file

    setWordParcerData: (data) ->
      word_parser_data = data

    getWordParcerData : ->
      word_parser_data

    setOriginalWordFile: (file) ->
      word_file = file

    getOriginalWordFile: ->
      word_file


    setRequestTrackerParams: (params) ->
      requestTrackerParams = params

    getRequestTrackerParams: ->
      requestTrackerParams

    getExcelParcerData: ->
      excel_parser_data

    setSelectedSheets: (sheets) ->
      selectedSheets = sheets

    getSelectedSheets: ->
      selectedSheets

    setTemplateParams: (params) ->
      templateParams = params

    getTemplateParams: ->
      templateParams

    setDiligenceParams: (params) ->
      diligenceParams = params

    getDiligenceParams: ->
      diligenceParams

    getPermissionsParams: ->
      permissionsParams

    setPermissionsParams: (params)->
      permissionsParams = params
      
    getTemplates: (params) ->
      Restangular.all('templates').getList(params)

    getTemplate: (id) ->
      Restangular.one('templates', id).get()

    saveTemplate: (id, params) ->
      Restangular.one('templates', id).customPUT(params)

    getDiligenceParams: ->
      diligenceParams

    getResponseTypes: ->
      Restangular.all('response_types').getList()

    getSection: (id) ->
      Restangular.one('sections', id).get()

    getSections: (templateId, params) ->
      Restangular.one('templates', templateId).all('sections').getList(params)

    getQuestions: (params) ->
      Restangular.all('questions').getList(params)

    getCustomQuestions: (params) ->
      Restangular.all('questions').customGET('', params)

    createQuestion: (id, params) ->
      Restangular.one('sections', id).all('questions').post params

    updateTemplate: (id, params) ->
      Restangular.one('templates', id).customPUT params

    createSection: (params) ->
      Restangular.all('sections').post params

    deleteTemplate: (id) ->
      Restangular.one('templates', id).remove()

    cloneTemplate: (id) ->
      Restangular.one('templates', id).all('clone').post()

    deleteQuestion: (sectionId, questionId) ->
      Restangular.one('sections', sectionId).one('questions', questionId).remove()

    updateQuestion: (id, params) ->
      Restangular.one('questions', id).customPUT params

    removeSection: (id) ->
      Restangular.one('sections', id).remove()

    updateSection: (id, params) ->
      Restangular.one('sections', id).customPUT params

    createGrid: (params) ->
      Restangular.all('grids').post(params)

    createOfflineDDGrid: (id, params) ->
      Restangular.one('dd_document_griditems').customPUT(params, '', {'dd_document_lineitems_id': id})

    activateTemplate: (id) ->
      params =
        is_draft: false

      Restangular.one('templates', id).customPUT(params)

    activatePatchTemplate: (id) ->
      $http.patch(baseUrl + '/templates/'+id+'/activate')

    getMappedQuestions: (templateId, questionId)=>
      Restangular.one('templates',templateId).one('questions',questionId).all('mapped_questions').getList()

    createVersion: (templateId, templateVersion)=>
      Restangular.one('templates',templateId).one('versions',templateVersion).all('create_version').post()

    createDropdownOptions: (params)=>
      Restangular.all('question_dropdowns').post(params)
