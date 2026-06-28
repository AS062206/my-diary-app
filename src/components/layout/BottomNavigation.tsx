import { Calendar, PenLine, List, Settings } from 'lucide-react';
import clsx from 'clsx';

interface BottomNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ currentTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'calendar', icon: Calendar, label: 'カレンダー' },
    { id: 'today', icon: PenLine, label: '今日' },
    { id: 'timeline', icon: List, label: 'タイムライン' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full transition-colors',
                isActive ? 'text-purple-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
