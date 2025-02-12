class DiligenceTemplatesController extends BaseController

  @register 'DiligenceTemplatesController'

  @inject 'TemplatesResource', 'ModalFactory', '$state', 'Utils','angularEnabled'

  initialize: ->
    @templates = @TemplatesResource.$new()
    @is_investor = @Utils.isInvestor()

  createNewTemplate: ->
     @ModalFactory.invokeModal 'manage_template'

  getActiveStatus: (row, grid) =>
    for i in [0...row.treeNode.aggregations.length]
      agg = row.treeNode.aggregations[i]
      if agg.groupVal
        return "Draft("+agg.value+")"
      else
        return "Active("+agg.value+")"

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol"
      @$state.go("app.diligence.template.preview",{templateId: row.entity.templateInfo.id})

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  getTemplateType: (grid,row,col)=>
    cellValue = grid.getCellValue(row, col)
    return "" if not cellValue
    # Some times because of bad data api may return numeric values
    # So we check if its a string or not before checking index
    if typeof cellValue == 'string'
      if cellValue.indexOf('dd_new') > -1
        return "Standard"
      else if cellValue.indexOf('dd_profile') > -1
        if @is_investor
          return "Profile"
        else
          return "Pre-approved"
      else
        return "Document"
    else
      return "Document"
