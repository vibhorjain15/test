angular.module('diligenceVault').factory 'AdvSearchManager', (GridResourceService, GridsDataService,uiGridConstants, Utils) ->
  new class AdvSearchManager

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      entity_type = if options and options.type then options.type else null
      if entity_type
        delete options.type
      resource = GridResourceService.$new(options)
      resource.name 'service/es_service/search'

      resource.disableGridExport()
      resource.enableFiltering()
      resource.usePostMethod()
      resource.setServerFilterable(false)
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      if entity_type == 'fund'
        resource.addTransformer (collection) ->
          _(collection).each (response) ->
            pf_aum = response.pf_aum
            pf_aum = parseInt(pf_aum)/1000000
            pf_aum = Math.round(pf_aum * 100) / 100

            return unless pf_aum?

            response.pf_aum = pf_aum.toLocaleString('en', {minimumFractionDigits:0})

        resource.setRowTemplate('adv-search-fund-row')
        resource.column('pf_name').align('left').showAggregationOptions(false).setTemplate('search-fund-name').enableHiding(false).title('Fund Name').setWidth(grid_widths_map['sm_column_lg']).filterable(true, {
          placeholder: 'Search Funds'
        })
        resource.column('firmname').align('left').showAggregationOptions(false).enableHiding(false).title('Firm Name').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
          placeholder: 'Search Firms'
        })
        resource.column('pf_type').disableColumnMenu().disableGrouping().title('Fund Type').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
          placeholder: 'Search Fund type'
        })
        resource.column('gp_name').disableColumnMenu().disableGrouping().title('GP Name').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
          placeholder: 'Search'
        })
        resource.column('pf_state_country').disableColumnMenu().disableGrouping().title('State/Country').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
          placeholder: 'Search'
        })
        resource.column('pf_aum').format('numberStr').disableColumnMenu().disableGrouping().title('AUM(mn)').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
          placeholder: 'Search AUM'
        })
      else if entity_type == 'firm'
        resource.addTransformer (collection) ->
          _(collection).each (response) ->
            info_discretionary_raum = response.info_discretionary_raum
            info_discretionary_raum = parseInt(info_discretionary_raum)/1000000
            info_discretionary_raum = Math.round(info_discretionary_raum * 100) / 100

            return unless info_discretionary_raum?

            response.info_discretionary_raum = info_discretionary_raum.toLocaleString('en', {minimumFractionDigits:0})

        resource.setRowTemplate('adv-search-firm-row')
        resource.column('info_legalname').align('left').showAggregationOptions(false).enableHiding(false).setTemplate('search-firm-name').title('Firm Name').setWidth(grid_widths_map['sm_column_lg']).filterable(true, {
          placeholder: 'Search firms'
        })

        resource.column('firmcrd').showAggregationOptions(false).enableHiding(false).title('Firm CRD').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
          placeholder: 'Search CRD'
        })

        resource.column('firmtype').showAggregationOptions(false).enableHiding(false).title('Firm Type').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
          placeholder: 'Search Type'
        })
        resource.column('filingdate').showAggregationOptions(false).enableHiding(false).format('date').title('Filing Date').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
          placeholder: 'Search Date'
        })
        resource.column('foo_country').showAggregationOptions(false).enableHiding(false).title('Country').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
          placeholder: 'Search country'
        })
        resource.column('info_discretionary_raum').format('numberStr').disableColumnMenu().disableGrouping().title('RAUM(mn)').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
          placeholder: 'Search RAUM'
        })
      else if entity_type == 'service_provider'
        resource.column('service_pro_name').align('left').showAggregationOptions(false).enableHiding(false).title('SP Name').setWidth(grid_widths_map['sm_column_lg']).filterable(true, {
          placeholder: 'Search Name'
        })

        resource.column('service_pro_type').showAggregationOptions(false).enableHiding(false).title('SP Type').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
          placeholder: 'Search Type'
        })

        resource.column('service_pro_location').showAggregationOptions(false).enableHiding(false).title('Location').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
          placeholder: 'Search Location'
        })
      resource
