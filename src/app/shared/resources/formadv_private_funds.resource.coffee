angular.module('diligenceVault').factory 'FormADVPrivateFundsResource', (GridResourceService, GridsDataService) ->
  new class FormADVPrivateFundsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.enableFiltering()
      resource.enableAlphabetFiltering()

      resource.name 'formadv_funds'

      resource.addTransformer (collection) ->
        _(collection).each (response) ->
          assets = response.assets
          assets = parseInt(assets)/1000000
          assets = Math.round(assets * 100) / 100
          min_amt = response.min_amt

          return unless assets?

          response.assets = assets.toLocaleString('en', {minimumFractionDigits:0})

          return unless min_amt?

          response.min_amt = min_amt.toLocaleString('en', {minimumFractionDigits:0})

      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.column('name').disableColumnMenu().disableGrouping().title('Private Fund Name').setWidth(grid_widths_map['lg_column_lg']).setTemplate('form-adv-private-funds-name').align('left').setDefaultSort('desc').filterable(true, {
        placeholder: 'Search fund'
      })
      resource.column('assets').format('numberStr').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_lg']).title('Gross Assets ($mm)')
      resource.column('type').showAggregationOptions(false).enableHiding(false).align('left').setWidth(grid_widths_map['sm_column_sm']).title('Type').setTemplate('form-adv-private-funds-type').filterable(true, {
        placeholder: 'Search type'
      })
      resource.column('id').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_lg']).title('ID')

      resource
