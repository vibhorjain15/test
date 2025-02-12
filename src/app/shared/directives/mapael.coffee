angular.module('diligenceVault').directive 'mapael', ($timeout, Utils) ->
  restrict: 'AE'
  template: '<div class="mapael-container"><div class="map"></div></div>'
  link: (scope, element, attrs) ->
    @colorScheme = Utils.getFirmColorScheme() or ['#a90e63', '#ffc23f', '#f08700', '#702169','#087e8b']

    init = (countries_obj) =>
      $timeout =>
        element.mapael
          map:
            name: 'world_countries'
            defaultArea:
              attrs:
                fill: 'lightgray'
                stroke: '#fdfdfd'
                "stroke-width": 1
              attrsHover:
                "stroke-width": 2
          areas: countries_obj

    rerender = ->
      element.trigger('resize')

    deregisterer = scope.$watchGroup [attrs.options], (values) =>
      [options] = values
      if options?
        countries_obj = {}
        _(options.data).each (country_item, i) =>
          country_obj = {
            attrs: {
              fill: @colorScheme[i]
            }
            tooltip: {
              content: country_item.tooltip
            }
          }
          countries_obj[country_item.country] = country_obj
        init(countries_obj)
        deregisterer()

    scope.$on 'fullscreen:on', rerender
    scope.$on 'fullscreen:off', rerender
