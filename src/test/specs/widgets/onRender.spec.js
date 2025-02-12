describe('onRender', function() {
    var element;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($compile, $rootScope) {});
        $rootScope.callback = function() {};
        sinon.spy($rootScope, 'callback');
    });

    it('should invoke onRender callback', function() {
        element = $compile('<div on-render=callback()></div>')($rootScope);
        $rootScope.$digest();
        $rootScope.callback.should.have.been.called;
    });
});
