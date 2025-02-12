describe('DvDiscussController', function() {
    var controller, $stateParams;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $sce, $state) {});
    });

    beforeEach(function() {
        $stateParams = {
            sort: 'created_at',
            q: 'what',
            category: 'due-diligence'
        };
        controller = $controller('DvDiscussController', {$stateParams: $stateParams});
    });

    beforeEach(function() {
        sinon.stub($sce, 'trustAsHtml', function(str) {
            return str;
        });
    });

    it('should have suitable defaults', function() {
        expect(controller.current_page).to.be.zero;
        expect(controller.infinite_scroll_page_count).to.equal(3);
        expect(controller.sort).to.equal($stateParams.sort);
    });

    it('should pick search query from $stateParams', function() {
        expect(controller.filters.q).to.equal($stateParams.q);
    });

    it('should have a copy of filters to be displayed as search results text', function() {
        expect(controller.filters).to.not.equal(controller.applied_filters);
        expect(controller.filters.q).to.equal(controller.applied_filters.q);
        expect(controller.applied_filters.category).to.deep.equal($stateParams.category);
    });

    describe('when $stateParams category is not array', function() {
        it('should convert filter categories to array', function() {
            expect(controller.filters.category).to.deep.equal([{ text: $stateParams.category }]);
        });
    });

    describe('when $stateParams category is array', function() {
        beforeEach(function() {
            controller = $controller('DvDiscussController', {
                $stateParams: {
                    category: ['foo', 'bar']
                }
            });
        });

        it('should map categories to array of objects that the ngTagsInput can read', function() {
            var mapped_categories = [{text: 'foo'}, {text: 'bar'}];

            expect(controller.filters.category).to.deep.equal(mapped_categories);
        });
    });

    describe('highlight', function() {
        it('should wrap the text in span tag when there is a match', function() {
            expect(controller.highlight('what is due diligence?'))
                .to.equal('<span class="highlight-match">what</span> is due diligence?');
        });

        it('should not wrap the text in span tag when there is no match', function() {
            expect(controller.highlight('stuff')).to.equal('stuff');
        });
    });

    describe('performSearch', function() {
        beforeEach(function() {
            sinon.spy($state, 'go');
        });

        it('should redirect to forum with query params', function() {
            var filters = {q: 'why is', category: 'hedge-funds', sort: 'popular'};

            controller.performSearch(filters);
            $state.go.should.have.been.calledWith('app.dv_discuss', filters);
        });

        it('should pluck category values if it comes from ngTagsInput', function() {
            var filters = {q: 'why is', category: [{text: 'foo'}], sort: 'popular'};

            controller.performSearch(filters);
            $state.go.should.have.been.calledWith('app.dv_discuss', {
                q: filters.q,
                category: ['foo'],
                sort: filters.sort
            });
        });

        it('should pick default filters from stateParams', function() {
            var filters = {q: 'how you doin?'};

            controller.performSearch(filters);
            $state.go.should.have.been.calledWith('app.dv_discuss', {
                q: filters.q,
                category: $stateParams.category,
                sort: $stateParams.sort
            });
        });
    });
});
