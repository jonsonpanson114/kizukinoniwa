import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

type Props = {
    year: number;
    month: number; // 0-indexed
    markedDates: Set<string>; // "YYYY-MM-DD"
    storyDates: Set<string>;  // "YYYY-MM-DD"
    selectedDate: string | null;
    onSelectDate: (date: string | null) => void;
    onMonthChange: (year: number, month: number) => void;
};

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function toDateKey(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

export function MiniCalendar({ year, month, markedDates, storyDates, selectedDate, onSelectDate, onMonthChange }: Props) {
    const today = new Date();
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => {
        if (month === 0) onMonthChange(year - 1, 11);
        else onMonthChange(year, month - 1);
    };
    const nextMonth = () => {
        if (month === 11) onMonthChange(year + 1, 0);
        else onMonthChange(year, month + 1);
    };

    // Build grid: weeks array of 7-day arrays (null = empty)
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }

    const monthLabel = `${year}年${month + 1}月`;

    return (
        <View style={{ marginBottom: 20 }}>
            {/* Month header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 18, color: COLORS.sumi }}>‹</Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: 'NotoSerifJP_400Regular', fontSize: 15, color: COLORS.sumi, letterSpacing: 2 }}>
                    {monthLabel}
                </Text>
                <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 18, color: COLORS.sumi }}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {DAY_LABELS.map((label, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{
                            fontSize: 10,
                            color: i === 0 ? '#C0392B' : i === 6 ? '#2980B9' : COLORS.stone,
                            fontFamily: 'NotoSansJP_400Regular',
                        }}>
                            {label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Date grid */}
            {weeks.map((week, wi) => (
                <View key={wi} style={{ flexDirection: 'row', marginBottom: 2 }}>
                    {week.map((day, di) => {
                        if (!day) return <View key={di} style={{ flex: 1 }} />;
                        const key = toDateKey(year, month, day);
                        const isToday = key === todayKey;
                        const isSelected = key === selectedDate;
                        const hasKizuki = markedDates.has(key);
                        const hasStory = storyDates.has(key);
                        const isSun = di === 0;
                        const isSat = di === 6;

                        return (
                            <TouchableOpacity
                                key={di}
                                style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
                                onPress={() => onSelectDate(isSelected ? null : key)}
                            >
                                <View style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isSelected ? COLORS.sumi : 'transparent',
                                }}>
                                    <Text style={{
                                        fontSize: 13,
                                        color: isSelected ? '#F5F5F0' : isSun ? '#C0392B' : isSat ? '#2980B9' : COLORS.sumi,
                                        textDecorationLine: isToday && !isSelected ? 'underline' : 'none',
                                        fontFamily: 'NotoSansJP_400Regular',
                                    }}>
                                        {day}
                                    </Text>
                                </View>
                                {/* Dots */}
                                <View style={{ flexDirection: 'row', gap: 2, marginTop: 1, height: 5 }}>
                                    {hasKizuki && (
                                        <View style={{
                                            width: 4, height: 4, borderRadius: 2,
                                            backgroundColor: isSelected ? '#F5F5F0' : COLORS.sumi,
                                        }} />
                                    )}
                                    {hasStory && (
                                        <View style={{
                                            width: 4, height: 4, borderRadius: 2,
                                            backgroundColor: isSelected ? '#F5F5F0' : COLORS.stone,
                                        }} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}

            {/* Legend */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.sumi }} />
                    <Text style={{ fontSize: 10, color: COLORS.stone, fontFamily: 'NotoSansJP_400Regular' }}>気づき</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.stone }} />
                    <Text style={{ fontSize: 10, color: COLORS.stone, fontFamily: 'NotoSansJP_400Regular' }}>物語</Text>
                </View>
            </View>
        </View>
    );
}
