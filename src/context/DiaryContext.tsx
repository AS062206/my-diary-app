import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood: string;
  weather?: string;
  photoUrl?: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
}

interface DiaryContextType {
  entries: DiaryEntry[];
  events: CalendarEvent[];
  addEntry: (entry: Omit<DiaryEntry, 'id'>, photoFile?: File) => Promise<void>;
  updateEntry: (id: string, entry: Partial<DiaryEntry>, photoFile?: File) => Promise<void>;
  getEntryByDate: (date: string) => DiaryEntry | undefined;
  getPastEntriesOnSameDate: (date: string) => DiaryEntry[];
  isLoading: boolean;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

const GAS_API_URL = import.meta.env.VITE_GAS_API_URL;

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If URL is not set or still default, load dummy data
    if (!GAS_API_URL || GAS_API_URL.includes('ここにGASのウェブアプリURLを貼り付けます')) {
      setEntries([
        {
          id: 'dummy-1',
          date: '2025-06-28',
          content: '一年前の今日の日記です。こんなこと考えてたんだなぁ。',
          mood: 'normal'
        }
      ]);
      setEvents([
        { id: 'ev-1', date: '2026-06-28', title: '友達とランチ' },
        { id: 'ev-2', date: '2026-06-30', title: '美容院' },
        { id: 'ev-3', date: '2026-06-28', title: 'ミーティング' }
      ]);
      setIsLoading(false);
      return;
    }

    // Fetch from GAS
    const fetchData = async () => {
      try {
        const response = await fetch(GAS_API_URL);
        const data = await response.json();
        if (data.status === 'success') {
          // Fix image URLs that might be blocked by browser due to export=view redirect
          const fixedEntries = (data.entries || []).map((e: DiaryEntry) => {
            if (e.photoUrl && e.photoUrl.includes('drive.google.com/uc')) {
              const idMatch = e.photoUrl.match(/id=([^&]+)/);
              if (idMatch) {
                return { ...e, photoUrl: `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000` };
              }
            }
            return e;
          });
          setEntries(fixedEntries);
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch data from GAS:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveToGas = async (data: any) => {
    if (!GAS_API_URL || GAS_API_URL.includes('ここにGASのウェブアプリURLを貼り付けます')) {
      return; // Mock mode, do nothing
    }
    try {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // avoid CORS preflight
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to post data to GAS:', error);
    }
  };

  const addEntry = async (entry: Omit<DiaryEntry, 'id'>, photoFile?: File) => {
    const newId = Date.now().toString();
    const newEntry: DiaryEntry = { ...entry, id: newId };
    
    // Add to local state immediately (Optimistic UI)
    setEntries(prev => [...prev, newEntry]);

    // Convert file to base64 if exists
    let photoBase64;
    let photoExt;
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
      photoExt = photoFile.type.split('/')[1];
    }

    // Send to GAS
    await saveToGas({ ...newEntry, photoBase64, photoExt });
  };

  const updateEntry = async (id: string, updated: Partial<DiaryEntry>, photoFile?: File) => {
    // Update local state immediately
    setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updated } : entry));

    let photoBase64;
    let photoExt;
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
      photoExt = photoFile.type.split('/')[1];
    }

    const currentEntry = entries.find(e => e.id === id);
    const dataToSend = { ...currentEntry, ...updated, photoBase64, photoExt };

    // Send to GAS
    await saveToGas(dataToSend);
  };

  const getEntryByDate = (date: string) => {
    return entries.find(entry => entry.date === date);
  };

  const getPastEntriesOnSameDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return entries.filter(entry => {
      const [, entryMonth, entryDay] = entry.date.split('-');
      return entry.date !== dateStr && entryMonth === month && entryDay === day;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <DiaryContext.Provider value={{ entries, events, addEntry, updateEntry, getEntryByDate, getPastEntriesOnSameDate, isLoading }}>
      {children}
    </DiaryContext.Provider>
  );
}

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
};
