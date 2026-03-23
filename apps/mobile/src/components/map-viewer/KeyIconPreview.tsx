import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useFileUrl } from '../../hooks/useFileUrl';
import { SHAPE_PATHS } from './map-constants';

type KeyDef = {
  icon_type: string;
  icon_shape: string;
  icon_color: string;
  icon_text: string | null;
  icon_name: string;
  custom_icon_uri: string | null;
  marker_size: string;
};

export function KeyIconPreview({
  keyDef,
  size: overrideSize,
}: {
  keyDef: KeyDef;
  size?: number;
}) {
  const sz = overrideSize ?? 16;
  const half = sz / 2;
  const resolvedUri = useFileUrl(
    keyDef.icon_type === 'image' || keyDef.icon_type === 'drawn'
      ? keyDef.custom_icon_uri
      : null,
  );

  // Image/drawn icon type
  if (keyDef.icon_type === 'image' || keyDef.icon_type === 'drawn') {
    if (resolvedUri) {
      return (
        <Image
          source={{ uri: resolvedUri }}
          style={[styles.image, { width: sz, height: sz, borderRadius: sz / 4 }]}
        />
      );
    }
    return (
      <View
        style={[
          styles.fallbackCircle,
          { width: sz, height: sz, borderRadius: sz / 2, backgroundColor: keyDef.icon_color },
        ]}
      />
    );
  }

  // Text icon type
  if (keyDef.icon_type === 'text') {
    return (
      <View
        style={[
          styles.textCircle,
          {
            width: sz,
            height: sz,
            borderRadius: sz / 2,
            backgroundColor: keyDef.icon_color,
          },
        ]}
      >
        <Text style={[styles.textLabel, { fontSize: sz * 0.55 }]}>
          {keyDef.icon_text?.slice(0, 2) ?? '?'}
        </Text>
      </View>
    );
  }

  // Default: shape
  return (
    <Svg width={sz} height={sz} viewBox={`${-half} ${-half} ${sz} ${sz}`}>
      {keyDef.icon_shape === 'circle' ? (
        <Circle r={half * 0.8} fill={keyDef.icon_color} />
      ) : (
        <Path
          d={SHAPE_PATHS[keyDef.icon_shape]?.(sz * 0.8) ?? ''}
          fill={keyDef.icon_color}
        />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallbackCircle: {},
  textCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLabel: {
    color: '#fff',
    fontWeight: '700',
    lineHeight: undefined,
  },
});
