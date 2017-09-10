/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type {ConcreteFragment} from 'relay-runtime';
export type IssueTimelineContainer_issue = {|
  +url: any;
  +timeline: {|
    +pageInfo: {|
      +endCursor: ?string;
      +hasNextPage: boolean;
    |};
    +edges: ?$ReadOnlyArray<?{|
      +cursor: string;
      +node: ?{|
        +__typename: string;
      |};
    |}>;
  |};
|};
*/


const fragment /*: ConcreteFragment*/ = {
  "argumentDefinitions": [
    {
      "kind": "RootArgument",
      "name": "timelineCount",
      "type": "Int"
    },
    {
      "kind": "RootArgument",
      "name": "timelineCursor",
      "type": "String"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "timelineCount",
        "cursor": "timelineCursor",
        "direction": "forward",
        "path": [
          "timeline"
        ]
      }
    ]
  },
  "name": "IssueTimelineContainer_issue",
  "selections": [
    {
      "kind": "ScalarField",
      "alias": null,
      "args": null,
      "name": "url",
      "storageKey": null
    },
    {
      "kind": "LinkedField",
      "alias": "timeline",
      "args": null,
      "concreteType": "IssueTimelineConnection",
      "name": "__IssueTimelineContainer_timeline_connection",
      "plural": false,
      "selections": [
        {
          "kind": "LinkedField",
          "alias": null,
          "args": null,
          "concreteType": "PageInfo",
          "name": "pageInfo",
          "plural": false,
          "selections": [
            {
              "kind": "ScalarField",
              "alias": null,
              "args": null,
              "name": "endCursor",
              "storageKey": null
            },
            {
              "kind": "ScalarField",
              "alias": null,
              "args": null,
              "name": "hasNextPage",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "kind": "LinkedField",
          "alias": null,
          "args": null,
          "concreteType": "IssueTimelineItemEdge",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "kind": "ScalarField",
              "alias": null,
              "args": null,
              "name": "cursor",
              "storageKey": null
            },
            {
              "kind": "LinkedField",
              "alias": null,
              "args": null,
              "concreteType": null,
              "name": "node",
              "plural": false,
              "selections": [
                {
                  "kind": "ScalarField",
                  "alias": null,
                  "args": null,
                  "name": "__typename",
                  "storageKey": null
                },
                {
                  "kind": "FragmentSpread",
                  "name": "CommitsContainer_nodes",
                  "args": null
                },
                {
                  "kind": "FragmentSpread",
                  "name": "IssueCommentContainer_item",
                  "args": null
                },
                {
                  "kind": "FragmentSpread",
                  "name": "CrossReferencedEventsContainer_nodes",
                  "args": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Issue"
};

module.exports = fragment;
