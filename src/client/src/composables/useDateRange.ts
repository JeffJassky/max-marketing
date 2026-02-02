import { ref, computed } from 'vue';

const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const selectedPreset = ref<string>('Last 30 Days');

// Initialize with Last 30 Days
const init = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  
  startDate.value = start;
  endDate.value = end;
};

init();

export const useDateRange = () => {
  const setRange = (start: Date, end: Date, label: string) => {
    startDate.value = start;
    endDate.value = end;
    selectedPreset.value = label;
  };

  const setPreset = (preset: string) => {
    const end = new Date();
    const start = new Date();
    let label = preset;

    switch (preset) {
      case 'Today':
        label = 'Today';
        // start is today
        break;
      case 'Yesterday':
        start.setDate(end.getDate() - 1);
        end.setDate(end.getDate() - 1);
        label = 'Yesterday';
        break;
      case 'This Week':
        const day = start.getDay() || 7; // Get current day number, converting Sun. to 7
        if (day !== 1) start.setHours(-24 * (day - 1)); // Set to Monday
        label = 'This Week';
        break;
      case 'Last Week':
        const lastWeekDay = start.getDay() || 7;
        start.setDate(start.getDate() - lastWeekDay - 6);
        end.setDate(end.getDate() - lastWeekDay);
        label = 'Last Week';
        break;
      case 'This Month':
        start.setDate(1);
        label = 'This Month';
        break;
      case 'Last Month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); // Last day of previous month
        label = 'Last Month';
        break;
      case 'Last 7 Days':
        start.setDate(end.getDate() - 7);
        label = 'Last 7 Days';
        break;
      case 'Last 30 Days':
        start.setDate(end.getDate() - 30);
        label = 'Last 30 Days';
        break;
      case 'Last 60 Days':
        start.setDate(end.getDate() - 60);
        label = 'Last 60 Days';
        break;
      case 'Last 90 Days':
        start.setDate(end.getDate() - 90);
        label = 'Last 90 Days';
        break;
      case 'Year to Date':
        start.setMonth(0, 1);
        label = 'Year to Date';
        break;
      default:
        // Custom or unknown
        return;
    }

    startDate.value = start;
    endDate.value = end;
    selectedPreset.value = label;
  };

  const dateParams = computed(() => {
    if (!startDate.value || !endDate.value) return {};
    return {
      startDate: startDate.value.toISOString().split('T')[0],
      endDate: endDate.value.toISOString().split('T')[0]
    };
  });

  return {
    startDate,
    endDate,
    selectedPreset,
    setRange,
    setPreset,
    dateParams
  };
};
