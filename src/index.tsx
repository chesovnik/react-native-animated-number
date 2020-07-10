import * as React from "react";
import { TextInput, TextInputProps } from "react-native";

interface Props {
  formatter: (value: number) => string;
  steps: number;
  time: number;
  value: number;
  focused: boolean;
}

export default class AnimatedNumber extends React.Component<Props & Omit<TextInputProps, "editable"|"value">> {
  public static defaultProps: Partial<Props> = {
    formatter: value => value.toString(),
    steps: 15,
    time: 17,
    focused: false,
  };

  private intervalTimer?: NodeJS.Timeout;
  /** No need to keep the current value in state since we update it imperatively */
  private currentValue: number;
  private textInputRef: React.RefObject<TextInput>;
  
  public constructor(props: Props & TextInputProps) {
    super(props);

    this.currentValue = props.value;
    this.textInputRef = React.createRef<TextInput>();
  }

  public componentDidUpdate({ value: prevValue }: Props) {
    const { value } = this.props;

    if (prevValue !== value) {
      this.handleUpdateValueImperatively();
    }
  }

  public componentWillUnmount() {
    this.possiblyClearInterval();    
  }

  public render() {
    const { formatter, steps, time, value, ...props } = this.props;

    return <TextInput editable={false} {...props} ref={this.textInputRef} value={formatter(this.currentValue)} />;
  }

  private possiblyClearInterval = () => {
    this.intervalTimer && clearInterval(this.intervalTimer);
  };

  private handleUpdateValueImperatively = () => {
    const { formatter, steps, time, value, focused } = this.props;
    /** Stop any previous animation */
    this.possiblyClearInterval();
    if (focused && this.textInputRef.current) {
        this.textInputRef.current.setNativeProps({ text: formatter(value) });
        this.currentValue = +(value);
        return;
    }
    
    /** Calculate change per step */
    const minimumStep = value - this.currentValue > 0 ? 1 : -1;
    const stepSize = Math.floor((value - this.currentValue) / steps);
    const valuePerStep = minimumStep > 0 ? Math.max(stepSize, minimumStep) : Math.min(stepSize, minimumStep);

    /** Clamping is required to correct for rounding errors */
    const clampValue = 1 === minimumStep ? Math.min.bind(undefined, value) : Math.max.bind(undefined, value);

    this.intervalTimer = setInterval(
      () => {
        /** Calculate next value */
        this.currentValue = Math.floor(clampValue(this.currentValue + valuePerStep));

        /** Set next value */
        if (this.textInputRef.current) {
          this.textInputRef.current.setNativeProps({ text: formatter(this.currentValue) });
        }

        if ((minimumStep === 1 && this.currentValue >= value) || (minimumStep === -1 && this.currentValue <= value)) {
          this.possiblyClearInterval();
        }
      },
      time
    );
  };
}
