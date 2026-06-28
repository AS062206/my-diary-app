import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import clsx from 'clsx';

const PIN_HASH = import.meta.env.VITE_APP_PIN_HASH || '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // default: hash of '1234'
const PIN_LENGTH = 4;

async function computeHash(pin: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PinScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      computeHash(pin).then(hashedPin => {
        if (hashedPin === PIN_HASH) {
          onAuthenticated();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      });
    }
  }, [pin, onAuthenticated]);

  const handleKeyPress = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-12 w-full max-w-sm">
        
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 dark:text-white">パスコードを入力</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">日記を開くには暗証番号が必要です</p>
        </div>

        {/* PIN Indicators */}
        <div className={clsx("flex gap-6", error && "animate-bounce")}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div 
              key={i}
              className={clsx(
                "w-4 h-4 rounded-full transition-all duration-300",
                pin.length > i 
                  ? "bg-purple-500 scale-110" 
                  : "bg-gray-300 dark:bg-gray-700",
                error && "bg-red-500"
              )}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full mt-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="aspect-square flex items-center justify-center text-3xl font-light rounded-full bg-white dark:bg-gray-800 dark:text-white shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <div className="aspect-square" /> {/* Empty spot for bottom left */}
          <button
            onClick={() => handleKeyPress('0')}
            className="aspect-square flex items-center justify-center text-3xl font-light rounded-full bg-white dark:bg-gray-800 dark:text-white shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="aspect-square flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full active:scale-95 transition-all"
          >
            <Delete size={32} />
          </button>
        </div>

      </div>
    </div>
  );
}
