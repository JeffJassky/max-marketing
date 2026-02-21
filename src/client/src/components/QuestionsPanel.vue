<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  MessageCircleQuestion,
  Sparkles,
  ChevronRight,
  Loader2,
} from 'lucide-vue-next';

interface Question {
  id: string;
  question: string;
  insight: string;
}

const props = defineProps<{
  questions: Question[];
  loading?: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'ask', question: Question): void;
}>();

const showAll = ref(false);

const handleAsk = (question: Question) => {
  emit('ask', question);
};

const visibleQuestions = computed(() => {
  if (showAll.value) {
    return props.questions;
  }
  // Limit to 4 questions for the panel view
  return props.questions.slice(0, 4);
});
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
  >
    <!-- Header -->
    <div
      class="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center"
        >
          <Sparkles class="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h3 class="font-bold text-slate-800">
            {{ title || 'Questions to Explore' }}
          </h3>
          <p class="text-xs text-slate-500">
            Click a question to start a conversation
          </p>
        </div>
      </div>
      <span
        v-if="questions.length > 0"
        class="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full"
      >
        {{ questions.length }} available
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-8 flex flex-col items-center justify-center">
      <Loader2 class="w-8 h-8 text-indigo-400 animate-spin mb-3" />
      <p class="text-sm text-slate-400 font-medium">
        Finding relevant questions...
      </p>
    </div>

    <!-- Empty State -->
    <div v-else-if="questions.length === 0" class="p-8 text-center">
      <div
        class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <MessageCircleQuestion class="w-8 h-8 text-slate-300" />
      </div>
      <p class="text-sm text-slate-400 font-medium">
        No relevant questions for this data
      </p>
    </div>

    <!-- Questions Grid -->
    <div v-else class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <button
        v-for="question in visibleQuestions"
        :key="question.id"
        @click="handleAsk(question)"
        class="group p-4 rounded-xl border text-left transition-all duration-200 bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 group-hover:bg-indigo-100 transition-colors"
          >
            <MessageCircleQuestion class="w-4 h-4 text-indigo-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-semibold text-slate-800 leading-snug group-hover:text-indigo-900 transition-colors"
            >
              {{ question.question }}
            </p>
            <p
              class="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2"
            >
              {{ question.insight }}
            </p>
          </div>
          <ChevronRight
            class="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
          />
        </div>
      </button>
    </div>

    <!-- View More Link -->
    <div
      v-if="questions.length > 4"
      class="px-6 py-3 border-t border-slate-100 bg-slate-50/50"
    >
      <button
        @click="showAll = !showAll"
        class="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
      >
        {{ showAll ? 'Show fewer' : `View all ${questions.length} questions` }}
        <ChevronRight
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-90': showAll }"
        />
      </button>
    </div>
  </div>
</template>
