import React, { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  View,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Modal com overlay aparecendo na hora e apenas o conteúdo subindo de baixo.
 */
export default function AnimatedModal({ visible, onRequestClose, children, style }) {
  const [showing, setShowing] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setShowing(true);
      slideY.setValue(SCREEN_HEIGHT);
      overlayOpacity.setValue(0); // Reset to 0 before animating

      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          damping: 24,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1, // Store opacity 1 implies fully opaque based on overlayBg style
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, slideY]);

  useEffect(() => {
    if (!visible && showing) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowing(false);
        setKeyboardHeight(0);
        onRequestClose?.();
      });
    }
  }, [visible, showing, overlayOpacity, slideY]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const showSub = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
    }
  }, [visible]);

  const overlayStyle = [
    styles.overlay,
    style,
    Platform.OS === 'android' ? { paddingBottom: keyboardHeight } : null,
  ];

  return (
    <Modal
      visible={showing}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={overlayStyle}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlayBg, { opacity: overlayOpacity }]} />
        <Animated.View style={[styles.content, { transform: [{ translateY: slideY }] }]}>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  content: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
});
