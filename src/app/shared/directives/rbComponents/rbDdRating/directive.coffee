angular.module('diligenceVault').directive 'rbDdRating', (FundDataservice, $q, Utils, Restangular) ->
  restrict: 'E'
  templateUrl: 'shared/directives/rbComponents/rbDdRating/template.html'
  link: (scope) ->

    entityId = scope.component.options.entity_id
    entityType = scope.component.options.entity_type
    scope.entityId = entityId

    getRatingsData = (entityId) ->
      deferred = $q.defer()
      ratingTypeID = Utils.getCurrentFirm().ratingTypeID
      promises = []
      promises.push Restangular.all('rating_scales').getList()
      promises.push Restangular.all('ratings/profile').getList({entity_id: entityId, entity_type: entityType})

      scope.loading = true
      $q.all(promises).then (responses) =>
        deferred.resolve(responses)

      deferred.promise

    if entityId
      getRatingsData(entityId).then (responses) ->
        scope.loading = false
        [scope.rating_scales, scope.ratings] = responses

        scope.noRatings = if scope.ratings.length == 0 then true else false
        calculateRatings()
        # rating_subtypes = _(rating_subtypes).filter (rating_subtype) ->
        #   !!rating_subtype.categories.length

        # _(rating_subtypes).each (rating_subtype) ->
        #   _(rating_subtype.categories).each (rating_category) ->
        #     rating_category.value = _(ratings).findWhere({ratingCategoryID: rating_category.id})?.value || 0

        #   setAggregateRating(rating_subtype)

        #scope.loading = false

        #scope.rating_subtypes = ratings
        #scope.ratings = ratings

    setAggregateRating = (rating_subtype) ->
      rating_subtype.aggregate_rating = getAggregateRating(rating_subtype.categories)
      rating_subtype.aggregate_rating_label = getAggregateRatingScaleLabel(rating_subtype.aggregate_rating)

    getAggregateRating = (categories) ->
      aggregate_rating = _(categories).reduce (sum, category) ->
        sum + (category.value || 0) * (category.weight / 100)
      , 0

      parseInt(aggregate_rating.toPrecision(2) * 100) / 100 #rounding off to two decimals without flooring/ceiling

    getAggregateRatingScaleLabel = (value) ->
      return unless value

      delta = value - parseInt(value)
      value = if delta > 0.5 then Math.ceil(value) else Math.floor(value)

      _(scope.rating_scales).findWhere(value: value).name

    calculateRatings = ->
      binary_mode = if scope.rating_scales.length > 0 then false else true
      scope.total_score = 0
      _(scope.ratings).each (category)=>
        category.score = 0
        _(category.ratings).each (subcategory)=>
          subcategory.score = 0
          _(subcategory.ratings).each (rating)=>
            if binary_mode
              score = rating.weightage
            else
              score = if rating.score then rating.weightage * rating.score else 0
            
            subcategory.score = subcategory.score + score
          
          if binary_mode
            subcategory.final_score = (subcategory.score / subcategory.weightage) * 5
            category.score = category.score + subcategory.final_score
          else
            subcategory.final_score = subcategory.score / subcategory.weightage
            category.score = category.score + (subcategory.final_score * subcategory.weightage)
          subcategory.color_code = Utils.getColorCode(subcategory.final_score,scope.rating_scales)
          
        if binary_mode
          category.final_score = (category.score / category.weightage) * 5
          scope.total_score = scope.total_score + category.final_score
        else
          category.final_score = category.score / category.weightage
          scope.total_score = scope.total_score + (category.final_score * category.weightage)
        category.color_code = Utils.getColorCode(category.final_score,scope.rating_scales)

      if binary_mode
        scope.total_score = (scope.total_score * 5)/100
      else
        scope.total_score = scope.total_score / 100
      scope.color_code = Utils.getColorCode(scope.total_score,scope.rating_scales)