import React, { useState } from 'react';
import { Button } from '../shared/Button';

interface TestScriptEditorProps {
  language: string;
  initialScript?: string;
  onSave: (script: string) => void;
  onCancel: () => void;
}

export const TestScriptEditor: React.FC<TestScriptEditorProps> = ({
  language,
  initialScript = '',
  onSave,
  onCancel,
}) => {
  const [script, setScript] = useState(initialScript);
  const [isModified, setIsModified] = useState(false);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value);
    setIsModified(true);
  };

  const handleSave = () => {
    onSave(script);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setScript(text);
      setIsModified(true);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      alert('Failed to paste from clipboard. Please try again.');
    }
  };

  const getLanguageExtension = () => {
    switch (language.toLowerCase()) {
      case 'python': return '.py';
      case 'javascript': return '.js';
      case 'java': return '.java';
      case 'c': return '.c';
      case 'cpp': return '.cpp';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border-2 border-neon-cyan rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-display font-bold text-neon-cyan">
              Edit Test Script ({language.toUpperCase()}{getLanguageExtension()})
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button onClick={handlePaste} variant="secondary" size="sm">
              📋 Paste from Clipboard
            </Button>
          </div>
          
          <div className="flex-1">
            <textarea
              value={script}
              onChange={handleScriptChange}
              className="w-full h-full px-4 py-3 bg-dark-900 border-2 border-dark-600 rounded-lg text-green-400 font-mono text-sm focus:border-neon-cyan focus:outline-none resize-none"
              spellCheck="false"
            />
          </div>
          
          <div className="flex gap-4 mt-4">
            <Button onClick={handleSave} variant="primary" disabled={!isModified}>
              Save Script
            </Button>
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};