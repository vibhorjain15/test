describe('joinBy filter', function() {
    beforeEach(function() {
        module('diligenceVault.filters');
    });

    var $filter, joinBy;

    beforeEach(inject(function(_$filter_) {
        $filter = _$filter_;
        joinBy = $filter('joinBy');
    }));

    it('should just return the variable if it is not an array', function() {
        var obj = obj;

        expect(joinBy('foo')).to.equal('foo');
        expect(joinBy(124)).to.equal(124);
        expect(obj).to.equal(obj);
    });

    it('should join array using "," if no delimiter is provided', function() {
        expect(joinBy(['foo'])).to.equal('foo');
        expect(joinBy(['foo', 'bar'])).to.equal('foo,bar');
    });

    it('should join array using specified delimiter', function() {
        expect(joinBy(['foo', 'bar'], ':')).to.equal('foo:bar');
    });
});
