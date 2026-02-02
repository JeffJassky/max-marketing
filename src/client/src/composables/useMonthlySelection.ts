import { ref, onMounted } from 'vue';

interface AvailableMonth {
  period_label: string;
  period_start: string;
}

const selectedMonth = ref<string>('');
const availableMonths = ref<AvailableMonth[]>([]);
const isLoadingMonths = ref(false);

export const useMonthlySelection = () => {
  const loadMonths = async () => {
    if (availableMonths.value.length > 0) return;
    
    isLoadingMonths.value = true;
    try {
      const res = await fetch('/api/reports/superlatives/months');
      if (res.ok) {
        const data = await res.json();
        availableMonths.value = data;
        if (availableMonths.value.length > 0 && !selectedMonth.value) {
          selectedMonth.value = availableMonths.value[0].period_label;
        }
      }
    } catch (err) {
      console.error('Failed to load months', err);
    } finally {
      isLoadingMonths.value = false;
    }
  };

  return {
    selectedMonth,
    availableMonths,
    isLoadingMonths,
    loadMonths
  };
};
