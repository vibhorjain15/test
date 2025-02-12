angular.module('diligenceVault').factory 'StrategyDataservice', (Restangular, RestangularHeaderService)->
  new class StrategyDataservice

    getStrategies: ->
      Restangular.all('funds').getList()

    getShareClass: (id) ->
      Restangular.one('shareclasses', id).get()

    getShareClassTable: (id) ->
      Restangular.one('shareclass_tables', id).get()

    getShareClassTables: (firmId,strategyId) =>
      Restangular.one('firms', firmId).one('funds', strategyId).all('AumTrackRecordDefinitions').getList()

    getShareClassTableValues: (params) ->
      Restangular.all('shareclass_table_values').getList(params)

    createShareClassTable: (params) ->
      Restangular.all('shareclass_tables').post(params)

    createShareClass: (params) ->
      Restangular.all('shareclasses').post(params)

    getShareClasses: (strategy_id) ->
      Restangular.all('shareclasses').getList(strategyId: strategy_id)

    getStrategy: (id) ->
      Restangular.one('funds', id).get(fund_type: 'Strategy')

    getStrategies: (params) ->
      Restangular.all('funds').getList(params)

    updateStrategy: (id, params) ->
      Restangular.one('funds', id).customPUT params

    newShareClassTableValue: (aumtrackrecord_defintion_id,attrs) ->
      restangularized = Restangular.one('AumTrackRecordDefinitions',aumtrackrecord_defintion_id).one('AumTrackRecordValues')

      _(restangularized).extend(attrs)

      restangularized

    getAttachments: (id, recordsPerPage, pageNumber) ->
      Restangular.all('attachmentassignments').customGET('', {
        entity_type: 'Strategy'
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
        .getList(strategyID: id, type: type).then @processDatesAndValues

    getValuationChartValues: (id) ->
      Restangular
      .one('funds', id)
      .all('valuations')
      .getList()

    getTimelineValues: ->
      Restangular
      .all('audit_trail')
      .getList()

    getStrategyProfile: (id) ->
      Restangular
      .one('funds', id)
      .all('profile')
      .customGET()

    getStrategyRatings: (id) ->
      Restangular
      .all('ratings')
      .getList(entity_id: id, entity_type: 'Strategy')

    getNotes: (id) ->
      Restangular.all('notes').getList(entity_id: id, entity_type: 'Strategy')

    createNote: (params) ->
      Restangular.all('notes').post(params)

    getEmails: (id) ->
      params =
        entity_id : id
        entity_type : 'strategy'
      Restangular.all('emails').getList(params)

    follow: (id) ->
      Restangular.one('funds', id).all('follow').customPUT()

    unfollow: (id) ->
      Restangular.one('funds', id).all('unfollow').customPUT()

    getProfileQuestionnaires: (id) ->
      Restangular.all('diligences/profile').customGET('', {entity_id: id, entity_type: 'Strategy'})

    getRelatedEntities: (id) ->
      Restangular.one('funds', id).all('related').getList()

    getAssociatedEntities: (productId,firmId) ->
      Restangular.all('service/dvapi_service/product_hierarchy').post({product_id: productId, firm_id: firmId})

    getRelatedVehicles: (params) ->
      RestangularHeaderService.RestangularWithHeader(params.pageUrl).one('firms', params.firmId).one('funds', params.strategyId).all('vehicles').getList()

    getRelatedVehicleById: (params) ->
      RestangularHeaderService.RestangularWithHeader(params.pageUrl).one('firms', params.firmId).one('funds', params.strategyId).one('vehicles', params.id).get()

    getRelatedContacts: (id) ->
      Restangular.all('contacts').getList(entity_id: id, entity_type: 'Strategy')

    getRelatedContactCount: (id) ->
      Restangular.all('contacts').customGET('', {entity_id: id, entity_type: 'Strategy', count: true})

    getDiligences: (id) ->
      Restangular.one('funds', id).all('diligences').getList()
