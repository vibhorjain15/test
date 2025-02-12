angular.module('diligenceVault').factory 'FirmDataservice', (Restangular)->
  new class FirmDataservice

    getRelatedEntities: (id) ->
      Restangular.one('firms', id).all('funds').getList()

    getRelatedContacts: (id,is_active = null) ->
      Restangular.all('contacts').getList(entity_id: id, entity_type: 'Firm', active : is_active)

    getRelatedContactCount: (id) ->
      Restangular.all('contacts').customGET('', {entity_id: id, entity_type: 'Firm', count: true})

    getFirmProfile: (id) ->
      Restangular
      .one('firms', id)
      .all('profile')
      .customGET()

    getProfileQuestionnaires: (id) ->
      Restangular.all('diligences/profile').customGET('', {entity_id: id, entity_type: 'Firm'})


    getDefaultShareClassValues: (id, type) ->
      Restangular
        .all('ShareClasses')
        .getList(firmID: id, type: type).then @processDatesAndValues

    getDiligences: (id) ->
      Restangular.one('firms', id).all('diligences').getList()

    getNotes: (id) ->
      Restangular.all('notes').getList(entity_id: id, entity_type: 'Firm')

    getFirms: (params) ->
      Restangular.all('firms/monitor').customGET('', params)

    getAttachments: (id, recordsPerPage, pageNumber) ->
      Restangular.all('attachmentassignments').customGET('', {
        entity_type: 'Firm'
        entity_id: id
        recordsPerPage: recordsPerPage
        pageNumber: pageNumber
      })

    getAllFirmsOnDV: () ->
      Restangular.all('firms/activation_list').getList()

    getTables: (firmId) =>
      Restangular.one('firms', firmId).all('AumTrackRecordDefinitions').getList()