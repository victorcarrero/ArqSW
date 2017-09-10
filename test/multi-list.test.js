import MultiList from '../lib/multi-list';

describe('MultiList', function() {
  describe('constructing a MultiList instance', function() {
    it('activates the first item from each list, and marks the first list as active', function() {
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ]);

      assert.equal(ml.getActiveListKey(), 'list1');
      assert.equal(ml.getActiveItem(), 'a');
      assert.equal(ml.getActiveItemForKey('list2'), 'd');
      assert.equal(ml.getActiveItemForKey('list3'), 'f');
    });
  });

  describe('activateListForKey(key)', function() {
    it('activates the list at the given index and calls the provided changed-activateion callback', function() {
      const didChangeActiveItem = sinon.spy();
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ], didChangeActiveItem);

      ml.activateListForKey('list2');
      assert.equal(ml.getActiveListKey(), 'list2');
      assert.equal(ml.getActiveItem(), 'd');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['d', 'list2']);

      didChangeActiveItem.reset();
      ml.activateListForKey('list3');
      assert.equal(ml.getActiveListKey(), 'list3');
      assert.equal(ml.getActiveItem(), 'f');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['f', 'list3']);
    });
  });

  describe('activateItemAtIndexForKey(key, itemIndex)', function() {
    it('activates the item, calls the provided changed-activateion callback, and remembers which item is active for each list', function() {
      const didChangeActiveItem = sinon.spy();
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ], didChangeActiveItem);

      ml.activateItemAtIndexForKey('list1', 2);
      assert.equal(ml.getActiveItem(), 'c');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['c', 'list1']);

      didChangeActiveItem.reset();
      ml.activateItemAtIndexForKey('list2', 1);
      assert.equal(ml.getActiveItem(), 'e');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['e', 'list2']);

      ml.activateItemAtIndexForKey('list3', 2);
      assert.equal(ml.getActiveItem(), 'h');

      ml.activateListForKey('list1');
      assert.equal(ml.getActiveItem(), 'c');

      ml.activateListForKey('list2');
      assert.equal(ml.getActiveItem(), 'e');

      ml.activateListForKey('list3');
      assert.equal(ml.getActiveItem(), 'h');
    });
  });

  describe('activateItem(item)', function() {
    it('activates the provided item and calls the provided changed-activateion callback', function() {
      const didChangeActiveItem = sinon.spy();
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ], didChangeActiveItem);

      ml.activateItem('b');
      assert.equal(ml.getActiveItem(), 'b');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['b', 'list1']);

      didChangeActiveItem.reset();
      ml.activateItem('e');
      assert.equal(ml.getActiveItem(), 'e');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['e', 'list2']);
    });
  });

  describe('activateNextList({wrap, activateFirst}) and activatePreviousList({wrap, activateLast})', function() {
    it('activates the next/previous list', function() {
      const didChangeActiveItem = sinon.spy();
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ], didChangeActiveItem);
      assert.equal(ml.getActiveListKey(), 'list1');

      ml.activateNextList();
      assert.equal(ml.getActiveListKey(), 'list2');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['d', 'list2']);

      didChangeActiveItem.reset();
      ml.activateNextList();
      assert.equal(ml.getActiveListKey(), 'list3');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['f', 'list3']);

      ml.activatePreviousList();
      assert.equal(ml.getActiveListKey(), 'list2');

      ml.activatePreviousList();
      assert.equal(ml.getActiveListKey(), 'list1');
    });

    it('wraps across beginning and end lists for wrap option is truthy, otherwise stops at beginning/end lists', function() {
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ]);
      assert.equal(ml.getActiveListKey(), 'list1');

      ml.activatePreviousList({wrap: true});
      assert.equal(ml.getActiveListKey(), 'list3');

      ml.activateNextList({wrap: true});
      assert.equal(ml.getActiveListKey(), 'list1');

      ml.activatePreviousList();
      assert.equal(ml.getActiveListKey(), 'list1');

      ml.activateListForKey('list3');
      assert.equal(ml.getActiveListKey(), 'list3');

      ml.activateNextList();
      assert.equal(ml.getActiveListKey(), 'list3');
    });

    it('activates first/last item in list if activateFirst/activateLast options are set to true', function() {
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ]);
      ml.activateListForKey('list2');

      ml.activatePreviousList({activateLast: true});
      assert.equal(ml.getActiveItem(), 'c');

      ml.activateItemAtIndexForKey('list2', 1);
      assert.equal(ml.getActiveItem(), 'e');
      ml.activateNextList({activateFirst: true});
      assert.equal(ml.getActiveItem(), 'f');
    });
  });

  describe('activateNextItem({wrap, stopAtBounds}) and activatePreviousItem({wrap, stopAtBounds})', function() {
    it('activates the next/previous item in the currently active list', function() {
      const didChangeActiveItem = sinon.spy();
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
      ], didChangeActiveItem);
      assert.equal(ml.getActiveItem(), 'a');

      ml.activateNextItem();
      assert.equal(ml.getActiveItem(), 'b');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['b', 'list1']);

      didChangeActiveItem.reset();
      ml.activateNextItem();
      assert.equal(ml.getActiveItem(), 'c');
      assert.equal(didChangeActiveItem.callCount, 1);
      assert.deepEqual(didChangeActiveItem.args[0], ['c', 'list1']);

      ml.activatePreviousItem();
      assert.equal(ml.getActiveItem(), 'b');

      ml.activatePreviousItem();
      assert.equal(ml.getActiveItem(), 'a');
    });

    it('activates the next/previous list if one exists when activateing past the last/first item of a list, unless stopAtBounds is true', function() {
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b']},
        {key: 'list2', items: ['c']},
      ]);

      assert.equal(ml.getActiveItem(), 'a');
      assert.equal(ml.getActiveListKey(), 'list1');
      ml.activateNextItem();
      assert.equal(ml.getActiveItem(), 'b');
      assert.equal(ml.getActiveListKey(), 'list1');
      ml.activateNextItem({stopAtBounds: true});
      assert.equal(ml.getActiveItem(), 'b');
      assert.equal(ml.getActiveListKey(), 'list1');
      ml.activateNextItem();
      assert.equal(ml.getActiveItem(), 'c');
      assert.equal(ml.getActiveListKey(), 'list2');
      ml.activateNextItem();
      assert.equal(ml.getActiveItem(), 'c');
      assert.equal(ml.getActiveListKey(), 'list2');
      ml.activateNextItem({stopAtBounds: true});
      assert.equal(ml.getActiveItem(), 'c');
      assert.equal(ml.getActiveListKey(), 'list2');
      ml.activatePreviousItem();
      assert.equal(ml.getActiveItem(), 'b');
      assert.equal(ml.getActiveListKey(), 'list1');
      ml.activatePreviousItem();
      assert.equal(ml.getActiveItem(), 'a');
      assert.equal(ml.getActiveListKey(), 'list1');
      ml.activatePreviousItem();
      assert.equal(ml.getActiveItem(), 'a');
      assert.equal(ml.getActiveListKey(), 'list1');
    });

    it('wraps across beginning and end lists if the wrap option is set to true', function() {
      const ml = new MultiList([
        {key: 'list1', items: ['a', 'b', 'c']},
        {key: 'list2', items: ['d', 'e']},
        {key: 'list3', items: ['f', 'g', 'h']},
      ]);
      assert.equal(ml.getActiveItem(), 'a');

      ml.activatePreviousItem({wrap: true});
      assert.equal(ml.getActiveItem(), 'h');

      ml.activateNextItem({wrap: true});
      assert.equal(ml.getActiveItem(), 'a');
    });
  });

  describe('updateLists(lists, {suppressCallback, oldActiveListIndex, oldActiveListItemIndex})', function() {
    describe('when referential identity of list keys is NOT maintained', function() {
      it('updates selected item based on options passed in', function() {
        function getRandomKey() {
          return performance.now() + Math.random() * 100000;
        }

        let options;

        const ml = new MultiList([
          {key: getRandomKey(), items: ['a', 'b', 'c']},
          {key: getRandomKey(), items: ['d', 'e']},
          {key: getRandomKey(), items: ['f', 'g', 'h']},
        ]);

        ml.activateItem('b');
        options = {oldActiveListIndex: 0, oldActiveListItemIndex: 1};

        ml.updateLists([
          {key: getRandomKey(), items: ['a', 'c']},
          {key: getRandomKey(), items: ['d', 'e']},
          {key: getRandomKey(), items: ['f', 'g', 'h']},
        ], options);

        assert.equal(ml.getActiveItem(), 'c');
        options = {oldActiveListIndex: 0, oldActiveListItemIndex: 1};

        ml.updateLists([
          {key: getRandomKey(), items: ['a']},
          {key: getRandomKey(), items: ['d', 'e']},
          {key: getRandomKey(), items: ['f', 'g', 'h']},
        ], options);

        assert.equal(ml.getActiveItem(), 'd');
        options = {oldActiveListIndex: 1, oldActiveListItemIndex: 0};

        ml.updateLists([
          {key: getRandomKey(), items: ['a']},
          {key: getRandomKey(), items: ['f', 'g', 'h']},
        ], options);

        assert.equal(ml.getActiveItem(), 'f');
        options = {oldActiveListIndex: 1, oldActiveListItemIndex: 1};

        ml.updateLists([
          {key: getRandomKey(), items: ['a']},
        ], options);

        assert.equal(ml.getActiveItem(), 'a');
        options = {oldActiveListIndex: 0, oldActiveListItemIndex: 0};

        ml.updateLists([
          {key: getRandomKey(), items: []},
          {key: getRandomKey(), items: ['j']},
        ], options);

        assert.equal(ml.getActiveItem(), 'j');
      });
    });

    describe('when referential identity of list keys is maintained', function() {
      it('adds and removes lists based on list keys and updates order accordingly, remembering the active list', function() {
        const ml = new MultiList([
          {key: 'list1', items: ['a', 'b', 'c']},
          {key: 'list2', items: ['d', 'e']},
        ]);
        assert.deepEqual(ml.getListKeys(), ['list1', 'list2']);
        assert.equal(ml.getActiveListKey(), 'list1');

        ml.updateLists([
          {key: 'list3', items: ['f', 'g', 'h']},
          {key: 'list1', items: ['a', 'b', 'c']},
          {key: 'list2', items: ['d', 'e']},
        ]);
        assert.deepEqual(ml.getListKeys(), ['list3', 'list1', 'list2']);
        assert.equal(ml.getActiveListKey(), 'list1');

        ml.updateLists([
          {key: 'list1', items: ['a', 'b', 'c']},
          {key: 'list3', items: ['f', 'g', 'h']},
        ]);
        assert.deepEqual(ml.getListKeys(), ['list1', 'list3']);
        assert.equal(ml.getActiveListKey(), 'list1');

        ml.updateLists([
          {key: 'list3', items: ['f', 'g', 'h']},
          {key: 'list2', items: ['d', 'e']},
          {key: 'list1', items: ['a', 'b', 'c']},
        ]);
        assert.deepEqual(ml.getListKeys(), ['list3', 'list2', 'list1']);
        assert.equal(ml.getActiveListKey(), 'list1');
      });

      describe('when active list is removed', function() {
        describe('when there is a new list in its place', function() {
          it('activates the new list in its place', function() {
            const didChangeActiveItem = sinon.spy();
            const ml = new MultiList([
              {key: 'list1', items: ['a', 'b', 'c']},
              {key: 'list2', items: ['d', 'e']},
            ], didChangeActiveItem);

            assert.equal(ml.getActiveListKey(), 'list1');

            ml.updateLists([
              {key: 'list2', items: ['d', 'e']},
            ]);
            assert.equal(ml.getActiveListKey(), 'list2');
            assert.equal(didChangeActiveItem.callCount, 1);
            assert.deepEqual(didChangeActiveItem.args[0], ['d', 'list2']);
          });
        });

        describe('when there is no list in its place', function() {
          it('activates the last item in the last list', function() {
            const didChangeActiveItem = sinon.spy();
            const ml = new MultiList([
              {key: 'list1', items: ['a', 'b', 'c']},
              {key: 'list2', items: ['d', 'e']},
            ], didChangeActiveItem);

            ml.activateListForKey('list2');

            didChangeActiveItem.reset();
            ml.updateLists([
              {key: 'list1', items: ['a', 'b', 'c']},
            ]);
            assert.equal(ml.getActiveListKey(), 'list1');
            assert.equal(didChangeActiveItem.callCount, 1);
            assert.deepEqual(didChangeActiveItem.args[0], ['c', 'list1']);
          });
        });
      });

      it('maintains the active items for each list, even if location has changed in list', function() {
        const ml = new MultiList([
          {key: 'list1', items: ['a', 'b', 'c']},
          {key: 'list2', items: ['d', 'e']},
        ]);

        ml.activateItemAtIndexForKey('list1', 1);
        assert.equal(ml.getActiveItem(), 'b');
        ml.activateItemAtIndexForKey('list2', 1);
        assert.equal(ml.getActiveItem(), 'e');

        ml.updateLists([
          {key: 'list1', items: ['b', 'c']},
          {key: 'list2', items: ['a', 'd', 'e']},
        ]);

        assert.equal(ml.getActiveListKey(), 'list2');

        ml.activateListForKey('list1');
        assert.equal(ml.getActiveItem(), 'b');

        ml.activateListForKey('list2');
        assert.equal(ml.getActiveItem(), 'e');
      });

      describe('when list item is no longer in the list upon update', function() {
        describe('when there is a new item in its place', function() {
          it('keeps the same active item index and shows the new item as active', function() {
            const didChangeActiveItem = sinon.spy();
            const ml = new MultiList([
              {key: 'list1', items: ['a', 'b', 'c']},
            ], didChangeActiveItem);

            ml.activateItemAtIndexForKey('list1', 0);
            assert.equal(ml.getActiveItem(), 'a');

            didChangeActiveItem.reset();
            ml.updateLists([
              {key: 'list1', items: ['b', 'c']},
            ]);
            assert.equal(ml.getActiveItem(), 'b');
            assert.equal(didChangeActiveItem.callCount, 1);
            assert.deepEqual(didChangeActiveItem.args[0], ['b', 'list1']);

            didChangeActiveItem.reset();
            ml.updateLists([
              {key: 'list1', items: ['b', 'c']},
            ]);
            assert.equal(ml.getActiveItem(), 'b');
            assert.equal(didChangeActiveItem.callCount, 0);
          });
        });

        describe('when there is no item in its place, but there is still an item in the list', function() {
          it('activates the last item in the list', function() {
            const didChangeActiveItem = sinon.spy();
            const ml = new MultiList([
              {key: 'list1', items: ['a', 'b', 'c']},
            ], didChangeActiveItem);

            ml.activateItemAtIndexForKey('list1', 2);
            assert.equal(ml.getActiveItem(), 'c');

            didChangeActiveItem.reset();
            ml.updateLists([
              {key: 'list1', items: ['a', 'b']},
            ]);
            assert.equal(ml.getActiveItem(), 'b');
            assert.equal(didChangeActiveItem.callCount, 1);
            assert.deepEqual(didChangeActiveItem.args[0], ['b', 'list1']);

            didChangeActiveItem.reset();
            ml.updateLists([
              {key: 'list1', items: ['a']},
            ]);
            assert.equal(ml.getActiveItem(), 'a');
            assert.equal(didChangeActiveItem.callCount, 1);
            assert.deepEqual(didChangeActiveItem.args[0], ['a', 'list1']);
          });
        });

        describe('when there are no more items in the list', function() {
          describe('when there is a non-empty list following the active list', function() {
            it('activates the first item in the following list', function() {
              const didChangeActiveItem = sinon.spy();
              const ml = new MultiList([
                {key: 'list1', items: ['a']},
                {key: 'list2', items: ['b', 'c']},
              ], didChangeActiveItem);

              ml.activateItemAtIndexForKey('list1', 0);
              assert.equal(ml.getActiveItem(), 'a');

              didChangeActiveItem.reset();
              ml.updateLists([
                {key: 'list1', items: []},
                {key: 'list2', items: ['b', 'c']},
              ]);
              assert.equal(ml.getActiveItem(), 'b');
              assert.equal(didChangeActiveItem.callCount, 1);
              assert.deepEqual(didChangeActiveItem.args[0], ['b', 'list2']);
            });
          });

          describe('when the following list is empty, but the preceeding list is non-empty', function() {
            it('activates the last item in the preceeding list', function() {
              const didChangeActiveItem = sinon.spy();
              const ml = new MultiList([
                {key: 'list1', items: ['a', 'b']},
                {key: 'list2', items: ['c']},
              ], didChangeActiveItem);

              ml.activateItemAtIndexForKey('list2', 0);
              assert.equal(ml.getActiveItem(), 'c');

              didChangeActiveItem.reset();
              ml.updateLists([
                {key: 'list1', items: ['a', 'b']},
                {key: 'list2', items: []},
              ]);
              assert.equal(ml.getActiveItem(), 'b');
              assert.equal(ml.getActiveItem(), 'b');
              assert.equal(didChangeActiveItem.callCount, 1);
              assert.deepEqual(didChangeActiveItem.args[0], ['b', 'list1']);
            });
          });
        });
      });
    });
  });
});
