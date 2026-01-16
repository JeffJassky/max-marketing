<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List } from 'lucide-vue-next';
import { onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
  content: string;
}>();

const editor = useEditor({
  content: props.content,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-slate prose-indigo max-w-none focus:outline-none bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm min-h-[150px]',
    },
  },
});

// Sync content if it changes from outside (e.g. re-generating)
watch(() => props.content, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML()) {
    editor.value.commands.setContent(newContent);
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="relative group">
    <bubble-menu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
      class="flex items-center gap-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-md"
    >
      <button 
        @click="editor.chain().focus().toggleBold().run()" 
        :class="{ 'bg-indigo-600': editor.isActive('bold') }"
        class="p-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Bold :size="16" />
      </button>
      <button 
        @click="editor.chain().focus().toggleItalic().run()" 
        :class="{ 'bg-indigo-600': editor.isActive('italic') }"
        class="p-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Italic :size="16" />
      </button>
      <button 
        @click="editor.chain().focus().toggleBulletList().run()" 
        :class="{ 'bg-indigo-600': editor.isActive('bulletList') }"
        class="p-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <List :size="16" />
      </button>
    </bubble-menu>
    
    <editor-content :editor="editor" />
  </div>
</template>
