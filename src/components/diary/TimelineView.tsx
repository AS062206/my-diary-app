import { format } from 'date-fns';
import { Smile, Meh, Frown, Angry } from 'lucide-react';
import { useDiary } from '../../context/DiaryContext';

const MOOD_ICONS = {
  happy: { icon: Smile, color: 'text-green-500' },
  normal: { icon: Meh, color: 'text-yellow-500' },
  sad: { icon: Frown, color: 'text-blue-500' },
  angry: { icon: Angry, color: 'text-red-500' },
};

export function TimelineView({ onSelectDate }: { onSelectDate: (date: string) => void }) {
  const { entries } = useDiary();

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p>まだ日記がありません。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 max-w-lg mx-auto w-full">
      {sortedEntries.map(entry => {
        const moodConfig = MOOD_ICONS[entry.mood as keyof typeof MOOD_ICONS] || MOOD_ICONS.happy;
        const MoodIcon = moodConfig.icon;

        return (
          <button
            key={entry.id}
            onClick={() => onSelectDate(entry.date)}
            className="flex flex-col gap-3 p-5 rounded-3xl bg-gray-50 dark:bg-gray-800 text-left hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">
                {format(new Date(entry.date), 'M月d日')}
              </span>
              <div className={`p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm ${moodConfig.color}`}>
                <MoodIcon size={20} />
              </div>
            </div>
            
            {entry.photoUrl && (
              <div className="w-full h-32 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img src={entry.photoUrl} alt="Diary" className="w-full h-full object-cover" />
              </div>
            )}
            
            <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
              {entry.content}
            </p>
          </button>
        );
      })}
    </div>
  );
}
