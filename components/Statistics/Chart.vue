<template lang="pug">
  .component-wrapper
    .filter-container
      select(v-model="selectedYear")
        option(value="" selected) Alle jaren
        option(v-for="year in uniqueYears" :key="year" :value="year") {{ year }}
    canvas#regattaChart( style="height:600px; width:100%;" )
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { Chart, registerables } from 'chart.js';
  import { parse } from 'csv-parse/browser/esm';

  const props = defineProps({
    selectedFile: {
      type: String,
      required: true,
    },
  });

  Chart.register(...registerables);

  const chartInstance = ref(null);
  const selectedYear = ref(''); // Selected year for filtering
  const uniqueYears = ref([]); // List of unique years in the dataset

  const convertTimeToSeconds = (timeStr) => {
    const [minutes, seconds] = timeStr.split(':').map(parseFloat);
    return minutes * 60 + seconds;
  };

  const formatSecondsToTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = (seconds % 1).toFixed(1).split('.')[1];
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  const calculateTrendLine = (times) => {
    const n = times.length;
    const sumX = times.reduce((acc, _, i) => acc + i, 0);
    const sumY = times.reduce((acc, y) => acc + y, 0);
    const sumXY = times.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = times.reduce((acc, _, i) => acc + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return times.map((_, i) => slope * i + intercept);
  };

  const fetchAndParseCSV = async () => {
    const filePath = `/${props.selectedFile}`;
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Error fetching CSV: ${response.status}`);
    const csvData = await response.text();

    return new Promise((resolve, reject) => {
      parse(
        csvData,
        { columns: true, skip_empty_lines: true },
        (err, records) => {
          if (err) reject(err);
          resolve(records);
        }
      );
    });
  };

  const createChart = async () => {
    // The file list loads in the browser; before that (and during server rendering) there is no file.
    if (!props.selectedFile || import.meta.server) return;
    const data = await fetchAndParseCSV();
    if (!data || data.length === 0) return;

    // Extract unique years from the dataset
    uniqueYears.value = Array.from(new Set(data.map((row) => row['Year']))).sort();

    // Filter data based on selected year
    const filteredData = selectedYear.value
      ? data.filter((row) => row['Year'] === selectedYear.value)
      : data;

    // Sort filtered data by "First Day Date"
    filteredData.sort((a, b) => new Date(a['First Day Date']) - new Date(b['First Day Date']));

    const labels = filteredData.map(
      (row) => `${row['Regatta Name'].substring(0, 20)}, ${row['Year']}`
    );
    const winningTimes = filteredData.map((row) =>
      convertTimeToSeconds(row['Winning Time'])
    );
    const averageTimes = filteredData.map((row) =>
      convertTimeToSeconds(row['Average Time'])
    );

    if (!labels.length || !winningTimes.length || !averageTimes.length) return;

    const winningTrendLine = calculateTrendLine(winningTimes);
    const averageTrendLine = calculateTrendLine(averageTimes);

    const ctx = document.getElementById('regattaChart').getContext('2d');

    if (chartInstance.value) chartInstance.value.destroy(); // Destroy previous chart

    chartInstance.value = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Winning Time (mm:ss.mmm)',
            data: winningTimes,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
          {
            label: 'Average Time (mm:ss.mmm)',
            data: averageTimes,
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)',
            tension: 0.1,
          },
          {
            label: 'Winning Time Trend Line',
            data: winningTrendLine,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderDash: [5, 5],
            tension: 0,
          },
          {
            label: 'Average Time Trend Line',
            data: averageTrendLine,
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
        scales: {
          y: {
        beginAtZero: true,
        title: {
          display: false,
          text: 'Time (mm:ss.mmm)',
        },
        ticks: {
          callback: (value) => formatSecondsToTime(value),
        },
          },
          x: {
        title: {
          display: false,
          text: 'Regatta Name (Year)',
        },
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
                const value = context.raw;
                const dataIndex = context.dataIndex;
                const location = filteredData[dataIndex]['Location'];
                return `${formatSecondsToTime(value)}, ${location})`;
                },
            },
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
      },
    });
  };

  onMounted(() => {
    createChart();
  });

  watch(
    () => [props.selectedFile, selectedYear.value],
    () => {
      createChart();
    },
    { immediate: true }
  );
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
  </style>
  