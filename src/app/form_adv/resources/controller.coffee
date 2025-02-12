class FormADVResourcesController extends BaseController
  @register 'FormADVResourcesController'

  @inject '$state'

  initialize: ->
   
    @resources = [
      {
        name: 'Instructions & Glossary',
        link: 'https://www.sec.gov/about/forms/formadv-instructions.pdf',
        #asofDate:'2011',
        desc: 'Instructions to be read before filing Form ADV'
      }
      {
        name: 'Form ADV Part 1A',
        link: 'https://www.sec.gov/rules/final/2011/ia-3221-appb.pdf',
        #asofDate:'2011'
        desc: 'Instructions for certain items in Part 1A'
      }
      {
        name: 'Form ADV Part 1B (NASAA)',
        link: 'http://www.nasaa.org/industry-resources/uniform-forms/form-adv/revisions-to-form-adv-part-1b/',
        asofDate:'10/2012',
        desc: 'Revisions to Form ADV Part 1B'
      }
      {
        name: 'Form ADV Part 2',
        link: 'https://www.sec.gov/about/forms/formadv-part2.pdf',
        #asofDate:'2011'
        desc: 'Instructions for Part 2'
      }
      {
        name: 'Execution Pages',
        link: 'https://www.sec.gov/about/forms/formadv-execution.pdf',
        #asofDate:'2011'
        desc: 'Execution Pages for FormADV'
      }
    ]

