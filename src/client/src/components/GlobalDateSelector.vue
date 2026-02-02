<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDateRange } from '../composables/useDateRange';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { Calendar, ChevronDown, ArrowRight } from 'lucide-vue-next';

const { startDate, endDate, selectedPreset, setRange, setPreset } = useDateRange();

// Local model for the datepicker [start, end]
const date = ref<Date[]>([startDate.value || new Date(), endDate.value || new Date()]);

// Local strings for manual text inputs
const fromInput = ref('');
const toInput = ref('');

const isOpen = ref(false);

const presets = [
  'Today',
  'Yesterday',
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'Last 7 Days',
  'Last 30 Days',
  'Last 60 Days',
  'Last 90 Days',
  'Year to Date'
];

// Format Date to YYYY-MM-DD for the input fields
const formatDateInput = (d: Date | null) => {
  if (!d) return '';
  // Use local date part to avoid timezone offset issues in the input field
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Sync text inputs when the global state changes (e.g. via preset or calendar click)
watch([startDate, endDate], ([newStart, newEnd]) => {
  fromInput.value = formatDateInput(newStart);
  toInput.value = formatDateInput(newEnd);
  if (newStart && newEnd) {
    date.value = [newStart, newEnd];
  }
}, { immediate: true });

const handleDateChange = (modelData: Date[]) => {
  if (modelData && modelData.length === 2) {
    setRange(modelData[0], modelData[1], 'Custom Range');
  }
};

const selectPreset = (preset: string) => {
  setPreset(preset);
  isOpen.value = false;
};

// Handle manual text input change
const handleManualInput = () => {
  const start = new Date(fromInput.value + 'T00:00:00');
  const end = new Date(toInput.value + 'T00:00:00');

  // Check if both dates are valid and start <= end
  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
    setRange(start, end, 'Custom Range');
  }
};

const formattedRange = computed(() => {
  if (selectedPreset.value !== 'Custom Range') return selectedPreset.value;
  if (!startDate.value || !endDate.value) return 'Select Date';
  
  return `${startDate.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
});
</script>

<template>
  <div class="relative">
    <!-- Trigger Button -->
    <button 
      @click="isOpen = !isOpen"
      class="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-slate-200 hover:border-indigo-500 hover:bg-slate-800 shadow-lg transition-all group"
    >
      <Calendar class="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
      <span class="tracking-tight">{{ formattedRange }}</span>
      <ChevronDown class="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
    </button>

    <!-- Main Dropdown Panel -->
    <div v-if="isOpen" class="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] flex overflow-hidden min-w-[850px] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      
      <!-- Left Sidebar: Presets -->
      <div class="w-44 bg-slate-50 border-r border-slate-100 p-3 flex flex-col gap-1 overflow-y-auto max-h-[500px]">
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 mb-1">Timeframes</div>
        <button
          v-for="preset in presets"
          :key="preset"
          @click="selectPreset(preset)"
          class="w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all"
          :class="selectedPreset === preset 
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
            : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'"
        >
          {{ preset }}
        </button>
      </div>

      <!-- Right Side: Dual Calendar + Manual Inputs -->
      <div class="flex-1 flex flex-col bg-white">
        
        <!-- Manual Input Toolbar -->
        <div class="p-6 border-b border-slate-100 bg-white flex items-center justify-between gap-6">
          <div class="flex items-center gap-3 flex-1">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">From</span>
              <input 
                v-model="fromInput" 
                type="date"
                @change="handleManualInput"
                class="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div class="text-slate-300">
              <ArrowRight class="w-4 h-4" />
            </div>
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">To</span>
              <input 
                v-model="toInput" 
                type="date"
                @change="handleManualInput"
                class="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <button 
            @click="isOpen = false"
            class="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
          >
            Apply
          </button>
        </div>

        <!-- Dual Calendar Area -->
        <div class="p-6 bg-white flex justify-center">
          <VueDatePicker
            v-model="date"
            range
            multi-calendars
            :enable-time-picker="false"
            format="yyyy-MM-dd"
            :inline="true"
            auto-apply
            :month-change-on-scroll="false"
            @update:model-value="handleDateChange"
          />
        </div>
      </div>
    </div>
    
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-[90] bg-slate-900/5 backdrop-blur-[1px]" @click="isOpen = false"></div>
  </div>
</template>

<style>
/* Refined Indigo/Slate Theme for VueDatePicker */
.dp__theme_light {
   --dp-primary-color: #4f46e5;
   --dp-primary-text-color: #ffffff;
   --dp-secondary-color: #f1f5f9;
   --dp-secondary-color-low-block: #eef2ff;
   --dp-hover-color: #f8fafc;
   --dp-hover-text-color: #4f46e5;
   --dp-hover-icon-color: #4f46e5;
   --dp-primary-disabled-color: #f1f5f9;
   --dp-primary-text-disabled-color: #cbd5e1;
   --dp-secondary-text-color: #64748b;
   --dp-border-color: transparent;
   --dp-menu-border-color: transparent;
   --dp-border-color-hover: #4f46e5;
   --dp-disabled-color: #f8fafc;
   --dp-scroll-bar-background: #f1f5f9;
   --dp-scroll-bar-color: #cbd5e1;
   --dp-success-color: #10b981;
   --dp-success-color-disabled: #a7f3d0;
   --dp-icon-color: #94a3b8;
   --dp-danger-color: #ef4444;
   --dp-marker-color: #ef4444;
   --dp-tooltip-color: #1e293b;
   --dp-disabled-color-text: #cbd5e1;
   --dp-highlight-color: #eef2ff;
   --dp-range-between-dates-background-color: #eef2ff;
   --dp-range-between-dates-text-color: #4338ca;
   --dp-range-start-date-background-color: #4f46e5;
   --dp-range-start-date-text-color: #ffffff;
   --dp-range-end-date-background-color: #4f46e5;
   --dp-range-end-date-text-color: #ffffff;
   
   /* Typography */
   --dp-font-family: 'Inter', sans-serif;
   --dp-border-radius: 12px;
   --dp-cell-border-radius: 8px;
}

/* Remove default border and shadow from inline calendar to use our custom container */
.dp__main {
  border: none !important;
}
.dp__outer_menu_wrap {
  box-shadow: none !important;
}
</style>