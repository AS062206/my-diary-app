import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ThemeProvider } from './context/ThemeContext';
import { DiaryProvider } from './context/DiaryContext';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { DarkModeToggle } from './components/ui/DarkModeToggle';
import { CalendarView } from './components/diary/CalendarView';
import { DiaryForm } from './components/diary/DiaryForm';
import { TimelineView } from './components/diary/TimelineView';
import { PinScreen } from './components/auth/PinScreen';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'today') {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setCurrentTab('today');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 pb-safe">
      <header className="flex justify-between items-center p-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          My Diary
        </h1>
        <DarkModeToggle />
      </header>

      <main className="w-full">
        {currentTab === 'calendar' && <CalendarView onSelectDate={handleSelectDate} />}
        {currentTab === 'today' && <DiaryForm date={selectedDate} key={selectedDate} />}
        {currentTab === 'timeline' && <TimelineView onSelectDate={handleSelectDate} />}
        {currentTab === 'settings' && (
          <div className="p-4 flex flex-col items-center justify-center h-64 text-gray-500">
            <p>設定画面（Google連携など）</p>
            <p className="text-sm mt-2">※モックアップ段階では未実装です</p>
          </div>
        )}
      </main>

      <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PinScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <ThemeProvider>
      <DiaryProvider>
        <AppContent />
      </DiaryProvider>
    </ThemeProvider>
  );
}

export default App;
