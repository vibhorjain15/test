angular.module('diligenceVault').factory 'Utils', (baseData, $injector, $window, keywordConstants,USER_ROLES) ->

  new class Utils

    recordsPerPage = 10
    selectedColors = [ '#264E86', '#20BF55', '#D14549', '#01BAEF', '#BAD75E', '#B576AD', '#757575', '#E6A71E' ]

    selectedHeatmapColors =  ["#cc3232" , "#db7b2b" , "#e7b416" , "#99c140" , "#4CAF50"]

    iconsList = [{'name': 'Update', 'icon': 'bolt'}, {'name': 'Related Entities', 'icon': 'linked-items'},  {'name': 'Under Review', 'icon': 'under-construction-2'}, {'name': 'Overview', 'icon': 'overview'}, {'Cloud based': 'cloud-lock', 'icon': 'cloud-lock'}, {'name': 'Checklist', 'icon': 'check-all'}, {'name': 'Investor', 'icon': 'investor'}, {'name': 'Org Chart', 'icon': 'branches'}, {'name': 'Score', 'icon': 'scoring'}, {'name': 'Analytics', 'icon': 'analytics2'}, {'name': 'Performance', 'icon': 'bar-graph'}, {'name': 'Research', 'icon': 'binoculars'}, {'name': 'Analytics 2', 'icon': 'computer-statistics'}, {'name': 'Workflow', 'icon': 'controls'}, {'name': 'Meeting', 'icon': 'handshake'}, {'name': 'payment-cogs', 'icon': 'payment-cogs'}, {'name': 'Startup', 'icon': 'rocket'}, {'name': 'tools', 'icon': 'tools'}, {'name': 'Team', 'icon': 'users'}, {'name': 'Team 2', 'icon': 'team'}, {'name': 'secure', 'icon': 'secure'}, {'name': 'History', 'icon': 'history'}, {'name': 'Notes', 'icon': 'notepad'}, {'name': 'Privacy', 'icon': 'privacy'}, {'name': 'access-level', 'icon': 'access-level'}, {'name': 'Assets', 'icon': 'aum'}, {'name': 'Strategy', 'icon': 'strategy'}, {'name': 'Meeting 2', 'icon': 'meeting'}, {'name': 'thunder', 'icon': 'thunder'}, {'name': 'Follow', 'icon': 'follow-fund'}, {'name': 'New Fund', 'icon': 'add-fund'}, {'name': 'New Contact', 'icon': 'add-user'}, {'name': 'compare', 'icon': 'compare'}, {'name': 'manager', 'icon': 'manager'}, {'name': 'file-doc', 'icon': 'file-doc'}, {'name': 'file-docx', 'icon': 'file-docx'}, {'name': 'readonly', 'icon': 'readonly'}, {'name': 'document-question', 'icon': 'document-question'}, {'name': 'doubt', 'icon': 'doubt'}, {'name': 'follow-up', 'icon': 'follow-up'}, {'name': 'raise-hand', 'icon': 'raise-hand'}, {'name': 'fund', 'icon': 'fund'}, {'name': 'analytics', 'icon': 'analytics'}, {'name': 'monitor', 'icon': 'monitor'}, {'name': 'chart', 'icon': 'chart'}, {'name': 'analyze', 'icon': 'analyze'}, {'name': 'gears', 'icon': 'gears'}, {'name': 'manage', 'icon': 'manage'}, {'name': 'bulb', 'icon': 'bulb'}, {'name': 'dash', 'icon': 'dash'}, {'name': 'grid', 'icon': 'grid'}, {'name': 'na', 'icon': 'na'}, {'name': 'file-plus', 'icon': 'file-plus'}, {'name': 'coffee', 'icon': 'coffee'}, {'name': 'picture', 'icon': 'picture'}, {'name': 'upload2', 'icon': 'upload2'}, {'name': 'Attachment', 'icon': 'attachment'}, {'name': 'Tweet', 'icon': 'retweet'}, {'name': 'Key', 'icon': 'key'}, {'name': 'Domicile', 'icon': 'location'}, {'name': 'Email', 'icon': 'mail'}, {'name': 'Due Date', 'icon': 'calendar'}, {'name': 'add-user-4', 'icon': 'add-user-4'}, {'name': 'th', 'icon': 'th'}, {'name': 'arrow-back', 'icon': 'arrow-back'}, {'name': 'Phone', 'icon': 'phone'}, {'name': 'Share', 'icon': 'share'}, {'name': 'Copy', 'icon': 'clone'}, {'name': 'file-add', 'icon': 'file-add'}, {'name': 'file', 'icon': 'file'}, {'name': 'Dots', 'icon': 'dots-three-vertical'}, {'name': 'Ratings 2', 'icon': 'star-half'}, {'name': 'page-break', 'icon': 'page-break'}, {'name': 'movie', 'icon': 'movie'}, {'name': 'Excel', 'icon': 'file-excel'}, {'name': 'git-compare', 'icon': 'git-compare'}, {'name': 'sign-out', 'icon': 'sign-out'}, {'name': 'bars', 'icon': 'bars'}, {'name': 'mobile', 'icon': 'mobile'}, {'name': 'Not Applicable', 'icon': 'not-applicable'}, {'name': 'copy', 'icon': 'copy'}, {'name': 'Info', 'icon': 'info'}, {'name': 'pushpin', 'icon': 'pushpin'}, {'name': 'add-user-3', 'icon': 'add-user-3'}, {'name': 'user-check', 'icon': 'user-check'}, {'name': 'pause2', 'icon': 'pause2'}, {'name': 'home', 'icon': 'home'}, {'name': 'scores', 'icon': 'scores'}, {'name': 'Pause', 'icon': 'pause'}, {'name': 'check2', 'icon': 'check2'}, {'name': 'font', 'icon': 'font'}, {'name': 'Image', 'icon': 'image'}, {'name': 'underline', 'icon': 'underline'}, {'name': 'pie-chart', 'icon': 'pie-chart'}, {'name': 'external-link', 'icon': 'external-link'}, {'name': 'Table', 'icon': 'table'}, {'name': 'bell', 'icon': 'bell'}, {'name': 'circle', 'icon': 'circle'}, {'name': 'powerpoint', 'icon': 'powerpoint'}, {'name': 'search', 'icon': 'Search'}, {'name': 'star', 'icon': 'star'}, {'name': 'Star', 'icon': 'star-o'}, {'name': 'user', 'icon': 'user'}, {'name': 'check', 'icon': 'check'}, {'name': 'close', 'icon': 'close'}, {'name': 'remove', 'icon': 'remove'}, {'name': 'times', 'icon': 'times'}, {'name': 'cog', 'icon': 'cog'}, {'name': 'gear', 'icon': 'gear'}, {'name': 'Clock', 'icon': 'clock-o'}, {'name': 'refresh', 'icon': 'refresh'}, {'name': 'Flag', 'icon': 'flag'}, {'name': 'tag', 'icon': 'tag'}, {'name': 'bookmark', 'icon': 'bookmark'}, {'name': 'print', 'icon': 'print'}, {'name': 'pencil', 'icon': 'pencil'}, {'name': 'Left', 'icon': 'chevron-left'}, {'name': 'Right', 'icon': 'chevron-right'}, {'name': 'Plus', 'icon': 'plus-circle'}, {'name': 'Minus', 'icon': 'minus-circle'}, {'name': 'check-circle', 'icon': 'check-circle'}, {'name': 'question-circle', 'icon': 'question-circle'}, {'name': 'ban', 'icon': 'ban'}, {'name': 'mail-forward', 'icon': 'mail-forward'}, {'name': 'expand', 'icon': 'expand'}, {'name': 'compress', 'icon': 'compress'}, {'name': 'plus', 'icon': 'plus'}, {'name': 'minus', 'icon': 'minus'}, {'name': 'Fire', 'icon': 'fire'}, {'name': 'Eye', 'icon': 'eye'}, {'name': 'Alert', 'icon': 'exclamation-triangle'}, {'name': 'Warning', 'icon': 'warning'}, {'name': 'Up', 'icon': 'chevron-up'}, {'name': 'Down', 'icon': 'chevron-down'}, {'name': 'cogs', 'icon': 'cogs'}, {'name': 'Approve', 'icon': 'thumbs-o-up'}, {'name': 'Not Approved', 'icon': 'thumbs-o-down'}, {'name': 'upload', 'icon': 'upload'}, {'name': 'Tasks', 'icon': 'tasks'}, {'name': 'Screen', 'icon': 'filter'}, {'name': 'Proposal', 'icon': 'briefcase'}, {'name': 'Square', 'icon': 'square'}, {'name': 'Comment', 'icon': 'comment-o'}, {'name': 'comments-o', 'icon': 'comments-o'}, {'name': 'angle-left', 'icon': 'angle-left'}, {'name': 'angle-right', 'icon': 'angle-right'}, {'name': 'angle-up', 'icon': 'angle-up'}, {'name': 'angle-down', 'icon': 'angle-down'}, {'name': 'smile-o', 'icon': 'smile-o'}, {'name': 'unlock-alt', 'icon': 'unlock-alt'}, {'name': 'ellipsis-h', 'icon': 'ellipsis-h'}, {'name': 'thumbs-up', 'icon': 'thumbs-up'}, {'name': 'thumbs-down', 'icon': 'thumbs-down'}, {'name': 'Firm', 'icon': 'institution'}, {'name': 'file-pdf-o', 'icon': 'file-pdf-o'}]

    dateRanges = {
      null:{
        'label':'No Filter'
        'value':null
        'range':{
          'startDate':moment()
          'endDate':moment()
        }
      }
      1:{
        'label':'Last 1 Month'
        'value':1
        'range':{
          'startDate':moment().subtract(1, 'months')
          'endDate':moment()
        }
      }
      3:{
        'label':'Last 3 Months'
        'value':3
        'range':{
          'startDate':moment().subtract(3, 'months')
          'endDate':moment()
        }
      }
      6:{
        'label':'Last 6 Months'
        'value':6
        'range':{
          'startDate':moment().subtract(6, 'months')
          'endDate':moment()
        }
      }
      12:{
        'label':'Last 1 Year'
        'value':12
        'range':{
          'startDate':moment().subtract(1, 'year')
          'endDate':moment()
        }
      }
    }

    isAdmin: ->
      baseData.currentUser.isAdmin

    isDefaultHomePage: ->
      baseData.email_notifications.home_page in ['default', '', null]
      
    isAdminOnly: ->
      baseData.currentUser.firmwide_role.toLowerCase() == USER_ROLES.ADMIN

    isSecurityAdmin: ->
      baseData.currentUser.firmwide_role.toLowerCase() == USER_ROLES.SECURITYADMIN

    isBusinessAdmin: ->
      baseData.currentUser.firmwide_role.toLowerCase() == USER_ROLES.BUSINESSADMIN

    hasFirmWideRole: ->
      baseData.currentUser.hasFirmWideRole

    isReadOnly: ->
      baseData.currentUser.isReadOnly

    isOwner: ->
      baseData.currentUser.firmwide_role.toLowerCase() == USER_ROLES.OWNER

    hasMultipleAccounts: ->
      baseData.currentUser.firmAccessCount > 1

    isFirstLogin: ->
      @getCurrentUser().isFirstLogin

    getSkipIntro: ->
      @getCurrentUser().skip_tour

    isFirstDD: ->
      @getCurrentUser().isFirstDD

    allowRichTextarea: ->
      @getCurrentFirm().allowRichTextarea

    isDocToHtmlEnabled: ->
      @getCurrentFirm().isDocToHtmlEnabled

    isFirstTemplate: ->
      @getCurrentUser().isFirstTemplate

    isFreeSubscription: ->
      @getSubscriptionLevel() is 'Free'

    isSmartSubscription: ->
      @getSubscriptionLevel() is 'Smart'

    isProductiveSubscription: ->
      @getSubscriptionLevel() is 'Productive'

    isProductiveInvestorSubscription: ->
      @isProductiveSubscription() && @isInvestor()

    isInstitutionalSubscription: ->
      @getSubscriptionLevel() is 'Institutional'

    disableShowPresentationModule: ->
      !@getFirmPreferences().show_presentation_module

    isPowerBISubscription: ->
      @getFirmPreferences().enable_powerbi_reports

    isFormADVSubscription: ->
      @getSubscriptionLevel() is 'FormADV'

    getLongestString: (arr) ->
      lgth = 0
      longest = undefined
      i = 0
      while i < arr.length
        if arr[i].length > lgth
          lgth = arr[i].length
          longest = arr[i]
        i++
      longest

    isFormADVAnalyticsSubscription: ->
      @getSubscriptionLevel() is 'FormADVAnalytics'

    isFullSubscription: ->
      @getSubscriptionLevel() is 'Full'

    isFundSubscription: ->
      @getSubscriptionType() is 'Fund'

    isVendorSubscription: ->
      @getSubscriptionType() is 'Vendor'

    isDocumentUploadByCurrentFirm: (creatorId) =>
      return Boolean(@getCurrentUser().firmInfo.id == creatorId)

    isCurrentUserFirmOwner: (id) =>
      return Boolean(@getCurrentUser().firmInfo.id == id)

    endUserAgreementAccepted: -> @getCurrentUser().eucAccepted

    discussAgreementAccepted: -> @getCurrentUser().discussEUCAccepted

    getSubscriptionLevel : -> @getCurrentUser().firmInfo.subscription

    # needs to pick the first element of the array. In the future will get the users to select one if they have more
    # than one subscription.
    getSubscriptionType : -> baseData.subscription_limits[0].type_id

    getSubscriptionLimit : -> baseData.subscription_limits[0].limit

    getCurrentSubscription : -> baseData.subscription_limits[0]

    isInvestor: -> @getCurrentUser().type is 'investor'

    isManager: -> @getCurrentUser().type is 'manager'

    isFreeInvestor: -> @getCurrentUser().type is 'investor' and @getSubscriptionLevel() is 'Free'

    isFreeManager: -> @getCurrentUser().type is 'manager' and @getSubscriptionLevel() is 'Free'

    getEntityType: =>
      if @getCurrentSubscription().type_id is 'Fund'
        return 'Product'
      else if @getCurrentSubscription().type_id is 'Vendor'
        return 'Vendor'
      else
        return 'Product'

    getEntityCTA: =>
      if @getCurrentSubscription().type_id is 'Fund'
        return 'Investor Outreach'
      else if @getCurrentSubscription().type_id is 'Vendor'
        return 'Client Outreach'
      else
        return 'Outreach'


    getEntitySubType: =>
      if @getCurrentSubscription().type_id is 'Fund'
        return 'Classification'
      else if @getCurrentSubscription().type_id is 'Vendor'
        return 'Type'
      else
        return 'Classification'

    getDVEntityDisplayName: =>
      if @getCurrentSubscription().type_id is 'Fund' && @isInvestor()
        return 'Manager'
      else if @getCurrentSubscription().type_id is 'Fund' && !@isInvestor()
        return 'Investor'
      else if @getCurrentSubscription().type_id is 'Vendor' && @isInvestor()
        return 'Vendor'
      else if @getCurrentSubscription().type_id is 'Vendor' && !@isInvestor()
        return 'Client'

    isApprover: -> @getCurrentUser().is_approver

    hideGroupByIntro: -> @getCurrentUser().group_by_intro

    getGroupByIntroDisplayOption: -> @displayGroupByIntro

    setGroupByIntroDisplayOption: (value) =>
      @displayGroupByIntro = value

    hideReviewFunctionalityIntro: -> @getCurrentUser().review_functionality_intro

    getReviewFunctionalityIntroDisplayOption: -> @displayReviewFunctionalityIntro

    setReviewFunctionalityIntroDisplayOption: (value) =>
      @displayReviewFunctionalityIntro = value

    goToCurrentFirmProfile: ->
      $state = $injector.get('$state')
      $state.go 'app.firm.settings.profile'

    getCurrentUser: -> baseData.currentUser

    getCurrentFirm: -> @getCurrentUser().firmInfo

    # getUiVersion: -> @getCurrentUser().firmInfo.preferences.ui_version
    isAngular: -> @getCurrentUser().firmInfo.preferences.ui_version == 'Angular'
    isTemplateAngular: ->
      @isAngular() && JSON.parse(@getCurrentUser().firmInfo.preferences.module_ui_version).template_ui_version == 2

    isQuestionnaireAngular: ->
      @isAngular() && JSON.parse(@getCurrentUser().firmInfo.preferences.module_ui_version).questionnaire_ui_version == 2

    isParserAngular: ->
      @isAngular() && JSON.parse(@getCurrentUser().firmInfo.preferences.module_ui_version).parser_ui_version == 2

    isAngularJS: -> @getCurrentUser().firmInfo.preferences.ui_version != 'Angular'
    #isAngularJS: -> true

    serializeObject: (obj) ->
      return obj unless obj

      _(obj).map((value, key) ->
        encodeURIComponent(key) + '=' + encodeURIComponent(value)
      ).join '&'

    groupSections: (sections, skip_questions) ->
      sections = _(sections).sortBy((section) ->
        !section.isParent
      )
      grouped_sections = []
      section_map = {}

      _(sections).each (section) ->
        if section.isParent
          section.subSections = []

          if skip_questions or section.questions.length
            section.subSections.push section

          section_map[section.id] = section
          grouped_sections.push section
        else
          if skip_questions or section.questions.length
            section_map[section.parentID].subSections.push section

      unless skip_questions
        grouped_sections = _(grouped_sections).filter((section) ->
          section.subSections.length
        )

      grouped_sections

    getGrantMap: ->
      manager: @isManager()
      investor: @isInvestor()
      admin: @isAdmin()
      securityAdmin: @isSecurityAdmin()
      businessAdmin: @isBusinessAdmin()
      readOnly: @isReadOnly()
      hasMultipleAccounts: @hasMultipleAccounts()
      'FreeSubscription': @isFreeSubscription()
      'SmartSubscription': @isSmartSubscription()
      'ProductiveSubscription': @isProductiveSubscription()
      'ProductiveInvestorSubscription': @isProductiveInvestorSubscription()
      'InstitutionalSubscription': @isInstitutionalSubscription()
      'FormADVSubscription': @isFormADVSubscription()
      'FormADVAnalyticsSubscription': @isFormADVAnalyticsSubscription()
      'FullSubscription': @isFullSubscription()
      'FundSubscription': @isFundSubscription()
      'VendorSubscription': @isVendorSubscription()
      'FreeInvestor': @isFreeInvestor()
      'FreeManager': @isFreeManager()
      'hidePresentationModule': @disableShowPresentationModule()
      'DiligenceVaultUser': @isDiligencevaultUser()
      'PowerBISubscription': @isPowerBISubscription()
      'angularView': @isAngular()
      'angularJSView': @isAngularJS()

    isDiligencevaultUser: ->
      current_user = @getCurrentUser()
      userName = current_user.userName
      userName.toLowerCase().indexOf('diligencevault.com') > -1

    isAuthorized: (grant_map, accessible_to, hidden_from) ->
      result = true

      if accessible_to?
        result = result && _(accessible_to).any((role) -> grant_map[role])

      if hidden_from?
        result = result && not _(hidden_from).any((role) -> grant_map[role])

      result

    getLazyLoadableTemplateFor: (templateName) ->
      "/assets/lazy-loadable-templates/#{templateName}.html"

    logError: (title, data) ->
      return unless $window._errs?

      #added try catch block to throw new error
      try
        throw new Error(title)
      catch exception
        #this exception object has the stack trace object which is needed for posting error to errorception
        current_user = @getCurrentUser()
        _errs.meta = _(current_user).pick('id', 'userName', 'type', 'isAdmin','isReadOnly', 'firstName', 'lastName', 'firmAccessCount')
        _errs.meta.angularVersion = 'angularJs'

        if data.config and data.config.headers
          delete data.config.headers

        if data?
          _errs.meta.data = angular.toJson(data)

        _errs.push(exception)

    filterOut: (collection, cb) -> #returns filtered list simultaneously removing them from the parent list
      filtered = []
      ref = [].slice.call(collection)
      collection.length = 0

      _(ref).each (entity) ->
        if cb(entity)
          filtered.push(entity)
        else
          collection.push(entity)

      filtered


    capitalize: (str) ->
      "#{str[0].toUpperCase()}#{str.slice(1).toLowerCase()}"

    supplant: (str, o) ->
      str.replace /\*\|([^\*\|\|\*]*)\|\*/g, (a, b) ->
        r = o[b.toLowerCase().trim()]
        if typeof r == 'string' or typeof r == 'number' then r else a

    convertToMillion: (number) ->
      number = parseInt(number)/1000000
      number = Math.round(number * 100) / 100
      number.toLocaleString('en', {minimumFractionDigits:2})

      number

    convertToBillion: (number) ->
      number = parseInt(number)/1000000000
      number = Math.round(number * 100) / 100
      number.toLocaleString('en', {minimumFractionDigits:2})

      number


    isColorLightOrDark: (color) ->
      # Variables for red, green, blue values
      r = undefined
      g = undefined
      b = undefined
      hsp = undefined
      # Check the format of the color, HEX or RGB?
      if color.match(/^rgb/)
        # If HEX --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/)
        r = color[1]
        g = color[2]
        b = color[3]
      else
        # If RGB --> Convert it to HEX: http://gist.github.com/983661
        color = +('0x' + color.slice(1).replace(color.length < 5 and /./g, '$&$&'))
        r = color >> 16
        g = color >> 8 & 255
        b = color & 255
      # HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
      hsp = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b)
      # Using the HSP value, determine whether the color is light or dark
      if hsp > 150
        'light'
      else
        'dark'

    standardPluralize: (text) ->
      return pluralize(text)

    getRecordsPerPageNum: ->
      return recordsPerPage

    setRecordsPerPageNum: (num) ->
      recordsPerPage = num

    createQuestionnaireTree: (sections, other) ->
      onlyQuestions = _(other).filter (element) ->
        element.type == 'questions'

      questionsGroupedBySection = _(onlyQuestions).groupBy (question) -> question.attributes.sectionID

      _(sections).each (section) ->
        section.questions =  questionsGroupedBySection[section.attributes.id]

      subSections = _(sections).filter (section) -> !section.attributes.isParent
      sections = _(sections).filter (section) -> section.attributes.isParent

      groupedSubSections = _(subSections).groupBy (subSection) -> subSection.attributes.parentID

      _(sections).each (section) ->
        section.subSections = groupedSubSections[section.attributes.id]

      sections

    ipToNumber: (ip_address) ->
      return ip_address.split(".").reduce((x, y)-> +y + x * 256)

    getRangeOfIP: (ip_start, ip_end) ->
      return 1 + @ipToNumber(ip_end) - @ipToNumber(ip_start)

    getFirmPreferences: () ->
      @getCurrentUser().firmInfo.preferences

    getFirmColorScheme: () ->
      return if @getFirmPreferences().color_codes == null then selectedColors else @getFirmPreferences().color_codes

    getHeatmapColorScheme: () ->
      return if @getFirmPreferences().heatmap_color_codes == null then selectedHeatmapColors else @getFirmPreferences().heatmap_color_codes

    updateFirmColorScheme: (colorsList) ->
      baseData.currentUser.firmInfo.preferences.color_codes = [].concat colorsList

    updateFirmLogo: (logoUrl) ->
      baseData.currentUser.firmInfo.preferences.logo_link = logoUrl

    getDefaultColorScheme: () ->
      return selectedColors

    getIconList: () ->
      return [].concat iconsList

    getDate_from: (toDate, value, key)->
      moment(toDate).subtract(value,key)

    getFromDateTimeFormatted: (date) ->
      moment(date).set({'hour':0,'minute':0,'second':0,'millisecond':0}).format("YYYY-MM-DD HH:mm:ss")

    getToDateTimeFormatted: (date) ->
      moment(date).set({'hour':23,'minute':59,'second':59,'millisecond':999}).format("YYYY-MM-DD HH:mm:ss")

    getLocalDateTime: (date) ->
      moment(date).add(moment(date).utcOffset(), 'minutes')

    getMomentDateTime: (date, format)=>
      moment(date, format)

    getLocalDateTimeGeneric: (date)->
      @getLocalDateTime(date).toDate()

    getUtcDateTime: (date) ->
      moment(date).subtract(moment(date).utcOffset(), 'minutes')

    getUtcFromDateTimeFormatted: (date) ->
      @getFromDateTimeFormatted(@getUtcDateTime(date))

    getUtcToDateTimeFormatted: (date) ->
      @getToDateTimeFormatted(@getUtcDateTime(date))

    getUtcFromDateTime: (date)=>
      moment(@getUtcDateTime(date)).set({'hour':0,'minute':0,'second':0,'millisecond':0})

    getUtcToDateTime: (date)=>
      moment(@getUtcDateTime(date)).set({'hour':23,'minute':59,'second':59,'millisecond':999})

    formatDatetime: (date)=>
      moment(date).format("YYYY-MM-DD HH:mm:ss")

    formatDatetimeUtc: (date)=>
      moment(date).format("YYYY-MM-DDTHH:mm:ss")

    fillArray: (array, value) ->
      #custom method to fill the entire array with the passed value
      i = 0
      while i < array.length
        array[i] = value
        i++

    getObjectLength:(object)=>
      Object.keys(object).length

    datesInRange:(d,start,end)=>
      moment(d).isSameOrAfter(moment(start)) and moment(d).isSameOrBefore(moment(end))

    escapeHtmlString: (text)=>
      charMap = {
        '&': '\\&amp;'        #for &
        '<': '\\&lt;'         #for <
        '>': '\\&gt;'         #for >
        '"': '\\&quot;'       #for "
        "'": '\\&#039;'       #for '
        "/": '\\&sol;'
        "\\": '\\&bsol;'
      }

      text.replace(/[&<>"'/\\]/g, (m) =>
        return charMap[m]
      )

    unescapeHtmlString:(text)=>
      text.replace(/\\&amp;/g, "&")     #for &
        .replace(/\\&lt;/g, "<")        #for <
        .replace(/\\&gt;/g, ">")        #for >
        .replace(/\\&quot;/g, "\"")     #for "
        .replace(/\\&#039;/g, "'")      #for '

    getPredefinedDateRanges:(index) =>
      dateRange = angular.copy dateRanges[index].range
      dateRange.startDate = @getUtcFromDateTime(dateRange.startDate)
      dateRange.endDate = @getUtcToDateTime(dateRange.endDate)
      dateRange

    getDateRanges: =>
      dateRanges

    getExpiryClass: (expiryDate, isLabel) ->
      diff = moment(expiryDate).diff(moment(),'seconds')
      warningThreshold = 1296000    #15 days in seconds

      #There are 3 expiry date changes. A, B and C. If the question is not expiring we show in success-blue,
      #if its expiring in 15 days we show in warning-orange and if its expired then we show in grey.
      if isLabel
        expiryStyleData = {
          class: 'label label-primary'
          text: 'Expires'
        }
        if diff <= warningThreshold and diff >= 0
          expiryStyleData = {
            class : 'label label-warning'
            text : 'Expires'
          }
        else if diff < 0
          expiryStyleData = {
            class : 'label label-default'
            text : 'Expired'
          }
      else
        expiryStyleData = {
          class: 'text text-muted'
          text: ''
        }
        if diff <= warningThreshold and diff >= 0
          expiryStyleData = {
            class : 'text text-warning'
            text : ''
          }
        else if diff < 0
          expiryStyleData = {
            class : 'text text-danger'
            text : ''
          }
      expiryStyleData

    getDateRangeMap: =>
      map = {}
      _(dateRanges).each (dateRange)=>
        date = [@getUtcFromDateTime(dateRange.range.startDate),@getUtcToDateTime(dateRange.range.endDate)]
        map[dateRange['label']] = date
      map

    getColorCodeFromDomain: (score, domain)=>
      unless score
        return
      background_color = domain(score)
      if not background_color
        background_color = '#f5f5f5'
      fore_color = @pickTextColorBasedOnBgColorAdvanced(background_color)
      {
        color: fore_color
        'background-color': background_color
      }

    getColorCode: (score,rating_scales)=>
      unless score
        return
      scale = _(rating_scales).findWhere(value: Math.ceil(score))
      background_color = scale.color_code if scale
      if not background_color
        background_color = '#f5f5f5'
      fore_color = @pickTextColorBasedOnBgColorAdvanced(background_color)
      {
        color: fore_color
        'background-color': background_color
      }

    pickTextColorBasedOnBgColorAdvanced: (bgColor)=>
      color = if (bgColor.charAt(0) == '#') then bgColor.substring(1, 7) else bgColor
      r = parseInt(color.substring(0, 2), 16)
      g = parseInt(color.substring(2, 4), 16)
      b = parseInt(color.substring(4, 6), 16)
      uicolors = [r / 255, g / 255, b / 255]
      c = uicolors.map (col) =>
        if col <= 0.03928
          return col / 12.92
        return Math.pow((col + 0.055) / 1.055, 2.4)

      L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2])
      if (L > 0.179) then 'black' else 'white'

    getQueryParams : (params,url) =>
      href = url
      #get the query string from the url
      reg = new RegExp( '[?&]' + params + '=([^&#]*)', 'i' )
      queryString = reg.exec(href)
      if queryString then queryString[1] else null

    getDisplayEntityType: (entity_type)=>
      if entity_type
        display_name = ""
        _(keywordConstants).each (value,key)=>
          if value.toLowerCase() == entity_type.toLowerCase()
            display_name = key
        display_name

    getDisplayUserRole: (role)=>
      userRoles =
        superadmin: 'Super Admin'
        superowner: 'Owner'
        superviewer: 'Viewer'
        supercontributor: 'readwrite'
        restricted: 'Restricted'
        securityadmin: 'Security Admin'
        businessadmin: 'Business Admin'
      if role
        display_name = ""
        _(userRoles).each (value,key)=>
          if key.toLowerCase() == role.toLowerCase()
            display_name = value
        display_name

    sortProjectsByStatus: (statusA, statusB, rowA, rowB, direction)=>
      if statusA == statusB
        return 0
      else if statusA == 'Invited'
        return -1
      else if statusB == 'Invited'
        return 1
      else if statusA < statusB
        return -1
      else if statusA > statusB
        return 1

    replaceGlobally: (original, searchTxt, replaceTxt) =>
      regex = new RegExp(searchTxt, 'g')
      original.replace regex, replaceTxt

    getMaxAsOfDate: =>
      moment().add(2, 'weeks').toDate()

    getMaxAsOfDateDiligence: =>
      moment().add(1, 'month').toDate()

    getExcelColumnName: (num)=>
      ordA = 'a'.charCodeAt(0)
      ordZ = 'z'.charCodeAt(0)
      len = ordZ - ordA + 1

      columnName = ""
      while num >= 0
        columnName = String.fromCharCode(num % len + ordA) + columnName;
        num = Math.floor(num / len) - 1;
      columnName.toUpperCase()

    trimLineBreak: (string)=>
      string.replace(/^(<br \/>)+|(<br \/>)+$/g, '')

    countWords: (str)=>
      if str and str.length > 0
        str.trim().split(/\s+/).length
      else
        0

    removeHtmlStrings: (str)=>
      str.replace(/<[^>]*(>|$)|&nbsp;|&zwnj;|&raquo;|&laquo;|&gt;/g, ' ')

    generateTable: (rows, columns, grid_responses, responseType)=>
      table = "<div class='dvTable'><table class='table table-bordered table-condensed'>"
      tableClose = "</table></div>"

      rowTag = "<tr>"
      rowCloseTag = "</tr>"

      #Generate table header
      tableHeader = rowTag
      tableHeader += "<th></th>"                              #Column at index (0,0)
      _(columns).each (column)=>
          tableHeader += "<th>#{column.name}</th>"
      tableHeader += rowCloseTag

      #Generate table body
      tableBody = ""
      _(rows).each (row, rowIndex)=>
          tableNthRow = rowTag
          if responseType == 'Grid'
            rowName = row.name
          else
            rowName = rowIndex + 1
          tableNthRow += "<td><b>#{rowName}</b></td>"        #Append row header
          _(columns).each (column,colIndex)=>
              #get index of the item in the gridresponses object
              itemIndex = (columns.length * rowIndex) + colIndex
              text = if grid_responses[itemIndex].attributes.value then grid_responses[itemIndex].attributes.value else ''
              tableNthRow += "<td>#{text}</td>"
          tableNthRow += rowCloseTag
          tableBody += tableNthRow
      table += tableHeader + tableBody
      table += tableClose
      table

    isAssignedToUser: (verifier, functions)=>
      current_user = @getCurrentUser()
      if verifier
        if verifier.attributes.assigned_to_function_id and functions
          return verifier.attributes.assigned_to_function_id in functions
        else if verifier.attributes.assigned_to
          return verifier.attributes.assigned_to == current_user.id

    getAssignedToName: (verifier)=>
      if verifier
        if verifier.attributes.assigned_to_function_id
          return verifier.attributes.assigned_to_function_name
        else if verifier.attributes.assigned_to
          return verifier.attributes.assigned_to_name

    numberIsDecimal: (number)=>
      regexPattern = /^[-+]?[0-9]+\.*[0-9]*$/
      isDecimal = regexPattern.test(number.toString())
      isDecimal

    numberIsInteger: (number)=>
      regexPattern = /^[-+]?[0-9]+$/
      isInteger = regexPattern.test(number.toString())
      isInteger

    getIssueTrackerDefaultName: =>
      @getFirmPreferences().issue_tracker_default_name

    convert_number: (number)=>
      if number == null or number == "" or number == undefined or number == 0
        return "Zero"
      if number < 0 or number > 999999999
        return "Number out of range!"
      Gn = Math.floor(number / 10000000)  # Crore
      number -= Gn * 10000000
      kn = Math.floor(number / 100000)    # lakhs
      number -= kn * 100000
      Hn = Math.floor(number / 1000)      # thousand
      number -= Hn * 1000
      Dn = Math.floor(number / 100)       # Tens (deca)
      number = number % 100               # Ones
      tn = Math.floor(number / 10)
      one = Math.floor(number % 10)
      res = ""

      if Gn > 0
        res += "#{@convert_number(Gn)} CRORE"
      if kn > 0
        res += "#{if res then "" else " "}#{@convert_number(kn)} Lakh"
      if Hn > 0
        res += "#{if res then "" else " "}#{@convert_number(Hn)} Thousand"

      if Dn
        res += "#{if res then "" else " "}#{@convert_number(Dn)} Hundred"

      ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
      tens = ["", "", "Twenty", "Thirty", "Fourty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

      if tn > 0 or one > 0
        if not (res == "")
          res += " And "
        if tn < 2
          res += ones[tn * 10 + one]
        else
          res += tens[tn]

      if res == ""
        res = "Zero"
      return res

