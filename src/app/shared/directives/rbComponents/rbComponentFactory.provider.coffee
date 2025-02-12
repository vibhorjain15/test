angular.module('diligenceVault').provider 'RbComponentFactory', ->
  "ngInject"
  merge_tag_regex = /^\*\|dv:(.*)\|\*$/
  ###
  Map of component specific options
  {
    text: {
      directive_name: 'rbText',
      customisable: true
    },
    line_break: {
      directive_name: 'rbLineBreak',
      customisable: false
    }
  }
  ###
  component_definition_map = {}

  new class RbComponentFactoryProvider
    configure: (name, config) ->
      component_definition_map[name] = config

    $get: ($templateCache)->
      "ngInject"
      new class RbComponentFactory
        isComponentConfigurable: (type) ->
          component_definition_map[type]?.customisable

        createNewComponent: (type, options) ->
          unless options?
            component_definition = component_definition_map[type]
            options = angular.extend({}, component_definition.options)

          {
            type: type,
            options: options,
            cid: _.uniqueId('rbc-') #cid => client id, rbc => report builder component
          }

        getComponentSettingsTemplate: (type) ->
          directive_name = component_definition_map[type].directive_name

          templateUrl = "shared/directives/rbComponents/#{directive_name}/settings.html"

          $templateCache.get(templateUrl)

        getComponentDirective: (type) ->
          switch type
            when 'text'
              '<rb-text></rb-text>'
            when 'notes'
              '<rb-notes></rb-notes>'
            when 'logo'
              '<rb-logo></rb-logo>'
            when 'line_break'
              '<rb-line-break></rb-line-break>'
            when 'aum_chart'
              '<rb-aum-chart></rb-aum-chart>'
            when 'performance_chart'
              '<rb-performance-chart></rb-performance-chart>'
            when 'valuation_chart'
              '<rb-valuation-chart></rb-valuation-chart>'
            when 'fund_overview'
              '<rb-fund-overview></rb-fund-overview>'
            when 'firm_overview'
              '<rb-firm-overview></rb-firm-overview>'
            when 'liquidity_overview'
              '<rb-liquidity-overview></rb-liquidity-overview>'
            when 'timeline'
              '<rb-timeline></rb-timeline>'
            when 'image_selector'
              '<rb-image-selector></rb-image-selector>'
            when 'dd_rating'
              '<rb-dd-rating></rb-dd-rating>'
            when 'questionnaire'
              '<rb-questionnaire></rb-questionnaire>'
            when 'blank_chart'
              '<rb-blank-chart></rb-blank-chart>'
            when 'header_row'
              '<rb-header-row></rb-header-row>'
            when 'questionnaire_template'
              '<rb-questionnaire-template></rb-questionnaire-template>'


        getComponentDirectiveForNotSupported: (type) ->
          '<rb-not-supported></rb-not-supported>'

        parseTemplate: (template) ->
          ###
            Explaining with an example
            template = """
              *|dv:text align:center content:Be%20*bold*%20yo%20yo|*
              *|dv:line_break|*
              *|dv:heading align:right    content:Some%20Heading|*
              *|dv:some_invalid_tag
            """
          ###
          merge_tags = template.split('\n')
          ###
            merge_tags = [
              '*|dv:text align:center content:Be%20*bold*%20yo%20yo|*',
              '*|dv:line_break|*',
              '*|dv:heading align:right    content:Some%20Heading|*',
              '*|dv:some_invalid_tag'
            ]
          ###

          merge_tags = _(merge_tags).filter((merge_tag) ->
            merge_tag_regex.test(merge_tag)
          )
          ###
            Removes invalid merge tags
            merge_tags = [
              '*|dv:text align:center content:Be%20*bold*%20yo%20yo|*',
              '*|dv:line_break|*',
              '*|dv:heading align:right    content:Some%20Heading|*'
            ]
          ###

          _(merge_tags).map (merge_tag) => @parseMergeTag(merge_tag)

        parseMergeTag: (merge_tag) ->
          ###
          Assume
          merge_tag = '*|dv:heading align:right    content:Some%20Heading|*'
          ###
          options = {}

          match = merge_tag.match(merge_tag_regex)[1]
          ###
          strip off symbols
          => 'heading align:right    content:Some%20Heading'
          ###
          match = match.replace(/\s{2,}/g, ' ')
          ###
          removes redundant whitespace with single space
          => 'heading align:right content:Some%20Heading'
          ###

          component_breakdown = match.split(/\s/)
          # => ['heading', 'align:right', 'content:Some%20Heading']

          component_type = component_breakdown[0]
          # => heading

          component_options = component_breakdown.slice(1)
          # => ['align:right', 'content:Some%20Heading', '']

          _(component_options).each (attr) ->
            #=> attr = 'content:Some%20Heading'
            [key, value] = attr.split(':')
            #=> key = 'content', value = 'Some%20Heading'

            if key? && value?
              value = decodeURIComponent(value)
              #=> value = 'Some Heading'

              options[key] = value

          ###
            {
              type: 'heading',
              options: {
                align: 'right',
                content: 'Some heading'
              }
            }
          ###
          @createNewComponent(component_type, options)

        formatComponents: (components) ->
          merge_tags = _(components).map (component) =>
            @formatToMergeTag(component)

          merge_tags.join('\n')

        formatToMergeTag: (component) ->
          merge_tag_start = "*|dv:#{component.type}"
          merge_tag_end = '|*'
          options = component.options || {}

          options = _(options).map (value, key) ->
            value = encodeURIComponent(value)

            "#{key}:#{value}"

          merge_tag_options = options.join(' ')

          "#{merge_tag_start} #{merge_tag_options} #{merge_tag_end}"
