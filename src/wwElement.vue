<template>
  <div class="statistics-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Statistiken werden geladen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
    </div>

    <!-- Dashboard -->
    <div v-else-if="stats" class="dashboard">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="header-text">
            <h2>{{ stats?.period_label || 'Statistik' }}</h2>
            <p class="date-range">
              {{ formatDate(stats?.period_start) }} - {{ formatDate(stats?.period_end) }}
            </p>
          </div>
          <div class="header-actions">
            <!-- Period Selector (only if enabled) -->
            <div v-if="content?.showPeriodSelector" class="period-selector">
              <button
                v-for="p in periods"
                :key="p.value"
                @click="selectPeriod(p.value)"
                :class="['period-button', { active: selectedPeriod === p.value }]"
              >
                {{ p.label }}
              </button>
            </div>
            <button class="refresh-button" @click="loadData" :disabled="loading">
              <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
              Aktualisieren
            </button>
          </div>
        </div>
      </div>

      <!-- Main Stats Grid -->
      <div class="stats-grid">
        <!-- Progress Ring Card -->
        <div class="card progress-card">
          <h3>Fortschritt</h3>
          <div class="progress-ring-container">
            <svg class="progress-ring" width="180" height="180">
              <circle
                class="progress-ring-bg"
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#e0e0e0"
                stroke-width="12"
              />
              <circle
                class="progress-ring-fill"
                cx="90"
                cy="90"
                r="70"
                fill="none"
                :stroke="progressColor"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="progressOffset"
              />
              <text
                x="90"
                y="85"
                text-anchor="middle"
                class="progress-text-large"
              >
                {{ (stats?.completion_percentage || 0).toFixed(1) }}%
              </text>
              <text
                x="90"
                y="105"
                text-anchor="middle"
                class="progress-text-small"
              >
                von {{ stats?.expected_hours || 0 }}h
              </text>
            </svg>
          </div>
        </div>

        <!-- Hours Card -->
        <div class="card hours-card">
          <h3>Arbeitszeit</h3>
          <div class="hours-display">
            <div class="hours-actual">
              <span class="hours-value">{{ stats?.total_minutes || 0 }}</span>
              <span class="hours-label">Minuten</span>
            </div>
            <div class="hours-expected">
              <span class="hours-label">Soll: {{ stats?.expected_minutes || 0 }} min</span>
            </div>
          </div>
          <div class="hours-bar">
            <div
              class="hours-bar-fill"
              :style="{ width: barWidth + '%' }"
            ></div>
          </div>
          <div class="hours-diff" :class="diffClass">
            {{ (stats?.difference_minutes || 0) > 0 ? '+' : '' }}{{ stats?.difference_minutes || 0 }} min
          </div>
        </div>

        <!-- Entry Count Card -->
        <div class="card count-card">
          <h3>Einträge</h3>
          <div class="count-display">
            <span class="count-value">{{ stats?.entry_count || 0 }}</span>
            <span class="count-label">Zeiteinträge</span>
          </div>
          <div class="count-details">
            <div class="count-row">
              <span class="count-detail-label">⌀ pro Eintrag:</span>
              <span class="count-detail-value">{{ formatHoursMinutes((stats?.average_hours_per_entry || 0) * 60) }}h</span>
            </div>
            <div class="count-row">
              <span class="count-detail-label">⌀ pro Tag:</span>
              <span class="count-detail-value">{{ averagePerDay }}h</span>
            </div>
          </div>
        </div>

        <!-- Minutes Card -->
        <div class="card minutes-card">
          <h3>Minuten</h3>
          <div class="minutes-display">
            <div class="minutes-row">
              <span class="minutes-label">Gearbeitet:</span>
              <span class="minutes-value">{{ formatHoursMinutes(stats?.total_minutes) }}h</span>
            </div>
            <div class="minutes-row">
              <span class="minutes-label">Soll:</span>
              <span class="minutes-value">{{ formatHoursMinutes(stats?.expected_minutes) }}h</span>
            </div>
            <div class="minutes-row diff" :class="diffClass">
              <span class="minutes-label">Differenz:</span>
              <span class="minutes-value">
                <span class="trend-indicator" :class="diffClass">
                  {{ (stats?.difference_minutes || 0) >= 0 ? '↑' : '↓' }}
                </span>
                {{ formatHoursMinutes(stats?.difference_minutes) }}h
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Breakdown (only for week view) -->
      <div v-if="selectedPeriod === 'week' && stats?.entries" class="daily-breakdown">
        <h3>Tägliche Übersicht</h3>
        <div class="daily-bars">
          <div
            v-for="(day, index) in weeklyDayBreakdown"
            :key="index"
            class="day-bar-container"
          >
            <div class="day-label">{{ day.label }}</div>
            <div
              class="day-bar-track"
              :title="`${day.label}: ${day.hours}h (${day.minutes} min) - ${day.percentage.toFixed(1)}% des Tagesziels`"
            >
              <div
                class="day-bar-fill"
                :style="{ width: day.percentage + '%' }"
                :class="{ 'has-data': day.minutes > 0 }"
              ></div>
            </div>
            <div class="day-stats">
              <span class="day-minutes">{{ day.minutes }} min</span>
              <span class="day-percentage">{{ day.percentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Breakdown (only for month view) -->
      <div v-if="selectedPeriod === 'month' && stats?.entries" class="daily-breakdown">
        <h3>Monatliche Übersicht</h3>
        <div class="daily-bars">
          <div
            v-for="(month, index) in monthlyYearBreakdown"
            :key="index"
            class="day-bar-container"
          >
            <div class="day-label">{{ month.label }}</div>
            <div
              class="day-bar-track"
              :title="`${month.label}: ${month.hours}h (${month.minutes} min) - ${month.percentage.toFixed(1)}% des Monatsziels`"
            >
              <div
                class="day-bar-fill"
                :style="{ width: month.percentage + '%' }"
                :class="{ 'has-data': month.minutes > 0 }"
              ></div>
            </div>
            <div class="day-stats">
              <span class="day-minutes">{{ month.minutes }} min</span>
              <span class="day-percentage">{{ month.percentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // State
    const stats = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const periods = [
      { value: 'day', label: 'Tag' },
      { value: 'week', label: 'Woche' },
      { value: 'month', label: 'Monat' },
    ];

    // Internal variable for selected period
    const { value: selectedPeriod, setValue: setSelectedPeriod } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedPeriod',
      type: 'string',
      defaultValue: 'week',
    });

    // Initialize from content.period if available
    watch(() => props.content?.period, (newPeriod) => {
      if (newPeriod && newPeriod !== selectedPeriod.value) {
        setSelectedPeriod(newPeriod);
      }
    }, { immediate: true });

    // Computed properties
    const circumference = computed(() => 2 * Math.PI * 70);

    const progressOffset = computed(() => {
      const percentage = Math.min(stats.value?.completion_percentage || 0, 100);
      return circumference.value - (percentage / 100) * circumference.value;
    });

    const barWidth = computed(() => {
      return Math.min((stats.value?.completion_percentage || 0), 100);
    });

    const diffClass = computed(() => {
      if (!stats.value) return '';
      return stats.value.difference_minutes >= 0 ? 'positive' : 'negative';
    });

    const formatHoursMinutes = (minutes) => {
      if (!minutes && minutes !== 0) return '0:00';
      if (isNaN(minutes)) return '0:00';
      const hours = Math.floor(Math.abs(minutes) / 60);
      const mins = Math.abs(minutes) % 60;
      const sign = minutes < 0 ? '-' : '';
      return `${sign}${hours}:${mins.toString().padStart(2, '0')}`;
    };

    const averagePerDay = computed(() => {
      if (!stats.value) return '0:00';
      const periodDays = selectedPeriod.value === 'day' ? 1 :
                         selectedPeriod.value === 'week' ? 7 : 30;
      const avgMinutes = (stats.value.total_minutes || 0) / periodDays;
      return formatHoursMinutes(avgMinutes);
    });

    const progressColor = computed(() => {
      if (!stats.value) return '#4CAF50';
      const percentage = stats.value.completion_percentage;
      if (percentage < 50) return '#f44336'; // Red
      if (percentage < 80) return '#FF9800'; // Orange
      return '#4CAF50'; // Green
    });
    const weeklyDayBreakdown = computed(() => {
      if (!stats.value || !stats.value.entries || selectedPeriod.value !== 'week') {
        return [];
      }

      const dailyHoursTarget = stats.value.expected_hours / 5; // Mon-Fri
      const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      const dayData = {};

      // Initialize all days with 0
      weekDays.forEach(day => {
        dayData[day] = { minutes: 0, label: day };
      });

      // Sum up minutes per day
      stats.value.entries.forEach(entry => {
        if (entry.clock_in) {
          const date = new Date(parseInt(entry.clock_in));
          const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
          const dayLabel = weekDays[dayIndex];
          dayData[dayLabel].minutes += entry.duration_minutes || 0;
        }
      });

      // Calculate percentages
      return weekDays.map(day => {
        const minutes = dayData[day].minutes;
        const hours = minutes / 60;
        const percentage = Math.min((hours / dailyHoursTarget) * 100, 100);
        return {
          label: day,
          minutes: minutes,
          hours: hours.toFixed(1),
          percentage: percentage,
        };
      });
    });

    const monthlyYearBreakdown = computed(() => {
      if (!stats.value || !stats.value.entries || selectedPeriod.value !== 'month') {
        return [];
      }

      const monthlyHoursTarget = stats.value.expected_hours; // Expected hours per month
      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      const monthData = {};

      // Initialize all months with 0
      monthNames.forEach((month, index) => {
        monthData[index] = { minutes: 0, label: month };
      });

      // Sum up minutes per month
      stats.value.entries.forEach(entry => {
        if (entry.clock_in) {
          const date = new Date(parseInt(entry.clock_in));
          const monthIndex = date.getMonth(); // 0-11
          monthData[monthIndex].minutes += entry.duration_minutes || 0;
        }
      });

      // Calculate percentages
      return monthNames.map((month, index) => {
        const minutes = monthData[index].minutes;
        const hours = minutes / 60;
        const percentage = Math.min((hours / monthlyHoursTarget) * 100, 100);
        return {
          label: month,
          minutes: minutes,
          hours: hours.toFixed(1),
          percentage: percentage,
        };
      });
    });

    // Watchers
    watch(() => props.content?.userId, () => {
      loadData();
    });

    // Methods
    const selectPeriod = (period) => {
      setSelectedPeriod(period);
      // Emit trigger event for period change
      emit('trigger-event', {
        name: 'period-change',
        event: { period: period }
      });
      loadData();
    };

    const loadData = async () => {
      loading.value = true;
      error.value = null;

      try {
        const params = new URLSearchParams();
        params.append('user_id', String(props.content?.userId || 1));
        params.append('period', String(selectedPeriod.value)); // Use selected period

        // Use referenceDate from content if set, otherwise use current date
        const refDate = props.content?.referenceDate || Date.now();
        params.append('reference_date', String(refDate));

        const url = `https://xv05-su7k-rvc8.f2.xano.io/api:6iYtDb6K/statistics?${params.toString()}`;

        console.log('Fetching statistics from:', url);
        console.log('Reference date:', new Date(refDate).toLocaleString('de-DE'));

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('API Error: ' + response.status);
        }

        stats.value = await response.json();
        console.log('Statistics loaded:', stats.value);
      } catch (err) {
        console.error('Error loading statistics:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      return new Date(parseInt(timestamp)).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const formatHeaderDate = (timestamp) => {
      if (!timestamp) return '';
      return new Date(parseInt(timestamp)).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\./g, '-');
    };

    // Lifecycle
    onMounted(() => {
      loadData();
    });

    // Return for template
    return {
      stats,
      loading,
      error,
      periods,
      selectedPeriod,
      circumference,
      progressOffset,
      barWidth,
      diffClass,
      averagePerDay,
      progressColor,
      weeklyDayBreakdown,
      monthlyYearBreakdown,
      selectPeriod,
      loadData,
      formatDate,
      formatHeaderDate,
      formatHoursMinutes,
    };
  },
};
</script>

<style scoped>
.statistics-dashboard {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
}

.loading,
.error {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #d32f2f;
  font-weight: 500;
}

.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-text {
  flex: 1;
  text-align: center;
}

.header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.date-range {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.period-selector {
  display: flex;
  gap: 8px;
  background: white;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.period-button {
  padding: 8px 16px;
  background: transparent;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.period-button:hover {
  background: #f5f5f5;
  color: #333;
}

.period-button.active {
  background: #4CAF50;
  color: white;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.refresh-button:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.refresh-button:active:not(:disabled) {
  transform: translateY(0);
}

.refresh-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
  display: inline-block;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4CAF50, #2196F3, #FF9800);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.1);
}

.card:hover::before {
  opacity: 1;
}

.card h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Progress Ring Card */
.progress-ring-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-fill {
  transition: stroke-dashoffset 1s ease;
}

.progress-text-large {
  font-size: 32px;
  font-weight: 700;
  fill: #333;
  transform: rotate(90deg);
  transform-origin: 90px 90px;
}

.progress-text-small {
  font-size: 14px;
  fill: #666;
  transform: rotate(90deg);
  transform-origin: 90px 90px;
}

/* Hours Card */
.hours-display {
  text-align: center;
  margin-bottom: 16px;
}

.hours-actual {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}

.hours-value {
  font-size: 48px;
  font-weight: 700;
  color: #4CAF50;
  line-height: 1;
}

.hours-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.hours-expected {
  margin-top: 8px;
}

.hours-bar {
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin: 16px 0;
}

.hours-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #66BB6A, #81C784);
  border-radius: 6px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
}

.hours-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.hours-diff {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-top: 12px;
}

.hours-diff.positive {
  color: #4CAF50;
}

.hours-diff.negative {
  color: #f44336;
}

/* Count Card */
.count-display {
  text-align: center;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count-value {
  font-size: 64px;
  font-weight: 700;
  color: #2196F3;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.count-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.count-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 2px solid #f0f0f0;
}

.count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.count-row:hover {
  background: #e9ecef;
}

.count-detail-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.count-detail-value {
  font-size: 16px;
  font-weight: 700;
  color: #2196F3;
}

/* Minutes Card */
.minutes-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.minutes-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.minutes-row:last-child {
  border-bottom: none;
}

.minutes-row.diff {
  padding-top: 16px;
  font-weight: 600;
}

.minutes-row.diff.positive {
  color: #4CAF50;
}

.minutes-row.diff.negative {
  color: #f44336;
}

.minutes-label {
  font-size: 14px;
  color: #666;
}

.minutes-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.minutes-row.diff .minutes-value {
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-indicator {
  font-size: 24px;
  font-weight: 700;
  display: inline-block;
  animation: pulse 2s ease-in-out infinite;
}

.trend-indicator.positive {
  color: #4CAF50;
}

.trend-indicator.negative {
  color: #f44336;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* Daily Breakdown */
.daily-breakdown {
  margin-top: 30px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.daily-breakdown h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.daily-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-bar-container {
  display: grid;
  grid-template-columns: 40px 1fr 140px;
  align-items: center;
  gap: 12px;
}

.day-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-align: center;
}

.day-bar-track {
  height: 32px;
  background: #e0e0e0;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.day-bar-track:hover {
  background: #d0d0d0;
  transform: scaleY(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.day-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #e0e0e0, #e0e0e0);
  border-radius: 16px;
  transition: width 0.8s ease, background 0.3s ease;
  min-width: 2px;
}

.day-bar-fill.has-data {
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
}

.day-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.day-minutes {
  color: #666;
  font-weight: 500;
  min-width: 70px;
}

.day-percentage {
  color: #333;
  font-weight: 700;
  min-width: 45px;
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .statistics-dashboard {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .period-selector {
    width: 100%;
    justify-content: center;
  }

  .period-button {
    flex: 1;
    padding: 10px 12px;
  }

  .refresh-button {
    width: 100%;
    justify-content: center;
  }

  .day-bar-container {
    grid-template-columns: 35px 1fr 120px;
    gap: 8px;
  }

  .day-label {
    font-size: 12px;
  }

  .day-bar-track {
    height: 28px;
  }

  .day-stats {
    font-size: 12px;
    gap: 8px;
  }

  .day-minutes {
    min-width: 60px;
  }

  .day-percentage {
    min-width: 40px;
  }
}
</style>
