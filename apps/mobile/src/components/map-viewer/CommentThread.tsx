import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Image, Alert, StyleSheet } from 'react-native';
import { Send, ImagePlus, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { Body, Caption } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { useFileUrl } from '../../hooks/useFileUrl';
import { REACTION_EMOJIS, REACTION_DISPLAY } from './map-constants';
import type { AggregatedComment } from '../../hooks/useMapData';

export function CommentThread({
  comment,
  onReply,
  onToggleReaction,
  onResolve,
  onReopen,
  onAddPhoto,
}: {
  comment: AggregatedComment;
  onReply: (commentId: string, content: string) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  onResolve: (commentId: string) => void;
  onReopen: (commentId: string) => void;
  onAddPhoto: (commentId: string, uri: string, fileName: string, fileSize: number) => void;
}) {
  const { colors } = useTheme();
  const [replyText, setReplyText] = useState('');
  const isResolved = !!comment.resolved_at;

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
  };

  const handleResolve = () => {
    Alert.alert('Resolve Comment', 'Mark this comment as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: () => onResolve(comment.id) },
    ]);
  };

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      onAddPhoto(comment.id, asset.uri, asset.fileName ?? 'photo.jpg', asset.fileSize ?? 0);
    }
  };

  // Aggregate reactions into counts
  const reactionCounts = new Map<string, { count: number; hasReacted: boolean }>();
  for (const r of comment.reactions) {
    const key = r.emoji ?? '';
    const existing = reactionCounts.get(key) ?? { count: 0, hasReacted: false };
    existing.count++;
    reactionCounts.set(key, existing);
  }

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Body style={styles.commentText}>{comment.content}</Body>
          <Caption color="secondary">
            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
          </Caption>
        </View>
        <Badge variant={isResolved ? 'secondary' : 'default'}>
          {isResolved ? 'Resolved' : 'Open'}
        </Badge>
      </View>

      {/* Photos */}
      {comment.photos.length > 0 && (
        <View style={styles.photoGrid}>
          {comment.photos.map((photo) => (
            <CommentPhoto key={photo.id} fileUri={photo.file_uri ?? ''} />
          ))}
        </View>
      )}

      {/* Reactions */}
      <View style={styles.reactionBar}>
        {REACTION_EMOJIS.map((emoji) => {
          const data = reactionCounts.get(emoji);
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionBtn,
                {
                  borderColor: data?.hasReacted ? colors.primary : colors.border,
                  backgroundColor: data?.hasReacted ? colors.primaryLight : 'transparent',
                },
              ]}
              onPress={() => onToggleReaction(comment.id, emoji)}
              activeOpacity={0.7}
            >
              <Caption>{REACTION_DISPLAY[emoji]}</Caption>
              {data && data.count > 0 && (
                <Caption color="secondary" style={styles.reactionCount}>
                  {data.count}
                </Caption>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <View style={[styles.repliesContainer, { borderColor: colors.border }]}>
          {comment.replies.map((reply) => (
            <View key={reply.id} style={styles.reply}>
              <Body style={styles.replyText}>{reply.content}</Body>
              <Caption color="secondary">
                {reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ''}
              </Caption>
            </View>
          ))}
        </View>
      )}

      {/* Reply input */}
      <View style={styles.replyRow}>
        <TextInput
          value={replyText}
          onChangeText={setReplyText}
          placeholder="Reply..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.replyInput, { borderColor: colors.border, color: colors.text }]}
          returnKeyType="send"
          onSubmitEditing={handleReply}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { opacity: replyText.trim() ? 1 : 0.4 }]}
          onPress={handleReply}
          disabled={!replyText.trim()}
        >
          <Send size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={handlePickPhoto}
          activeOpacity={0.7}
        >
          <ImagePlus size={14} color={colors.textSecondary} />
          <Caption color="secondary">Photo</Caption>
        </TouchableOpacity>

        {isResolved ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnRight, { borderColor: colors.border }]}
            onPress={() => onReopen(comment.id)}
            activeOpacity={0.7}
          >
            <RotateCcw size={14} color={colors.textSecondary} />
            <Caption color="secondary">Reopen</Caption>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnRight, { borderColor: colors.border }]}
            onPress={handleResolve}
            activeOpacity={0.7}
          >
            <CheckCircle2 size={14} color={colors.textSecondary} />
            <Caption color="secondary">Resolve</Caption>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function CommentPhoto({ fileUri }: { fileUri: string }) {
  const resolved = useFileUrl(fileUri);
  if (!resolved) return null;
  return (
    <Image
      source={{ uri: resolved }}
      style={styles.photo}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  commentText: {
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 6,
  },
  reactionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 28,
  },
  reactionCount: {
    fontSize: 11,
  },
  repliesContainer: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    gap: 8,
  },
  reply: {
    gap: 2,
  },
  replyText: {
    fontSize: 14,
  },
  replyRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  sendBtn: {
    padding: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 32,
  },
  actionBtnRight: {
    marginLeft: 'auto',
  },
});
