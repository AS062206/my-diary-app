import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useDiary } from '../../context/DiaryContext';
import clsx from 'clsx';

export function CalendarView({ onSelectDate }: { onSelectDate: (date: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { entries, events } = useDiary();

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  // Calculate empty padding days for the first row
  const startDayOfWeek = startOfMonth(currentDate).getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold">{format(currentDate, 'yyyy年 M月')}</h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-gray-500">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = entries.find(e => e.date === dateStr);
          const dayEvents = events.filter(e => e.date === dateStr);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              disabled={!isCurrentMonth}
              className={clsx(
                'relative aspect-square rounded-2xl flex items-center justify-center text-lg transition-all',
                !isCurrentMonth ? 'opacity-0 cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                isTodayDate ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 font-bold' : '',
                entry ? 'border-2 border-purple-200 dark:border-purple-800' : ''
              )}
            >
              <span>{format(day, 'd')}</span>
              <div className="absolute bottom-1 flex gap-1">
                {entry && (
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                )}
                {dayEvents.slice(0, 3).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-80" />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
