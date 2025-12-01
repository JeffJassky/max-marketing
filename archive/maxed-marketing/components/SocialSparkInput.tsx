import React, { useState } from 'react';
import { Sparkles, Upload, ArrowRight } from 'lucide-react';

interface SocialSparkInputProps {
  onGenerate: (topic: string) => void;
}

export const SocialSparkInput: React.FC<SocialSparkInputProps> = ({ onGenerate }) => {
  const [topic, setTopic] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (topic.trim()) onGenerate(topic);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] max-w-2xl mx-auto p-6 text-center">
        <div className="mb-8 p-4 bg-indigo-100 rounded-full animate-bounce-slow shadow-sm">
            <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">What specific product or event do you want to post about?</h2>
        <p className="text-slate-500 mb-8 text-lg">Enter your topic below to generate expert angles.</p>

        <div className="w-full relative mb-6">
            <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Summer Sale, New Product Launch, or Brand Story"
                className="w-full p-6 text-lg border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none min-h-[140px] shadow-sm text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-300 font-medium">
                Press Enter to generate
            </div>
        </div>

        <button
            onClick={() => {
                if(topic.trim()) onGenerate(topic);
            }}
            disabled={!topic.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform flex items-center justify-center mb-6
            ${topic.trim() 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:-translate-y-0.5 shadow-indigo-200' 
                : 'bg-slate-300 cursor-not-allowed'}`
            }
        >
            Generate Ideas
            <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        <button className="flex items-center text-slate-400 hover:text-indigo-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-slate-50">
            <Upload className="w-4 h-4 mr-2" />
            Analyze & Inspire (Upload/Link)
        </button>
    </div>
  );
};