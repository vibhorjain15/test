class CreateRatingMapController extends ModalController
    @register 'CreateRatingMapController'

    @inject 'Restangular','toaster','template','$state','ratingConstants','$timeout'

    initialize: ->
        @request = 
            template_id: @template.templateInfo.id
            template_version: @template.version
            rating_scale: null
            rating_level: 'question'
        @loading = true
        @Restangular.all('v2/rating_scales').doGET().then (response) =>
            @ratingScalesList = response
            @loading = false
        ,=>
            @loading = false

    setRatingSyncLevel: (syncLevel)=>
        @request.rating_level = syncLevel

    redirectToRatingScales: =>
        @$uibModalInstance.close()
        @$timeout =>
            @$state.go 'app.firm.settings.investment_rating.scales'

    onScaleChange: =>
        @loading_scale_definition = true
        @Restangular.one('v2/rating_scales',@request.rating_scale.id).one('versions',@request.rating_scale.version).getList('rating_scale_definitions').then (rating_scale) =>
            @ratingScaleDefinition = rating_scale
            noValueIndex = _(@ratingScaleDefinition).findIndex (scale)=>
                parseInt(scale.value) == @ratingConstants.naValue
            
            if noValueIndex > -1
                @naValue = @ratingScaleDefinition[noValueIndex]
                @ratingScaleDefinition.splice(noValueIndex,1)
            @loading_scale_definition = false
        ,(error)=>
            @loading_scale_definition = false

    submit: ->
        if @create_rating_map_form.$valid
            @creating_map = true
            params = _(@request).pick('template_id','template_version','rating_level')
            params.rating_scale_id = @request.rating_scale.id

            @Restangular.one('templates',@template.templateInfo.id).one('versions',@template.version).all('TemplateRatingSchemeMappings').all('auto_map').post(params).then (response) =>
                @toaster.pop 'success','','Rating Scheme successfully created from this template'
                @creating_map = false
                @$state.go 'app.firm.settings.investment_rating.types',{rating_id: response.rating_scheme_id}
                @close response
            ,(error)=>
                @creating_map = false