angular.module('diligenceVault').factory 'FormADVFirmResource', (GridResourceService, GridsDataService, uiGridConstants) ->
  new class FormADVFirmResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'formadv_firms'

      resource.addTransformer (collection) ->
        _(collection).each (response) ->
          aum = response.aum

          return unless aum?

          response.aum = aum.toLocaleString('en', {minimumFractionDigits:2})

      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('filingDate').title('Filing Date').format('date').setWidth(grid_widths_map['sm_column_sm']).setDefaultSort('desc')
      resource.column('firmCRD').title('Firm CRD').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search CRD'
      })
      resource.column('businessName').setWidth(grid_widths_map['lg_column_xxm']).title('Firm Name').align('left').setTemplate('form-adv-firm-name').filterable(true, {
        placeholder: 'Search firm'
      })
      resource.column('aum').title('Regulatory AUM ($mm)').setWidth(grid_widths_map['sm_column_sm'])
      resource.column('changeCount').setTemplate('form-adv-change-count').setWidth(grid_widths_map['sm_column_sm']).title('# of changes')
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
