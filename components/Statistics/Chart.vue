<template lang="pug">
  .component-wrapper
    .filter-container
      select(v-model="selectedYear" aria-label="Jaar")
        option(value="") Alle jaren
        option(v-for="year in uniqueYears" :key="year" :value="year") {{ year }}
    //- The chart is a picture for screen readers; the table above holds the same numbers.
    canvas(
      ref="canvas"
      role="img"
      aria-label="Lijngrafiek van de winnende en de gemiddelde tijd per wedstrijd, met trendlijnen. Dezelfde tijden staan in de tabel hierboven."
      style="height:600px; width:100%;"
    )
  </template>

  <script setup>
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { Chart, registerables } from 'chart.js';
  import { parse } from 'csv-parse/browser/esm';

  const props = defineProps({
    selectedFile: {
      type: String,
      required: true,
    },
  });

  Chart.register(...registerables);

  const canvas = ref(null);
  let chart = null;
  const selectedYear = ref(''); // Selected year for filtering
  const uniqueYears = ref([]); // List of unique years in the dataset

  // "8:35.309" -> 515.309 seconds; NaN for an empty or odd value.
  const convertTimeToSeconds = (timeStr) => {
    const [minutes, seconds] = String(timeStr || '').split(':').map(parseFloat);
    return minutes * 60 + seconds;
  };

  // 515.309 -> "8:35.3" (rounded to tenths first, so 59.96 becomes "1:00.0", not "0:59.0").
  const formatSecondsToTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '';
    const tenths = Math.round(seconds * 10);
    const minutes = Math.floor(tenths / 600);
    const rest = (tenths % 600) / 10;
    return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`;
  };

  const calculateTrendLine = (times) => {
    const n = times.length;
    if (n < 2) return times.slice();
    const sumX = times.reduce((acc, _, i) => acc + i, 0);
    const sumY = times.reduce((acc, y) => acc + y, 0);
    const sumXY = times.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = times.reduce((acc, _, i) => acc + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return times.map((_, i) => slope * i + intercept);
  };

  const fetchAndParseCSV = async () => {
    const csvData = await fetchStaticCsv(props.selectedFile);
    return new Promise((resolve, reject) => {
      parse(csvData, { columns: true, skip_empty_lines: true, bom: true }, (err, records) => (err ? reject(err) : resolve(records)));
    });
  };

  let current = 0;
  const createChart = async () => {
    // The CSV is fetched in the browser only.
    if (!props.selectedFile || import.meta.server) return;
    const request = ++current;
    let data;
    try {
      data = await fetchAndParseCSV();
    } catch {
      return;
    }
    // Only the latest call draws (a quick change of field or year starts a new one).
    if (request !== current || !canvas.value) return;

    uniqueYears.value = Array.from(new Set(data.map((row) => row['Year']))).sort();
    if (selectedYear.value && !uniqueYears.value.includes(selectedYear.value)) selectedYear.value = '';

    const filteredData = (selectedYear.value ? data.filter((row) => row['Year'] === selectedYear.value) : data)
      .filter((row) => Number.isFinite(convertTimeToSeconds(row['Winning Time'])))
      .sort((a, b) => new Date(a['First Day Date']) - new Date(b['First Day Date']));

    const labels = filteredData.map((row) => `${row['Regatta Name'].substring(0, 20)}, ${row['Year']}`);
    const winningTimes = filteredData.map((row) => convertTimeToSeconds(row['Winning Time']));
    const averageTimes = filteredData.map((row) => convertTimeToSeconds(row['Average Time']));

    if (chart) {
      chart.destroy();
      chart = null;
    }
    if (!labels.length) return;

    chart = new Chart(canvas.value.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Winnende tijd',
            data: winningTimes,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
          {
            label: 'Gemiddelde tijd',
            data: averageTimes,
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)',
            tension: 0.1,
          },
          {
            label: 'Trend winnende tijd',
            data: calculateTrendLine(winningTimes),
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderDash: [5, 5],
            tension: 0,
          },
          {
            label: 'Trend gemiddelde tijd',
            data: calculateTrendLine(averageTimes),
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)',
            borderDash: [5, 5],
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatSecondsToTime(value),
            },
          },
          x: {
            ticks: {
              maxRotation: 70,
              minRotation: 70,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const location = filteredData[context.dataIndex]?.['Location'];
                const time = formatSecondsToTime(context.raw);
                return `${context.dataset.label}: ${time}${location ? ` (${location})` : ''}`;
              },
            },
          },
        },
      },
    });
  };

  // Draw once the canvas exists, and again for every other field or year.
  onMounted(createChart);
  watch(() => [props.selectedFile, selectedYear.value], createChart);

  onBeforeUnmount(() => {
    current++;
    if (chart) chart.destroy();
    chart = null;
  });
  </script>
  <style scoped>
  .component-wrapper {
    width: 100%;
  }

  .filter-container {
    margin-bottom: 1rem;
  }

  canvas {
    width: 100%;
  }

select {
  background-color: white;
  outline: 0;
  border: 0;
  width: 10rem;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
}
select:focus-visible {
  outline: 2px solid rgba(230, 0, 0, 1);
  outline-offset: 2px;
}
  </style>
