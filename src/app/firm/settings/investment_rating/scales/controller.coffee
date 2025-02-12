class FirmSettingsInvestmentRatingScalesController extends BaseController
  @register 'FirmSettingsInvestmentRatingScalesController'

  @inject 'Restangular', '$scope', 'toaster', 'Utils', 'ModalFactory','SweetAlert', '$timeout','ratingConstants','angularEnabled', '$window'

  initialize: ->
    @defaultPrimaryColor = '#126B82'
    @color = @defaultPrimaryColor
    @selectedScale = null
    @defaultVersion = 0

    @naValue =
     value: '0'
     name: "N/A"
     color_code: '#FFFFFF'
     range_min_value: null
     range_max_value: null

    @miniColorSettings =
      changeDelay: 300
      control: 'hue'
      theme: 'bootstrap'
      position: 'bottom left'
      letterCase: 'uppercase'

    @Restangular.all('v2/rating_scales').doGET().then (response) =>
      @ratingScalesList = response
      @selectRatingScale(response[0]) if response.length > 0

    @$scope.$watch 'vm.selectedScale.rating_scales', (value) =>
      if value
        @setModelValidity()
        @setScaleValidity()
    , true
    @isManager = @Utils.isManager()
    if @isManager
      @$window.history.back()
      return

  onUnratedColorChanged: =>
    @setModelValidity()

  resetForm: ->
    @rating_scales_form.$setPristine()
    @rating_scales_form.$setUntouched()

  incrementScale: (name) ->
    scale =
      value: @selectedScale.rating_scales.length + 1
      name: name
    if @selectedScale.scale_mode == @ratingConstants.ScoreBand
      if @selectedScale.rating_scales.length == 0
        scale.range_min_value = 0
      else
        scale.range_min_value = Number(@selectedScale.rating_scales[@selectedScale.rating_scales.length - 1].range_max_value) + 1
      scale.range_max_value = scale.range_min_value + 10
    @selectedScale.rating_scales.push scale
    @resetForm()

  decrementScale: ->
    @selectedScale.rating_scales.splice @selectedScale.rating_scales.length - 1, 1
    @resetForm()

  selectRatingScale: (scale)=>
    @loading_rating_scales = true
    @selectedScale = scale
    @Restangular.one('v2/rating_scales',scale.id).one('versions',@defaultVersion).getList('rating_scale_definitions').then (response) =>
      @selectedScale.rating_scales = response
      if @selectedScale.rating_scales.length > 0
        noValueIndex = _(@selectedScale.rating_scales).findIndex (scale)=>
          parseInt(scale.value) == @ratingConstants.naValue
        if noValueIndex > -1
          @noValue = @selectedScale.rating_scales[noValueIndex]
          @selectedScale.rating_scales.splice(noValueIndex,1)
        else
          @noValue = angular.copy @naValue
      else
        @noValue = angular.copy @naValue
      @setScaleValidity()
      @loading_rating_scales = false
    ,(error)=>
      @loading_rating_scales = false

  onAddRatingScale: =>
    @ModalFactory.invokeModal 'add_rating_scale',
      resolve:
        rating_scales: => @ratingScalesList
      success: (response) =>
        @ratingScalesList.push response
        @selectRatingScale(response)

  onEditRatingScale: (scale,index)=>
    @ModalFactory.invokeModal 'add_rating_scale',
      resolve:
        editing_rating_scale: => angular.copy scale
        rating_scales: => @ratingScalesList
      success: (response) =>
        @ratingScalesList[index] = response
        @selectRatingScale(response)

  confirmRatingScaleDeletion: (scale,index)=>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this rating scale?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeRatingScale(scale, index)
    })

  removeRatingScale: (scale, index)=>
    @Restangular.one('v2/rating_scales',scale.id).remove().then (response) =>
      @ratingScalesList.splice(index,1)
      if @ratingScalesList.length > 0
        @selectRatingScale(@ratingScalesList[0])
      else
        @selectedScale = null
      @toaster.pop 'success', '', 'Your rating scale has been deleted successfully'
      swal.close()
    ,(error)=>
      swal.close()

  setModelValidity: () =>
    if @rating_scales_form
      _(@rating_scales_form.$$controls).forEach (formGroup) =>
        occurrence = 0
        _(@selectedScale.rating_scales).forEach (scale) ->
          if formGroup.$name and formGroup.$name.indexOf("color-") > -1 and scale.color_code and formGroup.$modelValue
            if scale.color_code.toUpperCase() == formGroup.$modelValue.toUpperCase()
              occurrence++

        if formGroup.$name and formGroup.$name.indexOf("color-") > -1 and @noValue.color_code and formGroup.$modelValue
          if @noValue.color_code.toUpperCase() == formGroup.$modelValue.toUpperCase()
            occurrence++

        formGroup.$setValidity('duplicateColor', occurrence < 2)

  setScaleValidity: =>
    @$timeout =>
      if @rating_scales_form and @selectedScale.scale_mode == @ratingConstants.ScoreBand
        _(@selectedScale.rating_scales).each (scale, index)=>
          if @rating_scales_form["range-max-value-#{index}"]
              @rating_scales_form["range-max-value-#{index}"].$setValidity('invalidMaxRange', (index == @selectedScale.rating_scales.length - 1 and Number(scale.range_max_value) == 100) or (index != @selectedScale.rating_scales.length - 1 and Number(scale.range_max_value) < 100))
          if @rating_scales_form["range-max-value-#{index}"]
              @rating_scales_form["range-max-value-#{index}"].$setValidity('invalidMaxRatingRange', Number(scale.range_max_value) > Number(scale.range_min_value))
          if index == 0
            if @rating_scales_form["range-min-value-#{index}"]
              @rating_scales_form["range-min-value-#{index}"].$setValidity('invalidMinimumMinRange', Number(scale.range_min_value) == 0)
           else
            if @rating_scales_form["range-min-value-#{index}"]
              @rating_scales_form["range-min-value-#{index}"].$setValidity('invalidMinRange', Number(scale.range_min_value) == (Number(@selectedScale.rating_scales[index - 1].range_max_value) + 1))

  save: ->
    if @rating_scales_form.$valid
      @loading = true
      params = [].concat(@noValue).concat(@selectedScale.rating_scales)
      @Restangular.one('v2/rating_scales',@selectedScale.id).one('versions',@selectedScale.version).all('rating_scale_definitions').customPUT(params)
        .then =>
          @toaster.pop 'success', '', 'Rating Scales have been saved!'
        .finally =>
          @loading = false
