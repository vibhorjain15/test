angular.module('diligenceVault').factory 'DueDiligenceDataservice', ($http, baseUrl, Restangular, Upload, $filter, Utils, $window,RestangularHeaderService, BaseDataService) ->

  new class DueDiligenceDataservice
    setStatus: (id, status) ->
      params =
        status: status
      RestangularHeaderService.RestangularWithHeader('', status).one('diligences', id).customPUT params

    deleteDiligence: (id, reason) ->
      Restangular.one('v2/diligences', id).remove statusReason: reason

    deleteSubscriber:(entity_type,entity_id,user_id) ->
      Restangular
        .all('entitysubscribers')
        .customDELETE(null, entity_id : entity_id, entity_type : entity_type, user_id : user_id,
        {'Content-Type': 'application/json; charset=utf-8'})

    getTodos: (id) ->
      Restangular.all('todos').getList(entity_id: id, entity_type: 'Response').then (todos) ->
        _(todos).map((todo) => Restangular.restangularizeElement null, todo, 'todos')

    saveTodo: (todo, id, diligence_id) ->
      todo.entity_id = id
      todo.entity_type = 'Response'
      Restangular.all('todos').post(todo).then (response) =>
        Restangular.restangularizeElement null, response, 'todos'

    getResponseHistory: (id) ->
      Restangular.one('responses', id).all('history').getList().then (response) ->
        response

    getFollowUps: (entity_id, entity_type) ->
      Restangular.all('followups').getList(entity_id: entity_id, entity_type: entity_type).then (responses) ->
        _(responses).each (response) ->
          response.updateTimeStamp = new Date(response.updateTimeStamp)

        responses = _(responses).sortBy((response) -> response.updateTimeStamp)

        responses

    saveFollowup: (response) ->
      Restangular.all('followups').post(response).then (response) ->
        response.updateTimeStamp = new Date(response.updateTimeStamp)
        response

    subscribe: (entity_id, entity_type) ->
      params =
        entity_id: entity_id
        entity_type: entity_type
      Restangular.all('EntitySubscribers').post(params).then (response) ->
        response

    getQuestionCounts: (diligenceId) ->
      Restangular.one('diligences', diligenceId).all('QuestionCounts').getList()

    getList: (questionId) ->
      Restangular.one('questions', questionId).all('options').getList()

    getAttachmentTypes: ->
      BaseDataService.getAttachmentTypes().then (response) ->
        response

    getDiligences: (params) ->
      Restangular.all('diligences').getList(params)

    getDiligenceByFirm: (firm_id, params) ->
      Restangular.one('firms', firm_id).all('diligences').getList(params)

    getDiligenceByFund: (fund_id, params) ->
      Restangular.one('funds', fund_id).all('diligences').getList(params)

    getDiligenceInfo: (id) ->
      Restangular.one('diligences', id).get()

    getDiligence: (Id) ->
      # RestangularHeaderService.RestangularWithHeader(Id, 'DueDiligence').one('diligences', Id).getList().then (response) =>
      params = {
        headers: {'entity_id': Id, entity_type: 'DueDiligence'}
      }
      $http.get(baseUrl + '/diligences/' + Id, params).then (response) ->
        response.data

    getSections: (diligenceId, status) ->
      params =
        ReadWrite: true
        StatusFilter: status or 'Default'

      $http(
        url: baseUrl + '/diligences/' + diligenceId + '/sections'
        method: 'GET'
        params: param
        headers: {entity_id: diligenceId, entity_type: 'DueDiligence'}
      ).then (response) =>
        Utils.groupSections response.data

    getDiligenceAttachments: (targetId, recordsPerPage, pageNumber) ->
      Restangular.all('attachmentassignments').customGET('', {
        entity_type: 'DueDiligence'
        entity_id: targetId
        recordsPerPage: recordsPerPage
        pageNumber: pageNumber
      })

    uploadAttachment: (files, fields) ->
      params =
        url: baseUrl + '/attachment'
        file: files

      if fields?
        params.fields = fields

      Upload.upload params

    uploadBulkExcel: (file, fields) ->
      params =
        url: baseUrl + '/bulk_import/upload'
        file: file

      if fields?
        params.fields = fields

      Upload.upload params

    updateAttachment: (files, fields, id) ->
      params =
        method: 'PUT'
        url: baseUrl + "/attachments/#{id}"
        file: files

      if fields?
        params.fields = fields

      Upload.upload params

    uploadDiligenceAttachment: (params) ->
      params.metaData.asOfDate = $filter('date')(params.metaData.asOfDate, 'MM-dd-yyyy')
      Restangular.one('diligences', params.assignments.targetId).all('attachments').post params

    saveResponse: (response) ->
      params = {
        headers: {'entity_id': response.duediligence_id, entity_type: 'DueDiligence'}
      }
      $http.put("#{baseUrl}/v3/responses", response, params).then (response) ->
        response.data

    deleteResponse: (id, diligenceId) ->
      params = {
        headers: {'entity_id': diligenceId, entity_type: 'DueDiligence'}
      }
      $http.delete("#{baseUrl}/v2/responses/#{id}", params)

    assignUserToSection: (section, user, diligenceId) ->
      params =
        userID: user?.id
        sectionID: section.id
        ddMasterID: diligenceId

      Restangular.all('userassignments').post params

    assignUserToEntity: (params) ->
      Restangular.all('EntityAssignments').customPUT(params)

    sendRecommendation: (recommendation, diligenceId) ->
      Restangular.one('diligences', diligenceId).all('recommendation').post recommendation

    getNotes: (diligenceId, questionId, childEntityType, pageUrl) ->
      params =
        entity_id: diligenceId
        child_entity_id: questionId
        child_entity_type: childEntityType
        entity_type: 'Duediligence'
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('notes').getList(params).then (notes) ->
        _(notes).map (note) =>
          Restangular.restangularizeElement null, note, 'notes'

    saveNotes: (params,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('notes').post params

    compare: (ids) ->
      ids = ids.join(',') if _.isArray(ids)
      Restangular.all('compare').all('peer').getList Ids: ids

    getDueDiligences: (params) ->
      Restangular.all('diligences').getList params

    getViews: (id, type,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(@pageUrl).all('entity_viewers').getList({
        entity_id: id
        entity_type: type
      })

    createSequence: (ddMasterID, sectionID) ->
      Restangular.all('sequences').post
        duediligence_id: ddMasterID
        sectionID: sectionID

    ensureSequence: (ddMasterID, sectionID) ->
      Restangular.all('sequences').customPUT
        duediligence_id: ddMasterID
        sectionID: sectionID

    removeSequence: (id) ->
      Restangular.one('sequences', id).remove()

    getGridRows: (id) ->
      Restangular.one('grids', id).all('grid_rows_columns').getList(type: 'row')

    getGridColumns: (id) ->
      Restangular.one('grids', id).all('grid_rows_columns').getList(type: 'column')

    getGridRowsAndColumns: (id) ->
      Restangular.one('grids', id).all('grid_rows_columns').getList()

    getGridData: (id, version, response) ->
      Restangular.one('grids', id).one('versions',version).customGET('', {response_id: response})

    getGridRowsAndColumnsOfOfflineDD: (id) ->
      Restangular.one('dd_document_griditems').customGET('', {dd_document_lineitems_id: id})

    getProfileQuestionnaire: (id) ->
      Restangular.one('grids', id).all('grid_rows_columns').getList(type: 'row')

    getAvailableQuestionsAndResponses: (params) ->
      # Had to create the URI like this, if '#' is present in query string parameter then AngularJS removes anything
      # that comes after it. So, your other query params can also get removed.
      Restangular.all('nlp_mappings?entity_id=' + params.entity_id + '&include_response=' + params.include_response +
                      '&strategy_id=' + params.strategy_id + '&entity_type='+params.entity_type+ '&type='+params.type
                      ).customGET('', { q: $window.encodeURIComponent params.q })

    getAvailableQuestionsAndResponsesEs: (params) ->
      Restangular.all('service/es_service/qa_recommendation').post(params)


    updateResponsesUsed: (diligenceId, params) ->
      Restangular.one('diligences', diligenceId).all('response_used').post params


    WritetoDoc: (params) ->
      Restangular.one('diligences/document_export').customGET('', params)

    WritetoExcel: (params) ->
      Restangular.one('diligences/generate_excel_report').customGET('', params)

    WritetoExcelQuestionsBased: (params) ->
      Restangular.all('service/excel_services/diligence_question_report').post(params)

    WritetoDocWithoutTemplate: (diligenceId) ->
      Restangular.one('diligences/document_export').customGET('', {diligence_id: diligenceId})

    WritetoOriginalDoc: (diligenceId)->
      Restangular.all('jobs').post
        job_type: 'doc_insertion'
        job_params:
          diligence_id: diligenceId
          send_email: true

    GetDoc: (diligenceId)->
      Restangular.one('diligences', diligenceId).all('document').get().then (response) ->
        response.data

    getExtendedDueDate: (diligenceId, status) ->
      params =
        dueDiligence_id: diligenceId,
        status: status
        recordsPerPage: 500
      Restangular.all('dd_dueDate_extensions').customGET('', params)

    extendDueDate: (params) ->
      Restangular.all('dd_dueDate_extensions').post params

    updateDueDate: (dueDateId, params) ->
      Restangular.one('dd_dueDate_extensions', dueDateId).customPUT
        status: params.status,
        action_reason: params.action_reason

    getSectionsV2: (diligenceId, params) ->
      Restangular.one('/v2/diligences/', diligenceId).one('sections').customGET('', params)

    getReportQuestionResponse: (params) ->
      Restangular.all('report_responses').customGET('',params)

    createNewVersion: (id) ->
      Restangular.one('diligences', id).all('clone').post()

    createNewDDV2: (data,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('/v2/diligences').post(data)

    updateDiligenceStatus: (status, diligenceId, pageUrl) ->
      params =
        status: status
      params2 = {
        headers: {'page-url': pageUrl, 'diligence-status': status.toLowerCase()}
      }
      $http.put(baseUrl + '/diligences/' + diligenceId, params, params2).then (response) ->
        response

    unMarkWIP: (projectId, type) ->
      Restangular.one('diligences',projectId).one('mark_wip').put({'mode':type}).then (response) ->
        response

    saveRequest: (request)->
      Restangular.all('requesttrackers').customPUT(request)

    getRequest: (requestId)=>
      Restangular.one('requesttrackers',requestId).get()

    getProfileDDQ:(param,pageUrl)->
      RestangularHeaderService.RestangularWithHeader(pageUrl).one('diligences').customGET('profile',param)

    getInvestorDiligenceByFirm: (firm_id, params) ->
      Restangular.one('firms', firm_id).all('investor_diligences').getList(params)

    getInvestorDiligenceByFund: (fund_id, params) ->
      Restangular.one('funds', fund_id).all('investor_diligences').getList(params)

    updateResponseStatus: (responseId, status)=>
      params = {
        id: responseId
        response_status: status
      }
      Restangular.one('responses',responseId).all('status').patch(params)

    getAllSectionVerifiers: (diligenceId, sectionId, isReadOnlyNotEditable)=>
      params = {
        type: if isReadOnlyNotEditable then 1701 else 1702
      }
      Restangular.one('diligences',diligenceId).one('sections',sectionId).customGET('todos',params)

    updatePostResponseStatus: (responseId, status)=>
      params = {
        id: responseId
        response_status: status
      }
      Restangular.one('responses',responseId).all('post_status').patch(params)

    exitReview: (diligenceId)=>
      Restangular.one('diligences',diligenceId).all('exit_review').customPUT()

    updateTrackChangesStatus: (responseId, status)=>
      params = {
        id: responseId
        track_change_status: status
      }
      Restangular.one('responses',responseId).all('track_status').patch(params)
