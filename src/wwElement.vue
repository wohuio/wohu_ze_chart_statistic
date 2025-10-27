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
            <h2>{{ formatHeaderDate(stats.period_start) }}</h2>
            <p class="date-range">
              {{ formatDate(stats.period_start) }} - {{ formatDate(stats.period_end) }}
            </p>
          </div>
          <button class="refresh-button" @click="loadData" :disabled="loading">
            <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
            Aktualisieren
          </button>
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
                stroke="#4CAF50"
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
                {{ stats.completion_percentage.toFixed(1) }}%
              </text>
              <text
                x="90"
                y="105"
                text-anchor="middle"
                class="progress-text-small"
              >
                von {{ stats.expected_hours }}h
              </text>
            </svg>
          </div>
        </div>

        <!-- Hours Card -->
        <div class="card hours-card">
          <h3>Arbeitszeit</h3>
          <div class="hours-display">
            <div class="hours-actual">
              <span class="hours-value">{{ stats.total_minutes }}</span>
              <span class="hours-label">Minuten</span>
            </div>
            <div class="hours-expected">
              <span class="hours-label">Soll: {{ stats.expected_minutes }} min</span>
            </div>
          </div>
          <div class="hours-bar">
            <div
              class="hours-bar-fill"
              :style="{ width: barWidth + '%' }"
            ></div>
          </div>
          <div class="hours-diff" :class="diffClass">
            {{ stats.difference_minutes > 0 ? '+' : '' }}{{ stats.difference_minutes }} min
          </div>
        </div>

        <!-- Minutes Card -->
        <div class="card minutes-card">
          <h3>Minuten</h3>
          <div class="minutes-display">
            <div class="minutes-row">
              <span class="minutes-label">Gearbeitet:</span>
              <span class="minutes-value">{{ formatHoursMinutes(stats.total_minutes) }}h</span>
            </div>
            <div class="minutes-row">
              <span class="minutes-label">Soll:</span>
              <span class="minutes-value">{{ formatHoursMinutes(stats.expected_minutes) }}h</span>
            </div>
            <div class="minutes-row diff" :class="diffClass">
              <span class="minutes-label">Differenz:</span>
              <span class="minutes-value">{{ formatHoursMinutes(stats.difference_minutes) }}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true },
  },
  data() {
    return {
      stats: null,
      loading: false,
      error: null,
    };
  },
  computed: {
    circumference() {
      return 2 * Math.PI * 70; // radius = 70
    },
    progressOffset() {
      const percentage = Math.min(this.stats?.completion_percentage || 0, 100);
      return this.circumference - (percentage / 100) * this.circumference;
    },
    barWidth() {
      return Math.min((this.stats?.completion_percentage || 0), 100);
    },
    diffClass() {
      if (!this.stats) return '';
      return this.stats.difference_minutes >= 0 ? 'positive' : 'negative';
    },
  },
  watch: {
    'content.userId': 'loadData',
    'content.period': 'loadData',
    'content.referenceDate': 'loadData',
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams();
        params.append('user_id', String(this.content.userId || 1));
        params.append('period', String(this.content.period || 'week'));
        params.append('reference_date', String(this.content.referenceDate || Date.now()));

        const url = `https://xv05-su7k-rvc8.f2.xano.io/api:6iYtDb6K/statistics?${params.toString()}`;

        console.log('Fetching statistics from:', url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('API Error: ' + response.status);
        }

        this.stats = await response.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(timestamp) {
      if (!timestamp) return '';
      return new Date(parseInt(timestamp)).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    },
    formatHeaderDate(timestamp) {
      if (!timestamp) return '';
      return new Date(parseInt(timestamp)).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\./g, '-');
    },
    formatHoursMinutes(minutes) {
      if (!minutes && minutes !== 0) return '0:00';
      const hours = Math.floor(Math.abs(minutes) / 60);
      const mins = Math.abs(minutes) % 60;
      const sign = minutes < 0 ? '-' : '';
      return `${sign}${hours}:${mins.toString().padStart(2, '0')}`;
    },
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
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
  border-radius: 6px;
  transition: width 1s ease;
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
  margin-bottom: 16px;
}

.count-value {
  display: block;
  font-size: 56px;
  font-weight: 700;
  color: #2196F3;
  line-height: 1;
}

.count-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.count-average {
  text-align: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
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

  .refresh-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
