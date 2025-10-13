import { StorachaFile } from '../types';

export interface SearchResult {
  file: StorachaFile;
  score: number;
  highlights: string[];
  matchType: 'filename' | 'content' | 'tags' | 'semantic';
  matchedText?: string;
}

export interface SearchQuery {
  query: string;
  filters?: {
    fileTypes?: string[];
    dateRange?: string;
    tags?: string[];
    hasOcr?: boolean;
  };
  searchType: 'fulltext' | 'semantic' | 'hybrid';
  limit?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'filename' | 'tag' | 'content' | 'recent';
  count?: number;
}

class SearchService {
  private semanticEmbeddings: Map<string, number[]> = new Map();
  private savedSearches: SavedSearch[] = [];
  private searchHistory: string[] = [];
  private maxHistoryItems = 50;

  constructor() {
    this.loadSavedSearches();
    this.loadSearchHistory();
  }

  // Full-text search implementation
  async fullTextSearch(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchTerms = this.tokenizeQuery(query.query.toLowerCase());
    
    // Get all files (in a real app, this would come from your file service)
    const files = await this.getAllFiles();
    
    for (const file of files) {
      const score = this.calculateFullTextScore(file, searchTerms, query.filters);
      if (score > 0) {
        const highlights = this.generateHighlights(file, searchTerms);
        results.push({
          file,
          score,
          highlights,
          matchType: this.determineMatchType(file, searchTerms),
          matchedText: this.getMatchedText(file, searchTerms)
        });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 50);
  }

  // Semantic search using embeddings
  async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Generate embedding for the search query
    const queryEmbedding = await this.generateEmbedding(query.query);
    
    // Get all files with OCR content
    const files = await this.getAllFiles();
    const filesWithOcr = files.filter(f => f.extractedText && f.extractedText.length > 0);
    
    for (const file of filesWithOcr) {
      const fileEmbedding = await this.getFileEmbedding(file);
      if (fileEmbedding) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, fileEmbedding);
        if (similarity > 0.3) { // Threshold for semantic similarity
          results.push({
            file,
            score: similarity,
            highlights: this.generateSemanticHighlights(file, query.query),
            matchType: 'semantic',
            matchedText: file.extractedText?.substring(0, 200) + '...'
          });
        }
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 50);
  }

  // Hybrid search combining full-text and semantic
  async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    const [fullTextResults, semanticResults] = await Promise.all([
      this.fullTextSearch(query),
      this.semanticSearch(query)
    ]);
    
    // Combine and deduplicate results
    const combinedResults = new Map<string, SearchResult>();
    
    // Add full-text results with higher weight
    fullTextResults.forEach(result => {
      combinedResults.set(result.file.id, {
        ...result,
        score: result.score * 1.5 // Boost full-text matches
      });
    });
    
    // Add semantic results, combining scores if file already exists
    semanticResults.forEach(result => {
      const existing = combinedResults.get(result.file.id);
      if (existing) {
        existing.score = (existing.score + result.score) / 2; // Average the scores
        existing.matchType = 'content';
      } else {
        combinedResults.set(result.file.id, result);
      }
    });
    
    return Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 50);
  }

  // Search suggestions and autocomplete
  async getSearchSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const query = partialQuery.toLowerCase();
    
    // Get recent searches
    const recentSearches = this.searchHistory
      .filter(term => term.toLowerCase().includes(query))
      .slice(0, 5)
      .map(term => ({ text: term, type: 'recent' as const }));
    
    // Get filename suggestions
    const files = await this.getAllFiles();
    const filenameSuggestions = files
      .filter(file => file.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map(file => ({ text: file.name, type: 'filename' as const }));
    
    // Get tag suggestions
    const allTags = new Set<string>();
    files.forEach(file => file.tags.forEach(tag => allTags.add(tag)));
    const tagSuggestions = Array.from(allTags)
      .filter(tag => tag.toLowerCase().includes(query))
      .slice(0, 5)
      .map(tag => ({ text: tag, type: 'tag' as const }));
    
    // Get content suggestions from OCR text
    const contentSuggestions = files
      .filter(file => file.extractedText && file.extractedText.toLowerCase().includes(query))
      .slice(0, 3)
      .map(file => {
        const text = file.extractedText || '';
        const startIndex = text.toLowerCase().indexOf(query);
        const suggestion = text.substring(Math.max(0, startIndex - 20), startIndex + query.length + 20);
        return { text: suggestion.trim(), type: 'content' as const };
      });
    
    suggestions.push(...recentSearches, ...filenameSuggestions, ...tagSuggestions, ...contentSuggestions);
    
    return suggestions.slice(0, 10); // Limit total suggestions
  }

  // Saved searches management
  saveSearch(name: string, query: SearchQuery): string {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      createdAt: new Date(),
      useCount: 0
    };
    
    this.savedSearches.push(savedSearch);
    this.persistSavedSearches();
    return savedSearch.id;
  }

  getSavedSearches(): SavedSearch[] {
    return [...this.savedSearches].sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0));
  }

  deleteSavedSearch(id: string): boolean {
    const index = this.savedSearches.findIndex(s => s.id === id);
    if (index !== -1) {
      this.savedSearches.splice(index, 1);
      this.persistSavedSearches();
      return true;
    }
    return false;
  }

  useSavedSearch(id: string): SearchQuery | null {
    const savedSearch = this.savedSearches.find(s => s.id === id);
    if (savedSearch) {
      savedSearch.lastUsed = new Date();
      savedSearch.useCount++;
      this.persistSavedSearches();
      return savedSearch.query;
    }
    return null;
  }

  // Search history management
  addToSearchHistory(query: string): void {
    if (query.trim().length === 0) return;
    
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(term => term !== query);
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Limit history size
    this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    
    this.persistSearchHistory();
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    this.persistSearchHistory();
  }

  // Private helper methods
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.replace(/[^\w]/g, ''));
  }

  private calculateFullTextScore(file: StorachaFile, searchTerms: string[], filters?: SearchQuery['filters']): number {
    let score = 0;
    
    // Apply filters first
    if (filters) {
      if (filters.fileTypes && !filters.fileTypes.includes(file.type)) return 0;
      if (filters.hasOcr && !file.extractedText) return 0;
      if (filters.tags && !filters.tags.some(tag => file.tags.includes(tag))) return 0;
    }
    
    // Filename matching (highest weight)
    const filenameLower = file.name.toLowerCase();
    searchTerms.forEach(term => {
      if (filenameLower.includes(term)) {
        score += 10;
        if (filenameLower.startsWith(term)) score += 5; // Boost for prefix matches
      }
    });
    
    // Tag matching
    file.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      searchTerms.forEach(term => {
        if (tagLower.includes(term)) score += 3;
      });
    });
    
    // OCR content matching
    if (file.extractedText) {
      const contentLower = file.extractedText.toLowerCase();
      searchTerms.forEach(term => {
        const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
        score += matches * 1; // Lower weight for content matches
      });
    }
    
    return score;
  }

  private generateHighlights(file: StorachaFile, searchTerms: string[]): string[] {
    const highlights: string[] = [];
    
    // Highlight filename matches
    let highlightedName = file.name;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedName = highlightedName.replace(regex, '<mark>$1</mark>');
    });
    if (highlightedName !== file.name) {
      highlights.push(`Filename: ${highlightedName}`);
    }
    
    // Highlight content matches
    if (file.extractedText) {
      const content = file.extractedText;
      searchTerms.forEach(term => {
        const regex = new RegExp(`(.{0,50}${term}.{0,50})`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          matches.forEach(match => {
            const highlighted = match.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>');
            highlights.push(`Content: ...${highlighted}...`);
          });
        }
      });
    }
    
    return highlights.slice(0, 3); // Limit highlights
  }

  private determineMatchType(file: StorachaFile, searchTerms: string[]): SearchResult['matchType'] {
    const filenameLower = file.name.toLowerCase();
    const hasFilenameMatch = searchTerms.some(term => filenameLower.includes(term));
    
    if (hasFilenameMatch) return 'filename';
    if (file.tags.some(tag => searchTerms.some(term => tag.toLowerCase().includes(term)))) return 'tags';
    return 'content';
  }

  private getMatchedText(file: StorachaFile, searchTerms: string[]): string {
    if (file.extractedText) {
      const content = file.extractedText;
      for (const term of searchTerms) {
        const index = content.toLowerCase().indexOf(term);
        if (index !== -1) {
          const start = Math.max(0, index - 100);
          const end = Math.min(content.length, index + term.length + 100);
          return content.substring(start, end);
        }
      }
    }
    return file.name;
  }

  private generateSemanticHighlights(file: StorachaFile, query: string): string[] {
    const highlights: string[] = [];
    
    if (file.extractedText) {
      // Simple semantic highlighting - in a real implementation, you'd use more sophisticated NLP
      const sentences = file.extractedText.split(/[.!?]+/);
      const relevantSentences = sentences
        .filter(sentence => this.calculateTextSimilarity(sentence, query) > 0.3)
        .slice(0, 2);
      
      relevantSentences.forEach(sentence => {
        highlights.push(`Content: ${sentence.trim()}...`);
      });
    }
    
    return highlights;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation - in production, use proper NLP libraries
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation - in production, use OpenAI, Cohere, or similar
    // For now, return a simple hash-based embedding
    const hash = this.simpleHash(text);
    return Array.from({ length: 384 }, (_, i) => Math.sin(hash + i) * 0.5 + 0.5);
  }

  private async getFileEmbedding(file: StorachaFile): Promise<number[] | null> {
    if (!file.extractedText) return null;
    
    const cacheKey = `embedding_${file.id}`;
    if (this.semanticEmbeddings.has(cacheKey)) {
      return this.semanticEmbeddings.get(cacheKey)!;
    }
    
    const embedding = await this.generateEmbedding(file.extractedText);
    this.semanticEmbeddings.set(cacheKey, embedding);
    return embedding;
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async getAllFiles(): Promise<StorachaFile[]> {
    // This would integrate with your existing file service
    // For now, return mock data with some sample files for testing
    return [
      {
        id: '1',
        name: 'project-document.pdf',
        cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        size: 1024000,
        type: 'document',
        mimeType: 'application/pdf',
        created: new Date('2024-01-15'),
        updated: new Date('2024-01-15'),
        tags: ['project', 'documentation', 'important'],
        isPublic: false,
        downloadCount: 5,
        ocrStatus: 'completed',
        extractedText: 'This is a project document containing important information about our software development process. It includes details about architecture, implementation guidelines, and best practices.',
        textExtractionMethod: 'embedded'
      },
      {
        id: '2',
        name: 'meeting-notes.txt',
        cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        size: 512000,
        type: 'document',
        mimeType: 'text/plain',
        created: new Date('2024-01-20'),
        updated: new Date('2024-01-20'),
        tags: ['meeting', 'notes', 'team'],
        isPublic: false,
        downloadCount: 3,
        ocrStatus: 'completed',
        extractedText: 'Meeting notes from our weekly team standup. Discussed project progress, upcoming deadlines, and resource allocation.',
        textExtractionMethod: 'embedded'
      },
      {
        id: '3',
        name: 'screenshot.png',
        cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        size: 2048000,
        type: 'image',
        mimeType: 'image/png',
        created: new Date('2024-01-25'),
        updated: new Date('2024-01-25'),
        tags: ['screenshot', 'ui', 'design'],
        isPublic: true,
        downloadCount: 12,
        ocrStatus: 'completed',
        extractedText: 'Screenshot of the new user interface design showing the dashboard layout and navigation elements.',
        textExtractionMethod: 'ocr'
      }
    ];
  }

  private loadSavedSearches(): void {
    try {
      const saved = localStorage.getItem('storacha_saved_searches');
      if (saved) {
        this.savedSearches = JSON.parse(saved).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          lastUsed: s.lastUsed ? new Date(s.lastUsed) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }

  private persistSavedSearches(): void {
    try {
      localStorage.setItem('storacha_saved_searches', JSON.stringify(this.savedSearches));
    } catch (error) {
      console.error('Failed to save searches:', error);
    }
  }

  private loadSearchHistory(): void {
    try {
      const history = localStorage.getItem('storacha_search_history');
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  private persistSearchHistory(): void {
    try {
      localStorage.setItem('storacha_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }
}

export const searchService = new SearchService();
