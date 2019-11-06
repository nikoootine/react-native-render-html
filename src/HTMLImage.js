import React, { PureComponent } from "react";
import { Image, View, Text, Dimensions } from "react-native";
import PropTypes from "prop-types";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default class HTMLImage extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      width: props.imagesInitialDimensions.width,
      height: props.imagesInitialDimensions.height,
      indeterminate: !props.style || !props.style.width || !props.style.height
    };
  }

  static propTypes = {
    source: PropTypes.object.isRequired,
    alt: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    style: Image.propTypes.style,
    imagesMaxWidth: PropTypes.number,
    imagesInitialDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number
    })
  };

  static defaultProps = {
    imagesInitialDimensions: {
      width: 100,
      height: 100
    }
  };

  componentDidMount() {
    this.getImageSize();
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentWillReceiveProps(nextProps) {
    this.getImageSize(nextProps);
  }

  getDimensionsFromStyle(style, height, width) {
    let styleWidth;
    let styleHeight;

    if (height) {
      styleHeight = height;
    }
    if (width) {
      styleWidth = width;
    }
    if (Array.isArray(style)) {
      style.forEach(styles => {
        if (!width && styles["width"]) {
          styleWidth = styles["width"];
        }
        if (!height && styles["height"]) {
          styleHeight = styles["height"];
        }
      });
    } else {
      if (!width && style["width"]) {
        styleWidth = style["width"];
      }
      if (!height && style["height"]) {
        styleHeight = style["height"];
      }
    }

    return { styleWidth, styleHeight };
  }

  getImageSize(props = this.props) {
    const { source, imagesMaxWidth, style, height, width } = props;
    const { styleWidth, styleHeight } = this.getDimensionsFromStyle(
      style,
      height,
      width
    );

    if (styleWidth && styleHeight) {
      if (this.mounted) {
        this.setState({
          width: this.parseDimension(styleWidth, screenWidth),
          height: this.parseDimension(styleHeight, screenHeight),
          indeterminate: false
        })
      }
    }
    // Fetch image dimensions only if they aren't supplied or if with or height is missing
    Image.getSize(
      source.uri,
      (originalWidth, originalHeight) => {
        if (styleWidth) {
          const parsedWidth = this.parseDimension(styleWidth, screenWidth);
          const optimalHeight = (parsedWidth * originalHeight) / originalWidth;
          if (this.mounted) {
            return (
              this.setState({
                width: parsedWidth,
                height: optimalHeight,
                error: false,
                indeterminate: false
              })
            );
          }
        }
        if (styleHeight) {
          const parsedHeight = this.parseDimension(styleHeight, screenHeight);
          const optimalWidth = (parsedHeight * originalWidth) / originalHeight;
          if (this.mounted) {
            return (
              this.setState({
                width: optimalWidth,
                height: parsedHeight,
                error: false
              })
            );
          }
        }
        if (!imagesMaxWidth) {
          if (this.mounted) {
            return (
              this.setState({
                width: originalWidth,
                height: originalHeight,
                indeterminate: false
              })
            );
          }
        }
        const optimalWidth =
          imagesMaxWidth <= originalWidth ? imagesMaxWidth : originalWidth;
        const optimalHeight = (optimalWidth * originalHeight) / originalWidth;

        if (this.mounted) {
          this.setState({
            width: optimalWidth,
            height: optimalHeight,
            error: false,
            indeterminate: false
          });
        }
      },
      () => {
        this.mounted && this.setState({ error: true });
      }
    );
  }

  parseDimension(dimension, screenSize) {
    if (typeof dimension === "string" && !dimension.includes("%")) {
      return parseInt(dimension, 10);
    }
    if (typeof dimension === "string" && dimension.includes("%")) {
      return (parseInt(dimension, 10) * screenSize) / 100;
    }
    return dimension;
  }

  validImage(source, style, props = {}) {
    return (
      <Image
        source={source}
        style={[
          style,
          {
            width: this.state.width,
            height: this.state.height,
            resizeMode: "cover"
          }
        ]}
        {...props}
      />
    );
  }

  get errorImage() {
    return (
      <View
        style={{
          width: 50,
          height: 50,
          borderWidth: 1,
          borderColor: "lightgray",
          overflow: "hidden",
          justifyContent: "center"
        }}
      >
        {this.props.alt ? (
          <Text style={{ textAlign: "center", fontStyle: "italic" }}>
            {this.props.alt}
          </Text>
        ) : (
          false
        )}
      </View>
    );
  }

  get placeholderImage() {
    return (
      <View
        style={{
          width: this.props.imagesInitialDimensions.width,
          height: this.props.imagesInitialDimensions.height
        }}
      />
    );
  }

  render() {
    const { source, style, passProps } = this.props;

    if (this.state.error) {
      return this.errorImage;
    }
    if (this.state.indeterminate) {
      return this.placeholderImage;
    }
    return this.validImage(source, style, passProps);
  }
}
