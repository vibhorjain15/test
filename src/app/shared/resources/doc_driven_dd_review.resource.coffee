angular.module('diligenceVault').factory 'DocDrivenResource', (GridResourceService, uiGridConstants, GridsDataService) ->
  new class DocDrivenResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'dd_document_lineitems'

      resource.enableFiltering()
      resource.setServerPaginated(true)
      resource.setServerFilterable(true)
      resource.enableRowSelection({full_row_selection: false})
      resource.enableRowHeaderSelection(false)

      resource.colDefaults align: 'center'

      resource
      .column('is_section')
      .setWidth(grid_widths_map['sm_column_xxm'])
      .disableSorting()
      .setTemplate('doc-dd-section-selector')
      .title('A Section?')
      .filterable(true, {
          type: uiGridConstants.filter.SELECT
          selectOptions: [
            {value: true, label: 'Yes'}
            {value: false, label: 'No'}
          ]
        })
      resource
      .column('is_question')
      .setWidth(grid_widths_map['sm_column_xxm'])
      .disableSorting()
      .setTemplate('doc-dd-question-selector')
      .title('A Question?')
      .filterable(true, {
          type: uiGridConstants.filter.SELECT
          selectOptions: [
            {value: true, label: 'Yes'}
            {value: false, label: 'No'}
          ]
        })
      resource
        .column('extracted_text')
        .setDefaultSort('asc')
        .title('Category Text')
        .align('left')

      resource
