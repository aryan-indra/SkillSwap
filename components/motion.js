import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, TouchableOpacity } from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const VARIANTS = {
  fade: {
    opacity: [0, 1],
  },
  scale: {
    opacity: [0, 1],
    scale: [0.92, 1],
  },
  slide: {
    opacity: [0, 1],
    translateY: [18, 0],
  },
  fadeSlide: {
    opacity: [0, 1],
    translateY: [18, 0],
  },
  fadeScale: {
    opacity: [0, 1],
    scale: [0.94, 1],
  },
  fadeScaleSlide: {
    opacity: [0, 1],
    scale: [0.94, 1],
    translateY: [18, 0],
  },
};

export default function Motion({
  as = 'view',
  variant = 'fadeSlide',
  delay = 0,
  duration = 450,
  style,
  children,
  ...rest
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const preset = useMemo(() => VARIANTS[variant] || VARIANTS.fadeSlide, [variant]);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, duration, progress]);

  const animatedStyle = useMemo(() => {
    const computedStyle = {};

    if (preset.opacity) {
      computedStyle.opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: preset.opacity,
      });
    }

    const transforms = [];

    if (preset.translateX) {
      transforms.push({
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: preset.translateX,
        }),
      });
    }

    if (preset.translateY) {
      transforms.push({
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: preset.translateY,
        }),
      });
    }

    if (preset.scale) {
      transforms.push({
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: preset.scale,
        }),
      });
    }

    if (transforms.length > 0) {
      computedStyle.transform = transforms;
    }

    return computedStyle;
  }, [preset, progress]);

  const Component = as === 'touchable' ? AnimatedTouchableOpacity : Animated.View;

  return (
    <Component style={[style, animatedStyle]} {...rest}>
      {children}
    </Component>
  );
}