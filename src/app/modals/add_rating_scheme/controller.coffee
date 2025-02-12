class AddRatingSchemeController extends ModalController
    @register 'AddRatingSchemeController'

    @inject 'Restangular','rating_scheme','rating_types','toaster'

    initialize: ->
        @editing_ratingscheme = _(@rating_scheme).pick('id', 'name', 'rating_scale_id', 'has_ratings')
        @edit = if @editing_ratingscheme.id then true else false

        @Restangular.all('v2/rating_scales').doGET().then (response) =>
            @ratingScalesList = response

    validateRatingName: ()=>
        duplicateRatings = _(@rating_types).filter((rating)=>
            @editing_ratingscheme.id != rating.id and rating.name == @editing_ratingscheme.name
        )
        duplicateRatings.length > 0
    
    submit:() =>
        if !@validateRatingName() and @add_rating_scheme_form.$valid
            @updating_rating_type = true

            if !@edit
                param = _(@editing_ratingscheme).pick('name','rating_scale_id')
                @Restangular.all('rating_types').post(param).then (response) =>
                    @toaster.pop 'success', '', 'Your rating type has been added successfully'
                    @editing_ratingscheme.id = response.id
                    @editing_ratingscheme.version = response.version
                    @editing_ratingscheme.rating_scale_id = response.rating_scale_id
                    @rating_types.push @editing_ratingscheme
                    @close(@rating_types)
                .finally(=> @updating_rating_type = false)
            else
                param = _(@editing_ratingscheme).pick('name','rating_scale_id')
                @Restangular.one('rating_types',@editing_ratingscheme.id).customPUT(param).then (response) =>
                    @toaster.pop 'success', '', 'Your rating type has been updated successfully'
                    @editing_ratingscheme.name = response.name
                    @editing_ratingscheme.version = response.version
                    @editing_ratingscheme.rating_scale_id = response.rating_scale_id
                    editedRating = _(@rating_types).find((rating) =>
                        rating.id == @editing_ratingscheme.id
                    )
                    editedRating.name = response.name
                    @close(@rating_types)
                .finally(=> @updating_rating_type = false)
        else
            @toaster.pop 'error', '', 'A rating with same name already exists'