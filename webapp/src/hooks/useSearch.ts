import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService, SearchResult, SearchQuery, SearchSuggestion, SavedSearch } from '../services/searchService';
import { StorachaFile } from '../types';

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxSuggestions = 10
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchType, setSearchType] = useState<SearchQuery['searchType']>('hybrid');
  const [filters, setFilters] = useState<SearchQuery['filters']>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSavedSearches(searchService.getSavedSearches());
    setSearchHistory(searchService.getSearchHistory());
  }, []);

  const executeSearch = useCallback(async (searchQuery: string, searchFilters?: SearchQuery['filters']) => {
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchQueryObj: SearchQuery = {
        query: searchQuery,
        searchType,
        filters: searchFilters || filters,
        limit: 50
      };

      let searchResults: SearchResult[] = [];
      
      switch (searchType) {
        case 'fulltext':
          searchResults = await searchService.fullTextSearch(searchQueryObj);
          break;
        case 'semantic':
          searchResults = await searchService.semanticSearch(searchQueryObj);
          break;
        case 'hybrid':
        default:
          searchResults = await searchService.hybridSearch(searchQueryObj);
          break;
      }

      setResults(searchResults);
      
      searchService.addToSearchHistory(searchQuery);
      setSearchHistory(searchService.getSearchHistory());
      
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType, filters, minQueryLength]);

  const loadSuggestions = useCallback(async (partialQuery: string) => {
    if (partialQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const searchSuggestions = await searchService.getSearchSuggestions(partialQuery);
      setSuggestions(searchSuggestions.slice(0, maxSuggestions));
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [minQueryLength, maxSuggestions]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedSuggestionIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (suggestionsRef.current) {
      clearTimeout(suggestionsRef.current);
    }

    debounceRef.current = setTimeout(() => {
      executeSearch(newQuery);
    }, debounceMs);

    suggestionsRef.current = setTimeout(() => {
      loadSuggestions(newQuery);
    }, 150);
  }, [executeSearch, loadSuggestions, debounceMs]);

  const search = useCallback((searchQuery?: string, searchFilters?: SearchQuery['filters']) => {
    const queryToSearch = searchQuery || query;
    if (queryToSearch.trim()) {
      executeSearch(queryToSearch, searchFilters);
      setShowSuggestions(false);
    }
  }, [query, executeSearch]);

  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    executeSearch(suggestion.text);
  }, [executeSearch]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          search();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, selectSuggestion, search]);

  const saveSearch = useCallback((name: string) => {
    if (!query.trim()) return null;
    
    const searchQueryObj: SearchQuery = {
      query,
      searchType,
      filters
    };
    
    const savedSearchId = searchService.saveSearch(name, searchQueryObj);
    setSavedSearches(searchService.getSavedSearches());
    return savedSearchId;
  }, [query, searchType, filters]);

  const loadSavedSearch = useCallback((savedSearchId: string) => {
    const savedQuery = searchService.useSavedSearch(savedSearchId);
    if (savedQuery) {
      setQuery(savedQuery.query);
      setSearchType(savedQuery.searchType);
      setFilters(savedQuery.filters || {});
      executeSearch(savedQuery.query, savedQuery.filters);
      setSavedSearches(searchService.getSavedSearches());
      return true;
    }
    return false;
  }, [executeSearch]);

  const deleteSavedSearch = useCallback((savedSearchId: string) => {
    const success = searchService.deleteSavedSearch(savedSearchId);
    if (success) {
      setSavedSearches(searchService.getSavedSearches());
    }
    return success;
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  const clearSearchHistory = useCallback(() => {
    searchService.clearSearchHistory();
    setSearchHistory([]);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchQuery['filters']>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (query.trim()) {
      executeSearch(query, updatedFilters);
    }
  }, [filters, query, executeSearch]);

  const updateSearchType = useCallback((newSearchType: SearchQuery['searchType']) => {
    setSearchType(newSearchType);
    
    if (query.trim()) {
      const searchQueryObj: SearchQuery = {
        query,
        searchType: newSearchType,
        filters
      };
      
      setIsSearching(true);
      let searchPromise: Promise<SearchResult[]>;
      
      switch (newSearchType) {
        case 'fulltext':
          searchPromise = searchService.fullTextSearch(searchQueryObj);
          break;
        case 'semantic':
          searchPromise = searchService.semanticSearch(searchQueryObj);
          break;
        case 'hybrid':
        default:
          searchPromise = searchService.hybridSearch(searchQueryObj);
          break;
      }
      
      searchPromise
        .then((searchResults: SearchResult[]) => {
          setResults(searchResults);
        })
        .catch((error) => {
          console.error('Search failed:', error);
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, [query, filters]);

  const toggleSuggestions = useCallback(() => {
    setShowSuggestions(prev => !prev);
  }, []);

  const getFilesFromResults = useCallback((): StorachaFile[] => {
    return results.map(result => result.file);
  }, [results]);

  const getResultForFile = useCallback((fileId: string): SearchResult | undefined => {
    return results.find(result => result.file.id === fileId);
  }, [results]);

  return {
    query,
    results,
    suggestions,
    isSearching,
    isLoadingSuggestions,
    searchType,
    filters,
    savedSearches,
    searchHistory,
    showSuggestions,
    selectedSuggestionIndex,
    
    handleQueryChange,
    search,
    selectSuggestion,
    handleKeyDown,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    clearSearch,
    clearSearchHistory,
    updateFilters,
    updateSearchType,
    toggleSuggestions,
    
    // Utilities
    getFilesFromResults,
    getResultForFile,
    
    // Computed
    hasResults: results.length > 0,
    hasSuggestions: suggestions.length > 0,
    canSaveSearch: query.trim().length > 0,
    totalResults: results.length
  };
};
