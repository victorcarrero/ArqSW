import React from 'react';
import {graphql, createRefetchContainer} from 'react-relay';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {autobind} from 'core-decorators';

import Octicon from '../views/octicon';
import IssueishBadge from '../views/issueish-badge';
import PeriodicRefresher from '../periodic-refresher';
import tinycolor from 'tinycolor2';

import PrStatusesContainer from './pr-statuses-container';

const reactionTypeToEmoji = {
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  LAUGH: '😆',
  HOORAY: '🎉',
  CONFUSED: '😕',
  HEART: '❤️',
};

export class PrInfo extends React.Component {
  static propTypes = {
    relay: PropTypes.shape({
      refetch: PropTypes.func.isRequired,
    }).isRequired,
    pinnedByUrl: PropTypes.bool,
    onUnpinPr: PropTypes.func,
    pullRequest: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      bodyHTML: PropTypes.string,
      number: PropTypes.number,
      repository: PropTypes.shape({
        name: PropTypes.string.isRequired,
        owner: PropTypes.shape({
          login: PropTypes.string,
        }),
      }),
      state: PropTypes.oneOf([
        'OPEN', 'CLOSED', 'MERGED',
      ]).isRequired,
      author: PropTypes.shape({
        login: PropTypes.string.isRequired,
        avatarUrl: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
      }).isRequired,
      reactionGroups: PropTypes.arrayOf(
        PropTypes.shape({
          content: PropTypes.string.isRequired,
          users: PropTypes.shape({
            totalCount: PropTypes.number.isRequired,
          }).isRequired,
        }),
      ).isRequired,
    }).isRequired,
  }

  state = {
    refreshing: false,
  }

  componentDidMount() {
    this.refresher = new PeriodicRefresher(PrInfo, {
      interval: () => 3 * 60 * 1000,
      getCurrentId: () => this.props.pullRequest.id,
      refresh: this.refresh,
      minimumIntervalPerId: 60 * 1000,
    });
    this.refresher.start();
  }

  componentWillUnmount() {
    this.refresher.destroy();
  }

  @autobind
  handleRefreshClick(e) {
    e.preventDefault();
    this.refresher.refreshNow(true);
  }

  @autobind
  refresh() {
    if (this.state.refreshing) {
      return;
    }

    this.setState({refreshing: true});
    this.props.relay.refetch({
      id: this.props.pullRequest.id,
    }, null, () => {
      this.setState({refreshing: false});
    }, {force: true});
  }

  render() {
    const pr = this.props.pullRequest;
    const repo = pr.repository;
    return (
      <div className="github-PrInfo">
        {this.props.pinnedByUrl && this.renderPinnedPr()}
        <div className="pr-badge-and-link">
          <IssueishBadge type="PullRequest" state={pr.state} />
          <span className="pr-link">
            <a className="pane-item-link" href={pr.url}>
              {repo.owner.login}/{repo.name}#{pr.number}
            </a>
          </span>
          <span className="refresh-button">
            <Octicon
              icon="repo-sync"
              className={cx({refreshing: this.state.refreshing})}
              onClick={this.handleRefreshClick}
            />
          </span>
        </div>
        <div className="pr-avatar-and-title">
          <a className="author-avatar-link" href={pr.author.url}>
            <img className="author-avatar" src={pr.author.avatarUrl} title={pr.author.login} />
          </a>
          <h3 className="pr-title">{pr.title}</h3>
        </div>
        <div className="conversation" onClick={this.handleClickPrLink}>
          <Octicon icon="comment-discussion" />
          Conversation
        </div>
        <div className="commit-count">
          <Octicon icon="git-commit" />
          Commits <span className="count-number">{pr.commitsCount.totalCount}</span>
        </div>
        <div className="labels">
          {pr.labels.edges.map(({node}) => {
            const {name, color} = node;
            const hex = `#${color}`;
            const textColor = tinycolor.mostReadable(hex, ['#fff', '#000']).toHexString();
            return (
              <span key={name} className="label" style={{background: hex, color: textColor}}>{name}</span>
            );
          })}
        </div>
        <div className="reactions">
          {pr.reactionGroups.map(group => (
            group.users.totalCount > 0
            ? <span className={cx('reaction-group', group.content.toLowerCase())} key={group.content}>
              {reactionTypeToEmoji[group.content]} &nbsp; {group.users.totalCount}
            </span>
            : null
          ))}
        </div>
        <PrStatusesContainer pullRequest={pr} />
      </div>
    );
  }

  renderPinnedPr() {
    return (
      <div className="pinned-pr-info">
        <Octicon
          title="This pull request has been manually pinned to this branch. Click here to select another PR."
          icon="pin"
          className="pinned-by-url"
          onClick={this.handleUnpinClick}
        />
        <span>
          This pull request has been manually pinned to the current branch.
          You may <a href="#" onClick={this.handleUnpinClick}>unpin it</a>.
        </span>
      </div>

    );
  }

  @autobind
  handleClickPrLink(event) {
    event.nativeEvent.preventDefault();
    event.nativeEvent.stopPropagation();
    const pr = this.props.pullRequest;
    const repo = pr.repository;
    atom.workspace.open(`atom-github://issueish/https://api.github.com/${repo.owner.login}/${repo.name}/${pr.number}`);
  }

  @autobind
  handleUnpinClick(event) {
    event.preventDefault();
    this.props.onUnpinPr && this.props.onUnpinPr();
  }
}

export default createRefetchContainer(PrInfo, {
  pullRequest: graphql`
    fragment PrInfoContainer_pullRequest on PullRequest {
      ...PrStatusesContainer_pullRequest
      id url number title state createdAt
      author {
        login avatarUrl
        ... on User { url }
        ... on Bot { url }
      }
      repository { name owner { login } }
      reactionGroups {
        content users { totalCount }
      }
      commitsCount:commits { totalCount }
      labels(first:100) {
        edges {
          node {
            name color
          }
        }
      }
    }
  `,
}, graphql`
  query PrInfoContainerRefetchQuery($id: ID!) {
    pullRequest:node(id: $id) {
      ... on PullRequest {
        ...PrInfoContainer_pullRequest
      }
    }
  }
`);
