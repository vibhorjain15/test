class InvestmentRatingsController extends BaseController
  @register 'InvestmentRatingsController'

  @inject '$scope', 'Restangular', 'Utils', '$q', 'toaster', '$state', 'baseUrl', '$http','SweetAlert','$timeout','ModalFactory','diligenceStatusConstant','responseStatus', 'headerConstants','ratingConstants','keywordConstants','angularEnabled','$window'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @diligenceTypeId = 1105
    @current_user = @Utils.getCurrentUser()
    @heatmap_options = {
      heatmap_orientation : "X"
      invertColor: false
    }
    @defaultVersion = 0
    @view_mode = 'tabbed'
    @loading = true
    @ratingChanged = false
    @ratingScaleMap = {}
    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
      @dueDiligenceID = diligence.id
      @entity_id = diligence.entity_id
      @entity_type = diligence.entity_type

      initPromise = []
      initPromise.push @getDefaultRatingScheme()
      initPromise.push @loadRatingSchemes()

      @$q.all(initPromise).then (response)=>
        selectedRatingSchemeID = if response[0] then response[0].rating_scheme_id else null
        @rating_types = response[1]
        selectedRatingType = _(@rating_types).find (type)=>
          type.id == selectedRatingSchemeID
        @loading = false
        if selectedRatingType
          @selectedRatingType = selectedRatingType
          @selectedRatingTypeBackup = selectedRatingType
          @loadRatings(selectedRatingSchemeID)
          
      if @current_user and @current_user.firmInfo
        permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
        if permissions_enabled
          @diligence.hasReadOnlyAccess = false
        else
          @diligence.isLocked = @diligence.isLocked || @diligence.hasReadOnlyAccess
      @getFirmPref()


      @selectedRatingTypeBackup = undefined
      @selectedRatingType = undefined
    @isManager = @Utils.isManager()
    if @isManager
      @$window.history.back()
      return

  onSelectedRatingChange: (newValue)=>
    #If a previous value exists for the rating type then show confirm before proceeding.
    if newValue and @selectedRatingTypeBackup?
      @SweetAlert.confirm({
        title: "Are you sure you want to change this rating?"
        text: 'Your previous ratings will be deleted'
        showLoaderOnConfirm: true
        focusCancel : true
        preConfirm: =>
          @postRatingType(newValue.id)
          @selectedRatingTypeBackup = newValue
      }).then (isConfirm) =>
        if isConfirm.dismiss and isConfirm.dismiss == true
          @selectedRatingType = @selectedRatingTypeBackup
          @$timeout =>
            swal.close()
    #else change the value directly
    else if newValue
      @postRatingType(newValue.id)
      @selectedRatingTypeBackup = newValue

  getCustomFields: (id)=>
    params =
      schema_type : 'rating'
      entity_id : id
    @Restangular.all('service/dvapi_service/get_custom_fields').post(params).then (response) =>
      @custom_fields = response.custom_fields.rating

  getDefaultRatingScheme: ->
    @Restangular.one('rating_scheme_defaults').customGET('',{entity_id: @dueDiligenceID, entity_type: 'DueDiligence'})

  loadRatingSchemes: ->
    @Restangular.all('rating_types').customGET('',{duediligence_id: @dueDiligenceID})

  postRatingType: (id) ->
    params=
      rating_scheme_id: id,
      entity_id: @dueDiligenceID,
      entity_type: 'Duediligence'

    @Restangular.all('rating_scheme_defaults').customPUT(params).then (response) =>
      @loadRatings(id)

      return

  getFirmPref: =>
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @reviewEnabled = @firm_preferences.enable_rating_custom_fields_review && @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
      @ratingsNotEditable = @diligence.diligence_type == 'dd_review' and @firm_preferences.enable_rating_custom_fields_review and (@diligence.status == @diligenceStatusConstant.COMPLETED or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW)

      if response.enable_yaxis_entity
          @heatmap_options.heatmap_orientation = "Y"

      if response.invert_color
          @heatmap_options.invertColor = response.invert_color

  loadRatings: (id) ->
    promises = []

    promises.push @Restangular.one('v2/rating_scales',@selectedRatingType.rating_scale_id).one('versions',@selectedRatingType.rating_scale_version).getList('rating_scale_definitions').then (rating_scale) =>
      @rating_scales = rating_scale
      noValueIndex = _(@rating_scales).findIndex (scale)=>
        parseInt(scale.value) == @ratingConstants.naValue

      if noValueIndex > -1
        @naValue = @rating_scales[noValueIndex]
        @rating_scales.splice(noValueIndex,1)

      if @rating_scales.length == 1
        @maxScore = 5
      else
        @maxScore = @rating_scales.length

    promises.push @Restangular.one('templates',@diligence.template_id).one('versions',@diligence.template_version).all('TemplateRatingSchemeMappings').getList().then (response)=>
      if response.length > 0 and @selectedRatingType.id == response[0].rating_scheme_id
        @ratingMappedToTemplate = true
      else
        @ratingMappedToTemplate = false

    if id
      promises.push @Restangular.all('ratings/profile').getList({entity_id: @dueDiligenceID, entity_type: 'DueDiligence', rating_scheme_id: id})
      promises.push @getCustomFields(id)
    else
      promises.push @Restangular.all('ratings/profile').getList({entity_id: @dueDiligenceID, entity_type: 'DueDiligence'})

    if @diligence.entity_type == 'Review'
      params =
        entity_type: @keywordConstants.Project
        entity_id: @diligence.id
    else
      params =
        entity_type: @diligence.entity_type
        entity_id: @diligence.entity_id

    promises.push @Restangular.all('function_assignments').getList(params).then (response)=>
      @entityFunctions = response

    promises.push @Restangular.one('diligences',@diligence.id).getList('MyFunctions').then (response)=>
      @myFunctions = response

    @loading = true
    @$q.all(promises).then (responses) =>
      @ratings = responses[2]
      @getRatingScaleForSubcategory()
      @ratingsBackup = angular.copy @ratings
      @ratingChanged = false

  getRatingScaleForSubcategory: =>
    promises = []
    _(@ratings).each (category)=>
      _(category.ratings).each (subcategory)=>
        @ratingScaleMap[subcategory.id] = {}
        if @selectedRatingType.rating_scale_mode == @ratingConstants.ScoreBand
          promises.push @Restangular.one('v2/rating_scales',subcategory.rating_scale_id).one('versions',@defaultVersion).getList('rating_scale_definitions').then (rating_scale) =>
            @ratingScaleMap[subcategory.id].rating_scales = rating_scale
            noValueIndex = _(@ratingScaleMap[subcategory.id].rating_scales).findIndex (scale)=>
              parseInt(scale.value) == @ratingConstants.naValue

            if noValueIndex > -1
              @ratingScaleMap[subcategory.id].naValue = @ratingScaleMap[subcategory.id].rating_scales[noValueIndex]
              @ratingScaleMap[subcategory.id].rating_scales.splice(noValueIndex,1)
        else
          @ratingScaleMap[subcategory.id].naValue = @naValue
          @ratingScaleMap[subcategory.id].rating_scales = @rating_scales

    @$q.all(promises).then (response)=>
      @getColorCodes()
      @loading = false

  setAggregateRating: (rating_subtype) ->
    rating_subtype.aggregate_rating = @getAggregateRating(rating_subtype.ratings)
    rating_subtype.aggregate_rating_label = @getAggregateRatingScaleLabel(rating_subtype.aggregate_rating)

  getAggregateRating: (categories) ->
    aggregate_rating = _(categories).reduce (sum, category) ->
      sum + (category.score || 0) * (category.weightage / 100)
    , 0

    parseInt((aggregate_rating).toPrecision(2) * 100) / 100 #rounding off to two decimals without flooring/ceiling

  getAggregateRatingScaleLabel: (value) ->
    return unless value

    delta = value - parseInt(value)
    value = if delta > 0.5 then Math.ceil(value) else Math.floor(value)

    _(@rating_scales).findWhere(value: value).name

  recordRating: (category) ->
    if @selectedRatingType.rating_scale_mode == @ratingConstants.Absolute and category.rating_value
      value = parseInt category.rating_value
    else if @selectedRatingType.rating_scale_mode == @ratingConstants.ScoreBand and category.score_value
      value = parseInt category.score_value
    else
      value = null

    params=
      value: value,
      entity_id: @dueDiligenceID,
      entity_type: 'Duediligence'
      ratingCategoryID: category.id
      response_id: category.response_id if category.response_id

    @Restangular.all('ratings').customPUT(params).then (response)=>
      category.rating_value = response.value
      @getColorCodes()
      @ratingsBackup = angular.copy @ratings
      @toaster.pop 'success', '', 'Your rating has been recorded successfully'
      @$timeout =>
        @ratingChanged = true
      , 2000

  getHeatmapResponse: =>
    params =
      entity_ids:
        duediligence: [@dueDiligenceID]
      include_portfolio: false
    @Restangular.one('rating_schemes',@selectedRatingType.id).all('rating_scores_analysis').post(params).then (response)=>
      @heatmapResponse = response

  toggleView: (view)=>
    @view_mode = view

  redirectToInvestmentRatings: ->
    @$state.go 'app.firm.settings.investment_rating.types'

  redirectToSummary: ->
    @$state.go '^.summary'

  getColorCodes: =>
    scaleArray = [1..@maxScore]
    colorScheme = _(@rating_scales).pluck ('color_code')
    colorScale = d3.scale.linear().domain(scaleArray).range(colorScheme)

    _(@ratings).each (level_one_category)=>
      _(level_one_category.ratings).each (level_two_category)=>
        _(level_two_category.ratings).each (level_three_ratings)=>
          if level_three_ratings.rating_value
            level_three_ratings.color_code = @Utils.getColorCodeFromDomain(level_three_ratings.rating_value,colorScale)
          else
            naValue = @ratingScaleMap[level_two_category.id].naValue
            fore_color = @Utils.pickTextColorBasedOnBgColorAdvanced(naValue.color_code)
            level_three_ratings.color_code = {
              color: fore_color
              'background-color': naValue.color_code
            }
        if level_two_category.rating_value
          level_two_category.color_code = @Utils.getColorCodeFromDomain(level_two_category.rating_value,colorScale)
        else
          naValue = @ratingScaleMap[level_two_category.id].naValue
          fore_color = @Utils.pickTextColorBasedOnBgColorAdvanced(naValue.color_code)
          level_two_category.color_code = {
            color: fore_color
            'background-color': naValue.color_code
          }
      if level_one_category.rating_value
        level_one_category.color_code = @Utils.getColorCodeFromDomain(level_one_category.rating_value,colorScale)
      else
        fore_color = @Utils.pickTextColorBasedOnBgColorAdvanced(@naValue.color_code)
        level_one_category.color_code = {
          color: fore_color
          'background-color': @naValue.color_code
        }
    @color_code = @Utils.getColorCodeFromDomain(@diligence.total_rating,colorScale)
  ###
    2 Modes :
    1) binary mode - where we consider weightage as score
    2) non binary mode -
        level 3 calculation : (ratings value * ratings weightage)
        level 2 calculation : (total score of level 3 scores / Weightage of category 2)
        level 1 calculation : (total score of level 2 scores / Weightage of category 1)
        total score : (total score of level 1 scores / 100) here we assume total weightage is 100 always.
  ###
  calculateRatings: =>
    binary_mode = if @rating_scales.length > 1 then false else true
    @total_score = 0
    _(@ratings).each (level_one_category)=>
      level_one_category.score = 0
      _(level_one_category.ratings).each (level_two_category)=>
        level_two_category.score = 0
        _(level_two_category.ratings).each (rating)=>
          if binary_mode
            score = rating.weightage
          else
            score = if rating.score then rating.weightage * rating.score else 0

          level_two_category.score = level_two_category.score + score

        if binary_mode
          level_two_category.final_score = (level_two_category.score / level_two_category.weightage) * 5
          level_one_category.score = level_one_category.score + level_two_category.score
        else
          level_two_category.final_score = level_two_category.score / level_two_category.weightage
          level_one_category.score = level_one_category.score + (level_two_category.final_score * level_two_category.weightage)
        level_two_category.color_code = @Utils.getColorCode(level_two_category.final_score,@rating_scales)

      if binary_mode
        level_one_category.final_score = (level_one_category.score * 5 / level_one_category.weightage)
        @total_score = @total_score + level_one_category.score
      else
        level_one_category.final_score = level_one_category.score / level_one_category.weightage
        @total_score = @total_score + (level_one_category.final_score * level_one_category.weightage)
      level_one_category.color_code = @Utils.getColorCode(level_one_category.final_score,@rating_scales)

    if binary_mode
      @total_score = (@total_score * 5)/100
    else
      @total_score = @total_score / 100
    @color_code = @Utils.getColorCode(@total_score,@rating_scales)

  linkHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value_url
    fieldsWithValue.length > 0

  fieldHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value
    fieldsWithValue.length > 0

  saveCustomFields: (rating, customFields)=>
    params =
      'entity_id': Number(@dueDiligenceID)
      'owner_user_id': @current_user.id
      'entity_type': @diligenceTypeId
      'schema_type': 'rating'
      'sub_entity_id': rating.id
      'custom_fields': []
    cFields = angular.copy customFields
    for selectedField in cFields
      switch selectedField.type
        when 'link'
          if @linkHasValue(selectedField.value)
            params.custom_fields.push selectedField
          else
            selectedField.value = []
            params.custom_fields.push selectedField
        when "checkbox"
          if @fieldHasValue(selectedField.value)
            if selectedField.otherOption
              otherOptionIndex = _(selectedField.value).findIndex (item)=>
                item.id == selectedField.otherOption.id
              if otherOptionIndex > -1
                otherOption = angular.copy selectedField.value[otherOptionIndex]
                otherOption.value = selectedField.textExplanation
                selectedField.value[otherOptionIndex] = otherOption
            params.custom_fields.push selectedField
          else
            selectedField.value = []
            params.custom_fields.push selectedField
        when "dropdown"
          if selectedField.value and selectedField.value.id
            field = angular.copy selectedField
            if field.otherOption and field.value.id == field.otherOption.id
              otherOption = angular.copy field.value
              otherOption.value = field.textExplanation
              field.value = otherOption
            field.value = [field.value]
            params.custom_fields.push field
          else
            selectedField.value = []
            params.custom_fields.push selectedField
        when "numeric", "int"
          if selectedField.value.length > 0
            values = []
            _(selectedField.value).each (field)=>
              if !_(parseFloat(field.value)).isNaN()
                field.value = Number(field.value)
                values.push field
            selectedField.value = values
            params.custom_fields.push selectedField
        else
          if selectedField.value.length > 0
            values = []
            _(selectedField.value).each (field)=>
              if field.value
                values.push field
            selectedField.value = values
            params.custom_fields.push selectedField

    if params.custom_fields.length > 0
      @Restangular.all('service/dvapi_service/post_custom_fields_data').post(params).then (response) =>
        @toaster.pop 'success','','Custom fields saved successfully'

  recalculateScores: =>
    params = 
      duediligence_ids: [@dueDiligenceID]
    @Restangular.all('diligences/recalculate_score').post(params).then (response)=>
      @diligence.recalculation_needed = false
      @$scope.getDueDiligence().then (diligence) =>
        @diligence = diligence
        if @view_mode == 'tabbed'
          @loadRatings(@selectedRatingType.id)
        else
          @getHeatmapResponse()

  reloadScores: =>
    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
      @loadRatings(@selectedRatingType.id)
      @ratingChanged = false

  openCustomFieldModal: (rating, subcategory, category, mode, view_mode)=>
    if @custom_fields.length > 0 or @reviewEnabled

      newRating =
        mode: mode
        attributes:
          rating_id: rating.id
          rating_name: rating.name
          rating_status: rating.rating_status
          rating_value: rating.rating_value
          score_value: rating.score_value

        verifier:
          attributes: rating.review_assignments[0] if rating.review_assignments.length > 0

      if @selectedRatingType.rating_level.toLowerCase() == 'section'
        selectedSubcategory = _(@ratingsBackup).find (categoryBackup)=>
          categoryBackup.id == subcategory.id
        selectedRating = _(selectedSubcategory.ratings).find (subcategoryBackup)=>
          subcategoryBackup.id == rating.id
        rating_scale = @ratingScaleMap[rating.id].rating_scales
        naValue = @ratingScaleMap[rating.id].naValue
      else
        selectedCategory = _(@ratingsBackup).find (categoryBackup)=>
          categoryBackup.id == category.id
        selectedSubcategory = _(selectedCategory.ratings).find (subcategoryBackup)=>
          subcategoryBackup.id == subcategory.id
        selectedRating = _(selectedSubcategory.ratings).find (ratingBackup)=>
          ratingBackup.id == rating.id

        rating_scale = @ratingScaleMap[subcategory.id].rating_scales
        naValue = @ratingScaleMap[subcategory.id].naValue

      if rating.rating_status != @responseStatus.STARTED
        newRating.attributes.rating_value = selectedRating.rating_value

      @ModalFactory.invokeModal 'manage_rating_custom_fields',
        resolve:
          entityType: => @diligenceTypeId
          entityId: => @dueDiligenceID
          subEntityId: => rating.id
          rating: => newRating
          readonly: => @diligence.isLocked || @ratingsNotEditable
          ratingScales: => rating_scale
          naValue: => naValue
          enableReview: => @reviewEnabled && selectedRating.rating_value?
          enable_tracking: => @firm_preferences.enable_track_changes
          functions: => @entityFunctions
          assignedFunctions: => @myFunctions
        success: (response)=>
          rating.rating_value = response.rating.attributes.rating_value
          rating.score_value = response.rating.attributes.score_value
          rating.rating_status = response.rating.attributes.rating_status
          rating.review_assignments[0] = response.rating.verifier.attributes if response.rating.verifier
          @recordRating(rating) if !view_mode
          @saveCustomFields(rating, response.customFields)
        dismiss: (response)=>
          rating.rating_value = selectedRating.rating_value
          rating.score_value = response.rating.attributes.score_value
          rating.rating_status = response.rating.attributes.rating_status
          rating.review_assignments[0] = response.rating.verifier.attributes if response.rating.verifier
    else
      @recordRating(rating)
