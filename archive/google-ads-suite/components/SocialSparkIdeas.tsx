import React, { useState } from 'react';
import { SocialIdea } from '../types';
import { Edit2, RefreshCw, Check, Sparkles, FileText, Image, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialSparkIdeasProps {
  topic: string;
  ideas: SocialIdea[];
  onBack: () => void;
  onUseIdea: (idea: SocialIdea) => void;
}

export const SocialSparkIdeas: React.FC<SocialSparkIdeasProps> = ({ topic, ideas, onBack, onUseIdea }) => {
  const [selectedId, setSelectedId] = useState<string>(ideas[0]?.id || '');
  const [showRefine, setShowRefine] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refineText, setRefineText] = useState('');

  const selectedIdea = ideas.find(i => i.id === selectedId);

  const handleExecutionSelect = (type: 'script' | 'visual' | 'caption') => {
    if (selectedIdea) {
        setShowModal(false);
        onUseIdea(selectedIdea);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">The Maxed 4</h1>
                <p className="text-slate-500 text-sm">Expert angles for <span className="font-semibold text-indigo-600">"{topic}"</span></p>
            </div>
            <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">
                Change Topic
            </button>
        </div>

        {/* The Maxed 4 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-1">
            {ideas.map((idea, idx) => {
                const isSelected = selectedId === idea.id;
                return (
                    <motion.div 
                        key={idea.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSelectedId(idea.id)}
                        className={`
                            relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-center min-h-[160px]
                            ${isSelected 
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-600' 
                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                            }
                        `}
                    >
                        {isSelected && (
                            <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                                <Check className="w-4 h-4" />
                            </div>
                        )}
                        
                        {/* 
                           UX FIX: Strictly displaying Title and Description only. 
                           Scaffolding labels (Category) are intentionally hidden. 
                        */}
                        <h3 className={`text-xl font-bold mb-3 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {idea.title}
                        </h3>
                        <p className={`text-base leading-relaxed ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>
                            {idea.description}
                        </p>
                    </motion.div>
                );
            })}
        </div>

        {/* Refine Section (Collapsible) */}
        <AnimatePresence>
            {showRefine && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                >
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Refine "{selectedIdea?.title}"
                        </label>
                        <textarea
                            value={refineText}
                            onChange={(e) => setRefineText(e.target.value)}
                            placeholder="Add specific details or adjustments you want to see in the final result..."
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* The Pivot Point (Action Bar) */}
        <div className="sticky bottom-6 z-20 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row gap-3">
            <button 
                onClick={() => setShowModal(true)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center justify-center text-lg"
            >
                <Sparkles className="w-5 h-5 mr-2" />
                Use {selectedIdea?.title || 'Idea'}
            </button>

            <div className="flex gap-3 flex-1 md:flex-none">
                <button 
                    onClick={() => setShowRefine(!showRefine)}
                    className={`flex-1 md:flex-none py-3 px-6 font-bold rounded-xl border transition-all flex items-center justify-center
                        ${showRefine 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }
                    `}
                >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Refine
                </button>
                
                <button 
                    onClick={onBack}
                    className="flex-1 md:flex-none py-3 px-6 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Ideas
                </button>
            </div>
        </div>

        {/* Execution Modal */}
        <AnimatePresence>
            {showModal && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Bring it to life</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-3">
                            <p className="text-slate-500 mb-4 text-sm">Select a format for <span className="font-semibold text-slate-900">"{selectedIdea?.title}"</span>:</p>

                            <button 
                                onClick={() => handleExecutionSelect('script')}
                                className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center group text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700">Outline & Script Builder</h4>
                                    <p className="text-xs text-slate-500">Perfect for Reels, TikToks, and Shorts.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleExecutionSelect('visual')}
                                className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center group text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <Image className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700">Visual Concept Generator</h4>
                                    <p className="text-xs text-slate-500">AI image prompts and scene descriptions.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleExecutionSelect('caption')}
                                className="w-full p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 transition-all flex items-center group text-left ring-1 ring-indigo-500/20"
                            >
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700">Caption & Hashtag Generator</h4>
                                    <p className="text-xs text-slate-500">Instagram, LinkedIn, and Facebook posts.</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};