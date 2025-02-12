class QuestionnaireShareClassTableSelectorController extends BaseController
  @register 'QuestionnaireShareClassTableSelectorController'

  @inject '$scope', 'FundDataservice', '$state', '$attrs','Utils',
    'ShareClassTableFactory', 'ModalFactory', 'keywordConstants', 'Restangular','DueDiligenceDataservice','entityTypeValue'

  initialize: ->
    deregisterer = @$scope.$parent.$watch @$attrs.response, (response) =>
      if response?
        @response = @$scope.$parent.$eval @$attrs.response
        @initShareClass()
        deregisterer()

  initShareClass: () ->
    @readonly = angular.fromJson @$attrs.readonly
    @is_investor = @Utils.isInvestor()
    @entity_type = @Utils.getEntityType()

    share_class_table_type = @$attrs.shareClassTableType

    if share_class_table_type is 'aum'
      @no_response = !@response.attributes.aumTable_id
    else if share_class_table_type is 'track_record'
      @no_response = !@response.attributes.returnTable_id

    @share_class_table_type = share_class_table_type

    @DueDiligenceDataservice.getDiligence(@response.diligenceId).then (response) =>
      fund_id = response.entity_id
      @diligence = response
      @fund_id = fund_id
      #return if @readonly and @no_response

      @getShareClasses(response, share_class_table_type)

  getShareClassTablePromise: (diligence,params)=>
    if diligence.entity_type == @keywordConstants.Firm
      @Restangular.one('firms', diligence.entity_id).all('AumTrackRecordDefinitions').getList(params)
    else if diligence.entity_type == @keywordConstants.Product
      @Restangular.one('firms', diligence.fromfirm_id).one('funds', diligence.entity_id).all('AumTrackRecordDefinitions').getList(params)
    else if diligence.entity_type == @keywordConstants.Vehicle
      @Restangular.one('firms', diligence.fromfirm_id).one('funds', diligence.parent_entity_id).one('vehicles', diligence.entity_id).all('AumTrackRecordDefinitions').getList(params)
    else if diligence.entity_type == @keywordConstants.Strategy
      @Restangular.one('firms', diligence.fromfirm_id).one('strategies', diligence.entity_id).all('AumTrackRecordDefinitions').getList(params)
    else if diligence.entity_type == @keywordConstants.Product && diligence.linked_duediligence_id
      @Restangular.one('firms', diligence.fromfirm_id).one('strategies', diligence.parent_entity_id).one('funds', diligence.entity_id).all('AumTrackRecordDefinitions').getList(params)

  getShareClasses: (diligence, type) =>
    #We create a snapshot after diligence is submitted to investor. but in case of precompletion review, we open the share
    #class in readonly mode but snapshot is not created. so we need to pass isEditable as true.
    params =
      type: type
      is_editable: if !@readonly or (@response.scope and @response.scope.isReadonlyEditable) then true else false

    @getShareClassTablePromise(diligence, params).then (share_class_tables)=>
      @share_class_tables = share_class_tables
      selectedShareClassTableId = @getSelectedShareClassTableId()
      #continue only if there are share class tables
      if @share_class_tables.length > 0
        if selectedShareClassTableId
          #if there is a share class table selected, find its index in the share class tables
          default_share_class_table_index = _(@share_class_tables).findIndex (table)=>
            table.id == selectedShareClassTableId
        #initialise selected share class if there is one saved in the response
        @selected_share_class = @share_class_tables[default_share_class_table_index] if default_share_class_table_index > -1
        @share_classes = @share_class_tables
        @renderShareClassTable()

  getSelectedShareClassTableId: ->
    attr = @response.value_attrs[0]

    @response.attributes[attr]

  setResponseValue: ->
    share_class = @selected_share_class
    attr = @response.value_attrs[0]

    @response.attributes[attr] = share_class?.id

  gotoEntityProfile: ->
    if @diligence.entity_type == @keywordConstants.Firm
      @$state.go 'app.firms.profile.aum_tr', {firmId: @diligence.entity_id}
    else if @diligence.entity_type == @keywordConstants.Product
      @$state.go 'app.firms.funds.profile.aum_tr', {firmId: @diligence.fromfirm_id,fundId: @diligence.entity_id}
    else if @diligence.entity_type == @keywordConstants.Vehicle
      @$state.go 'app.firms.funds.vehicles.profile.aum_tr', {firmId: @diligence.fromfirm_id,fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id}
    else if @diligence.entity_type == @keywordConstants.Strategy
      @$state.go 'app.firms.strategies.profile.aum_tr', {firmId: @diligence.fromfirm_id,strategyId: @diligence.entity_id}

  renderShareClassTable: ->
    @$scope.renderShareClassTable(@selected_share_class)

  onChange: ->
    @setResponseValue()
    @renderShareClassTable()
    @$scope.$parent.$eval @$attrs.onChange

  openUploadModal: ->
    @ModalFactory.invokeModal 'upload_aum_tr',
      resolve:
        entity_id: => @fund_id
        entity_type: => @entityTypeValue[@diligence.entity_type]