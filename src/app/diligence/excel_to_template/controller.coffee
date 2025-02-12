class DiligenceExcelTemplatesController extends BaseController

  @register 'DiligenceExcelTemplatesController'

  @inject 'ModalFactory', '$state', 'Utils', '$http', '$timeout', 'TemplatesDataService', '$window', 'SweetAlert' , '$compile' , '$scope', 'toaster', '$stateParams', 'Restangular', 'baseUrl' , 'angularParserEnabled'

  initialize: (newfile)->
    # @templates = @TemplatesResource.$new()
    @td_tags = []
    @answersColCoordinate = null
    @answersObj = {}
    @excelDataObj = {}
    @tr_tags = []
    $compile = @$compile
    @use_sheet_name_as_section = false
    @markSheetAsSection = false
    @isCellMarked = false
    @answer_columns = {}
    @countsObject = {
      questions: {count: 0, data: []}
      sections: {count: 0, data: []}
      answers: {count: 0, data: []}
      subSections: {count: 0, data: []}
      unmarked: {}
    }

    @stylesContainer = {}
    @styleParams = {

    }
    @indexParams = {}
    @styleClasses = ['questionsClass', 'sectionsClass', 'subSectionsClass', 'answersClass', 'commentClass']
    @comment_columns = {}
    @excelData = []
    @workbook = {}
    @hoveredElement = null
    backUpData = null
    @selectionSteps = [
      {alias: 'Category', name: "Section", is_active: false, count: 0, is_visible: true},
      {alias: 'SubCategory', name: "SubSection", is_active: false, count: 0, is_visible: true},
      {alias: 'Question', name: "Question", is_active: false, count: 0, is_visible: true},
      {alias: 'Answer', name: "Answer", is_active: false, count: 0, is_visible: true},
      {alias: 'Comment', name: "Comment", is_active: false, count: 0, is_visible: false}
    ]

    @active_step = ""
    @selectedItems = {
      Question: []
      Section: []
      SubSection: []
      Comment: []
      Answer: []
    }
    @document_id = null
    @excelDataObj = @TemplatesDataService.getExcelParcerData()
    @document_id = @$stateParams.doc_id
    @fileExist = false

    @originalExcelFile = @TemplatesDataService.getOriginalExcelFile()
    if @originalExcelFile
      file = @originalExcelFile[0]
    if !file
      @toaster.pop 'error', '', 'Please try again'
      @$window.history.back()
      return

    if file
      @fileExist = true
      reader = new FileReader()
      reader.onloadend = (event) =>
        arrayBuffer = reader.result
        @workbook = new ExcelJS.Workbook()
        @workbook.xlsx.load arrayBuffer
        @workbook.eachSheet (ws, sheetId) ->
          console.log ws.name

      reader.readAsArrayBuffer file

    @templateParams = @TemplatesDataService.getTemplateParams()
    if @excelDataObj.html_content
      @excelData = @excelDataObj.html_content
      if @excelData.length
        @selectedSheet = @excelData[0]
      @initExcelFile()
    else
      @$http.post(@baseUrl + "/excel_parser/upload?parserType=Excel&doc_id=#{@document_id}", {}).then ((response) =>
        @excelDataObj = response.data
        if @excelDataObj.html_content
          @excelData = @excelDataObj.html_content
          if @excelData.length
            @selectedSheet = @excelData[0]
          @initExcelFile()

      ), (error) =>
        console.log "error" , error

    if newfile
      @templateParams = {}
      @excelData = newfile.data.html_content
      @templateParams.name = newfile.file[0].name
      if @excelData.length
        @selectedSheet = @excelData[0]
      @initExcelFile()


    @is_investor = @Utils.isInvestor()

    @templateUrl = 'shared/report-list-templates/popover-template.html'
    @isPopoverOpen = false


  get_text: (tag) =>
    text = tag.innerText
    if tag.tagName == 'LI'
      _o_nested_lists = tag.querySelectorAll(':scope > ol')
      _u_nested_lists = tag.querySelectorAll(':scope > ul')
      for node of _o_nested_lists
        node_text = node.innerText
        text = text.replace(node_text, '')
      for node of _u_nested_lists
        node_text = node.innerText
        text = text.replace(node_text, '')
    text.trim().replace /\s\s+/g, ' '

  initExcelFile: =>
    # vm.setCoordinatesForTags(sheet)
    @loading = true
    selectedSheets = []
    for entry in @excelData
      @stylesContainer[entry.sheet_no] = {}
      @indexParams[entry.sheet_no] = {}
      entry.is_active = true
      selectedSheets.push entry
    @TemplatesDataService.setSelectedSheets(selectedSheets)
    @$timeout (=>
      @initContextMenu()
      @makeItSticky()
      @addRouteChangeNagger()
      for entry in @excelData
        @setCoordinatesForTags(entry)
      @loading = false
    ), 4000


  getStyle: (tag) =>
    style = getComputedStyle(tag)
    # key = style['color'] + style['fontFamily'] + style['fontSize'] + style['backgroundColor'] + style['fontWeight']
    key = style['color'] + style['fontFamily'] + style['backgroundColor'] + style['fontWeight']
    # key  = window.getComputedStyle(tag, null).getPropertyValue("color") + window.getComputedStyle(tag, null).getPropertyValue("font-family") + window.getComputedStyle(tag, null).getPropertyValue("background-color");
    key

  showStepCount: (step) =>
    selected_option = @lowerCaseFirstLetter(step.name)
    selected_option = selected_option + 's'
    count = 0
    if @countsObject[selected_option]
      count = @countsObject[selected_option].count
    count

  lowerCaseFirstLetter: (string) ->
    string.charAt(0).toLowerCase() + string.slice(1)

  makeItSticky: ->
    if $(document).height() > $(window).height()
      $('.sticky_savebar').affix({offset: {bottom: 50} })

  # Need to use appropriate answer_column value and comment column value for each sheet in for loop.
  initContextMenu: =>
    $.contextMenu({
        selector: '#element td',
        # items: $.contextMenu.fromMenu($('#html5polyfill')),
        callback: (key, option) =>
          splitedArray = option.split(/\s*\-\s*/g)
          type_of_text = splitedArray[0]
          if option.indexOf('key1') > -1
            if type_of_text == 'Unmark'
              @unMarkItems('this')
            else
              @cellSpecificOptionClick(type_of_text)
          else
            if type_of_text == 'Unmark'
              @unMarkItems('all')
            else
              @optionClick(type_of_text)

        items:
          'Section':
            'name': 'Mark as Category'
            'items':
              'Section-key1': 'name': 'This cell'
              'Section-key2': 'name': 'All similar cells'
          'SubSection':
            'name': 'Mark as SubCategory'
            'items':
              'SubSection-key1': 'name': 'This cell'
              'SubSection-key2': 'name': 'All similar cells'
          'Question':
            'name': 'Mark as Question'
            'items':
              'Question-key1': 'name': 'This cell'
              'Question-key2': 'name': 'All similar cells'
          'Answer':
            'name': 'Mark as Answer'
            'items':
              'Answer-key1': 'name': 'This cell'
              'Answer-key2': 'name': 'All similar cells'
          'Comment':
            'name': 'Mark as Comment'
            'items':
              'Comment-key1': 'name': 'This cell'
              'Comment-key2': 'name': 'All similar cells'
          'Unmark':
            'name': 'Unmark'
            'items':
              'Unmark-key1': 'name': 'This cell'
              'Unmark-key2': 'name': 'All similar cells'

    });

  clearDom: =>
    @td_tags = document.getElementsByTagName("td")
    # Iterate over the td_tags
    for td_tag in @td_tags
      # Get the type attribute of the td_tag
      type = td_tag.getAttribute('type')
      # See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
      if type
        @deselect_cell(td_tag, type)
    @$timeout =>
      @updateCounts()
      @removeRouteChangeNagger()

  clearSelectedSheet: (all) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to reset this sheet?"
      text: 'This will clear all marked items in current sheet'
      confirmButtonText: 'Proceed'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        for entry in @excelData
          if entry.sheet_no == @selectedSheet.sheet_no
            entry.is_done = false
            break
        # Fetch all the td_tags of the sheet using the div_id
        if all
          @td_tags = document.getElementsByTagName("td")
        else
          @td_tags = document.getElementById("table_" + @selectedSheet.sheet_no).getElementsByTagName("td")
        # Iterate over the td_tags
        for td_tag in @td_tags
          # Get the type attribute of the td_tag
          type = td_tag.getAttribute('type')
          # See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
          if type
            @deselect_cell(td_tag, type)
        @$timeout =>
          @updateCounts()

      else if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
        swal.close()

  saveClickedElement: (event) =>
    @currentEvent = event

  exportData1: (params) =>
    final_json =
      'Document_id': @document_id
      'name': @templateParams.name
      'sections': []
    k = 0
    len = params.length
    while k < len
      sheetParam = params[k]
      section_obj =
        'text': sheetParam.sheet_name
        'sheet_name': sheetParam.sheet_name
        'subSections': []
      sub_section_obj =
        'text': sheetParam.sheet_name
        'questions': []
      tr_tags = document.getElementById(sheetParam.div_id).querySelectorAll('tr[id]')
      i = 0
      while i < tr_tags.length
        tr_tag = tr_tags[i]
        id = tr_tag.getAttribute('id')
        if id and id.charAt(0) != 'r'
          i++
          continue
        td_tags = Array.from(tr_tag.children)
        j = 0
        while j < td_tags.length
          td_tag = td_tags[j]
          type = td_tag.getAttribute('type')
          text = td_tag.innerText

          ###
          We will check the type of the td_tag, if the type is section,
          we will check if the section_obj has any sub_section objects,
          if yes, we will add the section_obj to the final_json and we will reassign the section obj with the new section name value
          if no, we will reassign the section obj with the new section name value
          ###

          if !@markSheetAsSection and text and type == 'Section'
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
          else if text and type == 'SubSection'
            if sub_section_obj['questions'].length > 0
              sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj))
              section_obj['subSections'].push sub_section_obj_copy
            sub_section_obj['text'] = text
            sub_section_obj['questions'] = []
          else if text and type == 'Question'

            ###
            If the type of the tag is question, we will add the question obj with necessary info to the sub_section_obj
            ###

            ans_row_coord = td_tags[j].getAttribute('row_coord')
            ans_col_coord = sheetParam.answer_column
            #Here assign the answer_column value
            cmt_row_coord = td_tags[j].getAttribute('row_coord')
            cmt_col_coord = sheetParam.comment_column
            is_answer_found = false
            is_comment_found = false
            l = undefined
            l = j + 1
            while l < td_tags.length
              tag = td_tags[l]
              type = tag.getAttribute('type')
              if type == 'Answer'
                ans_row_coord = tag.getAttribute('row_coord')
                ans_col_coord = tag.getAttribute('column_coord')
                is_answer_found = true
              else if type == 'Comment'
                cmt_row_coord = tag.getAttribute('row_coord')
                cmt_col_coord = tag.getAttribute('column_coord')
                is_comment_found = true
              else if (type == 'Section' || type == 'SubSection' || type == 'Question')
                break
              if is_answer_found and is_comment_found
                break
              l++
            j = l - 1
            resposeTypeData = @getCellType(sheetParam.sheet_name, ans_row_coord, ans_col_coord)
            question_obj =
              'text': text
              'responseType': resposeTypeData['type']
              'responseTypeDesc': resposeTypeData['type']
              'response_coordinates': ans_row_coord + ',' + ans_col_coord
              'comment_coordinates': null
              'is_selected': true
            if resposeTypeData['type'] == 'Dropdown'
              question_obj['responseOptions'] = resposeTypeData['values']

            ###
                Here we check if the user has selected value for comment column, then we add value for comment column.
            ###

            if cmt_col_coord
              question_obj['comment_coordinates'] = cmt_row_coord + ',' + cmt_col_coord
            sub_section_obj['questions'].push question_obj
          j++
        i++
      # j = 0;
      # while (j < td_tags.length) {
      #     type = td_tags[j].getAttribute('type');
      #     text = td_tags[j].innerText;
      #     j++;
      # }
      if sub_section_obj['questions'].length > 0
        section_obj['subSections'].push sub_section_obj
      if section_obj['subSections'].length > 0
        final_json['sections'].push section_obj
      k++
    final_json

  setCoordinatesForTags: (sheet) =>
    div_id = 'table_' + sheet.sheet_no
    wrapper_tag = document.getElementById(div_id)
    tr_tags = wrapper_tag.querySelectorAll('tr[id]')
    merged_rows = {}
    for tr_tag in tr_tags
      id = tr_tag.getAttribute('id')
      if id and id.charAt(0) == 'r'
        row_coord = parseInt(id.substring(1)) + 1
        td_tags = Array.from(tr_tag.children)
        td_tags.shift()
        column_coord = 1
        for td_tag in td_tags
          if row_coord of merged_rows
            while merged_rows[row_coord].includes(column_coord)
              column_coord++
          tag_style = @getStyle(td_tag)
          td_tag.setAttribute 'row_coord', row_coord.toString()
          td_tag.setAttribute 'column_coord', column_coord.toString()
          td_tag.setAttribute 'tag_style', tag_style
          row_span = td_tag.getAttribute('rowspan')
          col_span = td_tag.getAttribute('colspan')
          if !col_span
            col_span = 1
          if row_span
            merged_columns = []
            i = column_coord
            while i < column_coord + parseInt(col_span)
              merged_columns.push i
              i++
            i = row_coord + 1
            while i < row_coord + parseInt(row_span)
              if i of merged_rows
                merged_rows[i] = merged_rows[i].concat(merged_columns)
              else
                merged_rows[i] = merged_columns
              i++
          column_coord += parseInt col_span

  setColorForQuestionSectionSubSectionCells: (style_key, type_of_text, element, sheet_no) =>
    if !style_key or !style_key.length
      @toaster.pop 'error', '', 'Please try again'
      return
    @tr_tags = document.getElementById("table_" + @selectedSheet.sheet_no).getElementsByTagName("tr")

    selected_tag = element
    column_index_of_selected_tag = selected_tag.cellIndex; #selected_tag is the cell user clicked, getting it's column value using cellIndex property.
    # Iterating through each row (tr of table) of the sheet (table)
    @stylesContainer[sheet_no][style_key] =  type_of_text
    @indexParams[sheet_no][type_of_text] = column_index_of_selected_tag
    for tr_tag in @tr_tags
      # Getting the list of cells in that row
      cells = tr_tag.getElementsByTagName('td');
      # Checking the number of cells in that row, sometimes a row might have less number of cells because of merging cells in Excel. This is to avoid Array Index Error.
      # Eg if the user has selected column number 10, there is a possibility that a row might have only 9 cells because of merging cell in Excel, in this case we will skip this row and we won't perform any style comparsion to select the cell
      if (cells.length <= column_index_of_selected_tag)
          continue;
      # cell_to_compare is the ith cell/ cell at ith column value. i is the column value selected by the user which is stored in column_index_of_selected_tag
      cell_to_compare = cells[column_index_of_selected_tag];
      # Rest is same, we fetch the style and text of that cell and compare it, if it's same we will mark it.
      key = @getStyle(cell_to_compare);
      text = cell_to_compare.innerText;
      type = cell_to_compare.getAttribute('type')
      if (text && key.localeCompare(style_key) == 0)
        jQuery(cell_to_compare).attr('type',type_of_text)


  changeExcelFile: =>
    templateParams = @TemplatesDataService.getTemplateParams()
    @ModalFactory.invokeModal 'manage_excel_file',
      resolve:
        params: => templateParams
      success: (res) =>
        @initialize(res)

  showWalkthrough: =>
    @ModalFactory.invokeModal 'excel_parser_walkthrough'

  setColorForSingleCell: (currentTag, type_of_text) =>
    jQuery(currentTag).attr('type',type_of_text)

  getCellType: (sheet_name, rownum, colnum) ->
    try
      worksheet = @workbook.getWorksheet(sheet_name)
      cell = worksheet.getRow(parseInt(rownum)).getCell(parseInt(colnum))
      obj = {}
      data_validation = cell.dataValidation || cell._dataValidations
      if data_validation
        cell_type = data_validation['type']
        if cell_type == 'list'
          formulae = data_validation['formulae'][0]
          dropdown_values = []
          if formulae.includes('$')
            if formulae.includes('!$')
              formaulae_data = formulae.split('!$')
              formulae = formaulae_data[1]
              sheet_name = formaulae_data[0].slice(1, -1)
              worksheet = @workbook.getWorksheet(sheet_name)
            cell_ranges = formulae.split(':')
            start_cell = worksheet.getCell(cell_ranges[0])
            end_cell = worksheet.getCell(cell_ranges[1])
            cell_da = start_cell
            start_row = start_cell._row._number
            start_col = start_cell._column._number
            end_row = end_cell._row._number
            end_col = end_cell._column._number
            if start_row == end_row
              i = start_col
              while i <= end_col
                dropdown_values.push worksheet.getRow(start_row).getCell(i).value
                i++
            else if start_col == end_col
              i = start_row
              while i <= end_row
                dropdown_values.push worksheet.getRow(i).getCell(start_col).value
                i++
          else
            dropdown_values = formulae.slice(1, -1)
            if dropdown_values.length > 0
              dropdown_values = dropdown_values.split(',')
            else
              dropdown_values = []
          small_dropdown_values = []
          i = 0
          while i < dropdown_values.length
            dd_value = dropdown_values[i]
            if dd_value
              small_dropdown_values.push dd_value.toLowerCase().trim()
            i++
          if dropdown_values.length <= 3 and (small_dropdown_values.includes('yes') and small_dropdown_values.includes('no') or small_dropdown_values.includes('true') and small_dropdown_values.includes('false'))
            params = 'type': 'Boolean'
            return params
          else
            response_options_obj = []
            i = 0
            while i < dropdown_values.length
              option_obj =
                'value': ''
                'id': 0
                'is_active': true
              option_obj['value'] = dropdown_values[i]
              response_options_obj.push option_obj
              i++
            params =
              'type': 'Dropdown'
              'values': response_options_obj
            return params
        else if cell_type == 'date'
          params = 'type': 'Date'
        else if cell_type == 'whole'
          params = 'type': 'Integer'
        else if cell_type == 'decimal'
          params = 'type': 'Numeric'
        else if cell_type == 'textLength'
          params = 'type': 'TextMultiLine'
        else
          params = 'type': 'TextMultiLine'
      else
        params = 'type': 'TextMultiLine'
      params
    catch ex
      params = 'type': 'TextMultiLine'
      params
    

  markSelectedItemsInOtherSheets: (params) =>
    tr_tags = document.getElementsByTagName("tr")
    for tr_tag in tr_tags
      cells = tr_tag.getElementsByTagName('td');
      for style_key, type_of_text of params[@selectedSheet.sheet_no]
        cell_index = @indexParams[@selectedSheet.sheet_no][type_of_text]
        # Getting the list of cells in that row
        cell_to_compare = cells[cell_index];
        if cell_to_compare
          key = @getStyle(cell_to_compare);
          text = cell_to_compare.innerText;
          if (text && key.localeCompare(style_key) == 0)
              jQuery(cell_to_compare).attr('type', type_of_text);

  toggleApplyStyle: =>
    if (@countsObject.questions.count == 0 || @countsObject.sections.count == 0 || @countsObject.answers.count == 0)
      @SweetAlert.confirm({
        title: 'Action Required'
        text: 'Please mark Categories, Questions and Answer column before applying to other sheets'
        confirmButtonText: 'Okay'
      }).then (response) =>
        swal.close()
      return
        # if isConfirm.value and isConfirm.value == true
    params = @TemplatesDataService.getSelectedSheets()
    @ModalFactory.invokeModal 'manage_excel_sheets',
      resolve:
        sheets: => params
        disabledMode: => false
      success: (response) =>
        @markSelectedItemsInOtherSheets(@stylesContainer)
        for sheet in @excelData
          for res in response
            if sheet.sheet_no == res.sheet_no
              sheet.is_active = res.is_active

        for entry in @excelData
          if entry.is_active
            @selectedSheet = entry
            break

        @$timeout =>
          @setColorForAnswerColumnAll(@answersObj[@selectedSheet.sheet_no].answer_column)
        @$timeout =>
          @updateCounts()
          fromApplySheet = true
          @checkIfSheetIfDone(fromApplySheet)



  deselect_cell: (tag, type) =>
    tag.removeAttribute('type');

  setColorForAnswerColumnAll: (answer_column) =>
    table_rows = document.getElementsByTagName("tr")
    i = 0
    while i < table_rows.length
      table_cols = table_rows[i].getElementsByTagName('td')
      j = 0
      while j < table_cols.length
        type = table_cols[j].getAttribute('type')
        if type == 'Question'
          jQuery(table_cols[answer_column]).attr('type', 'Answer')
        j++
      i++

  setColorForAnswerColumn: (answer_column, sheet_no) =>
    @answersObj[@selectedSheet.sheet_no] = {}
    @answersObj[@selectedSheet.sheet_no]['answer_column'] = answer_column

    table_rows = document.getElementById("table_" + @selectedSheet.sheet_no).getElementsByTagName("tr")
    i = 0
    while i < table_rows.length
      table_cols = table_rows[i].getElementsByTagName('td')
      j = 0
      while j < table_cols.length
        type = table_cols[j].getAttribute('type')
        if type == 'Question'
          jQuery(table_cols[answer_column]).attr('type', 'Answer')
          if sheet_no
            jQuery(table_cols[answer_column]).attr('sheet',sheet_no)
        j++
      i++


  setColorForCommentColumn: (comment_column, sheet_no) =>
    table_rows = document.getElementById("table_" + @selectedSheet.sheet_no).getElementsByTagName("tr")
    i = 0
    while i < table_rows.length
      table_cols = table_rows[i].getElementsByTagName('td')
      j = 0
      while j < table_cols.length
        type = table_cols[j].getAttribute('type')
        if type == 'Question'
          jQuery(table_cols[comment_column]).attr('type', 'Comment')
          if sheet_no
            jQuery(table_cols[comment_column]).attr('sheet',sheet_no)
        j++
      i++

  getStepCount: (name) =>
    count = 0
    if name == 'Question'
      count = @countsObject.questions.count
    else if name == 'Section'
      count = @countsObject.sections.count
    else if name == 'SubSection'
      count = @countsObject.subSections.count
    count

  getMarkedData: (sheet_no) =>
    array = []
    if sheet_no
      @td_tags = document.getElementById("table_" + sheet_no).getElementsByTagName("td")
    else
      @td_tags = document.getElementsByTagName("td")
    for td_tag in @td_tags
      # Get the type attribute of the td_tag
      type = td_tag.getAttribute('type')
      # See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
      if type
        array.push {text: td_tag.innerText, tag: td_tag, is_selected: true, type: type}
    array


  updateCounts: =>
    @countsObject = {
      questions: {count: 0, data: []}
      sections: {count: 0, data: []}
      subSections: {count: 0, data: []}
      answers: {count: 0, data: []}
    }
    @td_tags = document.getElementsByTagName("td")
    # Iterate over the td_tags
    for td_tag in @td_tags
      # Get the type attribute of the td_tag
      type = td_tag.getAttribute('type')
      # See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
      if type and type == 'Question'
        @countsObject.questions.count += 1
        @countsObject.questions.data.push {text: td_tag.innerText, tag: td_tag, is_selected: true}
      if type and type == 'Section'
        @countsObject.sections.count += 1
        @countsObject.sections.data.push {text: td_tag.innerText, tag: td_tag, is_selected: true}
      if type and type == 'SubSection'
        @countsObject.subSections.count += 1
        @countsObject.subSections.data.push {text: td_tag.innerText, tag: td_tag, is_selected: true}
      if type and type == 'Answer'
        @countsObject.answers.count += 1
        @countsObject.answers.data.push {text: td_tag.innerText, tag: td_tag, is_selected: true}

    if @markSheetAsSection
        @countsObject.sections.count = @excelData.length
        for entry in @excelData
          @countsObject.sections.data.push {text: entry.sheet_name, tag: null, is_selected: true}

  unMarkItems: (action) =>
    type = @currentEvent.target.getAttribute('type')
    if type
      if action == 'all'
        @clearSelectionByType(type, false)
        @closePopover()
      else
        @deselect_cell(@currentEvent.target, type)
        @closePopover()
      @updateCounts()

  clearSelectionByType: (tabType, all) =>
    if all
      @td_tags = document.getElementsByTagName("td")
    else
    # Fetch all the td_tags of the sheet using the div_id
      @td_tags = document.getElementById("table_" + @selectedSheet.sheet_no).getElementsByTagName("td")
    # Iterate over the td_tags
    i = 0
    while i < @td_tags.length
      # Get the type attribute of the td_tag
      type = @td_tags[i].getAttribute('type')
      # See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
      if type and type == tabType
        @deselect_cell(@td_tags[i], tabType)
      i++

  markSheetsAsDone: (sheet_no) =>
    if sheet_no
      for entry in @excelData
        if entry.sheet_no == sheet_no and entry.is_active
          entry.is_done = true
          break
    else
      for entry in @excelData
        if entry.is_active
          entry.is_done = true


  cellSpecificOptionClick: (type_of_text) =>
    target = $('.context-menu-active')[0]
    if $(target).is("td")
      @setColorForSingleCell(target, type_of_text)
      @updateCounts()
      @closePopover()
      @$timeout =>
        @checkIfSheetIfDone()

  get_unmarked_cells: (params) =>
    unmarked_data = {
      count: 0
      data: []
    }
    for sheetParam in params
      sheet_name = sheetParam.sheet_name
      sheet_no = sheetParam.sheet_no
      div_id = sheetParam.div_id
      unmarked_data[sheet_name] = []
      td_tags = document.getElementById(div_id).querySelectorAll('td[row_coord]')
      for td_tag in td_tags
        text = td_tag.innerText
        type = td_tag.getAttribute('type')
        row_coordinate = td_tag.getAttribute('row_coord')
        col_coordinate = td_tag.getAttribute('column_coord')
        cell_index = @get_excel_column_name_from_number(col_coordinate) + row_coordinate;
        if text and !type
          unmarked_data.count += 1
          unmarked_obj =
            'text': text
            'sheet_name': sheet_name
            'sheet_no': sheet_no
            'row_coordinate': row_coordinate
            'column_coordinate': @get_excel_column_name_from_number(col_coordinate)
            'cell_index': cell_index
          unmarked_data.data.push unmarked_obj
    unmarked_data

  get_excel_column_name_from_number: (column_number) =>
    # This function converts the column number to excel column letter
    column_number -= 1
    ordA = 'A'.charCodeAt(0)
    # Unicode value of A
    ordZ = 'Z'.charCodeAt(0)
    # Unicode value of Z
    len = ordZ - ordA + 1
    # Number of letters to use for conversion, In excel it is always 26
    excel_column_name = ''
    while column_number >= 0
      # Finds column letter value by repeatedly subtracting 26 (len) from the column number
      excel_column_name = String.fromCharCode(column_number % len + ordA) + excel_column_name
      column_number = Math.floor(column_number / len) - 1
    excel_column_name


  getStyleFromTagStyle: (tag) =>
    key = jQuery(tag).attr('tag_style')
    key

  optionClick: (e) =>
    # element = if @currentEvent then @currentEvent.target else @hoveredElement.target
    element = $('.context-menu-active')[0]
    if $(element).is("td")
      type_of_text = e
      key =  @getStyleFromTagStyle(element)
      if !key
        key =  @getStyle(element)
      bgColors =
        'Section': '#444'
        'SubSection': '#8adfeb'
        'Question': '#009688'
        'Answer': '#FF9800'
      current = element.cellIndex
      if type_of_text == 'Answer'
        sheet_data = @getMarkedData(@selectedSheet.sheet_no)
        questionFound = false
        if sheet_data.length
          for entry in sheet_data
            if entry.type == 'Question'
              questionFound = true
              break
        if !questionFound
          @toaster.pop 'error', '', 'Please select questions first'
          return
        @answer_columns[@selectedSheet.sheet_no] =  current
        @clearSelectionByType('Answer', false)
        @setColorForAnswerColumn(current, @selectedSheet.sheet_no)
        @$timeout =>
          @closePopover()
          @updateCounts()
        @$timeout =>
          @checkIfSheetIfDone()
        return
      else if type_of_text == 'Comment'
        @comment_columns[@selectedSheet.sheet_no] =  current
        @clearSelectionByType('Comment', false)
        @$timeout =>
          @setColorForCommentColumn(current, @selectedSheet.sheet_no)
        @closePopover()
        @$timeout =>
          @checkIfSheetIfDone()
        return
      else
        if type_of_text == 'Section' and @markSheetAsSection
          @markSheetAsSection = false
          @markSheetsAsSection()
          @$timeout =>
            @setColorForQuestionSectionSubSectionCells(key, type_of_text, element, @selectedSheet.sheet_no)
          return
        @setColorForQuestionSectionSubSectionCells(key, type_of_text, element, @selectedSheet.sheet_no)
        @updateCounts()
        @$timeout =>
          @checkIfSheetIfDone()
        @closePopover()
    else
      return


  addRouteChangeNagger: ->
    return if @route_change_nagger?
    # get unsaved changes
    leaving_state = false
    SweetAlert = @SweetAlert
    $state = @$state
    getTitle = =>
      "Are you sure you want to leave"

    # beforeunload event is fired when the window, the document and its resources are about to be unloaded.
    # The document is still visible and the event is still cancelable at this point
    @$window.onbeforeunload = ->
      "#{getTitle()}"

    # here we are listen to route/state change event. Before state is changed this event is fired
    @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
      return if leaving_state
      event.preventDefault()
      @clearDom()
      leaving_state = true
      # swal.close()
      @$timeout =>
        # pass state name with params, if we don't pass to params it will create problems
        @$state.go toState.name , toParams

  removeRouteChangeNagger: ->
    # This function is called when chanegs are saved

    # remove the beforeunload listner
    @$window.onbeforeunload = null
    # if check is there is a nagger (route change listner)
    if @route_change_nagger?
      $.contextMenu( 'destroy' )
      @route_change_nagger() #deregisters the listener
      @route_change_nagger = null

  checkIfSheetIfDone: (fromApplySheet) =>
    if fromApplySheet
      @markSheetsAsDone()
    else
      sheet_data = @getMarkedData(@selectedSheet.sheet_no)
      answerFound = false
      for entry in sheet_data
        if entry.type == 'Answer'
          answerFound = true
          break
      if @countsObject.sections.count and @countsObject.questions.count and answerFound
        @markSheetsAsDone(@selectedSheet.sheet_no)

  setSelectedSheet: (sheet) =>
    if sheet.is_active
      @selectedSheet = sheet

  setSelectedElement: (event) =>
    key = @getStyle(@currentEvent.target)

  closePopover: =>
    @isPopoverOpen = false
    jQuery('#popup').css('display', 'none')
    jQuery(".popover").css('display', 'none')
    jQuery(".popover").removeClass('in')


  markSheetsAsSection: =>
    for entry in @excelData
      if @markSheetAsSection
        entry.is_section = true
      else
        entry.is_section = false
    @unmarkCategories()
    @updateCounts()
    @$timeout =>
      @checkIfSheetIfDone()

  unmarkCategories: =>
    @clearSelectionByType('Section', true)

  openImportModal: =>
    sheet_data = @getMarkedData(@selectedSheet.sheet_no)
    for entry in sheet_data
      if entry.type == 'Answer'
        answerFound = true
      if entry.type == 'Section'
        sectionFound = true
      if entry.type == 'Question'
        questionFound = true

    if !sectionFound and !@markSheetAsSection
      @toaster.pop 'error', '', 'Please mark Categories'
      return
    if !questionFound
      @toaster.pop 'error', '', 'Please mark Questions'
      return
    if !answerFound
      @toaster.pop 'error', '', 'Please mark Answer Column'
      return

    is_valid = false
    params = []
    unmarkParams = []
    for entry in @excelData
      obj2 = {}
      obj2.sheet_no = entry.sheet_no
      obj2.sheet_name = entry.sheet_name
      obj2.div_id = 'table_' + entry.sheet_no
      unmarkParams.push obj2
      if entry.is_active and entry.is_done
        innerObj = {}
        innerObj.sheet_no = entry.sheet_no
        innerObj.sheet_name = entry.sheet_name
        innerObj.div_id = 'table_' + entry.sheet_no
        innerObj.answer_column = @answer_columns[entry.sheet_no]
        innerObj.comment_column = @comment_columns[entry.sheet_no]
        params.push innerObj
    testParams2 = @exportData1(params)
    unmarkedItems = @get_unmarked_cells(unmarkParams)
    if unmarkedItems.data.length
      @SweetAlert.confirm({
        title: "Action Required!"
        text: "There are #{unmarkedItems.count} unmarked items. Would you like to see?"
        confirmButtonText: 'Continue to preview'
        cancelButtonText: 'See unmarked'
        focusCancel: true
      }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          @ModalFactory.invokeModal 'manage_excel_template',
            resolve:
              selection: => @countsObject
              params: => testParams2
        else
          @ModalFactory.invokeModal 'view_unmarked_items',
            resolve:
              items: => unmarkedItems.data
    else
      @ModalFactory.invokeModal 'manage_excel_template',
        resolve:
          selection: => @countsObject
          params: => testParams2


  openEditSheetModal: =>
    params = @TemplatesDataService.getSelectedSheets()
    @ModalFactory.invokeModal 'manage_excel_sheets',
      resolve:
        sheets: => params
        disabledMode: => true
        active_sheet_no: => @selectedSheet.sheet_no
      success: (data) =>
        data.map (entry, index) => 
          @excelData[index].is_active = entry.is_active;
        # @excelData = data
        # for entry in @excelData
        #   if entry.is_active
        #     @selectedSheet = entry
        #     break

  openEditModal: (action) =>
    params = {
      type: action.name
    }
    if action.name == 'Question'
      selectionData = @countsObject.questions.data
    else if action.name == 'Section'
      selectionData = @countsObject.sections.data
    else if action.name == 'SubSection'
      selectionData = @countsObject.subSections.data
    @ModalFactory.invokeModal 'edit_excel_selection',
      resolve:
        selection: => angular.copy selectionData
        params: => params
      success: (response) =>
        for entry in response
          if !entry.is_selected
            @deselect_cell(entry.tag, action.name)
        @updateCounts()
