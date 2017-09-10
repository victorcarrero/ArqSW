import React from 'react';
import {shallow} from 'enzyme';

import {Commits} from '../../lib/containers/timeline-items/commits-container';

describe('CommitsContainer', function() {
  it('renders a header with one user name', function() {
    const nodes = [
      {id: 1, author: {name: 'FirstName', user: {login: 'FirstLogin'}}},
      {id: 2, author: {name: null, user: null}},
    ];
    const app = <Commits nodes={nodes} />;
    const instance = shallow(app);
    assert.match(instance.text(), /FirstLogin added/);
  });

  it('renders a header with two user names', function() {
    const nodes = [
      {id: 1, author: {name: 'FirstName', user: {login: 'FirstLogin'}}},
      {id: 2, author: {name: 'SecondName', user: {login: 'SecondLogin'}}},
    ];
    const app = <Commits nodes={nodes} />;
    const instance = shallow(app);
    assert.match(instance.text(), /FirstLogin and SecondLogin added/);
  });

  it('renders a header with more than two user names', function() {
    const nodes = [
      {id: 1, author: {name: 'FirstName', user: {login: 'FirstLogin'}}},
      {id: 2, author: {name: 'SecondName', user: {login: 'SecondLogin'}}},
      {id: 2, author: {name: 'ThirdName', user: {login: 'ThirdLogin'}}},
    ];
    const app = <Commits nodes={nodes} />;
    const instance = shallow(app);
    assert.match(instance.text(), /FirstLogin, SecondLogin, and others added/);
  });

  it('prefers displaying usernames from user.login', function() {
    const nodes = [
      {id: 1, author: {name: 'FirstName', user: {login: 'FirstLogin'}}},
      {id: 2, author: {name: 'SecondName', user: null}},
    ];
    const app = <Commits nodes={nodes} />;
    const instance = shallow(app);
    assert.match(instance.text(), /FirstLogin and SecondName added/);
  });

  it('falls back to generic text if there are no names', function() {
    const nodes = [
      {id: 1, author: {name: null, user: null}},
      {id: 2, author: {name: null, user: null}},
    ];
    const app = <Commits nodes={nodes} />;
    const instance = shallow(app);
    assert.match(instance.text(), /Someone added/);
  });

  it('only renders the header if there are multiple commits', function() {
    const nodes = [
      {id: 1, author: {name: 'FirstName', user: null}},
    ];
    const app = <Commits nodes={nodes} />;
    const instance = shallow(app);
    assert.notMatch(instance.text(), /added/);
  });
});
