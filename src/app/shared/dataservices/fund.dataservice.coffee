angular.module('diligenceVault').factory 'FundDataservice', (Restangular, RestangularHeaderService)->
  new class FundDataservice

    getFunds: ->
      Restangular.all('funds').getList()

    getShareClass: (id) ->
      Restangular.one('shareclasses', id).get()

    getShareClassTable: (id) ->
      Restangular.one('shareclass_tables', id).get()

    getShareClassTables: (firmId,fundId) =>
      Restangular.one('firms', firmId).one('funds', fundId).all('AumTrackRecordDefinitions').getList()

    getShareClassTableValues: (params) ->
      Restangular.all('shareclass_table_values').getList(params)

    createShareClassTable: (params) ->
      Restangular.all('shareclass_tables').post(params)

    createShareClass: (params) ->
      Restangular.all('shareclasses').post(params)

    getShareClasses: (fund_id) ->
      Restangular.all('shareclasses').getList(fundId: fund_id)

    getFund: (id) ->
      Restangular.one('funds', id).get()

    getFunds: (params) ->
      Restangular.all('funds').getList(params)

    updateFund: (id, params) ->
      Restangular.one('funds', id).customPUT params

    newShareClassTableValue: (aumtrackrecord_defintion_id,attrs) ->
      restangularized = Restangular.one('AumTrackRecordDefinitions',aumtrackrecord_defintion_id).one('AumTrackRecordValues')

      _(restangularized).extend(attrs)

      restangularized

    getAttachments: (id, recordsPerPage, pageNumber) ->
      Restangular.all('attachmentassignments').customGET('', {
        entity_type: 'Fund'
        entity_id: id
        recordsPerPage: recordsPerPage
        pageNumber: pageNumber
      })

    removeShareClass: (id) ->
      Restangular.one('shareclasses', id).remove()

    updateShareClass: (id, params) ->
      Restangular.one('shareclasses', id).customPUT(params)

    processDatesAndValues: (response) ->
      _(response).each (item) ->
        item.value ||= 0
        item.end_date = moment(item.end_date).format('YYYY-MM-DD')

      response

    getDefaultShareClassValues: (id, type) ->
      Restangular
        .all('ShareClasses')
        .getList(fundID: id, type: type).then @processDatesAndValues

    getValuationChartValues: (id) ->
      Restangular
      .one('funds', id)
      .all('valuations')
      .getList()

    getTimelineValues: ->
      Restangular
      .all('audit_trail')
      .getList()

    getFundProfile: (id) ->
      Restangular
      .one('funds', id)
      .all('profile')
      .customGET()

    getFundRatings: (id) ->
      Restangular
      .all('ratings')
      .getList(entity_id: id, entity_type: 'Fund')

    getNotes: (id) ->
      Restangular.all('notes').getList(entity_id: id, entity_type: 'Fund')

    createNote: (params) ->
      Restangular.all('notes').post(params)

    getEmails: (id) ->
      params =
        entity_id : id
        entity_type : 'fund'
      Restangular.all('emails').getList(params)

    follow: (id) ->
      Restangular.one('funds', id).all('follow').customPUT()

    unfollow: (id) ->
      Restangular.one('funds', id).all('unfollow').customPUT()

    getProfileQuestionnaires: (id) ->
      Restangular.all('diligences/profile').customGET('', {entity_id: id, entity_type: 'Fund'})

    getRelatedEntities: (id) ->
      Restangular.one('funds', id).all('related').getList()

    getRelatedVehicles: (params) ->
      RestangularHeaderService.RestangularWithHeader(params.pageUrl).one('firms', params.firmId).one('funds', params.fundId).all('vehicles').getList()

    getRelatedVehicleById: (params) ->
      RestangularHeaderService.RestangularWithHeader(params.pageUrl).one('firms', params.firmId).one('funds', params.fundId).one('vehicles', params.id).get()

    getRelatedContacts: (id) ->
      Restangular.all('contacts').getList(entity_id: id, entity_type: 'Fund')

    getRelatedContactCount: (id) ->
      Restangular.all('contacts').customGET('', {entity_id: id, entity_type: 'Fund', count: true})

    getDiligences: (id) ->
      Restangular.one('funds', id).all('diligences').getList()
