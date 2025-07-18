#!/usr/bin/env python3
"""
Generate MDX documentation from Python repositories.
Simplified script for MDX generation with better error handling.
"""

import os
import sys
from pathlib import Path

# Add the scripts directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from python_doc_analyzer import PythonDocAnalyzer, generate_mdx_docs

def generate_docs_for_repo(repo_path: str, output_file: str = None):
    """
    Generate MDX documentation for a Python repository.
    
    Args:
        repo_path: Path to the Python repository
        output_file: Output MDX file path (optional)
    """
    repo_path = Path(repo_path).resolve()
    
    if not repo_path.exists():
        print(f"❌ Error: Repository path does not exist: {repo_path}")
        return False
    
    if not output_file:
        output_file = f"{repo_path.name}_api_docs.mdx"
    elif not output_file.endswith('.mdx'):
        output_file = f"{output_file}.mdx"
    
    try:
        print(f"🔍 Analyzing repository: {repo_path}")
        analyzer = PythonDocAnalyzer(str(repo_path))
        documentation = analyzer.analyze_repository()
        
        print(f"📝 Generating MDX documentation...")
        mdx_content = generate_mdx_docs(documentation)
        
        # Write MDX file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(mdx_content)
        
        # Print success message with summary
        summary = documentation['summary']
        print(f"\n✅ MDX documentation generated successfully!")
        print(f"📄 Output file: {output_file}")
        print(f"\n📊 Documentation Summary:")
        print(f"   📦 Packages: {summary['total_packages']}")
        print(f"   📄 Modules: {summary['total_modules']}")
        print(f"   🏗️  Classes: {summary['total_classes']}")
        print(f"   ⚡ Functions: {summary['total_functions']}")
        print(f"   🔧 Methods: {summary['total_methods']}")
        
        if summary['package_names']:
            print(f"\n📦 Found packages: {', '.join(summary['package_names'])}")
        
        print(f"\n💡 You can now use this MDX file in your documentation site!")
        print(f"   Place it in your docs/ folder and it will be automatically rendered.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating documentation: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("🐍 Python to MDX Documentation Generator")
        print("=" * 40)
        print("\nUsage:")
        print("  python generate_mdx_docs.py <repo_path> [output_file]")
        print("\nExamples:")
        print("  python generate_mdx_docs.py /path/to/my/python/project")
        print("  python generate_mdx_docs.py ./my_package my_api_docs.mdx")
        print("  python generate_mdx_docs.py ~/projects/flask-app flask_api")
        print("\nThis will generate interactive MDX documentation with:")
        print("  • 📊 Interactive overview cards")
        print("  • 🎨 Syntax-highlighted code blocks")
        print("  • 📱 Responsive design components")
        print("  • 🔍 Searchable and navigable structure")
        print("  • 🎯 Ready for Next.js/MDX documentation sites")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = generate_docs_for_repo(repo_path, output_file)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
