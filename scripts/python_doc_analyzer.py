#!/usr/bin/env python3
"""
Python Documentation Analyzer
Analyzes local Python repositories and extracts comprehensive API documentation
from packages, modules, classes, functions, and their docstrings.
"""

import os
import ast
import json
import sys
import importlib.util
import inspect
import pkgutil
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Tuple
import re
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback

@dataclass
class DocParameter:
    """Represents a function/method parameter"""
    name: str
    type_hint: Optional[str] = None
    default_value: Optional[str] = None
    description: Optional[str] = None
    is_required: bool = True

@dataclass
class DocReturn:
    """Represents return information"""
    type_hint: Optional[str] = None
    description: Optional[str] = None

@dataclass
class DocException:
    """Represents exception information"""
    exception_type: str
    description: Optional[str] = None

@dataclass
class DocExample:
    """Represents a code example"""
    code: str
    description: Optional[str] = None
    output: Optional[str] = None

@dataclass
class ParsedDocstring:
    """Represents a parsed docstring with structured information"""
    summary: str = ""
    description: str = ""
    parameters: List[DocParameter] = None
    returns: Optional[DocReturn] = None
    raises: List[DocException] = None
    examples: List[DocExample] = None
    notes: List[str] = None
    see_also: List[str] = None
    attributes: List[DocParameter] = None
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = []
        if self.raises is None:
            self.raises = []
        if self.examples is None:
            self.examples = []
        if self.notes is None:
            self.notes = []
        if self.see_also is None:
            self.see_also = []
        if self.attributes is None:
            self.attributes = []

@dataclass
class FunctionDoc:
    """Represents documentation for a function or method"""
    name: str
    signature: str
    docstring: ParsedDocstring
    line_number: int
    is_async: bool = False
    is_property: bool = False
    is_classmethod: bool = False
    is_staticmethod: bool = False
    is_private: bool = False
    is_protected: bool = False
    decorators: List[str] = None
    source_file: str = ""
    
    def __post_init__(self):
        if self.decorators is None:
            self.decorators = []

@dataclass
class ClassDoc:
    """Represents documentation for a class"""
    name: str
    docstring: ParsedDocstring
    line_number: int
    methods: List[FunctionDoc] = None
    properties: List[FunctionDoc] = None
    class_variables: List[DocParameter] = None
    inheritance: List[str] = None
    is_abstract: bool = False
    source_file: str = ""
    
    def __post_init__(self):
        if self.methods is None:
            self.methods = []
        if self.properties is None:
            self.properties = []
        if self.class_variables is None:
            self.class_variables = []
        if self.inheritance is None:
            self.inheritance = []

@dataclass
class ModuleDoc:
    """Represents documentation for a module"""
    name: str
    file_path: str
    docstring: ParsedDocstring
    classes: List[ClassDoc] = None
    functions: List[FunctionDoc] = None
    constants: List[DocParameter] = None
    imports: List[str] = None
    submodules: List[str] = None
    
    def __post_init__(self):
        if self.classes is None:
            self.classes = []
        if self.functions is None:
            self.functions = []
        if self.constants is None:
            self.constants = []
        if self.imports is None:
            self.imports = []
        if self.submodules is None:
            self.submodules = []

@dataclass
class PackageDoc:
    """Represents documentation for a package"""
    name: str
    path: str
    docstring: ParsedDocstring
    modules: List[ModuleDoc] = None
    subpackages: List['PackageDoc'] = None
    version: Optional[str] = None
    author: Optional[str] = None
    license: Optional[str] = None
    
    def __post_init__(self):
        if self.modules is None:
            self.modules = []
        if self.subpackages is None:
            self.subpackages = []

class DocstringParser:
    """Parses docstrings in various formats (Google, NumPy, Sphinx)"""
    
    def __init__(self):
        self.google_sections = {
            'args': ['args', 'arguments', 'parameters', 'param', 'params'],
            'returns': ['returns', 'return', 'yields', 'yield'],
            'raises': ['raises', 'raise', 'except', 'exception', 'exceptions'],
            'examples': ['examples', 'example'],
            'note': ['note', 'notes'],
            'see_also': ['see also', 'seealso', 'see_also'],
            'attributes': ['attributes', 'attribute', 'attrs']
        }
    
    def parse(self, docstring: str) -> ParsedDocstring:
        """Parse a docstring and return structured information"""
        if not docstring:
            return ParsedDocstring()
        
        # Clean the docstring
        docstring = inspect.cleandoc(docstring)
        
        # Try different parsing strategies
        if self._is_google_style(docstring):
            return self._parse_google_style(docstring)
        elif self._is_numpy_style(docstring):
            return self._parse_numpy_style(docstring)
        elif self._is_sphinx_style(docstring):
            return self._parse_sphinx_style(docstring)
        else:
            return self._parse_plain_docstring(docstring)
    
    def _is_google_style(self, docstring: str) -> bool:
        """Check if docstring follows Google style"""
        google_keywords = ['Args:', 'Returns:', 'Yields:', 'Raises:', 'Examples:', 'Note:']
        return any(keyword in docstring for keyword in google_keywords)
    
    def _is_numpy_style(self, docstring: str) -> bool:
        """Check if docstring follows NumPy style"""
        numpy_pattern = r'^[A-Za-z\s]+\n-{3,}'
        return bool(re.search(numpy_pattern, docstring, re.MULTILINE))
    
    def _is_sphinx_style(self, docstring: str) -> bool:
        """Check if docstring follows Sphinx style"""
        sphinx_keywords = [':param', ':type', ':returns', ':rtype', ':raises']
        return any(keyword in docstring for keyword in sphinx_keywords)
    
    def _parse_google_style(self, docstring: str) -> ParsedDocstring:
        """Parse Google-style docstring"""
        lines = docstring.split('\n')
        parsed = ParsedDocstring()
        
        current_section = 'summary'
        current_content = []
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Check for section headers
            section_found = False
            for section_type, keywords in self.google_sections.items():
                if any(line.lower().startswith(f'{kw}:') for kw in keywords):
                    # Process previous section
                    if current_content:
                        self._process_section(parsed, current_section, current_content)
                    
                    current_section = section_type
                    current_content = []
                    section_found = True
                    break
            
            if not section_found:
                if line or current_content:  # Don't add empty lines at the start
                    current_content.append(line)
            
            i += 1
        
        # Process the last section
        if current_content:
            self._process_section(parsed, current_section, current_content)
        
        return parsed
    
    def _parse_numpy_style(self, docstring: str) -> ParsedDocstring:
        """Parse NumPy-style docstring"""
        sections = re.split(r'^([A-Za-z\s]+)\n-{3,}', docstring, flags=re.MULTILINE)
        parsed = ParsedDocstring()
        
        if sections:
            parsed.summary = sections[0].strip()
        
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                section_name = sections[i].strip().lower()
                section_content = sections[i + 1].strip().split('\n')
                
                if section_name in ['parameters', 'params', 'arguments']:
                    parsed.parameters = self._parse_parameters(section_content)
                elif section_name in ['returns', 'yields']:
                    parsed.returns = self._parse_returns(section_content)
                elif section_name in ['raises', 'exceptions']:
                    parsed.raises = self._parse_raises(section_content)
                elif section_name == 'examples':
                    parsed.examples = self._parse_examples(section_content)
        
        return parsed
    
    def _parse_sphinx_style(self, docstring: str) -> ParsedDocstring:
        """Parse Sphinx-style docstring"""
        lines = docstring.split('\n')
        parsed = ParsedDocstring()
        
        summary_lines = []
        i = 0
        
        # Extract summary
        while i < len(lines) and not lines[i].strip().startswith(':'):
            summary_lines.append(lines[i])
            i += 1
        
        parsed.summary = '\n'.join(summary_lines).strip()
        
        # Parse Sphinx directives
        while i < len(lines):
            line = lines[i].strip()
            
            if line.startswith(':param'):
                param_match = re.match(r':param\s+(\w+):\s*(.*)', line)
                if param_match:
                    param_name, param_desc = param_match.groups()
                    parsed.parameters.append(DocParameter(name=param_name, description=param_desc))
            
            elif line.startswith(':returns:') or line.startswith(':return:'):
                return_desc = line.split(':', 2)[-1].strip()
                parsed.returns = DocReturn(description=return_desc)
            
            elif line.startswith(':raises'):
                raise_match = re.match(r':raises\s+(\w+):\s*(.*)', line)
                if raise_match:
                    exc_type, exc_desc = raise_match.groups()
                    parsed.raises.append(DocException(exception_type=exc_type, description=exc_desc))
            
            i += 1
        
        return parsed
    
    def _parse_plain_docstring(self, docstring: str) -> ParsedDocstring:
        """Parse plain docstring without specific format"""
        lines = docstring.split('\n')
        
        # First non-empty line is summary
        summary = ""
        description_lines = []
        
        for line in lines:
            if not summary and line.strip():
                summary = line.strip()
            elif line.strip():
                description_lines.append(line)
        
        return ParsedDocstring(
            summary=summary,
            description='\n'.join(description_lines).strip()
        )
    
    def _process_section(self, parsed: ParsedDocstring, section: str, content: List[str]):
        """Process a section of the docstring"""
        content_text = '\n'.join(content).strip()
        
        if section == 'summary':
            lines = content_text.split('\n')
            if lines:
                parsed.summary = lines[0].strip()
                if len(lines) > 1:
                    parsed.description = '\n'.join(lines[1:]).strip()
        elif section == 'args':
            parsed.parameters = self._parse_parameters(content)
        elif section == 'returns':
            parsed.returns = self._parse_returns(content)
        elif section == 'raises':
            parsed.raises = self._parse_raises(content)
        elif section == 'examples':
            parsed.examples = self._parse_examples(content)
        elif section == 'note':
            parsed.notes = [content_text]
        elif section == 'see_also':
            parsed.see_also = [item.strip() for item in content_text.split(',')]
        elif section == 'attributes':
            parsed.attributes = self._parse_parameters(content)
    
    def _parse_parameters(self, lines: List[str]) -> List[DocParameter]:
        """Parse parameter descriptions"""
        parameters = []
        current_param = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if this is a new parameter
            param_match = re.match(r'^(\w+)(?:\s*$$([^)]+)$$)?\s*:\s*(.*)', line)
            if param_match:
                if current_param:
                    parameters.append(current_param)
                
                param_name, param_type, param_desc = param_match.groups()
                current_param = DocParameter(
                    name=param_name,
                    type_hint=param_type,
                    description=param_desc
                )
            elif current_param and line:
                # Continuation of previous parameter description
                current_param.description += f" {line}"
        
        if current_param:
            parameters.append(current_param)
        
        return parameters
    
    def _parse_returns(self, lines: List[str]) -> Optional[DocReturn]:
        """Parse return description"""
        content = '\n'.join(lines).strip()
        if not content:
            return None
        
        # Try to extract type and description
        type_match = re.match(r'^([^:]+):\s*(.*)', content)
        if type_match:
            return_type, return_desc = type_match.groups()
            return DocReturn(type_hint=return_type.strip(), description=return_desc.strip())
        else:
            return DocReturn(description=content)
    
    def _parse_raises(self, lines: List[str]) -> List[DocException]:
        """Parse exception descriptions"""
        exceptions = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            exc_match = re.match(r'^(\w+):\s*(.*)', line)
            if exc_match:
                exc_type, exc_desc = exc_match.groups()
                exceptions.append(DocException(exception_type=exc_type, description=exc_desc))
            else:
                # If no type specified, assume generic Exception
                exceptions.append(DocException(exception_type="Exception", description=line))
        
        return exceptions
    
    def _parse_examples(self, lines: List[str]) -> List[DocExample]:
        """Parse code examples"""
        examples = []
        current_example = []
        in_code_block = False
        
        for line in lines:
            if line.strip().startswith('>>>') or line.strip().startswith('...'):
                in_code_block = True
                current_example.append(line)
            elif in_code_block and (line.strip() == '' or line.startswith('    ')):
                current_example.append(line)
            else:
                if current_example:
                    examples.append(DocExample(code='\n'.join(current_example)))
                    current_example = []
                in_code_block = False
        
        if current_example:
            examples.append(DocExample(code='\n'.join(current_example)))
        
        return examples

class PythonDocAnalyzer:
    """Main analyzer class for Python documentation extraction"""
    
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()
        self.docstring_parser = DocstringParser()
        self.analyzed_files = set()
        
    def analyze_repository(self) -> Dict[str, Any]:
        """Analyze the entire repository and extract documentation"""
        if not self.repo_path.exists():
            raise FileNotFoundError(f"Repository path does not exist: {self.repo_path}")
        
        packages = self._find_python_packages()
        
        documentation = {
            'repository_path': str(self.repo_path),
            'analyzed_at': datetime.now().isoformat(),
            'total_packages': len(packages),
            'packages': [asdict(pkg) for pkg in packages],
            'summary': self._generate_summary(packages)
        }
        
        return documentation
    
    def _find_python_packages(self) -> List[PackageDoc]:
        """Find all Python packages in the repository"""
        packages = []
        
        for root, dirs, files in os.walk(self.repo_path):
            # Skip hidden directories and common non-package directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules', '.git']]
            
            if '__init__.py' in files:
                package_path = Path(root)
                try:
                    package_doc = self._analyze_package(package_path)
                    packages.append(package_doc)
                except Exception as e:
                    print(f"Error analyzing package {package_path}: {e}")
                    continue
        
        return packages
    
    def _analyze_package(self, package_path: Path) -> PackageDoc:
        """Analyze a single Python package"""
        package_name = package_path.name
        init_file = package_path / '__init__.py'
        
        # Parse __init__.py for package-level documentation
        package_docstring = ParsedDocstring()
        version = None
        author = None
        license = None
        
        if init_file.exists():
            try:
                with open(init_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                tree = ast.parse(content)
                
                # Extract module docstring
                if (tree.body and isinstance(tree.body[0], ast.Expr) and 
                    isinstance(tree.body[0].value, ast.Constant) and 
                    isinstance(tree.body[0].value.value, str)):
                    package_docstring = self.docstring_parser.parse(tree.body[0].value.value)
                
                # Extract package metadata
                for node in ast.walk(tree):
                    if isinstance(node, ast.Assign):
                        for target in node.targets:
                            if isinstance(target, ast.Name):
                                if target.id == '__version__' and isinstance(node.value, ast.Constant):
                                    version = str(node.value.value)
                                elif target.id == '__author__' and isinstance(node.value, ast.Constant):
                                    author = str(node.value.value)
                                elif target.id == '__license__' and isinstance(node.value, ast.Constant):
                                    license = str(node.value.value)
                
            except Exception as e:
                print(f"Error parsing {init_file}: {e}")
        
        # Find modules and subpackages
        modules = []
        subpackages = []
        
        for item in package_path.iterdir():
            if item.is_file() and item.suffix == '.py' and item.name != '__init__.py':
                try:
                    module_doc = self._analyze_module(item)
                    modules.append(module_doc)
                except Exception as e:
                    print(f"Error analyzing module {item}: {e}")
                    continue
            
            elif item.is_dir() and (item / '__init__.py').exists():
                try:
                    subpackage_doc = self._analyze_package(item)
                    subpackages.append(subpackage_doc)
                except Exception as e:
                    print(f"Error analyzing subpackage {item}: {e}")
                    continue
        
        return PackageDoc(
            name=package_name,
            path=str(package_path),
            docstring=package_docstring,
            modules=modules,
            subpackages=subpackages,
            version=version,
            author=author,
            license=license
        )
    
    def _analyze_module(self, module_path: Path) -> ModuleDoc:
        """Analyze a single Python module"""
        module_name = module_path.stem
        
        try:
            with open(module_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {module_path}: {e}")
            return ModuleDoc(name=module_name, file_path=str(module_path), docstring=ParsedDocstring())
        
        try:
            tree = ast.parse(content)
        except SyntaxError as e:
            print(f"Syntax error in {module_path}: {e}")
            return ModuleDoc(name=module_name, file_path=str(module_path), docstring=ParsedDocstring())
        
        # Extract module docstring
        module_docstring = ParsedDocstring()
        if (tree.body and isinstance(tree.body[0], ast.Expr) and 
            isinstance(tree.body[0].value, ast.Constant) and 
            isinstance(tree.body[0].value.value, str)):
            module_docstring = self.docstring_parser.parse(tree.body[0].value.value)
        
        # Extract classes, functions, and constants
        classes = []
        functions = []
        constants = []
        imports = []
        
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                class_doc = self._analyze_class(node, str(module_path))
                classes.append(class_doc)
            
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_doc = self._analyze_function(node, str(module_path))
                functions.append(func_doc)
            
            elif isinstance(node, ast.Assign):
                constants.extend(self._analyze_constants(node))
            
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                imports.extend(self._analyze_imports(node))
        
        return ModuleDoc(
            name=module_name,
            file_path=str(module_path),
            docstring=module_docstring,
            classes=classes,
            functions=functions,
            constants=constants,
            imports=imports
        )
    
    def _analyze_class(self, node: ast.ClassDef, source_file: str) -> ClassDoc:
        """Analyze a class definition"""
        # Extract class docstring
        class_docstring = ParsedDocstring()
        if (node.body and isinstance(node.body[0], ast.Expr) and 
            isinstance(node.body[0].value, ast.Constant) and 
            isinstance(node.body[0].value.value, str)):
            class_docstring = self.docstring_parser.parse(node.body[0].value.value)
        
        # Extract inheritance
        inheritance = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                inheritance.append(base.id)
            elif isinstance(base, ast.Attribute):
                inheritance.append(ast.unparse(base))
        
        # Extract methods and properties
        methods = []
        properties = []
        class_variables = []
        
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_doc = self._analyze_function(item, source_file, is_method=True)
                
                if func_doc.is_property:
                    properties.append(func_doc)
                else:
                    methods.append(func_doc)
            
            elif isinstance(item, ast.Assign):
                # Class variables
                for target in item.targets:
                    if isinstance(target, ast.Name):
                        var_name = target.id
                        var_value = ast.unparse(item.value) if hasattr(ast, 'unparse') else str(item.value)
                        class_variables.append(DocParameter(name=var_name, default_value=var_value))
        
        # Check if class is abstract
        is_abstract = any(
            isinstance(decorator, ast.Name) and decorator.id == 'abstractmethod'
            for method in methods
            for decorator in getattr(method, 'decorators', [])
        )
        
        return ClassDoc(
            name=node.name,
            docstring=class_docstring,
            line_number=node.lineno,
            methods=methods,
            properties=properties,
            class_variables=class_variables,
            inheritance=inheritance,
            is_abstract=is_abstract,
            source_file=source_file
        )
    
    def _analyze_function(self, node: Union[ast.FunctionDef, ast.AsyncFunctionDef], 
                         source_file: str, is_method: bool = False) -> FunctionDoc:
        """Analyze a function or method definition"""
        # Extract function docstring
        func_docstring = ParsedDocstring()
        if (node.body and isinstance(node.body[0], ast.Expr) and 
            isinstance(node.body[0].value, ast.Constant) and 
            isinstance(node.body[0].value.value, str)):
            func_docstring = self.docstring_parser.parse(node.body[0].value.value)
        
        # Generate function signature
        signature = self._generate_signature(node)
        
        # Extract decorators
        decorators = []
        is_property = False
        is_classmethod = False
        is_staticmethod = False
        
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Name):
                decorator_name = decorator.id
                decorators.append(decorator_name)
                
                if decorator_name == 'property':
                    is_property = True
                elif decorator_name == 'classmethod':
                    is_classmethod = True
                elif decorator_name == 'staticmethod':
                    is_staticmethod = True
        
        # Determine privacy level
        is_private = node.name.startswith('__') and not node.name.endswith('__')
        is_protected = node.name.startswith('_') and not is_private
        
        return FunctionDoc(
            name=node.name,
            signature=signature,
            docstring=func_docstring,
            line_number=node.lineno,
            is_async=isinstance(node, ast.AsyncFunctionDef),
            is_property=is_property,
            is_classmethod=is_classmethod,
            is_staticmethod=is_staticmethod,
            is_private=is_private,
            is_protected=is_protected,
            decorators=decorators,
            source_file=source_file
        )
    
    def _generate_signature(self, node: Union[ast.FunctionDef, ast.AsyncFunctionDef]) -> str:
        """Generate function signature string"""
        args = []
        
        # Regular arguments
        for arg in node.args.args:
            arg_str = arg.arg
            if arg.annotation:
                arg_str += f": {ast.unparse(arg.annotation)}"
            args.append(arg_str)
        
        # Default arguments
        defaults = node.args.defaults
        if defaults:
            num_defaults = len(defaults)
            for i, default in enumerate(defaults):
                arg_index = len(args) - num_defaults + i
                if arg_index >= 0:
                    args[arg_index] += f" = {ast.unparse(default)}"
        
        # *args
        if node.args.vararg:
            vararg = f"*{node.args.vararg.arg}"
            if node.args.vararg.annotation:
                vararg += f": {ast.unparse(node.args.vararg.annotation)}"
            args.append(vararg)
        
        # **kwargs
        if node.args.kwarg:
            kwarg = f"**{node.args.kwarg.arg}"
            if node.args.kwarg.annotation:
                kwarg += f": {ast.unparse(node.args.kwarg.annotation)}"
            args.append(kwarg)
        
        signature = f"{node.name}({', '.join(args)})"
        
        # Return annotation
        if node.returns:
            signature += f" -> {ast.unparse(node.returns)}"
        
        return signature
    
    def _analyze_constants(self, node: ast.Assign) -> List[DocParameter]:
        """Analyze module-level constants"""
        constants = []
        
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id.isupper():
                const_name = target.id
                const_value = ast.unparse(node.value) if hasattr(ast, 'unparse') else str(node.value)
                constants.append(DocParameter(name=const_name, default_value=const_value))
        
        return constants
    
    def _analyze_imports(self, node: Union[ast.Import, ast.ImportFrom]) -> List[str]:
        """Analyze import statements"""
        imports = []
        
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ''
            for alias in node.names:
                if alias.name == '*':
                    imports.append(f"from {module} import *")
                else:
                    imports.append(f"from {module} import {alias.name}")
        
        return imports
    
    def _generate_summary(self, packages: List[PackageDoc]) -> Dict[str, Any]:
        """Generate a summary of the analyzed documentation"""
        total_modules = sum(len(pkg.modules) for pkg in packages)
        total_classes = sum(len(module.classes) for pkg in packages for module in pkg.modules)
        total_functions = sum(len(module.functions) for pkg in packages for module in pkg.modules)
        total_methods = sum(
            len(cls.methods) + len(cls.properties) 
            for pkg in packages 
            for module in pkg.modules 
            for cls in module.classes
        )
        
        return {
            'total_packages': len(packages),
            'total_modules': total_modules,
            'total_classes': total_classes,
            'total_functions': total_functions,
            'total_methods': total_methods,
            'package_names': [pkg.name for pkg in packages]
        }

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description='Analyze Python repository for API documentation')
    parser.add_argument('repo_path', help='Path to the Python repository')
    parser.add_argument('-o', '--output', help='Output JSON file path', default='python_docs.json')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose output')
    parser.add_argument('--format', choices=['json', 'markdown'], default='json', 
                       help='Output format (json or markdown)')
    
    args = parser.parse_args()
    
    try:
        analyzer = PythonDocAnalyzer(args.repo_path)
        
        if args.verbose:
            print(f"Analyzing repository: {args.repo_path}")
        
        documentation = analyzer.analyze_repository()
        
        if args.format == 'json':
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(documentation, f, indent=2, ensure_ascii=False)
            
            if args.verbose:
                print(f"Documentation saved to: {args.output}")
                print(f"Summary: {documentation['summary']}")
        
        elif args.format == 'markdown':
            markdown_output = generate_markdown_docs(documentation)
            markdown_file = args.output.replace('.json', '.md')
            
            with open(markdown_file, 'w', encoding='utf-8') as f:
                f.write(markdown_output)
            
            if args.verbose:
                print(f"Markdown documentation saved to: {markdown_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        if args.verbose:
            traceback.print_exc()
        sys.exit(1)

def generate_markdown_docs(documentation: Dict[str, Any]) -> str:
    """Generate markdown documentation from the analysis results"""
    md_lines = []
    
    # Header
    md_lines.append(f"# API Documentation")
    md_lines.append(f"")
    md_lines.append(f"**Repository:** {documentation['repository_path']}")
    md_lines.append(f"**Generated:** {documentation['analyzed_at']}")
    md_lines.append(f"")
    
    # Summary
    summary = documentation['summary']
    md_lines.append(f"## Summary")
    md_lines.append(f"")
    md_lines.append(f"- **Packages:** {summary['total_packages']}")
    md_lines.append(f"- **Modules:** {summary['total_modules']}")
    md_lines.append(f"- **Classes:** {summary['total_classes']}")
    md_lines.append(f"- **Functions:** {summary['total_functions']}")
    md_lines.append(f"- **Methods:** {summary['total_methods']}")
    md_lines.append(f"")
    
    # Packages
    for package in documentation['packages']:
        md_lines.append(f"## Package: {package['name']}")
        md_lines.append(f"")
        
        if package['docstring']['summary']:
            md_lines.append(f"{package['docstring']['summary']}")
            md_lines.append(f"")
        
        if package['version']:
            md_lines.append(f"**Version:** {package['version']}")
        if package['author']:
            md_lines.append(f"**Author:** {package['author']}")
        if package['license']:
            md_lines.append(f"**License:** {package['license']}")
        
        md_lines.append(f"")
        
        # Modules
        for module in package['modules']:
            md_lines.append(f"### Module: {module['name']}")
            md_lines.append(f"")
            
            if module['docstring']['summary']:
                md_lines.append(f"{module['docstring']['summary']}")
                md_lines.append(f"")
            
            # Classes
            for cls in module['classes']:
                md_lines.append(f"#### Class: {cls['name']}")
                md_lines.append(f"")
                
                if cls['docstring']['summary']:
                    md_lines.append(f"{cls['docstring']['summary']}")
                    md_lines.append(f"")
                
                if cls['inheritance']:
                    md_lines.append(f"**Inherits from:** {', '.join(cls['inheritance'])}")
                    md_lines.append(f"")
                
                # Methods
                for method in cls['methods']:
                    md_lines.append(f"##### {method['name']}")
                    md_lines.append(f"")
                    md_lines.append(f"```python")
                    md_lines.append(f"{method['signature']}")
                    md_lines.append(f"```")
                    md_lines.append(f"")
                    
                    if method['docstring']['summary']:
                        md_lines.append(f"{method['docstring']['summary']}")
                        md_lines.append(f"")
            
            # Functions
            for func in module['functions']:
                md_lines.append(f"#### Function: {func['name']}")
                md_lines.append(f"")
                md_lines.append(f"```python")
                md_lines.append(f"{func['signature']}")
                md_lines.append(f"```")
                md_lines.append(f"")
                
                if func['docstring']['summary']:
                    md_lines.append(f"{func['docstring']['summary']}")
                    md_lines.append(f"")
    
    return '\n'.join(md_lines)

if __name__ == '__main__':
    main()
