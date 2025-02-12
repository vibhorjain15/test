angular.module('diligenceVault').factory 'FirmCRDMappingResource', (GridResourceService, BaseDataService, uiGridConstants, GridsDataService) ->
  new class FirmCRDMappingResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'Firm_FirmCRD_Mappings'

      resource.enableFiltering()


      resource.colDefaults align: 'center'
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.column('businessName').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['lg_column_lg']).setDefaultSort('asc').title('Firm Name').align('left').setTemplate('form-adv-firm-name').filterable(true, {
        placeholder: 'Search firm'
      })
      resource.column('firmCRD').disableColumnMenu().disableGrouping().title('Firm CRD').format('number').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search CRD'
      })
      resource.column('headquarter').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).title('Headquarter').setTemplate('empty-cell')
      resource.column('is_tracking').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_lg']).disableSorting().setTemplate('form-adv-actions')
      .title('Is Tracked?')
      .filterable(true, {
          type: uiGridConstants.filter.SELECT
          selectOptions: [
            {value: true, label: 'Yes'}
            {value: false, label: 'No'}
          ]
        })
      resource.column('material_changes').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_lg']).title('Has Material Changes').setTemplate('empty-cell')
      .filterable(true, {
          type: uiGridConstants.filter.SELECT
          selectOptions: [
            {value: 'Yes', label: 'Yes'}
            {value: 'No', label: 'No'}
            {value: 'NA', label: 'NA'}
          ]
        })
      resource.column('brochure_url').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_lg']).title('Part 2A Brochure').setTemplate('form-adv-brochure-url')

      resource
