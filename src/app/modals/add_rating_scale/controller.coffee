class AddRatingScaleController extends ModalController
    @register 'AddRatingScaleController'

    @inject 'Restangular','editing_rating_scale','rating_scales','toaster','ratingConstants'

    initialize: ->
        if @editing_rating_scale
            @edit = true
        else 
            @edit = false
            @editing_rating_scale = {
                name: ''
                scale_mode : @ratingConstants.Absolute
                is_active: true
            }

    validateRatingName: ()=>
        duplicateRatings = _(@rating_scales).filter((rating)=>
            @editing_rating_scale.id != rating.id and rating.name.toLowerCase() == @editing_rating_scale.name.toLowerCase()
        )
        duplicateRatings.length > 0

    setScaleMode: (mode)=>
        @editing_rating_scale.scale_mode = mode
    
    submit:() =>
        if !@validateRatingName()
            @updating_rating_type = true

            if !@edit
                params = _(@editing_rating_scale).pick('name','is_active','scale_mode')
                    
                @Restangular.all('v2/rating_scales').post(params).then (response) =>
                    @toaster.pop 'success', '', 'Your rating scale has been added successfully'
                    @close(response)
                .finally(=> @updating_rating_type = false)
            else
                @Restangular.one('v2/rating_scales',@editing_rating_scale.id).customPUT(@editing_rating_scale).then (response) =>
                    @toaster.pop 'success', '', 'Your rating type has been updated successfully'
                    @close(response)
                .finally(=> @updating_rating_type = false)
        else
            @toaster.pop 'error', '', 'A rating scale with same name already exists'