#!/usr/bin/env python3
import sys
import json
from search_engine import DocumentSearchEngine

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)
    
    command = sys.argv[1]
    search_engine = DocumentSearchEngine()
    
    try:
        if command == "search":
            if len(sys.argv) < 3:
                print(json.dumps({"error": "No search request provided"}))
                sys.exit(1)
            
            search_request = json.loads(sys.argv[2])
            query = search_request.get('query', '')
            filters = search_request.get('filters', {})
            limit = search_request.get('limit', 20)
            
            # Perform search
            results = search_engine.search(query, filters, limit)
            
            # Get suggestions
            suggestions = search_engine.get_suggestions(query) if query else []
            
            # Get stats
            stats = search_engine.get_stats()
            
            response = {
                "results": results,
                "total": len(results),
                "query": query,
                "filters": filters,
                "suggestions": suggestions,
                "stats": stats
            }
            
            print(json.dumps(response))
            
        elif command == "index":
            count = search_engine.index_documents()
            response = {
                "success": True,
                "indexed_count": count,
                "message": f"Successfully indexed {count} documents"
            }
            print(json.dumps(response))
            
        elif command == "stats":
            stats = search_engine.get_stats()
            print(json.dumps(stats))
            
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
