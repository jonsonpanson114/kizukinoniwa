// 伏線回収履歴詳細コンポーネント

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

const COLORS = {
  washi: '#F5F5F0',
  sumi: '#2D2D2D',
  stone: '#8E8E93',
};

interface ForeshadowingEntry {
  id: string;
  motif: string;
  status: 'planted' | 'resolved';
  created_at: string;
  planted_story_id?: string;
  resolved_story_id?: string;
  resolved_at?: string;
  resolved_story_content?: string;
}

interface ForeshadowingDetailProps {
  visible: boolean;
  onClose: () => void;
}

export const ForeshadowingDetail: React.FC<ForeshadowingDetailProps> = ({ visible, onClose }) => {
  const [seeds, setSeeds] = useState<ForeshadowingEntry[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<ForeshadowingEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSeeds = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('foreshadowing')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          // 回収された伏線の物語内容を取得
          const resolvedIds = data.filter((s: any) => s.status === 'resolved').map((s: any) => s.resolved_story_id);
          let storyMap: Record<string, string> = {};

          if (resolvedIds.length > 0) {
            const { data: stories } = await supabase
              .from('stories')
              .select('id, content')
              .in('id', resolvedIds);
            if (stories) {
              storyMap = Object.fromEntries(stories.map((s: any) => [s.id, s.content]));
            }
          }

          setSeeds(data.map((s: any) => ({
            ...s,
            resolved_story_content: storyMap[s.resolved_story_id],
          })));
        }
      }
    } catch (e) {
      console.error('Failed to fetch foreshadowing:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchSeeds();
    }
  }, [visible]);

  const getStatusText = (status: string) => {
    return status === 'resolved' ? '🌸 回収済み' : '🌱 未回収';
  };

  const getStatusColor = (status: string) => {
    return status === 'resolved' ? '#FFB7C5' : '#8E8E93';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>因果の庭</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>伏線回収履歴</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : seeds.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>まだ伏線は植えられていません</Text>
            <Text style={styles.emptySubtext}>物語を綴ると、種が植えられます</Text>
          </View>
        ) : (
          <ScrollView style={styles.scroll}>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{seeds.length}</Text>
                <Text style={styles.statLabel}>総伏線数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{seeds.filter(s => s.status === 'resolved').length}</Text>
                <Text style={styles.statLabel}>回収済み</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{seeds.filter(s => s.status === 'planted').length}</Text>
                <Text style={styles.statLabel}>未回収</Text>
              </View>
            </View>

            {seeds.map((seed) => (
              <TouchableOpacity
                key={seed.id}
                style={[
                  styles.card,
                  seed.status === 'resolved' && styles.resolvedCard,
                ]}
                onPress={() => setSelectedSeed(seed)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.icon, { color: getStatusColor(seed.status) }]}>
                    {seed.status === 'resolved' ? '🌸' : '🌱'}
                  </Text>
                  <View style={styles.motifContainer}>
                    <Text style={styles.motif}>{seed.motif}</Text>
                    <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(seed.status) }]}>
                      {getStatusText(seed.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>植えた日: </Text>
                  <Text style={styles.value}>
                    {new Date(seed.created_at).toLocaleDateString('ja-JP')}
                  </Text>
                </View>

                {seed.status === 'resolved' && seed.resolved_story_id && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>回収した日: </Text>
                      <Text style={styles.value}>
                        {new Date(seed.resolved_at!).toLocaleDateString('ja-JP')}
                      </Text>
                    </View>
                    {seed.resolved_story_content && (
                      <View style={styles.storyPreviewContainer}>
                        <Text style={styles.storyPreviewLabel}>回収物語:</Text>
                        <Text style={styles.storyPreview}>
                          {seed.resolved_story_content.substring(0, 80)}...
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 詳細モーダル */}
      <Modal
        visible={selectedSeed !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSeed(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSeed && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedSeed.motif}</Text>
                  <TouchableOpacity onPress={() => setSelectedSeed(null)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalSectionTitle}>状態</Text>
                  <Text style={[
                    styles.modalStatus,
                    selectedSeed.status === 'resolved' ? styles.resolvedText : styles.plantedText
                  ]}>
                    {selectedSeed.status === 'resolved' ? '🌸 回収済み' : '🌱 未回収'}
                  </Text>

                  <Text style={styles.modalSectionTitle}>植えられた日時</Text>
                  <Text style={styles.modalText}>
                    {new Date(selectedSeed.created_at).toLocaleString('ja-JP')}
                  </Text>

                  {selectedSeed.status === 'resolved' && (
                    <>
                      <Text style={styles.modalSectionTitle}>回収された日時</Text>
                      <Text style={styles.modalText}>
                        {new Date(selectedSeed.resolved_at!).toLocaleString('ja-JP')}
                      </Text>

                      {selectedSeed.resolved_story_content && (
                        <>
                          <Text style={styles.modalSectionTitle}>回収物語</Text>
                          <Text style={styles.modalStoryText}>
                            {selectedSeed.resolved_story_content}
                          </Text>
                        </>
                      )}
                    </>
                  )}

                  {selectedSeed.status === 'planted' && (
                    <View style={styles.hintContainer}>
                      <Text style={styles.hintTitle}>💡 ヒント</Text>
                      <Text style={styles.hintText}>
                        この伏線は、将来の物語で回収されるかもしれません。
                        気づきを綴り続けると、種はいつか芽吹きます。
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.washi,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.stone,
    width: 24,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'serif',
    color: COLORS.sumi,
    fontWeight: '600',
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'serif',
    color: COLORS.stone,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.stone,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.stone,
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: COLORS.stone,
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E0',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'serif',
    color: COLORS.sumi,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.stone,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E0',
  },
  resolvedCard: {
    borderColor: '#FFB7C5',
    backgroundColor: '#FFF5F8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  motifContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  motif: {
    fontSize: 18,
    fontFamily: 'serif',
    color: COLORS.sumi,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#FFF',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    color: COLORS.stone,
    fontSize: 14,
    width: 90,
  },
  value: {
    color: COLORS.sumi,
    fontSize: 14,
    flex: 1,
  },
  storyPreviewContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F8F5',
    borderRadius: 8,
  },
  storyPreviewLabel: {
    fontSize: 12,
    color: COLORS.stone,
    marginBottom: 4,
  },
  storyPreview: {
    color: COLORS.sumi,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'serif',
    color: COLORS.sumi,
    fontWeight: '600',
    flex: 1,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.stone,
  },
  modalBody: {
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stone,
    marginTop: 16,
    marginBottom: 8,
  },
  modalStatus: {
    fontSize: 16,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  resolvedText: {
    color: '#FF6B9D',
  },
  plantedText: {
    color: COLORS.stone,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.sumi,
    lineHeight: 20,
  },
  modalStoryText: {
    fontSize: 14,
    color: COLORS.sumi,
    lineHeight: 24,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#F8F8F5',
    borderRadius: 8,
  },
  hintContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#8B7355',
    lineHeight: 18,
  },
});
