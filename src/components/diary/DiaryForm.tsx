import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, MapPin, Smile, Frown, Meh, Angry } from 'lucide-react';
import clsx from 'clsx';
import { useDiary } from '../../context/DiaryContext';

const MOODS = [
  { id: 'happy', icon: Smile, label: 'Happy', color: 'text-green-500 bg-green-100 dark:bg-green-500/20' },
  { id: 'normal', icon: Meh, label: 'Normal', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20' },
  { id: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20' },
  { id: 'angry', icon: Angry, label: 'Angry', color: 'text-red-500 bg-red-100 dark:bg-red-500/20' },
];

export function DiaryForm({ date }: { date: string }) {
  const { addEntry, getEntryByDate, updateEntry, getPastEntriesOnSameDate } = useDiary();
  const existingEntry = getEntryByDate(date);
  const pastEntries = getPastEntriesOnSameDate(date);

  const [content, setContent] = useState(existingEntry?.content || '');
  const [mood, setMood] = useState(existingEntry?.mood || 'happy');
  const [weather, setWeather] = useState(existingEntry?.weather || '☀️ 晴れ');
  const [photoUrl, setPhotoUrl] = useState<string | null>(existingEntry?.photoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setPhotoFile(file);
    }
  };

  const handleSave = () => {
    if (existingEntry) {
      updateEntry(existingEntry.id, { content, mood, weather, photoUrl: photoUrl || undefined }, photoFile || undefined);
    } else {
      addEntry({ date, content, mood, weather, photoUrl: photoUrl || undefined }, photoFile || undefined);
    }
    alert('保存しました！');
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{new Date(date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}</h2>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <select 
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="bg-transparent border-none outline-none cursor-pointer appearance-none text-right font-medium"
          >
            <option value="☀️ 晴れ">☀️ 晴れ</option>
            <option value="☁️ くもり">☁️ くもり</option>
            <option value="☔️ 雨">☔️ 雨</option>
            <option value="❄️ 雪">❄️ 雪</option>
          </select>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="flex justify-between gap-2">
        {MOODS.map(m => {
          const Icon = m.icon;
          const isSelected = mood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all',
                isSelected ? m.color + ' ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-purple-500 scale-105' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon size={28} />
            </button>
          );
        })}
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今日はどんな一日だった？"
          className="w-full h-48 p-4 rounded-3xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500 resize-none text-base outline-none"
        />
      </div>

      {/* Photo Upload */}
      <div className="flex gap-2">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handlePhotoUpload}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Camera size={20} />
          <span>写真を撮る</span>
        </button>
        <button 
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture');
              fileInputRef.current.click();
              fileInputRef.current.setAttribute('capture', 'environment');
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ImageIcon size={20} />
          <span>ライブラリ</span>
        </button>
      </div>

      {/* Photo Preview */}
      {photoUrl && (
        <div className="relative rounded-3xl overflow-hidden aspect-video bg-gray-100 dark:bg-gray-800">
          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
          <button 
            onClick={() => {
              setPhotoUrl(null);
              setPhotoFile(null);
            }}
            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Save Button */}
      <button 
        onClick={handleSave}
        disabled={!content.trim() && !photoUrl}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
      >
        日記を保存する
      </button>
      {/* Past Entries */}
      {pastEntries.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">過去の今日</h3>
          <div className="flex flex-col gap-4">
            {pastEntries.map(entry => {
              const moodConfig = MOODS.find(m => m.id === entry.mood) || MOODS[0];
              const MoodIcon = moodConfig.icon;
              return (
                <div key={entry.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-purple-500">{entry.date.split('-')[0]}年</span>
                    <MoodIcon size={18} className={moodConfig.color.split(' ')[0]} />
                  </div>
                  {entry.photoUrl && (
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-gray-200 dark:bg-gray-700">
                      <img src={entry.photoUrl} alt="Past Diary" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{entry.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
