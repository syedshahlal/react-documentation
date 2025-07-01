import os
import ast
import json
import sys
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional
import re
import inspect
from urllib.parse import urlparse
import zipfile
import requests

class APIDocGenerator:
    def __init__(self):
        self.docs_data = {}
        self.temp_dir = None
        
    def clone_or_download_repo(self, repo_url: str) -> str:
        """Clone a git repository or download from URL"""
        self.temp_dir = tempfile.mkdtemp()
        
        try:
            # Try git clone first
            if repo_url.endswith('.git') or 'github.com' in repo_url or 'gitlab.com' in repo_url:
                subprocess.run(['git', 'clone', repo_url, self.temp_dir], 
                             check=True, capture_output=True)
                return self.temp_dir
            
            # Try downloading as zip
            response = requests.get(repo_url)
            if response.status_code == 200:
                zip_path = os.path.join(self.temp_dir, 'repo.zip')
                with open(zip_path, 'wb') as f:
                    f.write(response.content)
                
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(self.temp_dir)
                
                # Find the extracted folder
                extracted_folders = [d for d in os.listdir(self.temp_dir) 
                                   if os.path.isdir(os.path.join(self.temp_dir, d))]
                if extracted_folders:
                    return os.path.join(self.temp_dir, extracted_folders[0])
                    
            return self.temp_dir
            
        except Exception as e:
            print(f"Error downloading repository: {e}")
            return None
    
    def find_python_packages(self, root_path: str) -> List[str]:
        """Find all directories containing __init__.py files"""
        packages = []
        
        for root, dirs, files in os.walk(root_path):
            if '__init__.py' in files:
                # Skip hidden directories and common non-package directories
                if not any(part.startswith('.') for part in Path(root).parts):
                    if not any(skip in root.lower() for skip in ['test', 'tests', '__pycache__', '.git']):
                        packages.append(root)
        
        return packages
    
    def extract_docstring(self, node: ast.AST) -> Optional[str]:
        """Extract docstring from an AST node"""
        if (isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Module)) and 
            node.body and isinstance(node.body[0], ast.Expr) and 
            isinstance(node.body[0].value, ast.Constant) and 
            isinstance(node.body[0].value.value, str)):
            return node.body[0].value.value
        return None
    
    def parse_docstring(self, docstring: str) -> Dict[str, Any]:
        """Parse docstring into structured format (Google/Sphinx style)"""
        if not docstring:
            return {}
        
        lines = docstring.strip().split('\n')
        parsed = {
            'description': '',
            'args': [],
            'returns': '',
            'raises': [],
            'examples': [],
            'attributes': []
        }
        
        current_section = 'description'
        current_content = []
        
        for line in lines:
            line = line.strip()
            
            # Check for section headers
            if line.lower().startswith(('args:', 'arguments:', 'parameters:')):
                if current_content:
                    parsed[current_section] = '\n'.join(current_content).strip()
                current_section = 'args'
                current_content = []
            elif line.lower().startswith(('returns:', 'return:')):
                if current_content:
                    parsed[current_section] = '\n'.join(current_content).strip()
                current_section = 'returns'
                current_content = []
            elif line.lower().startswith(('raises:', 'raise:')):
                if current_content:
                    parsed[current_section] = '\n'.join(current_content).strip()
                current_section = 'raises'
                current_content = []
            elif line.lower().startswith(('examples:', 'example:')):
                if current_content:
                    parsed[current_section] = '\n'.join(current_content).strip()
                current_section = 'examples'
                current_content = []
            elif line.lower().startswith(('attributes:', 'attribute:')):
                if current_content:
                    parsed[current_section] = '\n'.join(current_content).strip()
                current_section = 'attributes'
                current_content = []
            else:
                current_content.append(line)
        
        # Add the last section
        if current_content:
            parsed[current_section] = '\n'.join(current_content).strip()
        
        # Parse arguments if they exist
        if parsed['args'] and isinstance(parsed['args'], str):
            args_text = parsed['args']
            args_list = []
            for line in args_text.split('\n'):
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        arg_name = parts[0].strip()
                        arg_desc = parts[1].strip()
                        args_list.append({'name': arg_name, 'description': arg_desc})
            parsed['args'] = args_list
        
        return parsed
    
    def analyze_python_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a Python file and extract all docstrings"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            file_info = {
                'path': file_path,
                'module_docstring': '',
                'classes': [],
                'functions': [],
                'constants': []
            }
            
            # Extract module docstring
            module_docstring = self.extract_docstring(tree)
            if module_docstring:
                file_info['module_docstring'] = self.parse_docstring(module_docstring)
            
            # Walk through AST nodes
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    class_info = {
                        'name': node.name,
                        'docstring': self.parse_docstring(self.extract_docstring(node) or ''),
                        'methods': [],
                        'line_number': node.lineno
                    }
                    
                    # Extract methods
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            method_info = {
                                'name': item.name,
                                'docstring': self.parse_docstring(self.extract_docstring(item) or ''),
                                'args': [arg.arg for arg in item.args.args],
                                'line_number': item.lineno,
                                'is_private': item.name.startswith('_'),
                                'is_property': any(isinstance(d, ast.Name) and d.id == 'property' 
                                                 for d in item.decorator_list)
                            }
                            class_info['methods'].append(method_info)
                    
                    file_info['classes'].append(class_info)
                
                elif isinstance(node, ast.FunctionDef) and not any(isinstance(parent, ast.ClassDef) 
                                                                  for parent in ast.walk(tree) 
                                                                  if hasattr(parent, 'body') and node in parent.body):
                    function_info = {
                        'name': node.name,
                        'docstring': self.parse_docstring(self.extract_docstring(node) or ''),
                        'args': [arg.arg for arg in node.args.args],
                        'line_number': node.lineno,
                        'is_private': node.name.startswith('_')
                    }
                    file_info['functions'].append(function_info)
                
                elif isinstance(node, ast.Assign):
                    # Extract module-level constants
                    for target in node.targets:
                        if isinstance(target, ast.Name) and target.id.isupper():
                            constant_info = {
                                'name': target.id,
                                'line_number': node.lineno,
                                'value': ast.unparse(node.value) if hasattr(ast, 'unparse') else str(node.value)
                            }
                            file_info['constants'].append(constant_info)
            
            return file_info
            
        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")
            return {'path': file_path, 'error': str(e)}
    
    def generate_package_docs(self, package_path: str) -> Dict[str, Any]:
        """Generate documentation for a Python package"""
        package_name = os.path.basename(package_path)
        package_info = {
            'name': package_name,
            'path': package_path,
            'modules': [],
            'subpackages': []
        }
        
        # Analyze __init__.py
        init_file = os.path.join(package_path, '__init__.py')
        if os.path.exists(init_file):
            package_info['init_module'] = self.analyze_python_file(init_file)
        
        # Find all Python files in the package
        for item in os.listdir(package_path):
            item_path = os.path.join(package_path, item)
            
            if os.path.isfile(item_path) and item.endswith('.py') and item != '__init__.py':
                module_info = self.analyze_python_file(item_path)
                module_info['module_name'] = item[:-3]  # Remove .py extension
                package_info['modules'].append(module_info)
            
            elif os.path.isdir(item_path) and os.path.exists(os.path.join(item_path, '__init__.py')):
                # Recursive analysis for subpackages
                subpackage_info = self.generate_package_docs(item_path)
                package_info['subpackages'].append(subpackage_info)
        
        return package_info
    
    def generate_documentation(self, repo_url_or_path: str) -> Dict[str, Any]:
        """Main method to generate complete API documentation"""
        try:
            # Determine if it's a URL or local path
            if repo_url_or_path.startswith(('http://', 'https://', 'git@')):
                root_path = self.clone_or_download_repo(repo_url_or_path)
                if not root_path:
                    return {'error': 'Failed to download repository'}
            else:
                root_path = repo_url_or_path
            
            if not os.path.exists(root_path):
                return {'error': f'Path does not exist: {root_path}'}
            
            # Find all Python packages
            packages = self.find_python_packages(root_path)
            
            documentation = {
                'repository': repo_url_or_path,
                'root_path': root_path,
                'packages': [],
                'generated_at': str(Path().absolute()),
                'total_packages': len(packages)
            }
            
            # Generate docs for each package
            for package_path in packages:
                package_docs = self.generate_package_docs(package_path)
                documentation['packages'].append(package_docs)
            
            return documentation
            
        except Exception as e:
            return {'error': f'Failed to generate documentation: {str(e)}'}
        
        finally:
            # Cleanup temporary directory
            if self.temp_dir and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
    
    def save_documentation(self, docs: Dict[str, Any], output_path: str):
        """Save documentation to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(docs, f, indent=2, ensure_ascii=False)

def main():
    if len(sys.argv) < 2:
        print("Usage: python api_doc_generator.py <repo_url_or_path> [output_file]")
        sys.exit(1)
    
    repo_url_or_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'api_docs.json'
    
    generator = APIDocGenerator()
    docs = generator.generate_documentation(repo_url_or_path)
    
    if 'error' in docs:
        print(f"Error: {docs['error']}")
        sys.exit(1)
    
    generator.save_documentation(docs, output_file)
    print(f"Documentation generated successfully: {output_file}")
    print(f"Found {docs['total_packages']} packages")

if __name__ == "__main__":
    main()
