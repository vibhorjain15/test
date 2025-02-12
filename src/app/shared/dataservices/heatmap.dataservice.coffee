angular.module('diligenceVault').factory 'HeatmapDataService', (Utils, Restangular , $http) ->

  new class HeatmapDataService


    HEADER = "HEADER"
    invertColorFlag = false
    TOTAL_SCORE_ROW = "TOTAL_SCORE"
    TOTAL_SCORE_ROW_TEXT = "TOTAL SCORE"
    defaultPlotHeight = 470
    defaultPlotWidth = 910
    maxYheaderWidth = 160
    xlabelDupes = {}
    ylabelDupes = {}
    alreadyCalculatedXLabels = []
    usedDupesIndex = []
    plotHeight = 510
    plotWidth = 910
    sortState = "H2L"
    colorScheme = ["#cc3232" , "#db7b2b" , "#e7b416" , "#99c140" , "#4CAF50"]
    cellWidth = null
    cellHeight = null
    yHeaderWidth = null
    xHeaderHeight = 40
    xHeaderNewHeight = xHeaderHeight
    rawApiData = null
    xlabel = null
    MANAGER_AXIS = null
    ylabel = null
    processedData = []
    TEXT_DISPLAY_STATE = true
    heatMapChartId = "heatmap-chart"
    defaultCellWidth = 270
    defaultCellHeight = 40
    charsInHeaderCell = 15
    topHeaderCoordinate = 2
    displayAttr = 'value'
    categoryOnly = false
    showDecimalPlaces = false
    showAverageFirst = true
    showWeightages = false
    displayTotalAttr = 'total_rating'
    ratingTableColorScale = ['#034748','#015356','#026061', '#027374', '#038887', '#049693', '#05b5a7' , '#06c6b5' , '#71f0df']
    colorScaleJson = [
      {
        "score" : 1
        "text" : "Low"
      }
      {
        "score" : 2
        "text" : ""
      }
      {
        "score" : 3
        "text" : ""
      }
      {
        "score" : 4
        "text" : ""
      }
      {
        "score" : 5
        "text" : ""
      }
      {
        "score" : 6
        "text" : ""
      }
      {
        "score" : 7
        "text" : ""
      }
      {
        "score" : 8
        "text" : ""
      }
      {
        "score" : 9
        "text" : "High"
      }
    ]

    getHeatmapChartId: ->
      heatMapChartId

    getRatingTableColorScale: ->
      ratingTableColorScale

    getDefaultCellWidth: ->
      defaultCellWidth

    getDefaultCellHeight: ->
      defaultCellHeight

    getColorScaleJson: ->
      colorScaleJson

    getPlotWidth: ->
      defaultPlotWidth

    getDuplicates = (array) ->
      duplicates = {}
      i = 0
      while i < array.length
        if duplicates.hasOwnProperty(array[i])
          duplicates[array[i]].push i
        else if array.lastIndexOf(array[i]) != i
          duplicates[array[i]] = [ i ]
        i++
      duplicates

    getNewPlotWidth: ->
      plotWidth

    getNewPlotHeight: ->
      plotHeight

    getPlotHeight: ->
      defaultPlotHeight

    getColorScheme: ->
      colorScheme

    getSortState: ->
      sortState

    getTextDisplayState: ->
      TEXT_DISPLAY_STATE


    setPlotWidth = ->
      plotWidth = (cellWidth * xlabel.length) + yHeaderWidth

    setPlotHeight = ->
      if ((ylabel.length * defaultCellHeight) + xHeaderNewHeight) < defaultPlotHeight
        return plotHeight = defaultPlotHeight
      plotHeight = (ylabel.length * defaultCellHeight) + xHeaderNewHeight
      plotHeight = plotHeight + defaultCellHeight if MANAGER_AXIS == 'X'
      plotHeight

    setHeatMapData: (rawApiData, opts) ->
      @heatmapdata = []
      textState = opts.textDisplayState
      invertColorFlag = opts.invertColor
      processedData = []
      plotHeight = opts.plotHeight
      plotWidth = opts.plotWidth
      rawApiData = rawApiData
      sortState = opts.sortState
      MANAGER_AXIS = opts.managerAxis
      displayAttr = opts.displayAttr
      displayTotalAttr = opts.displayTotalAttr
      categoryOnly = opts.categoryOnly
      showDecimalPlaces = opts.showDecimalPlaces
      showAverageFirst = opts.showAverageFirst
      showWeightages = opts.showWeightages

      processHeatmapData textState , rawApiData , sortState, invertColorFlag, opts.hide_dates
      processedData

    sortMembers = (sortingScheme) ->
      switch sortingScheme
        when 'L2H'
          rawApiData['members'].sort (a, b) ->
            if a[displayTotalAttr] < b[displayTotalAttr] then -1 else if a[displayTotalAttr] > b[displayTotalAttr] then 1 else 0
        when 'H2L'
          rawApiData['members'].sort (a, b) ->
            if a[displayTotalAttr] > b[displayTotalAttr] then -1 else if a[displayTotalAttr] < b[displayTotalAttr] then 1 else 0
        else
          break
      return


    setAxisLabels = (managerArr, ratingArr) ->
      ratingArr.push TOTAL_SCORE_ROW
      if MANAGER_AXIS is 'X'
        xlabel = managerArr
        ylabel = ratingArr
      else
        xlabel = ratingArr
        ylabel = managerArr
      return

    getMaxHeaderLength = (arr, pixelPerChar) ->
      yLabelArr = jQuery.extend true, [], arr
      longest = yLabelArr.sort((a, b) ->
        b.length - (a.length)
      )[0]
      yWidth = longest.length * pixelPerChar
      # if yWidth > maxYheaderWidth
      #   yWidth = maxYheaderWidth
      yWidth


    getCellWidth = ->
      if yHeaderWidth > maxYheaderWidth
        width = maxYheaderWidth
      else
        width = yHeaderWidth
      longestXlabel = Utils.getLongestString(xlabel)
      if (width * xlabel.length) < plotWidth
        width = plotWidth / (xlabel.length * 1.2)
        #width = (longestXlabel.length * 7)
      width

    getCellHeight = ->
      # clHeight = (plotHeight / ylabel.length) - 10
      clHeight = defaultCellHeight
      clHeight

    getXHeaderHeight = (longestXlabelLength)->
      maxWidthAllowed = (longestXlabelLength * 9)
      val = Math.ceil(maxWidthAllowed / cellWidth)
      xHeaderHeight * val

    getNoCharsInCell = (longestXlabelLength)->
      maxWidthAllowed = (longestXlabelLength * 9)
      val = Math.ceil(maxWidthAllowed / cellWidth)
      Math.ceil(longestXlabelLength / val)

    setCellDimensions = (ratingCategories)->
      if MANAGER_AXIS is 'X'
        label = _(ratingCategories).pluck('subCategory')
        label.push('total score')
        yHeaderWidth = getMaxHeaderLength(label, 10)
        longestHeaderLabel = Utils.getLongestString(xlabel)
        longestXlabelLength = longestHeaderLabel.length
      else
        yHeaderWidth = getMaxHeaderLength(ylabel, 7)
        label = _(ratingCategories).pluck('subCategory')
        label.push('total score')
        longestHeaderLabel = Utils.getLongestString(label)
        longestXlabelLength = longestHeaderLabel.length

      cellWidth = getCellWidth()
      xHeaderNewHeight = getXHeaderHeight(longestXlabelLength)
      charsInHeaderCell = getNoCharsInCell(longestXlabelLength)
      topHeaderCoordinate = Math.ceil(longestXlabelLength/charsInHeaderCell)
      topHeaderCoordinate = 2 if !topHeaderCoordinate or topHeaderCoordinate < 2

      setPlotWidth()
      setPlotHeight()
      cellHeight = getCellHeight()
      return


    setDimensionsForCellClasses = ->
      LeftHeader.width = yHeaderWidth
      LeftHeader.height = cellHeight
      TopHeader.width = cellWidth
      TopHeader.height = xHeaderNewHeight
      TopHeader.charsInHeaderCell = charsInHeaderCell
      TopHeader.topHeaderCoordinate = topHeaderCoordinate
      StandardCell.width = cellWidth
      StandardCell.height = cellHeight
      return

    createCell = (cell) ->
      processedData.push cell
      return

    getXCoor = (xname) ->
      textColumnWidth = 0
      if xname is HEADER
        return textColumnWidth
      indexOfXname = xlabel.indexOf(xname)
      coordinates = textColumnWidth + yHeaderWidth + indexOfXname * cellWidth
      coordinates

    getYCoor = (yname) ->
      if yname is HEADER
        return 0

      calculatedCoor = (xHeaderNewHeight) + ylabel.indexOf(yname) * cellHeight
      calculatedCoor

    createTopLeftCell = ->
      xcoor = 0
      ycoor = 0
      if MANAGER_AXIS is 'X'
        createCell new TopLeftCell(xcoor, ycoor, '', MANAGER_AXIS)
      else
        createCell new LeftTopCell(xcoor, ycoor, '', MANAGER_AXIS)
      return


    getCoordinates = (managerName, ratingName) ->
      if MANAGER_AXIS is 'X'
        {
          xcoor: getXCoor(managerName)
          ycoor: getYCoor(ratingName)
        }
      else
        {
          xcoor: getXCoor(ratingName)
          ycoor: getYCoor(managerName)
        }

    createManagerHeaderCells = (names) ->
      for headerName in names
        a = getCoordinates(headerName.key, HEADER)
        xcoor = a.xcoor
        ycoor = a.ycoor
        if MANAGER_AXIS is 'X'
          createCell new TopManagerHeader(xcoor, ycoor, headerName.name)
        else
          createCell new LeftManagerHeader(xcoor, ycoor, headerName.name)

      # _i = 0
      # names_1 = names
      # while _i < names_1.length
      #   name = names_1[_i]
      #   _a = getCoordinates(name, HEADER)
      #   xcoor = _a.xcoor
      #   ycoor = _a.ycoor
      #   if MANAGER_AXIS is 'X'
      #     createCell new TopManagerHeader(xcoor, ycoor, name)
      #   else
      #     createCell new LeftManagerHeader(xcoor, ycoor, name)
      #   _i++

    createRatingHeaderCells = (ratingObj) ->
      # ratingObjCopy = angular.copy ratingObj
      _(ratingObj).each (subrating) =>
        _a = getCoordinates(HEADER, subrating.name)
        xcoor = _a.xcoor
        ycoor = _a.ycoor
        subrating.name = subrating.name.toUpperCase()
        subrating.subCategory = subrating.subCategory.toUpperCase()
        if subrating.isCategory
          if MANAGER_AXIS is 'X'
            createCell new LeftCategoryHeader(xcoor, ycoor, subrating.subCategory, MANAGER_AXIS)
          else
            createCell new TopCategoryHeader(xcoor, ycoor, subrating.subCategory, MANAGER_AXIS)
        else
          if MANAGER_AXIS is 'X'
            createCell new LeftSubCategoryHeader(xcoor, ycoor, subrating.subCategory, MANAGER_AXIS)
          else
            createCell new TopSubCategoryHeader(xcoor, ycoor, subrating.subCategory, MANAGER_AXIS)


    getRatingCategories = (ratingObj) ->
      arr = []
      axisDisplayNameArray = []
      mainRatings = []
      for rating in ratingObj
        for subrating, subRatingIndex in rating.value
          if categoryOnly and rating.group_id == subrating.group_id
            idName = rating.key.replace(/ /g,'') + '_' + subrating.key.replace(/ /g,'') + '_' + subRatingIndex
            obj = {}
            obj.name = idName
            obj.mainCategory = rating.key
            obj.subCategory = subrating.key
            axisDisplayNameArray.push obj.name
            if mainRatings.indexOf(rating.key) == -1
              mainRatings.push rating.key
              obj.isCategory = true
            arr.push obj
          else if !categoryOnly
            idName = rating.key.replace(/ /g,'') + '_' + subrating.key.replace(/ /g,'') + '_' + subRatingIndex
            obj = {}
            obj.name = idName
            obj.mainCategory = rating.key
            obj.subCategory = subrating.key
            axisDisplayNameArray.push obj.name
            if mainRatings.indexOf(rating.key) == -1
              mainRatings.push rating.key
              obj.isCategory = true
            arr.push obj

      [arr, axisDisplayNameArray]


    createTotalScoreCells = (totalscores, textDisplayMode, invertColor) ->
      _i = 0
      totalscores_1 = totalscores
      while _i < totalscores_1.length
        totalScoreObj = totalscores_1[_i]
        x_1 = totalScoreObj.name + '_' + _i
        y_1 = TOTAL_SCORE_ROW
        z_1 = totalScoreObj[displayTotalAttr]
        _a = getCoordinates(x_1, y_1)
        xcoor_1 = _a.xcoor
        ycoor_1 = _a.ycoor
        createCell new StandardCell(xcoor_1, ycoor_1, z_1, textDisplayMode, invertColor, totalScoreObj.total_rating, null, showDecimalPlaces)
        _i++
      x = HEADER
      y = TOTAL_SCORE_ROW
      z = TOTAL_SCORE_ROW_TEXT
      _b = getCoordinates(x, y)
      xcoor = _b.xcoor
      ycoor = _b.ycoor
      if MANAGER_AXIS is 'X'
        createCell new LeftCategoryHeader(xcoor, ycoor, z, MANAGER_AXIS)
      else
        createCell new TopCategoryHeader(xcoor, ycoor, z, MANAGER_AXIS)
      return

    createScoreCells = (members, textDisplayMode, invertColor) ->
      for member in members
        memberRating = member.rating
        name = member.key
        for rating in memberRating
          for subrating, subRatingIndex in rating.value
            if categoryOnly and rating.group_id == subrating.group_id
              score = if !showDecimalPlaces and displayAttr == 'score_value' then Math.round(subrating[displayAttr]) else subrating[displayAttr]
              modifiedSubRating = rating.key.replace(/ /g,'') + '_' + subrating.key.replace(/ /g,'') + '_' + subRatingIndex
              _a = getCoordinates(name, modifiedSubRating)
              xcoor = _a.xcoor
              ycoor = _a.ycoor
              weightage = if showWeightages then subrating.weightage else null
              createCell new StandardCell(xcoor, ycoor, score, textDisplayMode, invertColor, subrating.value, weightage, showDecimalPlaces)
            else if !categoryOnly
              score = if !showDecimalPlaces and displayAttr == 'score_value' then Math.round(subrating[displayAttr]) else subrating[displayAttr]
              modifiedSubRating = rating.key.replace(/ /g,'') + '_' + subrating.key.replace(/ /g,'') + '_' + subRatingIndex
              _a = getCoordinates(name, modifiedSubRating)
              xcoor = _a.xcoor
              ycoor = _a.ycoor
              weightage = if showWeightages then subrating.weightage else null
              createCell new StandardCell(xcoor, ycoor, score, textDisplayMode, invertColor, subrating.value, weightage, showDecimalPlaces)


    processHeatmapData = (textDisplayMode, rawData, sortState, invertColor, hide_dates) ->
      rawApiData = rawData
      members = rawApiData["members"]
      if sortState
        sortMembers(sortState)

      leftTextColumn = rawApiData["textleftcol"]
      textColumnCount = leftTextColumn.length
      # memberNames = members.map((member) ->
      #   member.name
      # )
      if rawApiData["computed"]
        if showAverageFirst
          members = rawApiData["computed"].concat(rawApiData["members"])
        else
          members = rawApiData["members"].concat(rawApiData["computed"])

      memberNames = []
      memberNameKeys = []
      for member, index in members
        name_to_be_used = if hide_dates then member.name_without_dates else member.name
        member.key =  name_to_be_used + '_' + index
        member.name_to_be_used = name_to_be_used
        memberNames.push  {name: name_to_be_used, key: name_to_be_used + '_' + index}
        memberNameKeys.push  name_to_be_used + '_' + index

      ratingCategories = getRatingCategories(members[0].rating)
      memberTotalScores = members.map((member) ->
        scoreobj = {}
        scoreobj['name'] = member.name_to_be_used
        scoreobj['total_score'] = member.total_score
        scoreobj['total_rating'] = member.total_rating
        scoreobj
      )
      setAxisLabels memberNameKeys, ratingCategories[1]
      setCellDimensions(ratingCategories[0])
      setDimensionsForCellClasses()
      createTopLeftCell()
      createManagerHeaderCells memberNames
      createRatingHeaderCells ratingCategories[0]
      createTotalScoreCells memberTotalScores, textDisplayMode, invertColor
      createScoreCells members, textDisplayMode, invertColor
      return



class Cell
  constructor: (xcoor, ycoor, z, width, height) ->
    @xcoordinate = xcoor
    @ycoordinate = ycoor
    @z = z
    @width = width
    @height = height

class Header extends Cell
  constructor: (xcoor, ycoor, z, width, height) ->
    super(xcoor, ycoor, z, width, height)
    @isTextDisplayed = true
    # @isBold = true

class LeftHeader extends Header
  constructor: (xcoor, ycoor, z, isLeftAligned) ->
    super(xcoor, ycoor, z, LeftHeader.width, LeftHeader.height)
    @isLeftAligned = if isLeftAligned then isLeftAligned else false
    @isLeftHeader = true

class TopHeader extends Header
  constructor: (xcoor, ycoor, z) ->
    super(xcoor, ycoor, z, TopHeader.width, TopHeader.height)
    @isTopHeader = true
    @charsInHeaderCell = TopHeader.charsInHeaderCell
    @topHeaderCoordinate = TopHeader.topHeaderCoordinate
    @isCentered = true

class TopManagerHeader extends TopHeader
  constructor: (xcoor, ycoor, z) ->
    super(xcoor, ycoor, z)
    @hasWhiteText = true
    @hasDarkBackground = true

class LeftManagerHeader extends LeftHeader
  constructor: (xcoor, ycoor, z) ->
    isLeftAligned = true
    super(xcoor, ycoor, z, isLeftAligned)
    @hasWhiteText = true
    @hasDarkBackground = true

class StandardCell extends Cell
  constructor: (xcoor, ycoor, z, isTextDisplayed, isInvertColor, colorValue, weightage, showDecimalPlaces) ->
    if colorValue is 0
      @isNoValueCell = true
    super(xcoor, ycoor, z, StandardCell.width, StandardCell.height)
    @isTextDisplayed = if isTextDisplayed then true else false
    @isBorderHidden = false
    @colorValue = colorValue
    @weightage = weightage
    @showDecimalPlaces = showDecimalPlaces

class TopLeftCell extends LeftHeader
  constructor: (xcoor, ycoor, z, axis) ->
    super(xcoor, ycoor, z, axis)
    @isTopHeader = true
    @height = TopHeader.height
    @topHeaderCoordinate = TopHeader.topHeaderCoordinate
    if axis is "X"
      @hasDarkBackground = true
    else
      @hasGreyBackground = true

class LeftTopCell extends TopHeader
  constructor: (xcoor, ycoor, z, axis) ->
    super(xcoor, ycoor, z, axis)
    @isTopHeader = true
    @width = LeftHeader.width
    if axis is "X"
      @hasDarkBackground = true
    else
      @hasGreyBackground = true

class LeftCategoryHeader extends LeftHeader
  constructor: (xcoor, ycoor, z, axis) ->
    super(xcoor, ycoor, z, axis)
    if axis is "X"
      @hasGreyBackground = true
      @isBold = true
    else
      @isBold = false
      @strokeWhite = true
      @hasDarkBackground = false

class LeftSubCategoryHeader extends LeftHeader
  constructor: (xcoor, ycoor, z, axis) ->
    super(xcoor, ycoor, z, axis)
    @isItalicized = true
    @isBold = false
    @isIndented = true

class TopCategoryHeader extends TopHeader
  constructor: (xcoor, ycoor, z, axis) ->
    super(xcoor, ycoor, z, axis)
    if axis is "X"
      @hasGreyBackground = false
      @hasWhiteText = true
      @isBold = false
    else
      @isBold = true
      @hasWhiteText = false
      @hasGreyBackground = true

class TopSubCategoryHeader extends TopCategoryHeader
  constructor: (xcoor, ycoor, z, axis) ->
    super(xcoor, ycoor, z, axis)
    @isItalicized = true
    @isBold = false

class LeftTextColumn extends LeftHeader
  constructor: (xcoor, ycoor, z) ->
    super(xcoor, ycoor, z)

class HighlightedColumn extends Cell
  constructor: (xcoor, ycoor, z, width, height) ->
    super(xcoor, ycoor, z, width, height)
    @isBorderHidden = true
    @isHighlightBgCell = true
