import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ForeshadowingService } from '../lib/services/foreshadowing';
import { supabase } from '../lib/supabase';

interface Seed {
    id: string;
    motif: string;
    status: string | null;
    created_at: string | null;
}

export const ForeshadowingList = () => {
    const [seeds, setSeeds] = useState<Seed[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSeeds = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const history = await ForeshadowingService.getHistory(user.id);
                // Cast to match our local interface if needed, or rely on service return type
                setSeeds(history);
            } else {
                // Mock for testing offline
                // setSeeds([
                //     { id: '1', motif: '雨の音', status: 'planted', created_at: new Date().toISOString(), resolved_at: null },
                //     { id: '2', motif: '古い鍵', status: 'resolved', created_at: new Date(Date.now() - 86400000).toISOString(), resolved_at: new Date().toISOString() },
                // ]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeeds();
    }, []);

    if (loading && seeds.length === 0) return <Text style={styles.loading}>読み込み中...</Text>;
    if (seeds.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>因果の庭</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scroll}
            >
                {seeds.map((seed) => (
                    <View key={seed.id} style={[styles.card, seed.status === 'resolved' ? styles.resolved : styles.planted]}>
                        <Text style={styles.icon}>{seed.status === 'resolved' ? '🌸' : '🌱'}</Text>
                        <Text style={styles.motif}>{seed.motif}</Text>
                        <Text style={styles.date}>
                            {seed.created_at ? new Date(seed.created_at).toLocaleDateString() : ''}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4B5563',
        marginBottom: 8,
        fontFamily: 'ZenKakuGothicNew-Bold', // Assuming font is available
    },
    loading: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginVertical: 10,
    },
    scroll: {
        flexDirection: 'row',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginRight: 10,
        minWidth: 100,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
    },
    planted: {
        borderColor: '#10B981', // Emerald
    },
    resolved: {
        borderColor: '#EC4899', // Pink
        backgroundColor: '#FDF2F8',
    },
    icon: {
        fontSize: 24,
        marginBottom: 4,
    },
    motif: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 2,
    },
    date: {
        fontSize: 10,
        color: '#9CA3AF',
    },
});
