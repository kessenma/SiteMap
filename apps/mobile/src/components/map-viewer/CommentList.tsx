import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Body, Caption } from '../ui/Typography';
import type { AggregatedComment } from '../../hooks/useMapData';

export function CommentList({
  comments,
  selectedCommentId,
  onSelect,
}: {
  comments: AggregatedComment[];
  selectedCommentId: string | null;
  onSelect: (commentId: string) => void;
}) {
  const { colors } = useTheme();

  if (comments.length === 0) {
    return (
      <View style={styles.empty}>
        <Caption color="secondary">
          No comments yet. Use "Comment" mode to pin comments on the map.
        </Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {comments.map((c) => {
        const isResolved = !!c.resolved_at;
        const isSelected = selectedCommentId === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.row,
              {
                borderColor: colors.border,
                backgroundColor: isSelected ? colors.primaryLight : 'transparent',
              },
            ]}
            onPress={() => onSelect(c.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isResolved ? '#10B981' : '#6366F1' },
              ]}
            />
            <View style={styles.content}>
              <Body numberOfLines={1} style={styles.text}>
                {c.content}
              </Body>
              <Caption color="secondary">
                {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                {isResolved && ' \u00B7 Resolved'}
                {c.replies.length > 0 && ` \u00B7 ${c.replies.length} repl${c.replies.length === 1 ? 'y' : 'ies'}`}
              </Caption>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: 14,
  },
});
