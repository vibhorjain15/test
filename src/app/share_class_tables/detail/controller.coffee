class ShareClassTablesDetailController extends BaseController
  @register 'ShareClassTablesDetailController'

  @inject 'BaseDataService', '$stateParams', '$q', '$scope'

  initialize: ->
    id = @$stateParams.shareClassTableId

    @BaseDataService.getShareClassTable(id).then (share_class_table) =>
      @share_class =
          id: share_class_table.entity_id
          name: share_class_table.entity_name
          share_class_table : share_class_table
      @share_class_table = share_class_table
