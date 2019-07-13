import './Lamp.scss';
import { AppState } from 'AppState';
import { connect } from 'react-redux';
import { toggleDevice } from 'actions/device';
import BlinkenlightPopup from './BlinkenlightPopup';
import cc from 'classnames';
import React, { ReactNode } from 'react';
import Tooltip from '@material-ui/core/Tooltip';

const TooltipImg = ({ tooltip, ...props }: any) => (
  <Tooltip placement="top" title={tooltip}>
    <img {...props} />
  </Tooltip>
);

export type Lamp = {
  status_text?: string,
  rate_delay: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  name: string,
  type: string,
  status: 0 | 1,
  duplicates?: Lamp[],
  layer: string,
  image: string,
  is_writable: number,
};

type DispatchProps = {
  toggleDevice: typeof toggleDevice,
};
type OwnProps = {
  lamp: Lamp,
};
type Props = DispatchProps & OwnProps;

type State = {
  dialogOpen: boolean,
};

class LampComponent extends React.Component<Props, State> {
  static style = {
    lamp: {
      writeable: {
        cursor: 'pointer',
        transition: '300ms linear',
        ':hover': {
          transform: 'scale(1.3)',
        },
      },
      normal: {
        position: 'absolute',
      },
    },
  };
  state: State = {
    dialogOpen: false,
  };
  getTooltipText(lamp: Lamp) {
    let text = lamp.status_text;

    if (!text) {
      return null;
    }
    if (lamp.rate_delay > 0) {
      text = `${text} (${lamp.rate_delay}s)`;
    }
    /* eslint-disable react/no-danger */

    return <div dangerouslySetInnerHTML={{ __html: text }} />;

    /* eslint-enable react/no-danger */
  }
  getDuplicate(lamp: Lamp, tooltipText?: ReactNode) {
    if (!lamp.duplicates || !lamp.duplicates.length) {
      return null;
    }

    const dup = lamp.duplicates[0];
    const dupStyle = {
      left: dup.x1,
      top: dup.y1,
      width: lamp.x2,
      height: lamp.y2,
    };

    const cssClass = cc(['Lamp', { 'Lamp--writeable': lamp.is_writable && lamp.rate_delay <= 0 }]);
    const imgProps = {
      className: cssClass,
      onClick: this.toggle,
      name: lamp.name,
      style: dupStyle,
      src: lamp.image,
    };

    if (tooltipText) {
      return <TooltipImg {...imgProps} tooltip={tooltipText} />;
    }

    return <img {...imgProps} />;
  }
  toggle = () => {
    const { lamp, toggleDevice } = this.props;

    if (!lamp.is_writable) {
      return;
    }
    if (lamp.type === 'charwrite' || lamp.type === 'blinkenlight') {
      // if (lamp.type === 'charwrite' || lamp.type === 'blinkenlight' || lamp.type === 'beamer') {
      this.setState({
        dialogOpen: true,
      });
    } else if (lamp.rate_delay <= 0) {
      toggleDevice(lamp);
    }
  };
  handleRequestClose = () => {
    this.setState({
      dialogOpen: false,
    });
  };
  componentDidMount() {
    this.delayCheck(this.props);
  }
  UNSAFE_componentWillReceiveProps(props: Props) {
    this.delayCheck(props);
  }
  doesReduce: boolean = false;
  delayCheck = (props: Props) => {
    const { lamp } = props;

    if (lamp.rate_delay > 0 && !this.doesReduce) {
      this.reduceDelay();
    }
  };
  reduceDelay() {
    this.doesReduce = true;
    setTimeout(() => {
      const { lamp } = this.props;

      this.doesReduce = false;
      lamp.rate_delay -= 1;
      this.forceUpdate();
      if (lamp.rate_delay > 0) {
        this.reduceDelay();
      }
    }, 1000);
  }
  render() {
    const { lamp } = this.props;
    const { dialogOpen } = this.state;
    const style = {
      left: lamp.x1,
      top: lamp.y1,
      width: lamp.x2,
      height: lamp.y2,
    };
    const cssClass = cc(['Lamp', { 'Lamp--writeable': lamp.is_writable && lamp.rate_delay <= 0 }]);

    const tooltipText = this.getTooltipText(lamp);
    const imgProps = {
      className: cssClass,
      onClick: this.toggle,
      name: lamp.name,
      style,
      src: lamp.image,
    };
    let image;

    if (tooltipText) {
      image = <TooltipImg {...imgProps} tooltip={tooltipText} />;
    } else {
      image = <img {...imgProps} />;
    }

    let dialog;

    if (lamp.type === 'blinkenlight') {
      dialog = dialogOpen && <BlinkenlightPopup onRequestClose={this.handleRequestClose} lamp={lamp} />;
    }

    return (
      <>
        {image}
        {this.getDuplicate(lamp, tooltipText)}
        {dialog}
      </>
    );
  }
}

export default connect<{}, DispatchProps, OwnProps, AppState>(
  undefined,
  {
    toggleDevice,
  }
)(LampComponent);