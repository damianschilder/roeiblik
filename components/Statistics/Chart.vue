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
    .checkbox(v-for="metric in ['avgPosition', 'winRate']" :key="metric" class="toggle-option")
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

const props = defineProps({
  selectedFile: {
    type: String,
    required: true,
  },
});

Chart.register(...registerables);

const chartCanvas = ref(null);
const chartInstance = ref(null);
const chartData = ref({ labels: [], datasets: [] });
const isUpdating = ref(false);

const clubs = ref([]);
const selectedClubs = ref([]);
const selectedMetrics = ref(["wins", "entries"]);
const clubColors = ref({});
const processedData = ref({});

const predefinedColors = {
  Orca: "rgba(255, 0, 0, 1)",
  Triton: "rgba(0, 0, 255, 1)",
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

  // Default selection logic for Orca and Triton
  selectedClubs.value = uniqueClubs.filter((club) => ["Orca", "Triton"].includes(club));

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
        avgPosition: yearData
          ? parseFloat(yearData["Average Position"]) || null
          : null,
        avgWinningTime: yearData
          ? parseFloat(yearData["Average Winning Time"]) || null
          : null,
        winRate:
          yearData && yearData.Entries
            ? (parseInt(yearData.Wins, 10) /
                parseInt(yearData.Entries, 10)) *
              100
            : 0,
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

const updateChartData = async () => {
  console.debug("Starting updateChartData");
  isUpdating.value = true;
  const datasets = [];
  const yearsSet = new Set();

  selectedClubs.value.forEach((club) => {
    if (processedData.value[club]) {
      const clubData = processedData.value[club];

      selectedMetrics.value.forEach((metric) => {
        const data = clubData.map((row) => row[metric]);
        if (data.every((value) => value === null)) return;

        datasets.push({
          label: `${club} - ${metric}`,
          data,
          borderColor: clubColors.value[club],
          backgroundColor: `${clubColors.value[club].replace("1)", "0.2)")}`,
          borderWidth: 2,
          tension: 0,
        });
      });

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

  if (!chartData.value.datasets.length) {
    console.debug("No datasets to render, clearing canvas");
    const ctx = chartCanvas.value.getContext("2d");
    if (!ctx) {
      console.error("Context is null");
      return;
    }
    ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height);
    return;
  }

  console.debug("Creating new chart instance");
  const canvasContext = chartCanvas.value.getContext("2d");
  if (!canvasContext) {
    console.error("Failed to get canvas context");
    return;
  }
  chartInstance.value = new Chart(canvasContext, {
    type: "line",
    data: chartData.value,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: false,
          text: `Club Metrics Over the Years`,
        },
      },
      scales: {
        x: { title: { display: true, text: "Jaar" } },
        y: { title: { display: true, text: "Waarde" } },
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

watch([selectedClubs, selectedMetrics], () => {
  console.debug("Selected clubs or metrics changed, updating chart data");
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
