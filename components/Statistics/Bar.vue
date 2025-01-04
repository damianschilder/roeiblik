<template lang="pug">
  .component-wrapper(:style="{ opacity: isUpdating ? 0.5 : 1 }")
    .verenigingen
      .checkbox(v-for="club in clubs" :key="club" class="toggle-option")
        input(
          type="checkbox"
          :id="club"
          :value="club"
          v-model="selectedClubs"
          :disabled="isUpdating"
        )
        label(:for="club") {{ club }}
    .controls
      .checkbox(v-for="metric in ['wins', 'entries', 'avgPosition', 'winRate']" :key="metric" class="toggle-option")
        input(
          type="checkbox"
          :id="metric"
          :value="metric"
          v-model="selectedMetrics"
          :disabled="isUpdating"
        )
        label(:for="metric")
          | {{ metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1') }}
    canvas#club-chart(ref="chartCanvas")
    p(v-if="!chartData || chartData.datasets.length === 0") No data to display
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { parse } from "csv-parse/browser/esm";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({
  selectedFile: {
    type: String,
    required: true,
  },
});

const chartCanvas = ref(null);
const chartInstance = ref(null);
const chartData = ref({ labels: [], datasets: [] });
const isUpdating = ref(false);

const clubs = ref([]);
const selectedClubs = ref([]);
const selectedMetrics = ref(['wins', 'entries']);
const clubColors = ref({});
const processedData = ref({});

const predefinedColors = {
  Orca: "rgba(255, 0, 0, 1)",
  Triton: "rgba(7, 32, 53, 1)",
  Nereus: "rgb(117, 41, 54, 1)" 
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const fetchAndProcessCSV = async () => {
  if (!props.selectedFile) {
    console.warn("No selected file provided.");
    return;
  }

  console.log("Fetching CSV file:", props.selectedFile);

  try {
    const csvFilePath = `/${props.selectedFile}`;
    const response = await fetch(csvFilePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const csvContent = await response.text();
    parseCSV(csvContent);
  } catch (error) {
    console.error("Error fetching CSV file:", error);
  }
};

const parseCSV = (csvContent) => {
  parse(
    csvContent,
    { columns: true, skip_empty_lines: true },
    (err, data) => {
      if (err) {
        console.error("Error parsing CSV:", err);
        return;
      }
      processData(data);
    }
  );
};

const processData = (data) => {
  const uniqueClubs = Array.from(new Set(data.map((row) => row.Club))).sort();
  const allYears = Array.from(
    new Set(data.map((row) => parseInt(row.Year, 10)))
  ).sort();

  clubs.value = uniqueClubs;

  selectedClubs.value = uniqueClubs.filter((club) =>
    ["Orca", "Triton"].includes(club)
  );

  uniqueClubs.forEach((club) => {
    clubColors.value[club] =
      predefinedColors[club] || generateRandomColor();
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

const generateRandomColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, 1)`;
};

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
  const sumX = data.reduce((sum, point, index) => sum + index, 0);
  const sumY = data.reduce((sum, point) => sum + point, 0);
  const sumXY = data.reduce((sum, point, index) => sum + index * point, 0);
  const sumX2 = data.reduce((sum, point, index) => sum + index * index, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return data.map((_, index) => slope * index + intercept);
};

const updateChartData = async () => {
  console.debug("Starting updateChartData");
  isUpdating.value = true;
  const datasets = [];
  const yearsSet = new Set();

  selectedClubs.value.forEach((club) => {
    if (processedData.value[club]) {
      const clubData = processedData.value[club];

      if (selectedMetrics.value.includes("entries")) {
        const entriesDataset = {
          label: `${club} - Entries`,
          data: clubData.map((row) => row.entries),
          backgroundColor: clubColors.value[club].replace("1)", "0.5)"),
          stack: club, // Group Wins and Entries per club
          barPercentage: 0.6,
        };
        datasets.push(entriesDataset);

        const entriesTrendLine = calculateTrendLine(clubData.map((row) => row.entries));
        const entriesTrendDataset = {
          label: `${club} - Entries Trend`,
          data: entriesTrendLine,
          borderColor: clubColors.value[club].replace("1)", "1)"),
          backgroundColor: "transparent",
          type: "line",
          borderDash: [5, 5], // Dotted line
          tension: 0,
        };
        datasets.push(entriesTrendDataset);
      }

      if (selectedMetrics.value.includes("wins")) {
        const winsDataset = {
          label: `${club} - Wins`,
          data: clubData.map((row) => row.wins),
          backgroundColor: createPattern(
            clubColors.value[club].replace("1)", "1)")
          ),
          stack: club, // Group Wins and Entries per club
          barPercentage: 0.6,
        };
        datasets.push(winsDataset);

        const winsTrendLine = calculateTrendLine(clubData.map((row) => row.wins));
        const winsTrendDataset = {
          label: `${club} - Wins Trend`,
          data: winsTrendLine,
          borderColor: clubColors.value[club].replace("1)", "1)"),
          backgroundColor: "transparent",
          type: "line",
          borderDash: [5, 5], // Dotted line
          tension: 0,
        };
        datasets.push(winsTrendDataset);
      }

      if (selectedMetrics.value.includes("avgPosition")) {
        const avgPositionDataset = {
          label: `${club} - Avg Position`,
          data: clubData.map((row) => row.avgPosition),
          borderColor: clubColors.value[club].replace("1)", "1)"),
          backgroundColor: "transparent",
          type: "line",
          tension: 0,
        };
        datasets.push(avgPositionDataset);

        const avgPositionTrendLine = calculateTrendLine(clubData.map((row) => row.avgPosition));
        const avgPositionTrendDataset = {
          label: `${club} - Avg Position Trend`,
          data: avgPositionTrendLine,
          borderColor: clubColors.value[club].replace("1)", "1)"),
          backgroundColor: "transparent",
          type: "line",
          borderDash: [5, 5], // Dotted line
          tension: 0,
        };
        datasets.push(avgPositionTrendDataset);
      }

      if (selectedMetrics.value.includes("winRate")) {
        const winRateDataset = {
          label: `${club} - Win Rate`,
          data: clubData.map((row) => row.winRate),
          borderColor: clubColors.value[club].replace("1)", "1)"),
          backgroundColor: "transparent",
          type: "line",
          borderDash: [5, 5], // Dotted line
          tension: 0,
        };
        datasets.push(winRateDataset);

        const winRateTrendLine = calculateTrendLine(clubData.map((row) => row.winRate));
        const winRateTrendDataset = {
          label: `${club} - Win Rate Trend`,
          data: winRateTrendLine,
          borderColor: clubColors.value[club].replace("1)", "1)"),
          backgroundColor: "transparent",
          type: "line",
          borderDash: [5, 5], // Dotted line
          tension: 0,
        };
        datasets.push(winRateTrendDataset);
      }

      clubData.forEach((row) => yearsSet.add(row.year));
    }
  });

  const years = Array.from(yearsSet).sort();
  chartData.value = { labels: years, datasets };

  console.debug("Datasets prepared", datasets);
  console.debug("Years prepared", years);

  await renderChart();
  isUpdating.value = false;
};

const renderChart = async () => {
  console.debug("Starting renderChart");
  if (!chartCanvas.value) {
    console.error("chartCanvas is null");
    return;
  }

  if (chartInstance.value) {
    console.debug("Destroying existing chart instance");
    chartInstance.value.destroy();
    chartInstance.value = null;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.debug("Creating new chart instance");
  const canvasContext = chartCanvas.value.getContext("2d");
  if (!canvasContext) {
    console.error("Failed to get canvas context");
    return;
  }
  chartInstance.value = new Chart(canvasContext, {
    type: "bar",
    data: chartData.value,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        datalabels: {
            /* Adjust data label font size according to chart size */
            font: function(context) {
              var width = context.chart.width;
              var size = Math.round(width / 32);

              return {
              weight: 'bold',
              size: size
              };
            }
          }
      },
      scales: {
        x: {
          stacked: true, // Stack Wins and Entries for each club
        },
        y: {
          stacked: false, // Separate values on Y axis
          ticks: {
            beginAtZero: true, // Ensure Y axis starts at zero
          },
        },
      },
    },
  });
  console.debug("Chart instance created");
};

const debouncedUpdateChartData = debounce(updateChartData, 500);

watch(
  () => props.selectedFile,
  async (newFile) => {
    if (newFile) {
      console.debug("File changed, fetching and processing CSV");
      await fetchAndProcessCSV();
      debouncedUpdateChartData();
    }
  }
);

watch([selectedClubs], () => {
  console.debug("Selected clubs changed, updating chart data");
  debouncedUpdateChartData();
});

watch(selectedMetrics, () => {
  console.debug("Selected metrics changed, updating chart data");
  debouncedUpdateChartData();
});

onMounted(() => {
  console.debug("Component mounted, fetching CSV if file is provided");
  if (props.selectedFile) {
    fetchAndProcessCSV();
  }
});

onUnmounted(() => {
  console.debug("Component unmounted, destroying chart instance");
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
.verenigingen {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  column-gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
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

.toggle-option label {
}

canvas {
  display: block;
  width: 100%;
  height: auto;
  min-height: 20rem;
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
  color: #888;
}
</style>
