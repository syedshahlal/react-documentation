import os
import re
import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
import html
from datetime import datetime

class DocumentSearchEngine:
    def __init__(self, docs_path: str = "docs", db_path: str = "search_index.db"):
        self.docs_path = Path(docs_path)
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for search indexing"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create documents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT UNIQUE NOT NULL,
                title TEXT,
                content TEXT,
                excerpt TEXT,
                tags TEXT,
                category TEXT,
                difficulty TEXT,
                author TEXT,
                last_modified TIMESTAMP,
                word_count INTEGER,
                read_time INTEGER
            )
        ''')
        
        # Create search index table for better full-text search
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
                file_path,
                title,
                content,
                tags,
                category,
                content='documents',
                content_rowid='id'
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def extract_frontmatter(self, content: str) -> tuple:
        """Extract YAML frontmatter from markdown content"""
        frontmatter = {}
        
        if content.startswith('---'):
            try:
                # Split frontmatter and content
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    frontmatter_text = parts[1].strip()
                    content = parts[2].strip()
                    
                    # Simple YAML parser for basic frontmatter
                    for line in frontmatter_text.split('\n'):
                        if ':' in line:
                            key, value = line.split(':', 1)
                            key = key.strip()
                            value = value.strip().strip('"\'')
                            
                            # Handle arrays
                            if value.startswith('[') and value.endswith(']'):
                                value = [item.strip().strip('"\'') for item in value[1:-1].split(',')]
                            
                            frontmatter[key] = value
            except Exception as e:
                print(f"Error parsing frontmatter: {e}")
                
        return frontmatter, content
    
    def markdown_to_text(self, markdown_content: str) -> str:
        """Convert markdown to plain text"""
        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', markdown_content)
        text = re.sub(r'`[^`]*`', '', text)
        
        # Remove headers
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        
        # Remove links but keep text
        text = re.sub(r'\[([^\]]+)\]$$[^$$]+\)', r'\1', text)
        
        # Remove images
        text = re.sub(r'!\[[^\]]*\]$$[^$$]+\)', '', text)
        
        # Remove bold/italic
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def process_markdown_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Process a single markdown file and extract metadata"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_content = f.read()
                
            # Extract frontmatter
            frontmatter, content = self.extract_frontmatter(raw_content)
            
            # Convert markdown to plain text
            plain_text = self.markdown_to_text(content)
            
            # Calculate word count and read time
            word_count = len(plain_text.split())
            read_time = max(1, word_count // 200)  # Assume 200 words per minute
            
            # Extract title (from frontmatter or first heading)
            title = frontmatter.get('title', '')
            if not title:
                # Try to extract from first heading
                heading_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                if heading_match:
                    title = heading_match.group(1).strip()
                else:
                    title = file_path.stem.replace('-', ' ').replace('_', ' ').title()
            
            # Create excerpt (first 200 characters)
            excerpt = plain_text[:200] + '...' if len(plain_text) > 200 else plain_text
            
            # Get file stats
            stat = file_path.stat()
            last_modified = datetime.fromtimestamp(stat.st_mtime)
            
            # Handle tags
            tags = frontmatter.get('tags', [])
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',')]
            
            return {
                'file_path': str(file_path.relative_to(self.docs_path.parent)),
                'title': title,
                'content': plain_text,
                'excerpt': excerpt,
                'tags': json.dumps(tags),
                'category': frontmatter.get('category', ''),
                'difficulty': frontmatter.get('difficulty', ''),
                'author': frontmatter.get('author', ''),
                'last_modified': last_modified,
                'word_count': word_count,
                'read_time': read_time
            }
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return None
    
    def index_documents(self):
        """Index all markdown documents in the docs directory"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Clear existing data
        cursor.execute('DELETE FROM documents')
        cursor.execute('DELETE FROM search_index')
        
        # Find all markdown files
        markdown_files = []
        for pattern in ['**/*.md', '**/*.mdx']:
            markdown_files.extend(self.docs_path.glob(pattern))
        
        indexed_count = 0
        for file_path in markdown_files:
            doc_data = self.process_markdown_file(file_path)
            if doc_data:
                # Insert into documents table
                cursor.execute('''
                    INSERT OR REPLACE INTO documents 
                    (file_path, title, content, excerpt, tags, category, difficulty, author, last_modified, word_count, read_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    doc_data['file_path'],
                    doc_data['title'],
                    doc_data['content'],
                    doc_data['excerpt'],
                    doc_data['tags'],
                    doc_data['category'],
                    doc_data['difficulty'],
                    doc_data['author'],
                    doc_data['last_modified'],
                    doc_data['word_count'],
                    doc_data['read_time']
                ))
                
                # Insert into search index
                cursor.execute('''
                    INSERT INTO search_index (file_path, title, content, tags, category)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    doc_data['file_path'],
                    doc_data['title'],
                    doc_data['content'],
                    doc_data['tags'],
                    doc_data['category']
                ))
                
                indexed_count += 1
        
        conn.commit()
        conn.close()
        
        print(f"Indexed {indexed_count} documents")
        return indexed_count
    
    def search(self, query: str, filters: Dict[str, Any] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Search documents with optional filters"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build search query
        search_conditions = []
        params = []
        
        if query.strip():
            # Use FTS5 for full-text search
            search_conditions.append("search_index MATCH ?")
            # Escape special characters and add wildcards
            escaped_query = query.replace('"', '""')
            params.append(f'"{escaped_query}"*')
        
        # Apply filters
        filter_conditions = []
        if filters:
            if filters.get('category'):
                filter_conditions.append("d.category = ?")
                params.append(filters['category'])
            
            if filters.get('difficulty'):
                filter_conditions.append("d.difficulty = ?")
                params.append(filters['difficulty'])
            
            if filters.get('tags'):
                filter_conditions.append("d.tags LIKE ?")
                params.append(f'%{filters["tags"]}%')
            
            if filters.get('author'):
                filter_conditions.append("d.author = ?")
                params.append(filters['author'])
        
        # Combine conditions
        where_clause = ""
        if search_conditions or filter_conditions:
            all_conditions = search_conditions + filter_conditions
            where_clause = "WHERE " + " AND ".join(all_conditions)
        
        # Build final query
        if query.strip():
            sql_query = f'''
                SELECT d.*, 
                       SUBSTR(d.content, 1, 200) || '...' as snippet,
                       1 as rank
                FROM search_index 
                JOIN documents d ON search_index.rowid = d.id
                {where_clause}
                ORDER BY rank
                LIMIT ?
            '''
        else:
            sql_query = f'''
                SELECT d.*, 
                       d.excerpt as snippet,
                       0 as rank
                FROM documents d
                {where_clause}
                ORDER BY d.last_modified DESC
                LIMIT ?
            '''
        
        params.append(limit)
        
        cursor.execute(sql_query, params)
        results = cursor.fetchall()
        
        # Convert to dictionaries
        columns = [desc[0] for desc in cursor.description]
        search_results = []
        
        for row in results:
            result = dict(zip(columns, row))
            # Parse tags back to list
            try:
                result['tags'] = json.loads(result['tags']) if result['tags'] else []
            except:
                result['tags'] = []
            
            # Generate URL
            file_path = result['file_path']
            if file_path.startswith('docs/'):
                url_path = file_path[5:]  # Remove 'docs/' prefix
                if url_path.endswith('.md') or url_path.endswith('.mdx'):
                    url_path = url_path.rsplit('.', 1)[0]  # Remove extension
                result['url'] = f"/docs/{url_path}"
            else:
                result['url'] = f"/docs/{file_path}"
            
            search_results.append(result)
        
        conn.close()
        return search_results
    
    def get_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get search suggestions based on indexed content"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get title suggestions
        cursor.execute('''
            SELECT DISTINCT title 
            FROM documents 
            WHERE title LIKE ? 
            ORDER BY title 
            LIMIT ?
        ''', (f'%{query}%', limit))
        
        suggestions = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return suggestions
    
    def get_stats(self) -> Dict[str, Any]:
        """Get search index statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM documents')
        total_docs = cursor.fetchone()[0]
        
        cursor.execute('SELECT SUM(word_count) FROM documents')
        total_words = cursor.fetchone()[0] or 0
        
        cursor.execute('SELECT AVG(read_time) FROM documents')
        avg_read_time = cursor.fetchone()[0] or 0
        
        cursor.execute('SELECT DISTINCT category FROM documents WHERE category != ""')
        categories = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('SELECT DISTINCT difficulty FROM documents WHERE difficulty != ""')
        difficulties = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'total_documents': total_docs,
            'total_words': total_words,
            'average_read_time': round(avg_read_time, 1),
            'categories': categories,
            'difficulties': difficulties
        }

# CLI interface for testing
if __name__ == "__main__":
    import sys
    
    search_engine = DocumentSearchEngine()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "index":
            print("Indexing documents...")
            count = search_engine.index_documents()
            print(f"Successfully indexed {count} documents")
            
        elif command == "search" and len(sys.argv) > 2:
            query = sys.argv[2]
            results = search_engine.search(query)
            
            print(f"Found {len(results)} results for '{query}':")
            for i, result in enumerate(results, 1):
                print(f"\n{i}. {result['title']}")
                print(f"   File: {result['file_path']}")
                print(f"   URL: {result['url']}")
                print(f"   Excerpt: {result['excerpt'][:100]}...")
                if result['tags']:
                    print(f"   Tags: {', '.join(result['tags'])}")
                    
        elif command == "stats":
            stats = search_engine.get_stats()
            print("Search Index Statistics:")
            for key, value in stats.items():
                print(f"  {key.replace('_', ' ').title()}: {value}")
                
        else:
            print("Usage:")
            print("  python search_engine.py index")
            print("  python search_engine.py search 'query'")
            print("  python search_engine.py stats")
    else:
        print("Please provide a command: index, search, or stats")
