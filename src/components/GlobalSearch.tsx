import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api';

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetchApi(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data || []);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (link: string) => {
    navigate(link);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-full" ref={wrapperRef}>
      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input 
        type="text" 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search by ID, name, or phone..." 
        className="pl-10 pr-4 py-2 bg-gray-100/50 border-none rounded-xl focus:ring-2 focus:ring-leaf w-full md:w-72 lg:w-96 text-sm transition-all"
      />

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {results.map((result, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => handleSelect(result.link)}
                    className="w-full text-left p-3 hover:bg-gray-50 flex items-start gap-3 transition-colors"
                  >
                    <div className="mt-1">
                      {result.type === 'customer' ? (
                        <User className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-gold" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
