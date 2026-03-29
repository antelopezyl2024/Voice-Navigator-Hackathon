import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#f0f4ff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(74, 128, 240, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(50, 50, 80, ${opacity})`,
  propsForDots: { r: '2', strokeWidth: '1', stroke: '#4A80F0' },
  propsForBackgroundLines: { stroke: '#e0e7ff' },
};

const PIE_COLORS = ['#4A80F0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

export function LineChartDisplay({ data, label, unit = '' }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Sample to max 20 points for readability
  const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 20)) === 0);
  const labels = sampled.map((d) => String(d.year));
  const values = sampled.map((d) => d.value);

  return (
    <View style={styles.chartWrapper}>
      <Text style={styles.chartLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{ labels, datasets: [{ data: values }] }}
          width={Math.max(screenWidth - 32, sampled.length * 40)}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={sampled.length <= 30}
          withShadow={false}
          fromZero={false}
          yAxisSuffix={unit}
          verticalLabelRotation={30}
        />
      </ScrollView>
    </View>
  );
}

export function PieChartDisplay({ data, label }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.percentage, 0);
  const chartData = data.map((item, i) => ({
    name: item.name,
    population: item.percentage,
    color: PIE_COLORS[i % PIE_COLORS.length],
    legendFontColor: '#333',
    legendFontSize: 11,
  }));

  return (
    <View style={styles.chartWrapper}>
      <Text style={styles.chartLabel}>{label}</Text>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: { marginVertical: 8, backgroundColor: '#fff', borderRadius: 12, padding: 8, elevation: 2 },
  chartLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, textAlign: 'center' },
  chart: { borderRadius: 8 },
  empty: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#999', fontSize: 14 },
});
