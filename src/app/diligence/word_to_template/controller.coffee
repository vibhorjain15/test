class DiligenceWordTemplatesController extends BaseController

  @register 'DiligenceWordTemplatesController'

  @inject 'ModalFactory', '$state', 'Utils', '$http', '$timeout', 'TemplatesDataService', '$window', 'SweetAlert' , '$compile' , '$scope', 'toaster', '$stateParams', 'baseUrl' , 'angularParserEnabled'

  initialize: (newfile)->
    # @templates = @TemplatesResource.$new()
    @wordFileHtml = null
    @word_div = "elementWP"
    @wp = new WordParserV1(@word_div)

    @td_tags = []
    @tr_tags = []
    $compile = @$compile
    @loading = false
    @unmarkedTables = []
    @titleWarningShown = false
    @unmarkedTextIds = []
    @unmarkedTableIds = []
    @wordFileHtml = null
    @fixedTableWidth = 1250
    @answer_columns = {}
    @answerColumnWarningShown = false
    @countsObject = {
      Section: {count: 0, data: []}
      SubSection: {count: 0, data: []}
      Question: {count: 0, data: []}
      Answer: {count: 0, data: []}
    }
    @$window.localStorage.setItem('all_counts', JSON.stringify(@countsObject))
    @childElements = ["IMG", "SPAN", "A", "SMALL", "PRE", "STRONG", "SUB", "INPUT", "SELECT"]
    @parent_tags_list = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    @stylesContainer = {}
    @wordDataObj = {}
    @styleParams = {}
    @selectionSteps = [
      {name: "Section", alias: "Category", is_active: false, count: 0, is_visible: true},
      {name: "SubSection", alias: "SubCategory", is_active: false, count: 0, is_visible: true},
      {name: "Question", alias: "Question", is_active: false, count: 0, is_visible: true},
      {name: "Answer", alias: "Answer", is_active: false, count: 0, is_visible: true}
    ]

    @active_step = ""
    @document_id = @$stateParams.doc_id
    @wordDataObj = @TemplatesDataService.getWordParcerData()
    @templateParams = @TemplatesDataService.getTemplateParams()
    @originalWordFile = @TemplatesDataService.getOriginalWordFile()
    @parser_source = @$stateParams.type

    if @originalWordFile.length
      file = @originalWordFile[0]
      @fileName = @originalWordFile[0].name
    if @wordDataObj.html_content
      @wordFileHtml = @wordDataObj.html_content
      @$timeout =>
        @setStyleParams()
        # @removeAllHref()
        @setSelectionActions()
        jQuery(window).scroll =>
          @getTableWidth()
          scroll = jQuery(window).scrollTop()
          if scroll >= 350
            jQuery('#fixedTable').fadeIn()
          else
            jQuery('#fixedTable').fadeOut()

    else
      @$window.history.back()


    @templateUrl = 'shared/report-list-templates/popover-template.html'
    @isPopoverOpen = false


  getTableWidth: =>
    @fixedTableWidth = 1260
    panelWidth = $("#elementWP").width()
    if panelWidth >  @fixedTableWidth
      @fixedTableWidth = panelWidth
    @fixedTableWidth

  setSelectionActions: =>
    pageX = null
    pageY = null
    if !window.x
      x = {}
    x.Selector = {}

    x.Selector.getSelected = ->
      t = ''
      if window.getSelection
        t = window.getSelection()
      else if document.getSelection
        t = document.getSelection()
      else if document.selection
        t = document.selection.createRange().text
      t
    $(document).bind 'mouseup', =>
      selectedText = x.Selector.getSelected()
      if selectedText != ''
        $('ul.tools').css(
          'left': pageX + 5
          'top': pageY - 55).fadeIn 200
      else
        $('ul.tools').fadeOut 200

    $(document).on 'mousedown', (e) =>
      pageX = e.pageX
      pageY = e.pageY

  get_table_without_answer_col: =>
    unmarkedAnswerTables = @wp.checkAnswerCellMapping()
    found = false
    if unmarkedAnswerTables.length > 0
      @scrollToSpecificItem(unmarkedAnswerTables[0])
      found = true
    found

  isQaFlowAndAnswersNotMarked: =>
    unmarkedAnswerTables = document.getElementById(@word_div).querySelectorAll('[elem_type="QAAnswer"]')
    unmarkedAnswerTablesNormal = document.getElementById(@word_div).querySelectorAll('[elem_type="Answer"]')
    # unmarkedAnswerTables = @wp.checkAnswerCellMapping()
    found = false
    if (unmarkedAnswerTables.length == 0 and unmarkedAnswerTablesNormal.length == 0) and @isQaFlow()
      found = true
    found

  selectText: (node) =>
    node = document.getElementById(node)
    if document.body.createTextRange
      range = document.body.createTextRange()
      range.moveToElementText node
      range.select()
    else if window.getSelection
      selection = window.getSelection()
      range = document.createRange()
      range.selectNodeContents node
      selection.removeAllRanges()
      selection.addRange range
    else
      console.warn 'Could not select text in node: Unsupported browser.'

  get_unmarked_table: =>
    total_unmarked_tables = 0
    @unmarkedTableIds = []
    @unmarkedTables = document.getElementById(@word_div).querySelectorAll('table:not([elem_type])')
    for table, index in @unmarkedTables
      if !@wp.tableHasMergedCells(table)
        tableId = "table_"  + (index + 1)
        $(table).attr("id", tableId)
        @unmarkedTableIds.push tableId
    total_unmarked_tables = @unmarkedTableIds.length
    total_unmarked_tables


  get_row_column_headers: (table, type) =>
    ###
        Three types of tables for which we can create a Grid Type Question which is supported by our platform
            1- Only the 1st row has headings
            2- Only the 1st column has headings
            3- Both 1st row and 1st column has headings
    ###
    table_rows = table.rows
    first_row = table_rows[0].cells
    row_headings = []
    column_headings = []
    no_of_heading_in_row = 0
    no_of_heading_in_column = 0
    for cell in first_row
      if !cell.innerText
        cell.innerText = ""
      cell_text = $.trim(cell.innerText)
      column_headings.push cell_text
      if cell_text
        no_of_heading_in_column++
    for row in table_rows
      cell = row.cells[0]
      if !cell.innerText
        cell.innerText = ""
      cell_text = $.trim(cell.innerText)
      row_headings.push cell_text
      if cell_text
        no_of_heading_in_row++
    if type == 'Static'
      if no_of_heading_in_row > 1 and no_of_heading_in_column > 1
        # Type 3 table
        row_headings.shift()
        column_headings.shift()
        start_row = 1
        start_col = 1
      else if no_of_heading_in_column <= 1
        # Type 2 table
        column_headings = Array(column_headings.length - 1)
        i = 0
        while i < column_headings.length
          column_headings[i] = 'Column' + i + 1
          i++
        start_row = 0
        start_col = 1
      else if no_of_heading_in_row <= 1
        # Type 1 table
        row_headings = Array(row_headings.length - 1)
        i = 0
        while i < row_headings.length
          row_headings[i] = 'Row' + i + 1
          i++
        start_row = 1
        start_col = 0
    else if type == "Dynamic"
      start_row = 1
      start_col = 0
    {
      'row_headers': row_headings
      'column_headers': column_headings
      'start_row': start_row
      'start_col': start_col
    }

  tableHasMergedCells: (table) =>
    found = false
    mergedCells = false
    @tr_tags = table.getElementsByTagName("tr")
    for tr_tag in @tr_tags
      # Getting the list of cells in that row
      cells = tr_tag.getElementsByTagName('td')
      for cell in cells
        if (cell.colSpan and cell.colSpan > 1) || (cell.rowSpan and cell.rowSpan > 1)
          found = true
          break
    if found
      mergedCells = true
    mergedCells

  get_parent: (element, parent) =>
    while element and element.tagName != parent
      element = element.parentElement
    element

  # removeAllHref: =>
  #   anchor_with_href = document.getElementById(@word_div).querySelectorAll('[href]')
  #   for anchorTag in anchor_with_href
  #     $(anchorTag).removeAttr("href");

  exportData: (doc_id, template_name) =>
    marked_items = document.getElementById(@word_div).querySelectorAll('[elem_type]')
    GridTitle = null
    final_json =
      'Document_id': doc_id
      'name': template_name
      'sections': []
    section_obj =
      'text': if @fileName then @fileName else "Category"
      'subSections': []
    sub_section_obj =
      'text': if @fileName then @fileName else "SubCategory"
      'questions': []
    for item in marked_items
      text = item.getAttribute('elem_text')
      if item.tagName == "IMG"
        text = item.alt
      if !text
        i++
        continue
      type = item.getAttribute('elem_type')
      if type == 'Section'
        if sub_section_obj['questions'].length > 0
          sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj))
          section_obj['subSections'].push sub_section_obj_copy
        if section_obj['subSections'].length > 0
          section_obj_copy = JSON.parse(JSON.stringify(section_obj))
          final_json['sections'].push section_obj_copy
        section_obj['text'] = text
        section_obj['subSections'] = []
        sub_section_obj['text'] = text
        sub_section_obj['questions'] = []
      else if type == 'SubSection'
        if sub_section_obj['questions'].length > 0
          sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj))
          section_obj['subSections'].push sub_section_obj_copy
        sub_section_obj['text'] = text
        sub_section_obj['questions'] = []
      # else if type == 'Question'
      #   question_obj =
      #     'text': text
      #     'responseType': 'TextMultiLine'
      #     'is_selected': true
      #   sub_section_obj['questions'].push question_obj
      else if type == 'Question'
        question_obj =
          'text': text
          'responseType': 'TextMultiLine'
          'responseTypeDesc': 'Text Explanation - Paragraph'
          'is_selected': true
          'response_coordinates': null
          'comment_coordinates': null
        if item.tagName == 'TD'
          table_row = @get_parent(item, 'TR')
          table = @get_parent(table_row, 'TABLE')
          row_no = table_row.rowIndex
          table_no = table.getAttribute('table_no')
          question_cell_ind = item.cellIndex
          row_cells = table_row.cells
          i = question_cell_ind + 1
          while i < row_cells.length
            cell_type = row_cells[i].getAttribute('elem_type')
            if cell_type == 'Answer'
              if question_obj['response_coordinates'] == null
                question_obj['response_coordinates'] = "0,#{table_no},#{row_no},#{row_cells[i].cellIndex}"
            else if cell_type == 'Comment'
              if question_obj['comment_coordinates'] == null
                question_obj['comment_coordinates'] = "0,#{table_no},#{row_no},#{row_cells[i].cellIndex}"
            i++
        sub_section_obj['questions'].push question_obj
      else if type == 'GridTitle'
        GridTitle = text
      else if (type == 'Static' or type == 'Dynamic') and item.tagName == 'TABLE'
        question_text = 'Grid Question'
        # Assigning the question text from the text which was marked as question before this table.
        # if sub_section_obj['questions'].length > 0
        #   q_obj = sub_section_obj['questions'].pop()
        #   question_text = q_obj['text']
        if GridTitle
          question_text = GridTitle
          GridTitle = null
        merged_column_cell = item.querySelector('[colspan]')
        merged_row_cell = item.querySelector('[rowspan]')
        grid_flag = true
        if merged_row_cell or merged_column_cell
          grid_flag = false
        if grid_flag
          headings = @get_row_column_headers(item, type)
          row_headings = headings['row_headers']
          column_headings = headings['column_headers']
          start_row = headings['start_row']
          start_col = headings['start_col']
          table_no = item.getAttribute('table_no')
          response_type = if type == "Static" then "Grid" else "DynamicGrid"
          selected_table = $(item).clone().removeAttr("elem_type")
          question_obj =
            'text': question_text
            'is_selected': true
            'html': selected_table[0].outerHTML
            'responseType': response_type
            'responseTypeDesc': response_type
            'response_coordinates': "1,#{table_no},#{start_row},#{start_col}"
            'grid':
              'dataType': 'Integer'
              'dynamic_element': null
              'rows_columns': []
          # ref = row_headings.entries()
          # rh = i = 0
          # len = ref.length
          # while i < len
          if type == "Static"
            for rh, ind in row_headings
              row_object =
                'name': rh
                'elementType': 'Row'
                'order': ind + 1
              question_obj['grid']['rows_columns'].push row_object
          if type == "Dynamic"
            question_obj['grid']['dynamic_element'] = "Row"
          # ref = column_headings.entries()
          # ch = i = 0
          # len = ref.length
          # while i < len
          for ch, ind in column_headings
            column_object =
              'name': ch
              'elementType': 'Column'
              'order': ind + 1
              'type': 'text'
              'type_options': 'type': 'text'
            question_obj['grid']['rows_columns'].push column_object
          sub_section_obj['questions'].push question_obj
        else
          console.log 'Irregular Grid, copy html and paste it as Grid'
    if sub_section_obj['questions'].length > 0
      section_obj['subSections'].push sub_section_obj
    if section_obj['subSections'].length > 0
      final_json['sections'].push section_obj
    final_json

  getStyle: (tag) =>
    style = getComputedStyle(tag)
    key = style['color'] + style['fontFamily'] + style['fontSize'] + style['backgroundColor'] + style['fontWeight']
    # key = style['color'] + style['fontFamily'] + style['backgroundColor']
    # key  = window.getComputedStyle(tag, null).getPropertyValue("color") + window.getComputedStyle(tag, null).getPropertyValue("font-family") + window.getComputedStyle(tag, null).getPropertyValue("background-color");
    key


  setStyleParams: =>
    @initContextMenu()
    # @wp.word_div = document.getElementById(@word_div);
    @wp.setStyleAttribute()



  check_element: (element) ->
    parents = []
    children = []
    pelem = element.parentElement
    while pelem
      parents.push pelem.tagName
      pelem = pelem.parentElement
    if parents.includes('TABLE')
      return false
    true

  makeItSticky: =>
    if $(document).height() > $(window).height()
      $('.sticky_savebar').affix({offset: {bottom: 50} })

  markGridTitle: =>
    target = $('.context-menu-active')[0]
    if @isElementInsideTable(target)
      @wp.markOrUnmarkTableTags(target, ParserSelectionType.SELECT, ParserElementType.GRID_TITLE)
    else
      @wp.markOrUnmarkTextTags(target, ParserSelectionType.SELECT, ParserElementType.GRID_TITLE)
    # element = @evaluateTarget(target)
    # if element
    #   selectedElement = element
    #   text = selectedElement.innerText.trim()
    #   if text
    #     selectedElement.setAttribute 'elem_type', 'GridTitle'
    @$timeout =>
      @updateCounts()

  # Need to use appropriate answer_column value and comment column value for each sheet in for loop.
  initContextMenu: =>
    # $.contextMenu('html5');
    $.contextMenu({
        selector: '#elementWP td[empty_td="true"], #elementWP span[elem_text]',
        # items: $.contextMenu.fromMenu($('#html5polyfill')),
        callback: (key, option) =>
          splitedArray = option.split(/\s*\-\s*/g)
          type_of_text = splitedArray[0]
          if option.indexOf('this') > -1
            if type_of_text == 'Unmark'
              @unMarkItems(ParserSelectionType.DESELECT)
            else
              @cellSpecificOptionClick(type_of_text)
          else if option.indexOf('all') > -1
            if type_of_text == 'Unmark'
              @unMarkItems(ParserSelectionType.DESELECT_SIMILAR)
            else
              @optionClick(type_of_text)
          else if option.indexOf('static') > -1
              @markAsGridType(ParserElementType.GRID)
          else if option.indexOf('dynamic') > -1
              @markAsGridType(ParserElementType.DYNAMIC_GRID)
          else if option.indexOf('title') > -1
            if type_of_text == 'Unmark'
              @unMarkItems(ParserSelectionType.DESELECT)
            else
              @markGridTitle('title')
          else if option.indexOf('UnmarkGrid') > -1
            @unMarkGrid()
          else if option.indexOf('UpdateSelection') > -1
            if option.indexOf('add') > -1
              @updateSelection(ParserSelectionType.SELECT)
            else
              @updateSelection(ParserSelectionType.DESELECT)
          else if option.indexOf('UnmarkAnswerText') > -1
            @unmarkOrUnmarkAnswerText(ParserSelectionType.DESELECT)
          else if option.indexOf('MarkAnswerText') > -1
            @unmarkOrUnmarkAnswerText(ParserSelectionType.SELECT)
        items:
          'Validation':
            'name': 'Please select a valid text',
            disabled: => true
            visible: (key, opt) =>
              optionVisible = false
              if !@isUnmarkOptionVisible(key.currentTarget) and !@isUnmarkGridOptionVisible(key.currentTarget) and @isEmptyArea(key.currentTarget) and !@isAnswerOptionVisible(key.currentTarget) and !@isElementInsideTable(key.currentTarget)
                optionVisible = true
              optionVisible
          'Section':
            'name': 'Mark as Category'
            'items':
              'Section-this': 'name': 'This element'
              'Section-all': 'name': 'All similar elements'
            visible: (key, opt) =>
              optionVisible = true
              if  @isUnmarkGridOptionVisible(key.currentTarget) or @isEmptyArea(key.currentTarget)
                optionVisible = false
              optionVisible
          'SubSection':
            'name': 'Mark as SubCategory'
            'items':
              'SubSection-this': 'name': 'This element'
              'SubSection-all': 'name': 'All similar elements'
            visible: (key, opt) =>
              optionVisible = true
              if @isUnmarkGridOptionVisible(key.currentTarget) or @isEmptyArea(key.currentTarget)
                optionVisible = false
              optionVisible
          'Question':
            'name': 'Mark as Question'
            'items':
              'Question-this': 'name': 'This element'
              'Question-all': 'name': 'All similar elements'
              # 'Question-static': 'name': 'Static Grid'
              # 'Question-dynamic': 'name': 'Customizable Grid'
              # 'Question-title': 'name': 'Grid Title'
            visible: (key, opt) =>
              optionVisible = true
              if @isUnmarkGridOptionVisible(key.currentTarget) or @isEmptyArea(key.currentTarget)
                optionVisible = false
              optionVisible
          'static':
            'name': 'Mark as Static Grid'
            visible: (key, opt) =>
              optionVisible = false
              if @isElementInsideTable(key.currentTarget) and !@isQaFlow()
                optionVisible = true
              optionVisible
          'dynamic':
            'name': 'Mark as Customizable Grid'
            visible: (key, opt) =>
              optionVisible = false
              if @isElementInsideTable(key.currentTarget) and !@isQaFlow()
                optionVisible = true
              optionVisible
          'title':
            'name': 'Mark as Grid Header'
            visible: (key, opt) =>
              optionVisible = true
              if @isUnmarkGridOptionVisible(key.currentTarget) or @isEmptyArea(key.currentTarget) or @isQaFlow()
                optionVisible = false
              optionVisible
          'Answer':
            'name': 'Mark as Answer'
            'items':
              'Answer-this': 'name': 'This element'
              'Answer-all': 'name': 'All similar elements'
            visible: (key, opt) =>
              optionVisible = false
              if @isAnswerOptionVisible(key.currentTarget)
                optionVisible = true
              optionVisible
          'Unmark':
            'name': 'Unmark'
            'items':
              'Unmark-this': 'name': 'This element'
              'Unmark-all': 'name': 'All similar elements'
            visible: (key, opt) =>
              optionVisible = false
              if @isUnmarkOptionVisible(key.currentTarget) and !@isUnmarkGridOptionVisible(key.currentTarget) and !@isTextSelected(key.currentTarget)
                optionVisible = true
              optionVisible
          'UnmarkGrid':
            'name': 'Unmark Grid'
            visible: (key, opt) =>
              optionVisible = false
              if @isUnmarkGridOptionVisible(key.currentTarget) and @isElementInsideTable(key.currentTarget) and !@isQaFlow()
                optionVisible = true
              optionVisible
          'UpdateSelection':
            'name': 'Selected text actions'
            'items':
              'UpdateSelection-add': 'name': 'Mark as Answer'
              'UpdateSelection-remove': 'name': 'Remove from Answers'
            visible: (key, opt) =>
              optionVisible = false
              if @isTextSelected(key.currentTarget) and !@isElementInsideTable(key.currentTarget) and @isQaFlow() and  @isInsideQA(key.currentTarget)
                optionVisible = true
              optionVisible
          'UnmarkAnswerText':
            'name': 'Unmark Answer'
            visible: (key, opt) =>
              optionVisible = false
              if !@isTextSelected(key.currentTarget) and @isInsideQA(key.currentTarget) and @isQaFlow()
                optionVisible = true
              optionVisible
          'MarkAnswerText':
            'name': 'Mark as Answer'
            visible: (key, opt) =>
              optionVisible = false
              if !@isTextSelected(key.currentTarget) and @isInsideQA(key.currentTarget) and !@isElementInsideTable(key.currentTarget) and !@isQAElement(key.currentTarget)
                optionVisible = true
              optionVisible
    });

  tableContainsProperTdElements: (table) =>
    valid = false
    tr_tags = table.getElementsByTagName("tr")
    if tr_tags and tr_tags.length
      for tr_tag in tr_tags
        cells = tr_tag.getElementsByTagName('td')
        if cells.length >= 2
          valid = true
          break
    valid

  isInsideQA: (element) =>
    insideQA = false
    if $(element).closest('[elem_type="QAContainer"]').length
      insideQA = true
    insideQA

  isQAElement: (element) =>
    isQAEl = false
    if $(element).closest('[elem_type="QAAnswer"]').length
      isQAEl = true
    isQAEl

  isQaFlow: =>
    isQa = false
    if @parser_source and @parser_source == "QA"
      isQa = true
    isQa

  getNumFromText: (txt) =>
    num = txt.match(/\d/g);
    num = num.join("");
    num

  getSelectionParentElement: =>
    elementsArr = []
    parentEl = null
    sel = undefined
    if window.getSelection
      sel = window.getSelection()
      if sel.rangeCount
        focus_node = sel.focusNode.parentElement
        focus_node.domID = @getNumFromText(focus_node.id)
        anchor_node = sel.anchorNode.parentElement
        anchor_node.domID = @getNumFromText(anchor_node.id)
        if focus_node.domID < anchor_node.domID
          start_node = sel.focusNode.parentElement
          end_node = sel.anchorNode.parentElement
        else
          start_node = sel.anchorNode.parentElement
          end_node = sel.focusNode.parentElement
        elementsArr.push start_node
        elementsArr.push end_node
    else if (sel = document.selection) and sel.type != 'Control'
      range = sel.createRange()
      start_node = range.anchorNode()
      elementsArr.push start_node
      end_node = range.focusNode()
      elementsArr.push end_node
    elementsArr

  getSelectionText: =>
    text = ''
    if window.getSelection
      text = window.getSelection().toString()
    else if document.selection and document.selection.type != 'Control'
      text = document.selection.createRange().text
    text

  isTextSelected: (yourDiv) =>
    sel = window.getSelection()
    if sel.rangeCount < 1
      return false
    range = sel.getRangeAt(0)
    if range.collapsed
      return false
    cont = range.commonAncestorContainer
    $(cont) == $(yourDiv) or $(cont).parents(yourDiv).length > 0

  unmarkOrUnmarkAnswerText: (action) =>
    element = $('.context-menu-active')[0]
    @wp.markOrUnmarkQAAnswer(element, action)
    @$timeout =>
      @updateCounts()

  updateSelection: (action) =>
    tags  = @getSelectionParentElement()
    @wp.editQAAnswerMarking(tags[0], tags[1], action)
    @$timeout =>
      @updateCounts()


  isUnmarkGridOptionVisible: (element) =>
    is_visible = false
    if $(element).closest("table").length
      selected_elm = $(element).closest("table")[0]
      elem_type = selected_elm.getAttribute("elem_type")
      if elem_type and elem_type != ParserElementType.CUSTOM_TABLE
        is_visible = true
    else
      selected_elm = element
      elem_type = selected_elm.getAttribute("elem_type")
      if elem_type and elem_type != ParserElementType.CUSTOM_TABLE and selected_elm.tagName == "TABLE"
        is_visible = true
    is_visible


  getUnmarked: (params) =>
    elements = document.body.getElementsByTagName('*')
    i = 0
    while i < elements.length
      current = elements[i]
      if current.children.length == 0 and current.textContent.replace(RegExp(' |\\n', 'g'), '') != ''
        # Check the element has no children && that it is not empty
        array.push current.textContent

  isEmptyArea: (element) =>
    is_empty_area = true
    selected_elm = element
    if selected_elm.innerText and selected_elm.innerText.length
      is_empty_area = false
    is_empty_area


  isUnmarkOptionVisible: (target) =>
    is_visible = false
    element = @evaluateTarget(target)
    if $(element).attr("elem_type")
      is_visible = true
    else if $(element).closest("td").length
      td_elm = $(element).closest("td")[0]
      if $(td_elm).attr("elem_type")
        is_visible = true
    is_visible

  isAnswerOptionVisible: (element) =>
    is_visible = false
    selected_elm = element

    if (selected_elm.attributes.has_td or selected_elm.tagName == "TD") and @tableHasQuestionColumn(element, 'el') and !@isUnmarkOptionVisible(element)
      is_visible = true
    is_visible

  colmnIndexMatchedQuestionColumn: (element) =>
    columnIndexMatch = false
    table = $(element).closest('table')[0]
    if $(element).is("td")
      selected_tag = element
    else
      selected_tag = $(element).closest("td")[0]
    selectedColIndex = selected_tag.cellIndex
    if table
      table_rows = table.getElementsByTagName("tr")
      for table_row in table_rows
        table_cols = table_row.getElementsByTagName('td')
        for table_col in table_cols
          type = $(table_col).attr("elem_type")
          if type and type == "Question" and table_col.cellIndex == selectedColIndex
            columnIndexMatch = true
            break
    columnIndexMatch

  isTitleOptionVisible: (element) =>
    selected_elm = element
    is_visible = false
    if selected_elm.innerText and selected_elm.innerText.length > 2
      is_visible = true
    is_visible

  isElementMarked: (element) =>
    if element
      marked = false
      type = $(element).closest('[elem_type]')
      if type and type.length
        marked = true
      marked


  autoMarkAnswers: =>
    if !@countsObject.Section.count
        @SweetAlert.error({'title':'Please mark Category'})
        return
    if !@countsObject.Question.count
        @SweetAlert.error({'title':'Please mark Questions'})
        return
    @loading = true
    @wp.autoMarkAnswers().then (response) =>
      @updateCounts()
      @$scope.$apply =>
        @loading = false

  resetFile: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to reset this file?"
      text: 'This will clear all marked items in current file'
      confirmButtonText: 'Proceed'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        @wp.resetFile(null, true)
        @$timeout =>
          @updateCounts()

      else if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
        swal.close()


  markAsGridType: (type) =>
    target = $('.context-menu-active')[0]
    # element = @evaluateTarget(target)
    table = $(target).closest('table')[0]
    if table.hasAttribute('merge_cells_present') and type == 'Dynamic'
      @SweetAlert.error({'title':'This table has merged cells. Please unmerge those to continue'})
      return

    if type == ParserElementType.GRID
      if !(table.hasAttribute('multiple_rows') and table.hasAttribute('multiple_cols'))
        @SweetAlert.error({'title': 'A table must have more than 1 row and 1 column to mark it as Static Grid'})
        return

    @wp.markOrUnmarkGrids(target, ParserSelectionType.SELECT, type)
    # $(table).attr 'elem_type', type
    className = $(table).attr("id")
    $("."+className).remove()
    # $(table).removeAttr "id"
    table_type = if type  == "Dynamic" then "Customizable" else "Static"
    if !@titleWarningShown
      @SweetAlert.success({'title':"You marked a #{table_type} table, mark the text above the table as 'Grid header' to import as a single question."})
      @titleWarningShown = true
    
    @$timeout =>
      @updateCounts()

  unMarkGrid: =>
    element = $('.context-menu-active')[0]
    @wp.markOrUnmarkGrids(element, ParserSelectionType.DESELECT, null)
    # if ($(element).is("td") || @isElementInsideTd(element))
    #   table = $(element).closest('table')
    #   $(table).removeAttr 'elem_type'
    @$timeout =>
      @updateCounts()

  openChangeFileModal: =>
    templateParams = @TemplatesDataService.getTemplateParams()
    @ModalFactory.invokeModal 'manage_word_file',
      resolve:
        params: => templateParams
        source: =>  @parser_source
      success: (res) =>
        @wordFileHtml = null
        @wordDataObj = null
        @$timeout =>
          @$state.go(@$state.current, {doc_id: res.data.doc_id})

  changeWordFile: =>
    if @getMarkedItems().length
      @SweetAlert.confirm({
        title: "Action Required!"
        text: "There are marked items in document. If you continue these changes will be lost"
        confirmButtonText: 'Continue'
        cancelButtonText: 'Cancel'
        focusCancel: true
      }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          @openChangeFileModal()
    else
      @openChangeFileModal()

  deselect_cell: (tag, type) =>
    tag.removeAttribute('elem_type');

  tableHasAnswerColumn: (table) =>
    hasAnswerColumn = false
    table_rows = table.getElementsByTagName("tr")
    for table_row in table_rows
      table_cols = table_row.getElementsByTagName('td')
      for table_col in table_cols
        type = $(table_col).attr("elem_type")
        if type and type == "Answer"
          hasAnswerColumn = true
          break
    hasAnswerColumn

  tableHasQuestionColumn: (element, inputType) =>
    if inputType == 'table'
      table = element
    else
      table = $(element).closest('table')[0]
    hasQuestionColumn = false
    table_type = table.getAttribute('elem_type')
    if table_type == ParserElementType.CUSTOM_TABLE
      hasQuestionColumn = true

    hasQuestionColumn

  removeExistingMarkedColumn: (selected_tag, tabType) =>
    table = $(selected_tag).closest("table")
    table_rows = table[0].getElementsByTagName("tr")
    for table_row in table_rows
      table_cols = table_row.getElementsByTagName('td')
      for table_col in table_cols
        type = table_col.getAttribute('elem_type')
        if type == tabType
          table_col.removeAttribute("elem_type")


  setColorForAnswerColumn: (selected_tag, style_key) =>
    table = $(selected_tag).closest("table")
    column_index_of_selected_tag = $(selected_tag).closest("td")[0].cellIndex;
    table_rows = table[0].getElementsByTagName("tr")
    answer_column =  column_index_of_selected_tag
    for table_row in table_rows
      table_cols = table_row.getElementsByTagName('td')
      for table_col in table_cols
        selectedColumnHasQuestion = false
        type = table_col.getAttribute('elem_type')
        cell_to_compare = table_cols[answer_column]
        cell_to_compare_type = cell_to_compare.getAttribute('elem_type')
        if cell_to_compare_type == 'Question'
          selectedColumnHasQuestion = true
        # currentStyle = @getStyle(cell_to_compare)
        if type == 'Question' and !selectedColumnHasQuestion
          # if (currentStyle.localeCompare(style_key) == 0)
          cell_to_compare.setAttribute 'elem_type', 'Answer'
    @setTableAsMarked(table[0])

  setColorForCommentColumn: (answer_column, selected_tag) =>
    table = $(selected_tag).closest('table')
    table_rows = table[0].getElementsByTagName("tr")
    i = 0
    while i < table_rows.length
      table_cols = table_rows[i].getElementsByTagName('td')
      j = 0
      while j < table_cols.length
        type = table_cols[j].getAttribute('elem_type')
        if type == 'Question'
          table_cols[comment_column].setAttribute 'elem_type', 'Comment'
        j++
      i++


  evaluateTarget: (target) =>
    element = null
    if target.attributes.elem_type
      element = target
    if @childElements.indexOf(target.tagName) > -1
      for parentEl in @parent_tags_list
        if $(target).closest(parentEl).length
          element = $(target).closest(parentEl)[0]
          break
    else
      element = target
    element

  isElementInsideTable: (element) =>
    inside_table = false
    if jQuery(element).prop("tagName") == "TD" || jQuery(element).attr('has_td')
      inside_table = true
    inside_table


  unMarkItems: (action) =>
    target = $('.context-menu-active')[0]
    if @isElementInsideTable(target)
      @wp.markOrUnmarkTableTags(target, action, null)
    else
      @wp.markOrUnmarkTextTags(target, action, null)
    @$timeout =>
      @updateCounts()

  isTableMarked: (table) =>
    is_marked = false
    tr_tags = table.getElementsByTagName("tr")
    for tr_tag in tr_tags
      # Getting the list of cells in that row
      cells = tr_tag.getElementsByTagName('td')
      if $(cells).closest("[elem_type]").length
        is_marked = true
        break
      else if $(cells).find("[elem_type]").length
        is_marked = true
        break
    is_marked

  clearCustomTable: (selected_tag) =>
    table = $(selected_tag).closest('table')[0]
    marked_items = table.querySelectorAll('[elem_type]')
    for item in marked_items
      item.removeAttribute("elem_type")

  clearSelectionByTypeInTable: (tabType, selected_tag, action) =>
    table = $(selected_tag).closest('table')[0]
    if action == "all"
      marked_items = table.querySelectorAll('[elem_type]')
      for item in marked_items
        type = item.getAttribute("elem_type")
        if type and type == tabType
          item.removeAttribute("elem_type")
    else
      selected_tag.removeAttribute("elem_type")
    @$timeout =>
      if !@tableHasAnswerColumn(table) || !@tableHasQuestionColumn(table, 'table')
        table.removeAttribute("elem_type")

  getMarkedItems: =>
    marked_items = []
    marked_items = document.getElementById(@word_div).querySelectorAll('[elem_type]')
    marked_items

  clearSelectionByType: (element, tabType) =>
    # @td_tags = document.getElementsByTagName("td")
    marked_items = document.getElementById(@word_div).querySelectorAll('[elem_type]')
    style_key = @getStyle(element)
    for item in marked_items
      type = item.getAttribute("elem_type")
      currentStyle = @getStyle(item);
      if type and type == tabType and (currentStyle.localeCompare(style_key) == 0)
        item.removeAttribute("elem_type")

  getStepCount: (step) =>
    count = 0
    all_counts = @$window.localStorage.getItem('all_counts')
    if all_counts
      @countsObject = JSON.parse(all_counts)
      if @countsObject[step.name]
        count = @countsObject[step.name].count
    count

  updateCounts: =>
    @countsObject = {
      Section: {count: 0, data: []}
      SubSection: {count: 0, data: []}
      Question: {count: 0, data: []}
      Answer: {count: 0, data: []}
    }
    @selectionSteps = [
      {name: "Section", alias: "Category", is_active: false, count: 0, is_visible: true},
      {name: "SubSection", alias: "SubCategory", is_active: false, count: 0, is_visible: true},
      {name: "Question", alias: "Question", is_active: false, count: 0, is_visible: true},
      {name: "Answer", alias: "Answer", is_active: false, count: 0, is_visible: true}
    ]
    marking_count = @wp.getMarkingsCount()
    @countsObject.Section.count    = marking_count[ParserElementType.SECTION]
    @countsObject.SubSection.count = marking_count[ParserElementType.SUB_SECTION]
    @countsObject.Question.count   = marking_count[ParserElementType.QUESTION]
    @countsObject.Answer.count     = marking_count[ParserElementType.ANSWER]
    for step in @selectionSteps
      if @countsObject[step.name]
        step.count = @countsObject[step.name].count
    @$window.localStorage.setItem('all_counts', JSON.stringify(@countsObject))

  setTableAsMarked: (table) =>
    if @tableHasQuestionColumn(table, 'table') and @tableHasAnswerColumn(table)
      $(table).attr("elem_type" , "CustomTable")
      className = $(table).attr("id")
      $("."+className).remove()
      $(table).removeAttr 'id'

  cellSpecificOptionClick: (type_of_text) =>
    target = $('.context-menu-active')[0]
    text = target.innerText.trim()
    if @isElementInsideTable(target)
      table = $(target).closest('table')[0]
      @wp.markOrUnmarkTableTags(target, ParserSelectionType.SELECT, type_of_text)
      if !@answerColumnWarningShown and type_of_text == 'Question'
        @SweetAlert.success({'title':"You marked Questions in table. Please don't forget to mark Answer column for this table"})
        @answerColumnWarningShown = true
    else
      if @isInsideQA(target)
        @SweetAlert.confirm({
          title: "Action Required!"
          text: "If you proceed with this action asnwer marking will be reset and can't be undone. Do you want to continue?"
          confirmButtonText: "Yes, Proceed"
          cancelButtonText: 'No'
          focusCancel: true
        }).then (isConfirm) =>
          if isConfirm.value and isConfirm.value == true
            @wp.resetFile(true)
            @$timeout =>
              if isConfirm.value and isConfirm.value == true
                @wp.markOrUnmarkTextTags(target, ParserSelectionType.SELECT, type_of_text)
      else
        @wp.markOrUnmarkTextTags(target, ParserSelectionType.SELECT, type_of_text)
    @$timeout =>
      @updateCounts()

  optionClick: (e) =>
    target = $('.context-menu-active')[0]
    type_of_text = e
    if @isElementInsideTable(target)
      table = $(target).closest('table')[0]
      @wp.markOrUnmarkTableTags(target, ParserSelectionType.SELECT_SIMILAR, type_of_text)
      if !@answerColumnWarningShown and type_of_text == 'Question'
        @SweetAlert.success({'title':"You marked Questions in table. Please don't forget to mark Answer column for this table"})
        @answerColumnWarningShown = true
    else
      if @isInsideQA(target)
        @SweetAlert.confirm({
          title: "Action Required!"
          text: "If you proceed with this action asnwer marking will be reset. Do you want to continue?"
          confirmButtonText: "Yes, proceed"
          cancelButtonText: 'No'
          focusCancel: true
        }).then (isConfirm) =>
          if isConfirm.value and isConfirm.value == true
            @wp.resetFile(true)
            @$timeout =>
              @wp.markOrUnmarkTextTags(target, ParserSelectionType.SELECT_SIMILAR, type_of_text)
      else
        @wp.markOrUnmarkTextTags(target, ParserSelectionType.SELECT_SIMILAR, type_of_text)
    @$timeout =>
      @updateCounts()

  isElementInsideTd: (element) =>
    inside_td = false
    if $(element).attr('has_td')
      inside_td = true
    inside_td

  scrollToSpecificItem: (itemId) =>
    $('html,body').animate { scrollTop: $('#' + itemId).offset().top - 110 }, 500

  scrollToUnmarkedTable: =>
    if @unmarkedTableIds.length
      for tableId in @unmarkedTableIds
        $('html,body').animate { scrollTop: $('#' + tableId).offset().top - 110 }, 500
        break
    else
      for textId in @unmarkedTextIds
        $('html,body').animate { scrollTop: $('#' + textId).offset().top - 110 }, 500
        break

  getItemsWithLongText: =>
    found = false
    marked_items = @getMarkedItems()
    for elem in marked_items
      text = elem.getAttribute('elem_text')
      type = elem.getAttribute('elem_type')
      if (type == 'Section' || type == 'SubSection') and text.length >= 150
        @scrollToSpecificItem(elem.id)
        entity = "Category"
        if type == "SubSection"
          entity = "SubCategory"
        @SweetAlert.error({'title': entity + ' has more than 150 characters.'})
        found = true
        break
    found

  get_unmarked_text: =>
    # var parent_tags_list = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    selector = ''
    @unmarkedTextIds = []
    unmarked_count = 0
    not_elem_type_selector = 'not([elem_type])'
    for parent_tag in @parent_tags_list
      if parent_tag == 'LI'
        li_selector = "#{parent_tag}:#{not_elem_type_selector}"
        selector += "OL:#{not_elem_type_selector} > #{li_selector}, UL:#{not_elem_type_selector} > #{li_selector},"
      else
        selector += "#{parent_tag}:#{not_elem_type_selector}" + ","
    unmarked_items = document.getElementById(@word_div).querySelectorAll(selector.slice(0, -1))
    unmarked_text = []
    for item, index in unmarked_items
      if !@check_element(item)
        continue
      text = @wp.getTagText(item)
      if text
        unmarked_text.push item
        $(item).attr("id", "text_"  + (index + 1))
        @unmarkedTextIds.push "text_" + (index + 1)
    unmarked_count = @unmarkedTextIds.length
    unmarked_count

  executeUndo: =>
    @wp.executeUndo()
    @$timeout =>
      @updateCounts()

  executeRedo: =>
    @wp.executeRedo()
    @$timeout =>
      @updateCounts()

  openImportModal: =>
    if !@countsObject.Section.count
        @SweetAlert.error({'title':'Please mark Category'})
        return
    if !@countsObject.Question.count
        @SweetAlert.error({'title':'Please mark Questions'})
        return
    if @get_table_without_answer_col()
      return
    if @isQaFlowAndAnswersNotMarked()
      @SweetAlert.error({'title':'Please click auto identify answers'})
      # @$timeout =>
      #   @autoMarkAnswers()
      return
    unmarkedTablesCount = @get_unmarked_table()
    unmarkedTextCount = @get_unmarked_text()
    if unmarkedTablesCount > 0 || unmarkedTextCount > 0
      if unmarkedTablesCount > 0 and unmarkedTextCount == 0
        if unmarkedTablesCount > 1
          text = "There are #{unmarkedTablesCount} unmarked tables. Would you like to see?"
        else
          text = "There is #{unmarkedTablesCount} unmarked table. Would you like to see?"
      else if unmarkedTablesCount == 0 and unmarkedTextCount > 0
        if unmarkedTextCount > 1
          text = "There are #{unmarkedTextCount} unmarked text items. Would you like to see?"
        else
          text = "There is #{unmarkedTextCount} unmarked text item. Would you like to see?"
      else if unmarkedTablesCount > 0 and unmarkedTextCount > 0
        if unmarkedTablesCount > 1 and unmarkedTextCount > 1
          text = "There are #{unmarkedTablesCount} unmarked tables and #{unmarkedTextCount} unmarked text items. Would you like to see?"
        else if unmarkedTablesCount == 1 and unmarkedTextCount > 1
          text = "There is #{unmarkedTablesCount} unmarked table and #{unmarkedTextCount} unmarked text items. Would you like to see?"
        else if unmarkedTablesCount > 1 and unmarkedTextCount == 1
          text = "There are #{unmarkedTablesCount} unmarked tables and #{unmarkedTextCount} unmarked text item. Would you like to see?"
        else
          text = "There is #{unmarkedTablesCount} unmarked table and #{unmarkedTextCount} unmarked text item. Would you like to see?"
      @SweetAlert.confirm({
        title: "Action Required!"
        text: text
        confirmButtonText: 'Continue to preview'
        cancelButtonText: 'See unmarked'
        focusCancel: true
      }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          testParams2 = @wp.exportData(@document_id, @templateParams.name)
          @ModalFactory.invokeModal 'manage_excel_template',
            resolve:
              selection: => @countsObject
              params: => testParams2
              source: =>  @parser_source
        else
          @$timeout =>
            @scrollToUnmarkedTable()
      return
    testParams2 = @wp.exportData(@document_id, @templateParams.name)
    @ModalFactory.invokeModal 'manage_excel_template',
      resolve:
        selection: => @countsObject
        params: => testParams2
        source: => @parser_source
