class ManageAUMTRController extends ModalController
  @register 'ManageAUMTRController'

  @inject 'BaseDataService', '$stateParams', 'Restangular', 'entity_id', 'entity_type', 'table'

  initialize: ->
    @saving_table = false
    @edit_mode = false
    @params = {}
    @types = [
      {label: 'AUM', value: 'aum'}
      {label: 'Track Record', value: 'track_record'}
    ]
    @Restangular.all('currency').getList().then (response) =>
      @currencies = response
      
    @periods = ['Monthly', 'Quarterly']

    if (@table)
      @params = angular.copy(@table)
      @edit_mode = true
    else
      @params =
        entity_id: @entity_id
        entity_type: @entity_type
        type: @types[0].value
        period: @periods[0]
        profile_type: 'Gross'
        is_active: 1

  resetFormErrors: ->
    return unless @table_form?

    @table_form.$setPristine()
    @table_form.$setUntouched()

  manageTable: (table) ->
    if @edit_mode
      @BaseDataService.updateTable(@params).then ((response) =>
        if table?
          @$uibModalInstance.close([response, table])
        else
          @$uibModalInstance.close(response)
        ), ((error) =>
          @saving_table = false
        )
    else
      @BaseDataService.createTable(@params).then ((response) =>
        if table?
          @$uibModalInstance.close([response, table])
        else
          @$uibModalInstance.close(response)
        ), ((error) =>
          @saving_table = false
        )

  submit: ->
    if @table_form.$valid
      @saving_table = true
      @manageTable()
