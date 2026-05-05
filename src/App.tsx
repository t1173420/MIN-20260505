/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shuffle, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Layers,
  LayoutGrid,
  History,
  X,
  Share2,
  FileDown,
  Upload,
  FileText,
  FileSpreadsheet
} from 'lucide-react';

type GroupingMode = 'count' | 'size';

interface Group {
  id: number;
  members: string[];
}

interface HistoryItem {
  id: string;
  timestamp: number;
  groups: Group[];
  totalNames: number;
  mode: GroupingMode;
  targetValue: number;
  operator: string;
}

const COLORS = [
  { name: 'deep', border: 'bg-brand-deep', text: 'text-brand-deep', lightBg: 'bg-brand-light/10', borderCol: 'border-brand-light/30' },
  { name: 'medium', border: 'bg-brand-medium', text: 'text-brand-medium', lightBg: 'bg-brand-medium/10', borderCol: 'border-brand-medium/30' },
  { name: 'dark', border: 'bg-brand-dark', text: 'text-brand-dark', lightBg: 'bg-brand-dark/5', borderCol: 'border-brand-dark/20' },
  { name: 'light', border: 'bg-brand-deep/60', text: 'text-brand-deep/80', lightBg: 'bg-white', borderCol: 'border-brand-light/40' },
];

const SAMPLE_NAMES = [
  '亞瑟', '貝兒', '查理', '朵拉', '艾瑞克', '費歐娜', 
  '喬治', '海倫', '伊恩', '珍妮', '凱文', '露西'
].join('\n');

export default function App() {
  const [input, setInput] = useState<string>('');
  const [mode, setMode] = useState<GroupingMode>('count');
  const [targetValue, setTargetValue] = useState<number>(2);
  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('grouping_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('current_user'));
  const [showUserPicker, setShowUserPicker] = useState(!currentUser);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = useCallback((newGroups: Group[], total: number, m: GroupingMode, val: number) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groups: newGroups,
      totalNames: total,
      mode: m,
      targetValue: val,
      operator: currentUser || '未知使用者',
    };
    const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('grouping_history', JSON.stringify(updatedHistory));
  }, [history, currentUser]);

  const removeHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('grouping_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (confirm('確定要清空所有歷程記錄嗎？')) {
      setHistory([]);
      localStorage.removeItem('grouping_history');
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setGroups(item.groups);
    setMode(item.mode);
    setTargetValue(item.targetValue);
    setShowHistory(false);
  };

  const loadNamesFromHistory = (item: HistoryItem) => {
    const allNames = item.groups.flatMap(g => g.members).join('\n');
    setInput(allNames);
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_NAMES);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.csv')) {
        // Simple CSV parsing: remove quotes and normalize separators
        const cleaned = content
          .replace(/"/g, '')
          .split(/[\n,]/)
          .map(n => n.trim())
          .filter(n => n !== '')
          .join('\n');
        setInput(cleaned);
      } else {
        setInput(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input value so same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSelectUser = (name: string) => {
    const finalName = name === 'custom' ? customName.trim() : name;
    if (!finalName) return;
    
    setCurrentUser(finalName);
    localStorage.setItem('current_user', finalName);
    setShowUserPicker(false);
    setCustomName('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
    setShowUserPicker(true);
  };

  // Parse input into clean names
  const names = useMemo(() => {
    return input
      .split(/[\n,;]/)
      .map(n => n.trim())
      .filter(n => n !== '');
  }, [input]);

  const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handleGroup = useCallback(() => {
    if (names.length === 0) return;
    
    setIsGrouping(true);
    
    // Simulate a bit of processing for "feel"
    setTimeout(() => {
      const shuffled = shuffleArray(names);
      const newGroups: Group[] = [];
      
      let groupCount = 0;
      if (mode === 'count') {
        groupCount = Math.max(1, Math.min(targetValue, names.length));
      } else {
        groupCount = Math.ceil(names.length / Math.max(1, targetValue));
      }

      for (let i = 0; i < groupCount; i++) {
        newGroups.push({ id: i + 1, members: [] });
      }

      shuffled.forEach((name, index) => {
        const groupIndex = index % groupCount;
        newGroups[groupIndex].members.push(name);
      });

      setGroups(newGroups);
      saveToHistory(newGroups, names.length, mode, targetValue);
      setIsGrouping(false);
    }, 400);
  }, [names, mode, targetValue, saveToHistory]);

  const handleCopy = () => {
    if (groups.length === 0) return;
    
    const text = groups
      .map(g => `【第 ${g.id} 組】\n${g.members.join(', ')}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportCSV = () => {
    if (groups.length === 0) return;
    
    // CSV Header
    let csvContent = '\uFEFF組別,成員人數,名單\n'; // Add BOM for Excel UTF-8
    
    groups.forEach(g => {
      csvContent += `${g.id},${g.members.length},"${g.members.join(', ')}"\n`;
    });
    
    downloadFile(csvContent, `分組結果_${new Date().toLocaleDateString()}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportTXT = () => {
    if (groups.length === 0) return;
    
    let txtContent = `【分組結果紀錄】\n匯出時間：${new Date().toLocaleString()}\n\n`;
    
    groups.forEach(g => {
      txtContent += `== 第 ${g.id} 組 (${g.members.length} 人) ==\n`;
      txtContent += g.members.map(m => `• ${m}`).join('\n');
      txtContent += '\n\n';
    });
    
    downloadFile(txtContent, `分組結果_${new Date().toLocaleDateString()}.txt`, 'text/plain;charset=utf-8;');
  };

  const handleClear = () => {
    setInput('');
    setGroups([]);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark font-sans p-4 md:p-10 selection:bg-brand-light/30">
      <AnimatePresence>
        {showUserPicker && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-light via-brand-deep to-brand-dark" />
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-brand-bg rounded-3xl flex items-center justify-center mb-6 text-brand-deep">
                  <Users size={40} />
                </div>
                <h2 className="text-3xl font-black text-brand-dark">請選擇身分</h2>
                <p className="text-brand-medium font-bold mt-2">身份資訊將被記錄於分組歷程中</p>
              </div>

              <div className="space-y-4">
                {['周杰倫', '蔡依林'].map(user => (
                  <button 
                    key={user}
                    onClick={() => handleSelectUser(user)}
                    className="w-full py-4 bg-brand-bg hover:bg-brand-light/20 text-brand-dark font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {user}
                  </button>
                ))}
                
                <div className="pt-4 border-t border-brand-light/10">
                  <p className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-3 px-1">或者是其他使用者...</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="輸入您的姓名"
                      className="flex-1 px-5 py-4 bg-brand-bg rounded-2xl text-brand-dark font-bold outline-none focus:ring-2 focus:ring-brand-deep/20"
                    />
                    <button 
                      onClick={() => handleSelectUser('custom')}
                      disabled={!customName.trim()}
                      className="px-6 py-4 bg-brand-dark text-white rounded-2xl font-black disabled:opacity-20 hover:bg-brand-deep transition-all active:scale-95"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto">
        {/* Header Area */}
        <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-5">
            <div className="bg-brand-dark p-3.5 rounded-2xl shadow-2xl shadow-brand-medium/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Users className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-brand-dark sm:text-4xl">分組小魔法</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-brand-deep font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-medium" />
                  智能且視覺化的名單分組解決方案
                </p>
                {currentUser && (
                  <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-brand-bg rounded-lg border border-brand-light/30">
                    <span className="text-[10px] font-black text-brand-medium uppercase">USER:</span>
                    <span className="text-xs font-black text-brand-deep">{currentUser}</span>
                    <button onClick={handleLogout} className="p-1 text-brand-light hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-brand-light/30">
            <button 
              onClick={() => setShowHistory(false)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                !showHistory ? 'bg-brand-deep text-white shadow-lg shadow-brand-light/20' : 'text-brand-medium hover:text-brand-deep'
              }`}
            >
              <Users size={18} />
              主分組區
            </button>
            <button 
              onClick={() => setShowHistory(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all relative ${
                showHistory ? 'bg-brand-deep text-white shadow-lg shadow-brand-light/20' : 'text-brand-medium hover:text-brand-deep'
              }`}
            >
              <History size={18} />
              歷史保存
              {history.length > 0 && !showHistory && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-dark text-white text-[11px] flex items-center justify-center rounded-full animate-bounce border-2 border-brand-bg font-black">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Configuration (Steps 1 & 2) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8 lg:sticky lg:top-8">
            {/* Step 1: Input */}
            <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-brand-medium/5 border border-brand-light/20 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-medium font-black text-lg group-hover:bg-brand-light/20 transition-colors">1</div>
                  <h2 className="text-xl font-black text-brand-dark">準備名單</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleLoadSample} className="px-3 py-1.5 bg-brand-bg hover:bg-brand-light/30 text-brand-medium hover:text-brand-dark rounded-xl text-[10px] font-black transition-all">
                    載入範例
                  </button>
                  <button onClick={triggerFileUpload} className="px-3 py-1.5 bg-brand-bg hover:bg-brand-medium/30 text-brand-medium hover:text-brand-dark rounded-xl text-[10px] font-black transition-all flex items-center gap-1">
                    <Upload size={10} />
                    上傳文件
                  </button>
                  <div className="w-[1px] h-4 bg-brand-light/20 mx-1" />
                  <span className="text-xs font-black text-brand-medium bg-brand-bg px-3 py-1.5 rounded-xl">{names.length} 人</span>
                  <button onClick={handleClear} className="p-1.5 text-brand-light hover:text-red-400 transition-colors" title="清空全部"><Trash2 size={16} /></button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv" className="hidden" />
                </div>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="在此貼上姓名，每個名字換行或用逗號分開..."
                className="w-full h-64 sm:h-80 p-6 rounded-3xl border-2 border-brand-bg focus:border-brand-medium/30 focus:ring-8 focus:ring-brand-medium/5 outline-none transition-all resize-none bg-brand-bg/20 text-brand-dark font-bold leading-relaxed"
              />
            </section>

            {/* Step 2: Settings */}
            <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-brand-medium/5 border border-brand-light/20 group">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-medium font-black text-lg group-hover:bg-brand-deep/20 transition-colors">2</div>
                <h2 className="text-xl font-black text-brand-dark">分組偏好</h2>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-brand-bg p-1.5 rounded-2xl mb-8">
                <button onClick={() => setMode('count')} className={`flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all ${mode === 'count' ? 'bg-white shadow-md text-brand-deep' : 'text-brand-medium hover:text-brand-deep'}`}>
                  指定組數
                </button>
                <button onClick={() => setMode('size')} className={`flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all ${mode === 'size' ? 'bg-white shadow-md text-brand-deep' : 'text-brand-medium hover:text-brand-deep'}`}>
                  每組人數
                </button>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-black text-brand-medium uppercase tracking-widest">數量調整</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTargetValue(v => Math.max(1, v - 1))} className="w-8 h-8 rounded-full bg-brand-bg hover:bg-brand-light/40 flex items-center justify-center transition-colors">－</button>
                    <span className="text-4xl font-black text-brand-deep w-12 text-center">{targetValue}</span>
                    <button onClick={() => setTargetValue(v => v + 1)} className="w-8 h-8 rounded-full bg-brand-bg hover:bg-brand-light/40 flex items-center justify-center transition-colors">＋</button>
                  </div>
                </div>
                <input type="range" min="1" max={Math.max(30, names.length)} value={targetValue} onChange={(e) => setTargetValue(parseInt(e.target.value))} className="w-full h-2.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-deep" />
              </div>

              <button
                onClick={handleGroup}
                disabled={names.length === 0 || isGrouping}
                className="w-full py-5 bg-brand-dark hover:bg-brand-deep disabled:opacity-40 text-white text-xl font-black rounded-[1.5rem] shadow-2xl shadow-brand-dark/20 transition-all active:scale-95 flex items-center justify-center gap-4 group"
              >
                {isGrouping ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Shuffle size={26} /></motion.div>
                ) : (
                  <><Shuffle size={26} className="group-hover:rotate-180 transition-transform duration-700" /> 開始魔法分組</>
                )}
              </button>
            </section>
          </div>

          {/* Right Column: Dynamic Results (Step 3) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="wait">
              {!showHistory ? (
                <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 min-h-[800px]">
                  {/* Results Header Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-brand-medium/5 border border-brand-light/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-deep">
                        <LayoutGrid size={32} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-brand-dark">分組成果</h2>
                        {groups.length > 0 && <p className="text-brand-medium font-bold text-sm">已將 {names.length} 位成員分配至 {groups.length} 個小組</p>}
                      </div>
                    </div>
                    
                    {groups.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button onClick={handleCopy} className="flex items-center gap-2 px-5 py-3 bg-brand-bg text-brand-deep rounded-2xl text-xs font-black hover:bg-brand-light/30 transition-all active:scale-95">
                          {copied ? <Check size={16} className="text-brand-deep" /> : <Copy size={16} />} 複製
                        </button>
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-5 py-3 bg-brand-medium/10 text-brand-medium rounded-2xl text-xs font-black hover:bg-brand-medium/20 transition-all active:scale-95">
                          <FileSpreadsheet size={16} /> 試算表
                        </button>
                        <button onClick={handleExportTXT} className="flex items-center gap-2 px-5 py-3 bg-brand-deep/10 text-brand-deep rounded-2xl text-xs font-black hover:bg-brand-deep/20 transition-all active:scale-95">
                          <FileText size={16} /> 存檔
                        </button>
                      </div>
                    )}
                  </div>

                  {groups.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <AnimatePresence mode="popLayout">
                        {groups.map((group, idx) => {
                          const color = COLORS[idx % COLORS.length];
                          return (
                            <motion.div
                              key={group.id}
                              initial={{ opacity: 0, scale: 0.9, y: 30 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: idx * 0.08 }}
                              className={`bg-white rounded-[2.5rem] p-8 shadow-md border hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}
                              style={{ borderColor: color.borderCol }}
                            >
                              <div className={`absolute top-0 right-0 w-4 h-full ${color.border} opacity-80`} />
                              <div className="flex items-end justify-between mb-8">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black text-brand-light uppercase underline decoration-brand-bg decoration-4 underline-offset-4">TEAM</span>
                                  <h3 className={`text-4xl font-black ${color.text}`}>{String(group.id).padStart(2, '0')}</h3>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-brand-light uppercase block mb-1">MEMBER COUNT</span>
                                  <span className="px-4 py-1 bg-brand-bg rounded-full text-xs font-black text-brand-deep">{group.members.length} / {names.length}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {group.members.map((member, mIdx) => (
                                  <motion.div key={mIdx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (idx * 0.08) + (mIdx * 0.05) }} className="flex items-center gap-4 p-4 bg-brand-bg/30 rounded-2xl font-bold text-brand-dark hover:bg-white border border-transparent hover:border-brand-light/20 transition-all">
                                    <div className={`w-8 h-8 rounded-xl ${color.lightBg} flex items-center justify-center text-xs font-black ${color.text}`}>{mIdx + 1}</div>
                                    {member}
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-brand-light bg-white/50 rounded-[4rem] border-4 border-dashed border-brand-light/20 min-h-[600px] p-10 text-center">
                      <div className="w-32 h-32 bg-brand-bg rounded-[3rem] flex items-center justify-center mb-8 transform -rotate-12">
                        <LayoutGrid size={56} className="opacity-20" />
                      </div>
                      <h3 className="text-2xl font-black text-brand-medium">準備好分組了嗎？</h3>
                      <p className="font-bold text-brand-light max-w-[300px] mt-4 leading-relaxed">在左側輸入名單並按下開始，分組魔法將會在此降臨。</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 min-h-[800px]">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-brand-medium/5 border border-brand-light/10 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-brand-dark flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-brand-medium animate-ping" />
                        歷史分組庫
                      </h2>
                      <p className="text-brand-medium font-bold text-sm mt-1">恢復過去 50 次的美好分組紀錄</p>
                    </div>
                    {history.length > 0 && (
                      <button onClick={clearHistory} className="px-5 py-3 text-brand-deep hover:text-white hover:bg-brand-deep transition-all font-black text-xs rounded-2xl flex items-center gap-2">
                        <Trash2 size={16} /> 全部清空
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {history.length > 0 ? (
                      history.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white border-2 border-brand-bg rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-brand-bg flex flex-col items-center justify-center shrink-0">
                              <span className="text-xs font-black text-brand-light uppercase">{new Date(item.timestamp).toLocaleDateString('zh-TW', { month: 'short' })}</span>
                              <span className="text-2xl font-black text-brand-dark leading-none">{new Date(item.timestamp).getDate()}</span>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-1 flex items-center gap-2">
                                  <span>RECORD AT {new Date(item.timestamp).toLocaleTimeString()}</span>
                                  <span className="w-1 h-1 rounded-full bg-brand-light" />
                                  <span className="text-brand-deep">OPERATOR: {item.operator}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-2xl font-black text-brand-dark">{item.groups.length}</span>
                                    <span className="text-[10px] font-bold text-brand-light uppercase">Groups</span>
                                  </div>
                                  <div className="w-[2px] h-8 bg-brand-bg rounded-full" />
                                  <div className="flex flex-col">
                                    <span className="text-2xl font-black text-brand-dark">{item.totalNames}</span>
                                    <span className="text-[10px] font-bold text-brand-light uppercase">Names</span>
                                  </div>
                                </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button onClick={() => loadFromHistory(item)} className="px-6 py-3 bg-brand-deep shadow-lg shadow-brand-deep/20 text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-all active:scale-95 flex items-center gap-2">
                              <LayoutGrid size={16} /> 檢視
                            </button>
                            <button onClick={() => loadNamesFromHistory(item)} className="px-6 py-3 bg-brand-bg text-brand-medium rounded-2xl text-xs font-black hover:bg-brand-light/30 transition-all active:scale-95">
                              復原名單
                            </button>
                            <button onClick={() => removeHistoryItem(item.id)} className="p-3 text-brand-light hover:text-brand-dark hover:bg-brand-bg rounded-xl transition-all">
                              <X size={20} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-32 text-brand-light bg-brand-bg rounded-[4rem] border-4 border-dashed border-brand-light/20">
                        <History size={64} className="opacity-10 mb-8" />
                        <h3 className="text-2xl font-black text-brand-medium">無紀錄</h3>
                        <p className="font-bold text-brand-light mt-2">分組後系統會自動為您備份。</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="mt-24 pb-12 text-center flex flex-col items-center gap-6">
          <div className="w-12 h-1 bg-brand-medium/20 rounded-full" />
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-brand-light uppercase tracking-[0.3em]">Elegant & Reliable</span>
            <span className="text-sm font-black text-brand-dark/60">© 2026 分組小魔法 Grouping Master</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
