class ViewQuestionTagsController extends ModalController

  @register 'ViewQuestionTagsController'

  @inject '$uibModalInstance', 'template', 'Restangular', 'toaster', '$timeout', '$state'

  initialize: ->
    @questionTags = []
    @selectedTab = 'QuestionTags'
    @newRatingArray = []
    @customTagsArr = []
    @sections = []
    @isAbsolute = false
    @loading = true
    @ratingTags = []
    @selectedSection = null
    if @template?
      @Restangular.all('questions').customGET('', {template_id: @template.id}).then (response) =>
        @questionTags = response
        @sections = @getSections()
        @getRatingScheme()
        for everyQuestionTag in @questionTags
          everyQuestionTag.copyKey = '{{' + @template.id + '_' + everyQuestionTag.group_id + '_1}}'
          everyQuestionTag.copyCommentKey = '{{comment_' + @template.id + '_' + everyQuestionTag.group_id + '_1}}'
        @questionTagsCopy = angular.copy @questionTags
    @getCustomTags()

  goToTemplateView: ->
    @close('close')


  filtersQuestionTags: =>
    if @selectedSection
      @questionTags = _(@questionTagsCopy).filter (questionTag) => questionTag.sectionID == @selectedSection

  getCopyParams: (value) =>
    params = {}
    if @isAbsolute
      params.copyKey = '{{' + 'rating_' + value + '_1}}'
      params.copyKeyName = '{{' + 'ratingname_' + value + '_1}}'
    else
      params.copyKey = '{{' + 'score_' + value + '_1}}'
      params.copyKeyName = '{{' + 'ratingname_' + value + '_1}}'
      params.copyKeyColor = '{{' + 'rating_' + value + '_1}}'
    params

  getRatingTags: =>
    @Restangular.all('reports/new/rating_tags').customGET('', {template_id: @template.id}).then (response) =>
      @ratingTags = response
      @$timeout =>
        for category in @ratingTags
          category.copyParams = @getCopyParams(category.group_id)
          if category.ratings and category.ratings.length
            for subCategory in category.ratings
              subCategory.copyParams = @getCopyParams(subCategory.group_id)
              if subCategory.ratings.length
                for question in subCategory.ratings
                  question.copyParams = @getCopyParams(question.group_id)

  getRatingScheme: =>
    @loading_custom_fields = true
    @Restangular.one('templates',@template.id).one('versions',@template.version).all('TemplateRatingSchemeMappings').getList().then (response)=>
      if response.length > 0
        @selectedRatingScheme = response[0]
        if @selectedRatingScheme.rating_scale_mode == 'Absolute'
          @isAbsolute = true
        @getCustomFields(@selectedRatingScheme.rating_scheme_id)
        @getRatingTags()
      else
        @selectedRatingScheme = null
        @loading_custom_fields = false
      @loading = false
    ,(error)=>
      @loading = false
      @loading_custom_fields = false

  getCustomFields: (id)=>
    params =
      schema_type : 'rating'
      entity_id : id
    @Restangular.all('service/dvapi_service/get_custom_fields').post(params).then (response) =>
      @custom_fields = response.custom_fields.rating
      @loading_custom_fields = false
    ,(error)=>
      @loading_custom_fields = false

  getCustomTags: =>
    @Restangular.all('reports/new/custom_tags').getList().then (response) =>
      @customTagsArr = response
      @loading = false
      for everyCustomTag in @customTagsArr
        if everyCustomTag.item4 == 'Report'
          everyCustomTag.copyKey = "{{"+everyCustomTag.item2+"}}"
        else
          everyCustomTag.copyKey = '{{' + @template.id + '_' + everyCustomTag.item2 + '_1}}'

  copyTags: (type) =>
    message = type + ' tag(s) successfully copied'
    @toaster.pop 'success', '', message

  getCopyText: (tag, type) ->
    text = ""
    if type == 'QuestionTags'
      text = '{{' + @template.id + '_' + tag.id + '_1}}'
    else if type == 'ReportTags'
      text = '{{' + @template.id + '_' + tag.sectionID + '_1}}'
    else if type == 'CustomTags'
      text = '{{' + @template.id + '_' + tag.value + '_1}}'
    text

  setActiveTab: (active_tab) =>
    @searchText = ""
    @selectedSection = null
    @selectedTab = active_tab

  clearFilters: =>
    @selectedSection = null
    @searchText = ""
    @questionTags = _(@questionTagsCopy).filter (questionTag) => questionTag.id

  getSections: =>
    arr = []
    dupes = []
    for entry in @questionTags
      if dupes.indexOf(entry.sectionID) == -1
        arr.push {id: entry.sectionID, name: entry.section_name}
        dupes.push entry.sectionID
    arr

  selectCategory: (category)=>
    @selectedTotalScore = null
    @selectedCategory.active = false if @selectedCategory
    category.active = true
    @selectedCategory = category
    @selectedSubcategory = category

  selectSubCategory: (subCategory, category)=>
    @selectedTotalScore = null
    @selectedSubcategory.active = false if @selectedSubcategory
    subCategory.active = true
    @selectedSubcategory = subCategory
    @selectedCategory = category

  selectTotalScore: =>
    @selectedTotalScore = {}
    @selectedCategory.active = false if @selectedCategory
    @selectedSubcategory.active = false if @selectedSubcategory
    @selectedTotalScore.copyParams = @getCopyParams('project')