angular.module('diligenceVault').config (RestangularProvider) ->
  RestangularProvider.extendModel 'discussions', (response) ->
    results = if response.id then [response] else response.results

    _(results).each (discussion) ->
      return unless discussion.text? # this is when you initialise a new discussion using Restangular.one & before calling .get() on it

      discussion.slug = discussion.text.replace(/\?/g, '').replace(/(\s+)/g, '-')

    response
