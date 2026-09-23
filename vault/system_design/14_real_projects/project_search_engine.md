#system-design #project #hands-on #java

# Build It: Simple Search Engine (Java)

> Build an inverted index search engine from scratch. Teaches: tokenization, inverted indexes, TF-IDF scoring, and search architecture.

---

## What You Build

Index documents → search by keywords → rank by relevance.

## Core Implementation

```java
// === Tokenizer ===
public class Tokenizer {
    public List<String> tokenize(String text) {
        return Arrays.stream(text.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "")  // Remove punctuation
            .split("\\s+"))
            .filter(w -> !STOP_WORDS.contains(w))  // Remove "the", "a", "is"
            .map(this::stem)  // "running" → "run"
            .collect(Collectors.toList());
    }

    private String stem(String word) {
        // Simple Porter stemmer (or use library)
        if (word.endsWith("ing")) return word.substring(0, word.length() - 3);
        if (word.endsWith("ed")) return word.substring(0, word.length() - 2);
        if (word.endsWith("s") && !word.endsWith("ss")) return word.substring(0, word.length() - 1);
        return word;
    }
}

// === Inverted Index ===
public class InvertedIndex {
    // word → { docId → [positions] }
    private final Map<String, Map<String, List<Integer>>> index = new HashMap<>();
    private final Map<String, Document> documents = new HashMap<>();
    private final Tokenizer tokenizer = new Tokenizer();

    public void addDocument(Document doc) {
        documents.put(doc.getId(), doc);
        List<String> tokens = tokenizer.tokenize(doc.getContent());

        for (int i = 0; i < tokens.size(); i++) {
            String token = tokens.get(i);
            index.computeIfAbsent(token, k -> new HashMap<>())
                 .computeIfAbsent(doc.getId(), k -> new ArrayList<>())
                 .add(i);
        }
    }

    public List<SearchResult> search(String query) {
        List<String> queryTokens = tokenizer.tokenize(query);

        // Find documents containing ALL query tokens
        Set<String> matchingDocs = null;
        for (String token : queryTokens) {
            Map<String, List<Integer>> postings = index.getOrDefault(token, Map.of());
            if (matchingDocs == null) {
                matchingDocs = new HashSet<>(postings.keySet());
            } else {
                matchingDocs.retainAll(postings.keySet()); // Intersection
            }
        }

        if (matchingDocs == null) return List.of();

        // Score each document using TF-IDF
        return matchingDocs.stream()
            .map(docId -> new SearchResult(docId, calculateScore(docId, queryTokens)))
            .sorted(Comparator.comparingDouble(SearchResult::getScore).reversed())
            .limit(10)
            .collect(Collectors.toList());
    }

    private double calculateScore(String docId, List<String> queryTokens) {
        double score = 0;
        for (String token : queryTokens) {
            double tf = termFrequency(token, docId);
            double idf = inverseDocFrequency(token);
            score += tf * idf;
        }
        return score;
    }

    private double termFrequency(String term, String docId) {
        List<Integer> positions = index.getOrDefault(term, Map.of())
            .getOrDefault(docId, List.of());
        return positions.size(); // Simplified TF
    }

    private double inverseDocFrequency(String term) {
        int docsWithTerm = index.getOrDefault(term, Map.of()).size();
        if (docsWithTerm == 0) return 0;
        return Math.log((double) documents.size() / docsWithTerm);
    }
}

// === Usage ===
InvertedIndex engine = new InvertedIndex();
engine.addDocument(new Document("1", "Java concurrency multithreading tutorial"));
engine.addDocument(new Document("2", "Python web development flask tutorial"));
engine.addDocument(new Document("3", "Java spring boot microservices"));

List<SearchResult> results = engine.search("java tutorial");
// Returns doc "1" (both words match, high TF-IDF) then doc "3" (only "java" matches)
```

## What You Learn

| Concept | How Applied |
|---------|------------|
| Inverted index | Core search data structure |
| Tokenization | Text processing pipeline |
| TF-IDF scoring | Relevance ranking |
| Set operations | AND queries via intersection |
| Stop words + stemming | Text normalization |

## Extensions
1. Add phrase search ("exact phrase")
2. Add fuzzy matching (Levenshtein distance)
3. Add REST API with Spring Boot
4. Add persistence (serialize index to disk)
5. Add autocomplete (trie + prefix matching)

## Links
- [[../02_building_blocks/search_systems]] — Elasticsearch architecture
- [[../05_case_studies/design_search_autocomplete]] — Autocomplete system design
