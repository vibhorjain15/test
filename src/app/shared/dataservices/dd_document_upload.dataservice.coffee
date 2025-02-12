angular.module('diligenceVault').factory 'DDDocumentUploadDataservice', ($q, Restangular, $http, baseUrl) ->
  new class DDDocumentUploadDataservice
    getReviewedLineItemCount: (id) ->
      Restangular
        .one('dd_documents', id)
        .one('reviewed_lineitem_count', null)
        .get()

    getSignedUrl: (id) ->
      Restangular
        .one('dd_documents', id)
        .one('signed_url', null)
        .get()

    getDocuments: (params) ->
      Restangular.all('dd_documents').customGET('', params)

    getDocument: (id, params) ->
      Restangular.one('dd_documents', id).customGET('', params)

    getDocumentLineItems: (params) ->
      Restangular.all('dd_document_lineitems').customGET('', params)

    getQuestionMappings: (params) ->
      Restangular
        .all('dd_question_fuzzymappings')
        .getList(params)

    updateLineItem: (line_item_id, params) ->
      Restangular.one('dd_document_lineitems', line_item_id).customPUT(params)

    updateMappingInput: (id, params) ->
      Restangular.one('dd_documents', id).all('map').post(params)

    updateDocument: (id, params) ->
      Restangular.one('dd_documents', id).customPUT(params)

    updateLineItemsForTemplate: (id, params) ->
      Restangular.one('dd_documents', id).all('template').post("",params)

    recordMappingFeedback: (line_item_id, feedback) ->
      params =
        doc_lineitem_id: line_item_id

      params[feedback] = true

      Restangular.all('lineitems_mapping_feedbacks').customPUT(params)

    getMappedQuestions: (id, params) ->
      Restangular
        .one('dd_documents', id)
        .all('mapped_questions')
        .customGET('', params)

    associateQuestionsWithSection: (section, questions) ->
      params =
        sectionId: section.id
        questionIds: _(questions).pluck('id')

      Restangular.all('sectiondefinitions').post(params)

    removeQuestionAssignmentsWithSection: (section, questions) ->
      params =
        sectionId: section.id
        questionIds: _(questions).pluck('id')

      $http({
        url: baseUrl + '/sectiondefinitions'
        method: 'DELETE'
        data: params
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      })

    removeDocument: (id) ->
      Restangular.one('dd_documents', id).remove()
