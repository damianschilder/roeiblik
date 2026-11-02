<template lang="pug">
  .component-wrapper(:style="{ opacity: isUpdating ? 0.5 : 1 }")
    fieldset.verenigingen
      legend.visually-hidden Verenigingen in de grafiek
      .checkbox(v-for="(club, index) in clubs" :key="club" class="toggle-option")
        input(
          type="checkbox"
          :id="`${uid}-club-${index}`"
          :value="club"
          v-model="selectedClubs"
          :disabled="isUpdating"
        )
        label(:for="`${uid}-club-${index}`") {{ club }}
    fieldset.controls
      legend.visually-hidden Gegevens in de grafiek
      .checkbox(v-for="metric in METRICS" :key="metric.key" class="toggle-option")
        input(
          type="checkbox"
          :id="`${uid}-${metric.key}`"
          :value="metric.key"
          v-model="selectedMetrics"
          :disabled="isUpdating"
        )
        label(:for="`${uid}-${metric.key}`") {{ metric.label }}
    //- A picture for screen readers; the table "Statistieken van verenigingen" has the totals.
    canvas#club-chart(
      ref="chartCanvas"
      role="img"
      :aria-label="`Staafdiagram per jaar van ${selectedMetricLabels} voor ${selectedClubs.join(', ') || 'geen verenigingen'}, met trendlijnen.`"
    )
    p(v-if="loaded && (!chartData || chartData.datasets.length === 0)") Geen gegevens om te tonen.
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { parse } from "csv-parse/browser/esm";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({
  selectedFile: {
    type: String,
    required: true,
  },
});

const METRICS = [
  { key: 'wins', label: 'Overwinningen' },
  { key: 'entries', label: 'Inschrijvingen' },
  { key: 'avgPosition', label: 'Gemiddelde positie' },
  { key: 'winRate', label: 'Winstpercentage' },
];

const uid = useId();
const chartCanvas = ref(null);
const chartInstance = ref(null);
const chartData = ref({ labels: [], datasets: [] });
const isUpdating = ref(false);
const loaded = ref(false);

const clubs = ref([]);
const selectedClubs = ref([]);
const selectedMetrics = ref(['wins', 'entries']);
const clubColors = ref({});
const processedData = ref({});

const selectedMetricLabels = computed(() =>
  METRICS.filter((m) => selectedMetrics.value.includes(m.key)).map((m) => m.label.toLowerCase()).join(' en ') || 'niets'
);

const predefinedColors = {
  Orca: "rgba(255, 0, 0, 1)",
  Triton: "rgba(7, 32, 53, 1)",
  Nereus: "rgba(117, 41, 54, 1)"
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

let current = 0;
const fetchAndProcessCSV = async () => {
  if (!props.selectedFile) return;
  const request = ++current;
  try {
    const csvContent = await fetchStaticCsv(props.selectedFile);
    const data = await new Promise((resolve, reject) => {
      parse(csvContent, { columns: true, skip_empty_lines: true, bom: true }, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
    if (request !== current) return;
    processData(data);
  } catch {
    if (request !== current) return;
    clubs.value = [];
    processedData.value = {};
  }
};

const processData = (data) => {
  const uniqueClubs = Array.from(new Set(data.map((row) => row.Club))).sort();
  const allYears = Array.from(
    new Set(data.map((row) => parseInt(row.Year, 10)))
  ).sort();

  clubs.value = uniqueClubs;
  processedData.value = {};

  selectedClubs.value = uniqueClubs.filter((club) =>
    ["Orca", "Triton"].includes(club)
  );

  uniqueClubs.forEach((club) => {
    clubColors.value[club] = predefinedColors[club] || colorFor(club);
  });

  uniqueClubs.forEach((club) => {
    const clubData = data.filter((row) => row.Club === club);

    const clubDataByYear = allYears.map((year) => {
      const yearData = clubData.find(
        (row) => parseInt(row.Year, 10) === year
      );
      return {
        year,
        wins: yearData ? parseInt(yearData.Wins, 10) || 0 : 0,
        entries: yearData ? parseInt(yearData.Entries, 10) || 0 : 0,
        avgPosition: yearData ? parseFloat(yearData["Average Position"]) || 0 : 0,
        winRate: yearData ? parseFloat(yearData["Win Rate (%)"]) || 0 : 0,
      };
    });

    processedData.value[club] = clubDataByYear;
  });
};

// The same colour for a club on every visit (it used to be random per page load).
const colorFor = (name) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return `hsla(${hash % 360}, 65%, 45%, 1)`;
};
const withAlpha = (color, alpha) => color.replace(/,\s*1\)$/, `, ${alpha})`);

const createPattern = (color) => {
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext("2d");

  // Create diagonal lines pattern
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 10, 10);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 10);
  ctx.stroke();
  return ctx.createPattern(canvas, "repeat");
};

const calculateTrendLine = (data) => {
  const n = data.length;
  if (n < 2) return data.slice();
  const sumX = data.reduce((sum, point, index) => sum + index, 0);
  const sumY = data.reduce((sum, point) => sum + point, 0);
  const sumXY = data.reduce((sum, point, index) => sum + index * point, 0);
  const sumX2 = data.reduce((sum, point, index) => sum + index * index, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return data.map((_, index) => slope * index + intercept);
};

const trend = (label, values, color) => ({
  label: `${label} (trend)`,
  data: calculateTrendLine(values),
  borderColor: color,
  backgroundColor: "transparent",
  type: "line",
  borderDash: [5, 5], // Dotted line
  tension: 0,
});

const updateChartData = async () => {
  isUpdating.value = true;
  const datasets = [];
  const yearsSet = new Set();

  selectedClubs.value.forEach((club) => {
    const clubData = processedData.value[club];
    if (!clubData) return;
    const color = clubColors.value[club];

    if (selectedMetrics.value.includes("entries")) {
      const values = clubData.map((row) => row.entries);
      datasets.push({
        label: `${club} - Inschrijvingen`,
        data: values,
        backgroundColor: withAlpha(color, 0.5),
        stack: club, // Group Wins and Entries per club
        barPercentage: 0.6,
      });
      datasets.push(trend(`${club} - Inschrijvingen`, values, color));
    }

    if (selectedMetrics.value.includes("wins")) {
      const values = clubData.map((row) => row.wins);
      datasets.push({
        label: `${club} - Overwinningen`,
        data: values,
        backgroundColor: createPattern(color),
        stack: club, // Group Wins and Entries per club
        barPercentage: 0.6,
      });
      datasets.push(trend(`${club} - Overwinningen`, values, color));
    }

    if (selectedMetrics.value.includes("avgPosition")) {
      const values = clubData.map((row) => row.avgPosition);
      datasets.push({
        label: `${club} - Gemiddelde positie`,
        data: values,
        borderColor: color,
        backgroundColor: "transparent",
        type: "line",
        tension: 0,
      });
      datasets.push(trend(`${club} - Gemiddelde positie`, values, color));
    }

    if (selectedMetrics.value.includes("winRate")) {
      const values = clubData.map((row) => row.winRate);
      datasets.push({
        label: `${club} - Winstpercentage`,
        data: values,
        borderColor: color,
        backgroundColor: "transparent",
        type: "line",
        borderDash: [5, 5], // Dotted line
        tension: 0,
      });
      datasets.push(trend(`${club} - Winstpercentage`, values, color));
    }

    clubData.forEach((row) => yearsSet.add(row.year));
  });

  const years = Array.from(yearsSet).sort();
  chartData.value = { labels: years, datasets };

  await renderChart();
  loaded.value = true;
  isUpdating.value = false;
};

const renderChart = async () => {
  if (!chartCanvas.value) return;

  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const canvasContext = chartCanvas.value?.getContext("2d");
  if (!canvasContext) return;
  chartInstance.value = new Chart(canvasContext, {
    type: "bar",
    data: chartData.value,
    options: {
      responsive: true,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          stacked: true, // Stack Wins and Entries for each club
        },
        y: {
          stacked: false, // Separate values on Y axis
          beginAtZero: true,
        },
      },
    },
  });
};

const debouncedUpdateChartData = debounce(updateChartData, 500);

watch(
  () => props.selectedFile,
  async (newFile) => {
    if (newFile) {
      await fetchAndProcessCSV();
      debouncedUpdateChartData();
    }
  }
);

watch([selectedClubs], () => {
  debouncedUpdateChartData();
});

watch(selectedMetrics, () => {
  debouncedUpdateChartData();
});

onMounted(() => {
  if (props.selectedFile) {
    fetchAndProcessCSV();
  }
});

onUnmounted(() => {
  current++;
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
fieldset {
  margin: 0;
  min-width: 0;
}

.verenigingen {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  column-gap: 1rem;
  margin-bottom: 1rem;
  padding: 0 0 1rem;
  border: 0;
  border-bottom: 1px solid #ddd;
  @include tablet-small {
    grid-template-columns: repeat(4, 1fr);
  }
  @include mobile {
    grid-template-columns: repeat(3, 1fr);
  }
}

.controls {
  display: flex;
  column-gap: 1rem;
  margin-bottom: 1rem;
  padding: 0;
  border: 0;
  row-gap: 0.25rem;
  flex-wrap: wrap;
  @include mobile {
    justify-content: center;
  }
}

.toggle-option {
  display: flex;
  align-items: center;
}

canvas {
  display: block;
  width: 100%;
  height: auto;
}

input, label {
  margin: initial;
  cursor: pointer;
  accent-color: rgb(230, 0 ,0);
}

.checkbox {
  display: flex;
  align-items: center;
  column-gap: 0.25rem;
}

p {
  text-align: center;
  margin-top: 20px;
  font-size: 16px;
  color: $black50;
}
</style>
