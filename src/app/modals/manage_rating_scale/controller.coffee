class ManageRatingScaleController extends ModalController

    @register 'ManageRatingScaleController'

    @inject '$scope', '$timeout', 'Restangular','$filter', 'category', 'selectedRating','toaster', 'ratingConstants'

    initialize: ->
        @selectedScale = 
            id: @category.rating_scale_id
            version: @selectedRating.rating_scale_version
            rating_scales: []

        @miniColorSettings =
            changeDelay: 300
            control: 'hue'
            theme: 'bootstrap'
            position: 'bottom left'
            letterCase: 'uppercase'

        @$scope.$watch 'vm.selectedScale.rating_scales', (value) =>
            if value
                @setScaleValidity()
        , true

        @defaultVersion = 0
        @getRatingScaleDefinition()

    getRatingScaleDefinition: =>
        @loading_scale = true
        @Restangular.one('v2/rating_scales',@selectedScale.id).one('versions',@defaultVersion).getList('rating_scale_definitions').then (response) =>
            @selectedScale.rating_scales = response
            if @selectedScale.rating_scales.length > 0
                noValueIndex = _(@selectedScale.rating_scales).findIndex (scale)=>
                    parseInt(scale.value) == @ratingConstants.naValue

                if noValueIndex > -1
                    @noValue = @selectedScale.rating_scales[noValueIndex]
                    @selectedScale.rating_scales.splice(noValueIndex,1)
            @loading_scale = false
        ,(error)=>
            @loading_scale = false

    setScaleValidity: =>
        @$timeout =>
            if @manage_rating_scales_form
                _(@selectedScale.rating_scales).each (scale, index)=>
                    if @manage_rating_scales_form["range-max-value-#{index}"]
                        @manage_rating_scales_form["range-max-value-#{index}"].$setValidity('invalidMaxRange', (index == @selectedScale.rating_scales.length - 1 and Number(scale.range_max_value) == 100) or index != @selectedScale.rating_scales.length - 1)
                    if index == 0 
                        if @rating_scales_form["range-max-value-#{index}"]
                            @rating_scales_form["range-max-value-#{index}"].$setValidity('invalidMaxRatingRange', Number(scale.range_max_value) > Number(scale.range_min_value))
                        if @manage_rating_scales_form["range-min-value-#{index}"]
                            @manage_rating_scales_form["range-min-value-#{index}"].$setValidity('invalidMinimumMinRange', Number(scale.range_min_value) == 0)
                    else
                        if @rating_scales_form["range-max-value-#{index}"]
                            @rating_scales_form["range-max-value-#{index}"].$setValidity('invalidMaxRatingRange', Number(scale.range_max_value) > Number(scale.range_min_value))
                        if @manage_rating_scales_form["range-min-value-#{index}"]
                            @manage_rating_scales_form["range-min-value-#{index}"].$setValidity('invalidMinRange', Number(scale.range_min_value) == (Number(@selectedScale.rating_scales[index - 1].range_max_value) + 1))

    save: ->
        if @manage_rating_scales_form.$valid
            @saving = true
            params = [].concat(@noValue).concat(@selectedScale.rating_scales)
            if @category.rating_scale_id == @selectedRating.rating_scale_id
                @Restangular.one('rating_scheme_definitions',@category.id).one('rating_scales',@selectedScale.id).all('duplicate_scale').post(params)
                    .then (response)=>
                        @toaster.pop 'success', '', 'Rating Scales have been saved!'
                        newRatingScaleId = response[0].rating_scale_id
                        @close newRatingScaleId
                    .finally =>
                        @saving = false
            else
                @Restangular.one('v2/rating_scales',@selectedScale.id).one('versions',@selectedScale.version).all('rating_scale_definitions').customPUT(params)
                    .then =>
                        @toaster.pop 'success', '', 'Rating Scales have been saved!'
                        @close @selectedScale.id
                    .finally =>
                        @saving = false