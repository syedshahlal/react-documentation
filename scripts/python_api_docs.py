#!/usr/bin/env python3
"""
Complete Python API Documentation Generator
A single script that analyzes Python repositories and generates MDX documentation
with interactive components, following imports to extract complete API information.
"""

import os
import ast
import json
import sys
import inspect
import argparse
import importlib
import importlib.util
import types
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Set, Tuple
import re
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback
import warnings

# Suppress warnings during import analysis
warnings.filterwarnings('ignore')

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
class ImportedAPI:
    """Represents an imported API element"""
    name: str
    module_path: str
    type: str  # 'function', 'class', 'module', 'constant'
    docstring: ParsedDocstring
    signature: Optional[str] = None
    source_location: Optional[str] = None
    is_builtin: bool = False
    methods: List['FunctionDoc'] = None
    attributes: List[DocParameter] = None
    
    def __post_init__(self):
        if self.methods is None:
            self.methods = []
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
    imported_apis: List[ImportedAPI] = None
    submodules: List[str] = None
    
    def __post_init__(self):
        if self.classes is None:
            self.classes = []
        if self.functions is None:
            self.functions = []
        if self.constants is None:
            self.constants = []
        if self.imported_apis is None:
            self.imported_apis = []
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

class ImportAnalyzer:
    """Analyzes and follows imports to extract API documentation"""
    
    def __init__(self, repo_path: str, max_depth: int = 3):
        self.repo_path = Path(repo_path).resolve()
        self.max_depth = max_depth
        self.analyzed_modules: Set[str] = set()
        self.docstring_parser = DocstringParser()
        
        # Add repo path to sys.path for imports
        if str(self.repo_path) not in sys.path:
            sys.path.insert(0, str(self.repo_path))
    
    def analyze_imports(self, import_nodes: List[Union[ast.Import, ast.ImportFrom]], 
                       current_module_path: str) -> List[ImportedAPI]:
        """Analyze import statements and extract API documentation"""
        imported_apis = []
        
        for node in import_nodes:
            try:
                if isinstance(node, ast.Import):
                    imported_apis.extend(self._analyze_import(node, current_module_path))
                elif isinstance(node, ast.ImportFrom):
                    imported_apis.extend(self._analyze_import_from(node, current_module_path))
            except Exception as e:
                # Continue on import errors
                continue
        
        return imported_apis
    
    def _analyze_import(self, node: ast.Import, current_module_path: str) -> List[ImportedAPI]:
        """Analyze 'import module' statements"""
        imported_apis = []
        
        for alias in node.names:
            module_name = alias.name
            
            try:
                module = self._safe_import_module(module_name)
                if module:
                    api = self._extract_module_api(module, module_name)
                    if api:
                        imported_apis.append(api)
            except Exception:
                continue
        
        return imported_apis
    
    def _analyze_import_from(self, node: ast.ImportFrom, current_module_path: str) -> List[ImportedAPI]:
        """Analyze 'from module import name' statements"""
        imported_apis = []
        
        if not node.module:
            return imported_apis
        
        module_name = node.module
        
        try:
            module = self._safe_import_module(module_name)
            if not module:
                return imported_apis
            
            for alias in node.names:
                import_name = alias.name
                
                if import_name == '*':
                    # Handle 'from module import *'
                    api = self._extract_module_api(module, module_name)
                    if api:
                        imported_apis.append(api)
                else:
                    # Handle specific imports
                    try:
                        obj = getattr(module, import_name, None)
                        if obj:
                            api = self._extract_object_api(obj, import_name, module_name)
                            if api:
                                imported_apis.append(api)
                    except Exception:
                        continue
        
        except Exception:
            pass
        
        return imported_apis
    
    def _safe_import_module(self, module_name: str) -> Optional[types.ModuleType]:
        """Safely import a module"""
        if module_name in self.analyzed_modules:
            return None
        
        self.analyzed_modules.add(module_name)
        
        try:
            # Try standard import first
            return importlib.import_module(module_name)
        except ImportError:
            try:
                # Try importing from current package
                spec = importlib.util.find_spec(module_name)
                if spec and spec.origin:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    return module
            except Exception:
                pass
        
        return None
    
    def _extract_module_api(self, module: types.ModuleType, module_name: str) -> Optional[ImportedAPI]:
        """Extract API documentation from a module"""
        try:
            docstring = inspect.getdoc(module) or ""
            parsed_docstring = self.docstring_parser.parse(docstring)
            
            # Get module location
            source_location = None
            try:
                source_location = inspect.getfile(module)
            except (TypeError, OSError):
                pass
            
            # Check if it's a builtin module
            is_builtin = hasattr(module, '__file__') and module.__file__ is None
            
            return ImportedAPI(
                name=module_name,
                module_path=module_name,
                type='module',
                docstring=parsed_docstring,
                source_location=source_location,
                is_builtin=is_builtin
            )
        
        except Exception:
            return None
    
    def _extract_object_api(self, obj: Any, obj_name: str, module_name: str) -> Optional[ImportedAPI]:
        """Extract API documentation from an imported object"""
        try:
            obj_type = self._get_object_type(obj)
            docstring = inspect.getdoc(obj) or ""
            parsed_docstring = self.docstring_parser.parse(docstring)
            
            # Get signature for functions and methods
            signature = None
            if obj_type in ['function', 'method']:
                try:
                    sig = inspect.signature(obj)
                    signature = f"{obj_name}{sig}"
                except (ValueError, TypeError):
                    signature = f"{obj_name}(...)"
            
            # Get source location
            source_location = None
            try:
                source_location = inspect.getfile(obj)
            except (TypeError, OSError):
                pass
            
            # For classes, extract methods and attributes
            methods = []
            attributes = []
            
            if obj_type == 'class':
                methods = self._extract_class_methods(obj)
                attributes = self._extract_class_attributes(obj)
            
            return ImportedAPI(
                name=obj_name,
                module_path=module_name,
                type=obj_type,
                docstring=parsed_docstring,
                signature=signature,
                source_location=source_location,
                is_builtin=source_location is None,
                methods=methods,
                attributes=attributes
            )
        
        except Exception:
            return None
    
    def _get_object_type(self, obj: Any) -> str:
        """Determine the type of an object"""
        if inspect.isclass(obj):
            return 'class'
        elif inspect.isfunction(obj) or inspect.ismethod(obj):
            return 'function'
        elif inspect.ismodule(obj):
            return 'module'
        elif isinstance(obj, (int, float, str, bool, list, dict, tuple)):
            return 'constant'
        else:
            return 'object'
    
    def _extract_class_methods(self, cls: type) -> List[FunctionDoc]:
        """Extract methods from a class"""
        methods = []
        
        try:
            for name, method in inspect.getmembers(cls, predicate=inspect.isfunction):
                if name.startswith('_') and not name.startswith('__'):
                    continue  # Skip private methods for brevity
                
                try:
                    docstring = inspect.getdoc(method) or ""
                    parsed_docstring = self.docstring_parser.parse(docstring)
                    
                    # Get signature
                    try:
                        sig = inspect.signature(method)
                        signature = f"{name}{sig}"
                    except (ValueError, TypeError):
                        signature = f"{name}(...)"
                    
                    method_doc = FunctionDoc(
                        name=name,
                        signature=signature,
                        docstring=parsed_docstring,
                        line_number=0,
                        is_private=name.startswith('__') and name.endswith('__'),
                        is_protected=name.startswith('_') and not name.startswith('__')
                    )
                    
                    methods.append(method_doc)
                
                except Exception:
                    continue
        
        except Exception:
            pass
        
        return methods[:10]  # Limit to first 10 methods for performance
    
    def _extract_class_attributes(self, cls: type) -> List[DocParameter]:
        """Extract attributes from a class"""
        attributes = []
        
        try:
            for name in dir(cls):
                if name.startswith('_'):
                    continue
                
                try:
                    attr = getattr(cls, name)
                    if not callable(attr):
                        attr_type = type(attr).__name__
                        attr_value = str(attr) if len(str(attr)) < 100 else f"{str(attr)[:100]}..."
                        
                        attributes.append(DocParameter(
                            name=name,
                            type_hint=attr_type,
                            default_value=attr_value
                        ))
                
                except Exception:
                    continue
        
        except Exception:
            pass
        
        return attributes[:10]  # Limit for performance

class PythonDocAnalyzer:
    """Main analyzer class for Python documentation extraction"""
    
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()
        self.docstring_parser = DocstringParser()
        self.import_analyzer = ImportAnalyzer(str(repo_path))
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
        
        # Extract classes, functions, constants, and imports
        classes = []
        functions = []
        constants = []
        import_nodes = []
        
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
                import_nodes.append(node)
        
        # Analyze imports and extract API documentation
        imported_apis = self.import_analyzer.analyze_imports(import_nodes, str(module_path))
        
        return ModuleDoc(
            name=module_name,
            file_path=str(module_path),
            docstring=module_docstring,
            classes=classes,
            functions=functions,
            constants=constants,
            imported_apis=imported_apis
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
            'abstractmethod' in getattr(method, 'decorators', [])
            for method in methods
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
        total_imported_apis = sum(
            len(module.imported_apis) 
            for pkg in packages 
            for module in pkg.modules
        )
        
        return {
            'total_packages': len(packages),
            'total_modules': total_modules,
            'total_classes': total_classes,
            'total_functions': total_functions,
            'total_methods': total_methods,
            'total_imported_apis': total_imported_apis,
            'package_names': [pkg.name for pkg in packages]
        }

def generate_mdx_docs(documentation: Dict[str, Any]) -> str:
    """Generate MDX documentation from the analysis results"""
    mdx_lines = []
    
    # MDX Header with metadata
    mdx_lines.append("---")
    mdx_lines.append(f"title: 'API Documentation'")
    mdx_lines.append(f"description: 'Auto-generated Python API documentation with imported APIs'")
    mdx_lines.append(f"generated_at: '{documentation['analyzed_at']}'")
    mdx_lines.append(f"repository: '{documentation['repository_path']}'")
    mdx_lines.append("---")
    mdx_lines.append("")
    
    # Import statements for MDX components
    mdx_lines.append("import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'")
    mdx_lines.append("import { Badge } from '@/components/ui/badge'")
    mdx_lines.append("import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'")
    mdx_lines.append("import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'")
    mdx_lines.append("import { Alert, AlertDescription } from '@/components/ui/alert'")
    mdx_lines.append("")
    
    # Title and description
    mdx_lines.append(f"# 🐍 Python API Documentation")
    mdx_lines.append("")
    mdx_lines.append(f"<Alert>")
    mdx_lines.append(f"  <AlertDescription>")
    mdx_lines.append(f"    **Repository:** `{documentation['repository_path']}`<br/>")
    mdx_lines.append(f"    **Generated:** {documentation['analyzed_at']}")
    mdx_lines.append(f"  </AlertDescription>")
    mdx_lines.append(f"</Alert>")
    mdx_lines.append("")
    
    # Summary section
    summary = documentation['summary']
    mdx_lines.append("## 📊 Overview")
    mdx_lines.append("")
    mdx_lines.append("<div className='grid grid-cols-2 md:grid-cols-6 gap-4 mb-6'>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-blue-600'>{summary['total_packages']}</div><div className='text-sm text-muted-foreground'>Packages</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-green-600'>{summary['total_modules']}</div><div className='text-sm text-muted-foreground'>Modules</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-purple-600'>{summary['total_classes']}</div><div className='text-sm text-muted-foreground'>Classes</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-orange-600'>{summary['total_functions']}</div><div className='text-sm text-muted-foreground'>Functions</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-red-600'>{summary['total_methods']}</div><div className='text-sm text-muted-foreground'>Methods</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-indigo-600'>{summary['total_imported_apis']}</div><div className='text-sm text-muted-foreground'>Imported APIs</div></CardContent></Card>")
    mdx_lines.append("</div>")
    mdx_lines.append("")
    
    # Package list
    if summary['package_names']:
        mdx_lines.append("### 📦 Discovered Packages")
        mdx_lines.append("")
        mdx_lines.append("<div className='flex flex-wrap gap-2 mb-6'>")
        for pkg_name in summary['package_names']:
            mdx_lines.append(f"  <Badge variant='outline'>{pkg_name}</Badge>")
        mdx_lines.append("</div>")
        mdx_lines.append("")
    
    # Packages documentation
    mdx_lines.append("## 📚 API Reference")
    mdx_lines.append("")
    
    for package in documentation['packages']:
        mdx_lines.append(f"### Package: `{package['name']}`")
        mdx_lines.append("")
        
        # Package info card
        mdx_lines.append("<Card className='mb-6'>")
        mdx_lines.append("  <CardHeader>")
        mdx_lines.append(f"    <CardTitle className='flex items-center gap-2'>")
        mdx_lines.append(f"      📦 {package['name']}")
        if package['version']:
            mdx_lines.append(f"      <Badge>{package['version']}</Badge>")
        mdx_lines.append(f"    </CardTitle>")
        
        if package['docstring']['summary']:
            mdx_lines.append(f"    <CardDescription>{_escape_mdx(package['docstring']['summary'])}</CardDescription>")
        
        mdx_lines.append("  </CardHeader>")
        
        if package['author'] or package['license'] or package['docstring']['description']:
            mdx_lines.append("  <CardContent>")
            
            if package['docstring']['description']:
                mdx_lines.append(f"    <p className='mb-4'>{_escape_mdx(package['docstring']['description'])}</p>")
            
            if package['author'] or package['license']:
                mdx_lines.append("    <div className='flex gap-4 text-sm text-muted-foreground'>")
                if package['author']:
                    mdx_lines.append(f"      <span>**Author:** {package['author']}</span>")
                if package['license']:
                    mdx_lines.append(f"      <span>**License:** {package['license']}</span>")
                mdx_lines.append("    </div>")
            
            mdx_lines.append("  </CardContent>")
        
        mdx_lines.append("</Card>")
        mdx_lines.append("")
        
        # Modules with enhanced tabs including imported APIs
        if package['modules']:
            mdx_lines.append("<Tabs defaultValue='modules' className='mb-8'>")
            mdx_lines.append("  <TabsList>")
            mdx_lines.append("    <TabsTrigger value='modules'>Modules</TabsTrigger>")
            if any(module['classes'] for module in package['modules']):
                mdx_lines.append("    <TabsTrigger value='classes'>Classes</TabsTrigger>")
            if any(module['functions'] for module in package['modules']):
                mdx_lines.append("    <TabsTrigger value='functions'>Functions</TabsTrigger>")
            if any(module['imported_apis'] for module in package['modules']):
                mdx_lines.append("    <TabsTrigger value='imported-apis'>📦 Imported APIs</TabsTrigger>")
            mdx_lines.append("  </TabsList>")
            mdx_lines.append("")
            
            # Modules tab
            mdx_lines.append("  <TabsContent value='modules'>")
            mdx_lines.append("    <Accordion type='single' collapsible>")
            
            for i, module in enumerate(package['modules']):
                mdx_lines.append(f"      <AccordionItem value='module-{i}'>")
                mdx_lines.append(f"        <AccordionTrigger>")
                mdx_lines.append(f"          <div className='flex items-center gap-2'>")
                mdx_lines.append(f"            📄 <code>{module['name']}.py</code>")
                mdx_lines.append(f"            <div className='flex gap-1'>")
                if module['classes']:
                    mdx_lines.append(f"              <Badge variant='secondary' className='text-xs'>{len(module['classes'])} classes</Badge>")
                if module['functions']:
                    mdx_lines.append(f"              <Badge variant='secondary' className='text-xs'>{len(module['functions'])} functions</Badge>")
                if module['imported_apis']:
                    mdx_lines.append(f"              <Badge variant='secondary' className='text-xs'>{len(module['imported_apis'])} imports</Badge>")
                mdx_lines.append(f"            </div>")
                mdx_lines.append(f"          </div>")
                mdx_lines.append(f"        </AccordionTrigger>")
                mdx_lines.append(f"        <AccordionContent>")
                
                if module['docstring']['summary']:
                    mdx_lines.append(f"          <p className='mb-4'>{_escape_mdx(module['docstring']['summary'])}</p>")
                
                # Module content summary
                if module['classes'] or module['functions'] or module['imported_apis']:
                    mdx_lines.append("          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>")
                    
                    if module['classes']:
                        mdx_lines.append("            <div>")
                        mdx_lines.append("              <h5 className='font-semibold mb-2'>Classes</h5>")
                        mdx_lines.append("              <ul className='space-y-1'>")
                        for cls in module['classes'][:5]:
                            mdx_lines.append(f"                <li><code>{cls['name']}</code></li>")
                        if len(module['classes']) > 5:
                            mdx_lines.append(f"                <li className='text-sm text-muted-foreground'>... +{len(module['classes']) - 5} more</li>")
                        mdx_lines.append("              </ul>")
                        mdx_lines.append("            </div>")
                    
                    if module['functions']:
                        mdx_lines.append("            <div>")
                        mdx_lines.append("              <h5 className='font-semibold mb-2'>Functions</h5>")
                        mdx_lines.append("              <ul className='space-y-1'>")
                        for func in module['functions'][:5]:
                            mdx_lines.append(f"                <li><code>{func['name']}()</code></li>")
                        if len(module['functions']) > 5:
                            mdx_lines.append(f"                <li className='text-sm text-muted-foreground'>... +{len(module['functions']) - 5} more</li>")
                        mdx_lines.append("              </ul>")
                        mdx_lines.append("            </div>")
                    
                    if module['imported_apis']:
                        mdx_lines.append("            <div>")
                        mdx_lines.append("              <h5 className='font-semibold mb-2'>Imported APIs</h5>")
                        mdx_lines.append("              <ul className='space-y-1'>")
                        for api in module['imported_apis'][:5]:
                            api_type_color = {
                                'function': 'text-blue-600',
                                'class': 'text-green-600',
                                'module': 'text-purple-600'
                            }.get(api['type'], 'text-gray-600')
                            mdx_lines.append(f"                <li className='flex items-center gap-2'>")
                            mdx_lines.append(f"                  <code className='{api_type_color}'>{api['name']}</code>")
                            mdx_lines.append(f"                  <Badge variant='outline' className='text-xs'>{api['type']}</Badge>")
                            mdx_lines.append(f"                </li>")
                        if len(module['imported_apis']) > 5:
                            mdx_lines.append(f"                <li className='text-sm text-muted-foreground'>... +{len(module['imported_apis']) - 5} more</li>")
                        mdx_lines.append("              </ul>")
                        mdx_lines.append("            </div>")
                    
                    mdx_lines.append("          </div>")
                
                mdx_lines.append(f"        </AccordionContent>")
                mdx_lines.append(f"      </AccordionItem>")
            
            mdx_lines.append("    </Accordion>")
            mdx_lines.append("  </TabsContent>")
            
            # Imported APIs tab
            if any(module['imported_apis'] for module in package['modules']):
                mdx_lines.append("  <TabsContent value='imported-apis'>")
                mdx_lines.append("    <div className='space-y-6'>")
                
                for module in package['modules']:
                    if module['imported_apis']:
                        mdx_lines.append(f"      <div>")
                        mdx_lines.append(f"        <h4 className='font-semibold mb-4'>From module: <code>{module['name']}.py</code></h4>")
                        mdx_lines.append("        <div className='grid gap-4'>")
                        
                        for api in module['imported_apis']:
                            mdx_lines.append("          <Card>")
                            mdx_lines.append("            <CardHeader>")
                            mdx_lines.append(f"              <CardTitle className='flex items-center gap-2'>")
                            
                            type_icon = {
                                'function': '⚡',
                                'class': '🏗️',
                                'module': '📦',
                                'constant': '🔧'
                            }.get(api['type'], '📄')
                            
                            mdx_lines.append(f"                {type_icon} <code>{api['name']}</code>")
                            mdx_lines.append(f"                <Badge variant='secondary'>{api['type']}</Badge>")
                            
                            if api['is_builtin']:
                                mdx_lines.append(f"                <Badge variant='outline'>builtin</Badge>")
                            
                            mdx_lines.append(f"              </CardTitle>")
                            
                            if api['docstring']['summary']:
                                mdx_lines.append(f"              <CardDescription>{_escape_mdx(api['docstring']['summary'])}</CardDescription>")
                            
                            mdx_lines.append("            </CardHeader>")
                            
                            if api['signature'] or api['docstring']['description'] or api['methods'] or api['attributes']:
                                mdx_lines.append("            <CardContent>")
                                
                                # Show signature for functions
                                if api['signature']:
                                    mdx_lines.append("              <div className='mb-3'>")
                                    mdx_lines.append("                <h6 className='font-semibold mb-1'>Signature</h6>")
                                    mdx_lines.append(f"                <pre className='bg-muted p-2 rounded text-sm overflow-x-auto'><code>{_escape_mdx(api['signature'])}</code></pre>")
                                    mdx_lines.append("              </div>")
                                
                                # Show description
                                if api['docstring']['description']:
                                    mdx_lines.append(f"              <p className='mb-3'>{_escape_mdx(api['docstring']['description'])}</p>")
                                
                                # Show methods for classes
                                if api['methods']:
                                    mdx_lines.append("              <div className='mb-3'>")
                                    mdx_lines.append("                <h6 className='font-semibold mb-2'>Methods</h6>")
                                    mdx_lines.append("                <div className='space-y-1'>")
                                    for method in api['methods'][:3]:  # Show first 3 methods
                                        mdx_lines.append(f"                  <div className='flex items-center gap-2'>")
                                        mdx_lines.append(f"                    <code className='text-sm'>{method['name']}()</code>")
                                        if method['docstring']['summary']:
                                            mdx_lines.append(f"                    <span className='text-xs text-muted-foreground'>- {_escape_mdx(method['docstring']['summary'][:50])}...</span>")
                                        mdx_lines.append(f"                  </div>")
                                    
                                    if len(api['methods']) > 3:
                                        mdx_lines.append(f"                  <p className='text-sm text-muted-foreground'>... +{len(api['methods']) - 3} more methods</p>")
                                    
                                    mdx_lines.append("                </div>")
                                    mdx_lines.append("              </div>")
                                
                                # Show attributes
                                if api['attributes']:
                                    mdx_lines.append("              <div>")
                                    mdx_lines.append("                <h6 className='font-semibold mb-2'>Attributes</h6>")
                                    mdx_lines.append("                <div className='flex flex-wrap gap-2'>")
                                    for attr in api['attributes'][:5]:  # Show first 5 attributes
                                        mdx_lines.append(f"                  <Badge variant='outline' className='text-xs'>{attr['name']}</Badge>")
                                    if len(api['attributes']) > 5:
                                        mdx_lines.append(f"                  <span className='text-xs text-muted-foreground'>+{len(api['attributes']) - 5} more</span>")
                                    mdx_lines.append("                </div>")
                                    mdx_lines.append("              </div>")
                                
                                mdx_lines.append("            </CardContent>")
                            
                            mdx_lines.append("          </Card>")
                        
                        mdx_lines.append("        </div>")
                        mdx_lines.append(f"      </div>")
                
                mdx_lines.append("    </div>")
                mdx_lines.append("  </TabsContent>")
            
            # Classes tab (keeping existing implementation)
            if any(module['classes'] for module in package['modules']):
                mdx_lines.append("  <TabsContent value='classes'>")
                mdx_lines.append("    <div className='space-y-6'>")
                
                for module in package['modules']:
                    for cls in module['classes']:
                        mdx_lines.append("      <Card>")
                        mdx_lines.append("        <CardHeader>")
                        mdx_lines.append(f"          <CardTitle className='flex items-center gap-2'>")
                        mdx_lines.append(f"            🏗️ <code>{cls['name']}</code>")
                        if cls['inheritance']:
                            mdx_lines.append(f"            <Badge variant='outline'>extends {', '.join(cls['inheritance'])}</Badge>")
                        if cls['is_abstract']:
                            mdx_lines.append(f"            <Badge variant='destructive'>abstract</Badge>")
                        mdx_lines.append(f"          </CardTitle>")
                        
                        if cls['docstring']['summary']:
                            mdx_lines.append(f"          <CardDescription>{_escape_mdx(cls['docstring']['summary'])}</CardDescription>")
                        
                        mdx_lines.append("        </CardHeader>")
                        mdx_lines.append("        <CardContent>")
                        
                        if cls['docstring']['description']:
                            mdx_lines.append(f"          <p className='mb-4'>{_escape_mdx(cls['docstring']['description'])}</p>")
                        
                        # Methods and properties
                        if cls['methods'] or cls['properties']:
                            mdx_lines.append("          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>")
                            
                            if cls['methods']:
                                mdx_lines.append("            <div>")
                                mdx_lines.append("              <h6 className='font-semibold mb-2'>Methods</h6>")
                                mdx_lines.append("              <div className='space-y-2'>")
                                for method in cls['methods'][:5]:  # Show first 5 methods
                                    privacy_badge = ""
                                    if method['is_private']:
                                        privacy_badge = "<Badge variant='outline' className='text-xs'>private</Badge>"
                                    elif method['is_protected']:
                                        privacy_badge = "<Badge variant='outline' className='text-xs'>protected</Badge>"
                                    
                                    mdx_lines.append(f"                <div className='flex items-center gap-2'>")
                                    mdx_lines.append(f"                  <code className='text-sm'>{method['name']}()</code>")
                                    if privacy_badge:
                                        mdx_lines.append(f"                  {privacy_badge}")
                                    mdx_lines.append(f"                </div>")
                                
                                if len(cls['methods']) > 5:
                                    mdx_lines.append(f"                <p className='text-sm text-muted-foreground'>... and {len(cls['methods']) - 5} more methods</p>")
                                
                                mdx_lines.append("              </div>")
                                mdx_lines.append("            </div>")
                            
                            if cls['properties']:
                                mdx_lines.append("            <div>")
                                mdx_lines.append("              <h6 className='font-semibold mb-2'>Properties</h6>")
                                mdx_lines.append("              <div className='space-y-1'>")
                                for prop in cls['properties']:
                                    mdx_lines.append(f"                <code className='text-sm'>{prop['name']}</code>")
                                mdx_lines.append("              </div>")
                                mdx_lines.append("            </div>")
                            
                            mdx_lines.append("          </div>")
                        
                        mdx_lines.append("        </CardContent>")
                        mdx_lines.append("      </Card>")
                
                mdx_lines.append("    </div>")
                mdx_lines.append("  </TabsContent>")
            
            # Functions tab (keeping existing implementation)
            if any(module['functions'] for module in package['modules']):
                mdx_lines.append("  <TabsContent value='functions'>")
                mdx_lines.append("    <div className='space-y-4'>")
                
                for module in package['modules']:
                    for func in module['functions']:
                        mdx_lines.append("      <Card>")
                        mdx_lines.append("        <CardHeader>")
                        mdx_lines.append(f"          <CardTitle className='flex items-center gap-2'>")
                        mdx_lines.append(f"            ⚡ <code>{func['name']}()</code>")
                        if func['is_async']:
                            mdx_lines.append(f"            <Badge variant='secondary'>async</Badge>")
                        if func['is_private']:
                            mdx_lines.append(f"            <Badge variant='outline'>private</Badge>")
                        elif func['is_protected']:
                            mdx_lines.append(f"            <Badge variant='outline'>protected</Badge>")
                        mdx_lines.append(f"          </CardTitle>")
                        
                        if func['docstring']['summary']:
                            mdx_lines.append(f"          <CardDescription>{_escape_mdx(func['docstring']['summary'])}</CardDescription>")
                        
                        mdx_lines.append("        </CardHeader>")
                        mdx_lines.append("        <CardContent>")
                        
                        # Function signature
                        mdx_lines.append("          <div className='mb-4'>")
                        mdx_lines.append("            <h6 className='font-semibold mb-2'>Signature</h6>")
                        mdx_lines.append(f"            <pre className='bg-muted p-2 rounded text-sm overflow-x-auto'><code>{_escape_mdx(func['signature'])}</code></pre>")
                        mdx_lines.append("          </div>")
                        
                        if func['docstring']['description']:
                            mdx_lines.append(f"          <p className='mb-4'>{_escape_mdx(func['docstring']['description'])}</p>")
                        
                        # Parameters and return info
                        if func['docstring']['parameters'] or func['docstring']['returns']:
                            mdx_lines.append("          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>")
                            
                            if func['docstring']['parameters']:
                                mdx_lines.append("            <div>")
                                mdx_lines.append("              <h6 className='font-semibold mb-2'>Parameters</h6>")
                                mdx_lines.append("              <div className='space-y-2'>")
                                for param in func['docstring']['parameters']:
                                    mdx_lines.append(f"                <div>")
                                    mdx_lines.append(f"                  <code className='text-sm font-medium'>{param['name']}</code>")
                                    if param['type_hint']:
                                        mdx_lines.append(f"                  <Badge variant='outline' className='ml-2 text-xs'>{param['type_hint']}</Badge>")
                                    if param['description']:
                                        mdx_lines.append(f"                  <p className='text-sm text-muted-foreground mt-1'>{_escape_mdx(param['description'])}</p>")
                                    mdx_lines.append(f"                </div>")
                                mdx_lines.append("              </div>")
                                mdx_lines.append("            </div>")
                            
                            if func['docstring']['returns']:
                                mdx_lines.append("            <div>")
                                mdx_lines.append("              <h6 className='font-semibold mb-2'>Returns</h6>")
                                if func['docstring']['returns']['type_hint']:
                                    mdx_lines.append(f"              <Badge variant='outline' className='mb-2'>{func['docstring']['returns']['type_hint']}</Badge>")
                                if func['docstring']['returns']['description']:
                                    mdx_lines.append(f"              <p className='text-sm'>{_escape_mdx(func['docstring']['returns']['description'])}</p>")
                                mdx_lines.append("            </div>")
                            
                            mdx_lines.append("          </div>")
                        
                        mdx_lines.append("        </CardContent>")
                        mdx_lines.append("      </Card>")
                
                mdx_lines.append("    </div>")
                mdx_lines.append("  </TabsContent>")
            
            mdx_lines.append("</Tabs>")
        
        mdx_lines.append("")
    
    # Footer
    mdx_lines.append("---")
    mdx_lines.append("")
    mdx_lines.append("<Alert>")
    mdx_lines.append("  <AlertDescription>")
    mdx_lines.append("    📝 This documentation was automatically generated from Python source code with imported API analysis.<br/>")
    mdx_lines.append(f"    🕒 Generated on {documentation['analyzed_at']}")
    mdx_lines.append("  </AlertDescription>")
    mdx_lines.append("</Alert>")
    
    return '\n'.join(mdx_lines)

def _escape_mdx(text: str) -> str:
    """Escape special characters for MDX"""
    if not text:
        return ""
    
    # Escape curly braces and other MDX special characters
    text = text.replace('{', '\\{').replace('}', '\\}')
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    
    # Handle backticks in text
    if '`' in text:
        text = text.replace('`', '\\`')
    
    return text

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(
        description='🐍 Python API Documentation Generator - Analyze Python repositories and generate beautiful MDX documentation with imported API analysis',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s /path/to/my/python/project
  %(prog)s ./my_package --output my_api_docs.mdx
  %(prog)s ~/projects/flask-app --format json --verbose
  %(prog)s /usr/local/lib/python3.9/site-packages/requests --format mdx

This tool analyzes Python code and generates comprehensive documentation including:
• 📦 Package structure and metadata
• 📄 Module docstrings and imports  
• 🏗️ Class inheritance and methods
• ⚡ Function signatures and parameters
• 📦 Imported APIs with full documentation (like pydoc/pdoc/autodoc)
• 🎨 Interactive MDX components for modern documentation sites
        """
    )
    
    parser.add_argument('repo_path', help='Path to the Python repository or package')
    parser.add_argument('-o', '--output', help='Output file path (default: auto-generated)', default=None)
    parser.add_argument('-f', '--format', choices=['json', 'mdx'], default='mdx', 
                       help='Output format: json for data, mdx for documentation (default: mdx)')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Print header
    if args.verbose:
        print("🐍 Python API Documentation Generator")
        print("=" * 40)
    
    try:
        repo_path = Path(args.repo_path).resolve()
        
        if not repo_path.exists():
            print(f"❌ Error: Repository path does not exist: {repo_path}")
            sys.exit(1)
        
        if args.verbose:
            print(f"🔍 Analyzing repository: {repo_path}")
            print("📦 Following imports and extracting API documentation...")
        
        analyzer = PythonDocAnalyzer(str(repo_path))
        documentation = analyzer.analyze_repository()
        
        # Generate output filename if not provided
        if not args.output:
            repo_name = repo_path.name
            if args.format == 'mdx':
                args.output = f"{repo_name}_api_docs.mdx"
            else:
                args.output = f"{repo_name}_api_docs.json"
        elif not args.output.endswith(f'.{args.format}'):
            args.output = f"{args.output}.{args.format}"
        
        if args.verbose:
            print(f"📝 Generating {args.format.upper()} documentation...")
        
        if args.format == 'json':
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(documentation, f, indent=2, ensure_ascii=False)
        else:
            mdx_content = generate_mdx_docs(documentation)
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(mdx_content)
        
        # Print success message with summary
        summary = documentation['summary']
        print(f"\n✅ {args.format.upper()} documentation generated successfully!")
        print(f"📄 Output file: {args.output}")
        
        if args.verbose:
            print(f"\n📊 Documentation Summary:")
            print(f"   📦 Packages: {summary['total_packages']}")
            print(f"   📄 Modules: {summary['total_modules']}")
            print(f"   🏗️  Classes: {summary['total_classes']}")
            print(f"   ⚡ Functions: {summary['total_functions']}")
            print(f"   🔧 Methods: {summary['total_methods']}")
            print(f"   📦 Imported APIs: {summary['total_imported_apis']}")
            
            if summary['package_names']:
                print(f"\n📦 Found packages: {', '.join(summary['package_names'])}")
        
        if args.format == 'mdx':
            print(f"\n💡 You can now use this MDX file in your documentation site!")
            print(f"   The documentation includes imported APIs with full docstrings!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if args.verbose:
            traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
