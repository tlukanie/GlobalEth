import React, { useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface InputAreaProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ inputValue, setInputValue, handleSend, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  return (
    <div className="border-t border-base-300 p-4 bg-base-100">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="input input-bordered flex-1 focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="btn btn-primary rounded-full p-2"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InputArea;
