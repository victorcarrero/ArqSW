import React from 'react';
import PropTypes from 'prop-types';
import {autobind} from 'core-decorators';

import ModelObserver from '../models/model-observer';

export default class ObserveModel extends React.Component {
  static propTypes = {
    model: PropTypes.shape({
      onDidUpdate: PropTypes.func.isRequired,
    }),
    fetchData: PropTypes.func.isRequired,
    children: PropTypes.func.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.state = {data: null};
    this.modelObserver = new ModelObserver({fetchData: this.fetchData, didUpdate: this.didUpdate});
  }

  componentWillMount() {
    this.mounted = true;
    this.modelObserver.setActiveModel(this.props.model);
  }

  componentWillReceiveProps(nextProps) {
    this.modelObserver.setActiveModel(nextProps.model);
  }

  @autobind
  fetchData(model) {
    return this.props.fetchData(model);
  }

  @autobind
  didUpdate(model) {
    if (this.mounted) {
      const data = this.modelObserver.getActiveModelData();
      this.setState({data});
    }
  }

  render() {
    return this.props.children(this.state.data);
  }

  componentWillUnmount() {
    this.mounted = false;
    this.modelObserver.destroy();
  }
}
