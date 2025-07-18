#!/usr/bin/env python3
"""
Simple script to analyze a Python repository and generate documentation.
Usage examples for the Python Documentation Analyzer.
"""

import os
import sys
import json
from pathlib import Path

# Add the scripts directory to the path so we can import our analyzer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from python_doc_analyzer import PythonDocAnalyzer

def analyze_local_repo(repo_path: str, output_file: str = None):
    """
    Analyze a local Python repository and generate documentation.
    
    Args:
        repo_path: Path to the local Python repository
        output_file: Optional output file path (defaults to repo_name_docs.json)
    """
    repo_path = Path(repo_path).resolve()
    
    if not repo_path.exists():
        print(f"Error: Repository path does not exist: {repo_path}")
        return False
    
    if not output_file:
        output_file = f"{repo_path.name}_docs.json"
    
    try:
        print(f"Analyzing repository: {repo_path}")
        analyzer = PythonDocAnalyzer(str(repo_path))
        documentation = analyzer.analyze_repository()
        
        # Save to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(documentation, f, indent=2, ensure_ascii=False)
        
        # Print summary
        summary = documentation['summary']
        print(f"\n✅ Analysis complete!")
        print(f"📁 Output saved to: {output_file}")
        print(f"\n📊 Summary:")
        print(f"   • Packages: {summary['total_packages']}")
        print(f"   • Modules: {summary['total_modules']}")
        print(f"   • Classes: {summary['total_classes']}")
        print(f"   • Functions: {summary['total_functions']}")
        print(f"   • Methods: {summary['total_methods']}")
        
        if summary['package_names']:
            print(f"\n📦 Found packages:")
            for pkg_name in summary['package_names']:
                print(f"   • {pkg_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing repository: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main entry point with example usage"""
    if len(sys.argv) < 2:
        print("Python Repository Documentation Analyzer")
        print("=" * 40)
        print("\nUsage:")
        print("  python analyze_repo.py <repo_path> [output_file]")
        print("\nExamples:")
        print("  python analyze_repo.py /path/to/my/python/project")
        print("  python analyze_repo.py ./my_package my_docs.json")
        print("  python analyze_repo.py ~/projects/flask-app flask_docs.json")
        print("\nThis will analyze all Python packages, modules, classes, and functions")
        print("in the specified repository and generate comprehensive API documentation.")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = analyze_local_repo(repo_path, output_file)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
