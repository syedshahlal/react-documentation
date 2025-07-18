#!/usr/bin/env python3
"""
Complete Python API Documentation Generator
A single script that analyzes Python repositories and generates MDX documentation
with interactive components, similar to Sphinx and pdoc.
"""

import os
import ast
import json
import sys
import inspect
import argparse
import importlib
import importlib.util
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Set
import re
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback
import pkgutil
import types

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
    line_number: int = 0
    is_async: bool = False
    is_property: bool = False
    is_classmethod: bool = False
    is_staticmethod: bool = False
    is_private: bool = False
    is_protected: bool = False
    decorators: List[str] = None
    source_file: str = ""
    module_path: str = ""
    is_imported: bool = False
    
    def __post_init__(self):
        if self.decorators is None:
            self.decorators = []

@dataclass
class ClassDoc:
    """Represents documentation for a class"""
    name: str
    docstring: ParsedDocstring
    line_number: int = 0
    methods: List[FunctionDoc] = None
    properties: List[FunctionDoc] = None
    class_variables: List[DocParameter] = None
    inheritance: List[str] = None
    is_abstract: bool = False
    source_file: str = ""
    module_path: str = ""
    is_imported: bool = False
    
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
class ImportedAPI:
    """Represents imported API elements"""
    module_name: str
    imported_classes: List[ClassDoc] = None
    imported_functions: List[FunctionDoc] = None
    imported_constants: List[DocParameter] = None
    is_builtin: bool = False
    import_path: str = ""
    
    def __post_init__(self):
        if self.imported_classes is None:
            self.imported_classes = []
        if self.imported_functions is None:
            self.imported_functions = []
        if self.imported_constants is None:
            self.imported_constants = []

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
    """Analyzes and follows import statements to extract API documentation"""
    
    def __init__(self, repo_path: str, docstring_parser: DocstringParser):
        self.repo_path = Path(repo_path).resolve()
        self.docstring_parser = docstring_parser
        self.analyzed_modules: Set[str] = set()
        self.import_cache: Dict[str, Any] = {}
        
    def analyze_imports(self, module_path: Path, ast_tree: ast.AST) -> List[ImportedAPI]:
        """Analyze all imports in a module and extract their API documentation"""
        imported_apis = []
        
        # Add the module's directory to Python path temporarily
        module_dir = str(module_path.parent)
        if module_dir not in sys.path:
            sys.path.insert(0, module_dir)
        
        try:
            for node in ast.walk(ast_tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        api = self._analyze_import(alias.name, module_path)
                        if api:
                            imported_apis.append(api)
                
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        # Handle "from module import name1, name2"
                        for alias in node.names:
                            if alias.name == '*':
                                # Handle "from module import *"
                                api = self._analyze_wildcard_import(node.module, module_path)
                                if api:
                                    imported_apis.append(api)
                            else:
                                api = self._analyze_from_import(node.module, alias.name, module_path)
                                if api:
                                    imported_apis.append(api)
        
        finally:
            # Remove the temporary path
            if module_dir in sys.path:
                sys.path.remove(module_dir)
        
        return imported_apis
    
    def _analyze_import(self, module_name: str, source_path: Path) -> Optional[ImportedAPI]:
        """Analyze a direct import (import module_name)"""
        if module_name in self.analyzed_modules:
            return None
        
        try:
            # Try to import the module
            module = self._safe_import(module_name, source_path)
            if not module:
                return None
            
            self.analyzed_modules.add(module_name)
            
            # Extract API from the imported module
            return self._extract_module_api(module, module_name)
        
        except Exception as e:
            print(f"Warning: Could not analyze import '{module_name}': {e}")
            return None
    
    def _analyze_from_import(self, module_name: str, item_name: str, source_path: Path) -> Optional[ImportedAPI]:
        """Analyze a from import (from module import item)"""
        import_key = f"{module_name}.{item_name}"
        if import_key in self.analyzed_modules:
            return None
        
        try:
            # Try to import the module
            module = self._safe_import(module_name, source_path)
            if not module:
                return None
            
            self.analyzed_modules.add(import_key)
            
            # Get the specific item from the module
            if not hasattr(module, item_name):
                return None
            
            item = getattr(module, item_name)
            
            # Create ImportedAPI for the specific item
            api = ImportedAPI(
                module_name=f"{module_name}.{item_name}",
                is_builtin=self._is_builtin_module(module_name),
                import_path=f"from {module_name} import {item_name}"
            )
            
            # Analyze the imported item
            if inspect.isclass(item):
                class_doc = self._analyze_imported_class(item, f"{module_name}.{item_name}")
                if class_doc:
                    api.imported_classes.append(class_doc)
            
            elif inspect.isfunction(item) or inspect.ismethod(item):
                func_doc = self._analyze_imported_function(item, f"{module_name}.{item_name}")
                if func_doc:
                    api.imported_functions.append(func_doc)
            
            elif not callable(item) and not inspect.ismodule(item):
                # It's a constant or variable
                const_doc = DocParameter(
                    name=item_name,
                    default_value=str(item)[:100] if len(str(item)) <= 100 else str(item)[:100] + "...",
                    description=f"Imported from {module_name}"
                )
                api.imported_constants.append(const_doc)
            
            return api if (api.imported_classes or api.imported_functions or api.imported_constants) else None
        
        except Exception as e:
            print(f"Warning: Could not analyze from import '{module_name}.{item_name}': {e}")
            return None
    
    def _analyze_wildcard_import(self, module_name: str, source_path: Path) -> Optional[ImportedAPI]:
        """Analyze a wildcard import (from module import *)"""
        if f"{module_name}.*" in self.analyzed_modules:
            return None
        
        try:
            module = self._safe_import(module_name, source_path)
            if not module:
                return None
            
            self.analyzed_modules.add(f"{module_name}.*")
            
            # Get all public items from the module
            api = ImportedAPI(
                module_name=f"{module_name}.*",
                is_builtin=self._is_builtin_module(module_name),
                import_path=f"from {module_name} import *"
            )
            
            # Get items to import (respect __all__ if it exists)
            if hasattr(module, '__all__'):
                items_to_import = module.__all__
            else:
                items_to_import = [name for name in dir(module) if not name.startswith('_')]
            
            # Limit to prevent overwhelming documentation
            items_to_import = items_to_import[:20]  # Limit to first 20 items
            
            for item_name in items_to_import:
                if hasattr(module, item_name):
                    item = getattr(module, item_name)
                    
                    if inspect.isclass(item):
                        class_doc = self._analyze_imported_class(item, f"{module_name}.{item_name}")
                        if class_doc:
                            api.imported_classes.append(class_doc)
                    
                    elif inspect.isfunction(item) or inspect.ismethod(item):
                        func_doc = self._analyze_imported_function(item, f"{module_name}.{item_name}")
                        if func_doc:
                            api.imported_functions.append(func_doc)
            
            return api if (api.imported_classes or api.imported_functions) else None
        
        except Exception as e:
            print(f"Warning: Could not analyze wildcard import from '{module_name}': {e}")
            return None
    
    def _safe_import(self, module_name: str, source_path: Path) -> Optional[types.ModuleType]:
        """Safely import a module with proper error handling"""
        if module_name in self.import_cache:
            return self.import_cache[module_name]
        
        try:
            # First try direct import
            module = importlib.import_module(module_name)
            self.import_cache[module_name] = module
            return module
        
        except ImportError:
            try:
                # Try relative import from the source file's directory
                spec = importlib.util.find_spec(module_name, package=str(source_path.parent))
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    self.import_cache[module_name] = module
                    return module
            except Exception:
                pass
        
        except Exception as e:
            print(f"Warning: Could not import '{module_name}': {e}")
        
        self.import_cache[module_name] = None
        return None
    
    def _extract_module_api(self, module: types.ModuleType, module_name: str) -> ImportedAPI:
        """Extract API documentation from an imported module"""
        api = ImportedAPI(
            module_name=module_name,
            is_builtin=self._is_builtin_module(module_name),
            import_path=f"import {module_name}"
        )
        
        # Get all public attributes
        public_attrs = [name for name in dir(module) if not name.startswith('_')]
        
        # Limit to prevent overwhelming documentation
        public_attrs = public_attrs[:30]  # Limit to first 30 items
        
        for attr_name in public_attrs:
            try:
                attr = getattr(module, attr_name)
                
                if inspect.isclass(attr):
                    class_doc = self._analyze_imported_class(attr, f"{module_name}.{attr_name}")
                    if class_doc:
                        api.imported_classes.append(class_doc)
                
                elif inspect.isfunction(attr) or inspect.ismethod(attr):
                    func_doc = self._analyze_imported_function(attr, f"{module_name}.{attr_name}")
                    if func_doc:
                        api.imported_functions.append(func_doc)
                
                elif not callable(attr) and not inspect.ismodule(attr):
                    # It's a constant
                    const_doc = DocParameter(
                        name=attr_name,
                        default_value=str(attr)[:100] if len(str(attr)) <= 100 else str(attr)[:100] + "...",
                        description=f"Constant from {module_name}"
                    )
                    api.imported_constants.append(const_doc)
            
            except Exception as e:
                continue  # Skip problematic attributes
        
        return api
    
    def _analyze_imported_class(self, cls: type, full_name: str) -> Optional[ClassDoc]:
        """Analyze an imported class"""
        try:
            # Get class docstring
            docstring = inspect.getdoc(cls) or ""
            parsed_docstring = self.docstring_parser.parse(docstring)
            
            # Get inheritance
            inheritance = [base.__name__ for base in cls.__bases__ if base != object]
            
            # Get methods and properties
            methods = []
            properties = []
            
            for name, method in inspect.getmembers(cls):
                if name.startswith('_'):
                    continue  # Skip private methods for imported classes
                
                if inspect.ismethod(method) or inspect.isfunction(method):
                    try:
                        func_doc = self._analyze_imported_function(method, f"{full_name}.{name}")
                        if func_doc:
                            methods.append(func_doc)
                    except Exception:
                        continue
                
                elif isinstance(method, property):
                    try:
                        prop_doc = FunctionDoc(
                            name=name,
                            signature=f"{name}: property",
                            docstring=self.docstring_parser.parse(inspect.getdoc(method) or ""),
                            is_property=True,
                            module_path=full_name,
                            is_imported=True
                        )
                        properties.append(prop_doc)
                    except Exception:
                        continue
            
            return ClassDoc(
                name=cls.__name__,
                docstring=parsed_docstring,
                methods=methods[:10],  # Limit methods
                properties=properties[:5],  # Limit properties
                inheritance=inheritance,
                module_path=full_name,
                is_imported=True
            )
        
        except Exception as e:
            print(f"Warning: Could not analyze imported class '{full_name}': {e}")
            return None
    
    def _analyze_imported_function(self, func: callable, full_name: str) -> Optional[FunctionDoc]:
        """Analyze an imported function"""
        try:
            # Get function docstring
            docstring = inspect.getdoc(func) or ""
            parsed_docstring = self.docstring_parser.parse(docstring)
            
            # Get function signature
            try:
                sig = inspect.signature(func)
                signature = f"{func.__name__}{sig}"
            except (ValueError, TypeError):
                signature = f"{func.__name__}(...)"
            
            return FunctionDoc(
                name=func.__name__,
                signature=signature,
                docstring=parsed_docstring,
                is_async=inspect.iscoroutinefunction(func),
                module_path=full_name,
                is_imported=True
            )
        
        except Exception as e:
            print(f"Warning: Could not analyze imported function '{full_name}': {e}")
            return None
    
    def _is_builtin_module(self, module_name: str) -> bool:
        """Check if a module is a built-in Python module"""
        builtin_modules = set(sys.builtin_module_names)
        stdlib_modules = {
            'os', 'sys', 'json', 'datetime', 'pathlib', 'typing', 'collections',
            'itertools', 'functools', 're', 'math', 'random', 'urllib', 'http',
            'email', 'html', 'xml', 'csv', 'sqlite3', 'threading', 'multiprocessing',
            'asyncio', 'logging', 'unittest', 'argparse', 'configparser', 'pickle',
            'base64', 'hashlib', 'hmac', 'secrets', 'uuid', 'time', 'calendar',
            'locale', 'gettext', 'io', 'tempfile', 'shutil', 'glob', 'fnmatch',
            'subprocess', 'socket', 'ssl', 'select', 'signal', 'platform',
            'ctypes', 'struct', 'array', 'weakref', 'copy', 'pprint', 'reprlib',
            'enum', 'dataclasses', 'contextlib', 'abc', 'numbers', 'cmath',
            'decimal', 'fractions', 'statistics', 'zlib', 'gzip', 'bz2', 'lzma',
            'zipfile', 'tarfile'
        }
        
        return (module_name in builtin_modules or 
                module_name in stdlib_modules or 
                module_name.split('.')[0] in stdlib_modules)

class PythonDocAnalyzer:
    """Main analyzer class for Python documentation extraction"""
    
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()
        self.docstring_parser = DocstringParser()
        self.import_analyzer = ImportAnalyzer(str(self.repo_path), self.docstring_parser)
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
        
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                class_doc = self._analyze_class(node, str(module_path))
                classes.append(class_doc)
            
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_doc = self._analyze_function(node, str(module_path))
                functions.append(func_doc)
            
            elif isinstance(node, ast.Assign):
                constants.extend(self._analyze_constants(node))
        
        # Analyze imports and extract their API documentation
        imported_apis = self.import_analyzer.analyze_imports(module_path, tree)
        
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
        
        # Count imported APIs
        total_imported_classes = sum(
            len(api.imported_classes)
            for pkg in packages 
            for module in pkg.modules 
            for api in module.imported_apis
        )
        total_imported_functions = sum(
            len(api.imported_functions)
            for pkg in packages 
            for module in pkg.modules 
            for api in module.imported_apis
        )
        
        return {
            'total_packages': len(packages),
            'total_modules': total_modules,
            'total_classes': total_classes,
            'total_functions': total_functions,
            'total_methods': total_methods,
            'total_imported_classes': total_imported_classes,
            'total_imported_functions': total_imported_functions,
            'package_names': [pkg.name for pkg in packages]
        }

def generate_mdx_docs(documentation: Dict[str, Any]) -> str:
    """Generate MDX documentation from the analysis results"""
    mdx_lines = []
    
    # MDX Header with metadata
    mdx_lines.append("---")
    mdx_lines.append(f"title: 'API Documentation'")
    mdx_lines.append(f"description: 'Auto-generated Python API documentation'")
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
    mdx_lines.append("<div className='grid grid-cols-2 md:grid-cols-7 gap-4 mb-6'>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-blue-600'>{summary['total_packages']}</div><div className='text-sm text-muted-foreground'>Packages</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-green-600'>{summary['total_modules']}</div><div className='text-sm text-muted-foreground'>Modules</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-purple-600'>{summary['total_classes']}</div><div className='text-sm text-muted-foreground'>Classes</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-orange-600'>{summary['total_functions']}</div><div className='text-sm text-muted-foreground'>Functions</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-red-600'>{summary['total_methods']}</div><div className='text-sm text-muted-foreground'>Methods</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-cyan-600'>{summary['total_imported_classes']}</div><div className='text-sm text-muted-foreground'>Imported Classes</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-pink-600'>{summary['total_imported_functions']}</div><div className='text-sm text-muted-foreground'>Imported Functions</div></CardContent></Card>")
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
        
        # Modules
        if package['modules']:
            mdx_lines.append("<Tabs defaultValue='modules' className='mb-8'>")
            mdx_lines.append("  <TabsList>")
            mdx_lines.append("    <TabsTrigger value='modules'>Modules</TabsTrigger>")
            if any(module['classes'] for module in package['modules']):
                mdx_lines.append("    <TabsTrigger value='classes'>Classes</TabsTrigger>")
            if any(module['functions'] for module in package['modules']):
                mdx_lines.append("    <TabsTrigger value='functions'>Functions</TabsTrigger>")
            if any(module['imported_apis'] for module in package['modules']):
                mdx_lines.append("    <TabsTrigger value='imports'>Imported APIs</TabsTrigger>")
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
                    mdx_lines.append(f"              <Badge variant='outline' className='text-xs'>{len(module['imported_apis'])} imports</Badge>")
                mdx_lines.append(f"            </div>")
                mdx_lines.append(f"          </div>")
                mdx_lines.append(f"        </AccordionTrigger>")
                mdx_lines.append(f"        <AccordionContent>")
                
                if module['docstring']['summary']:
                    mdx_lines.append(f"          <p className='mb-4'>{_escape_mdx(module['docstring']['summary'])}</p>")
                
                # Module classes and functions summary
                if module['classes'] or module['functions']:
                    mdx_lines.append("          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>")
                    
                    if module['classes']:
                        mdx_lines.append("            <div>")
                        mdx_lines.append("              <h5 className='font-semibold mb-2'>Classes</h5>")
                        mdx_lines.append("              <ul className='space-y-1'>")
                        for cls in module['classes']:
                            mdx_lines.append(f"                <li><code>{cls['name']}</code></li>")
                        mdx_lines.append("              </ul>")
                        mdx_lines.append("            </div>")
                    
                    if module['functions']:
                        mdx_lines.append("            <div>")
                        mdx_lines.append("              <h5 className='font-semibold mb-2'>Functions</h5>")
                        mdx_lines.append("              <ul className='space-y-1'>")
                        for func in module['functions']:
                            mdx_lines.append(f"                <li><code>{func['name']}()</code></li>")
                        mdx_lines.append("              </ul>")
                        mdx_lines.append("            </div>")
                    
                    mdx_lines.append("          </div>")
                
                # Show imported APIs summary
                if module['imported_apis']:
                    mdx_lines.append("          <div className='mt-4'>")
                    mdx_lines.append("            <h5 className='font-semibold mb-2'>📥 Imported APIs</h5>")
                    mdx_lines.append("            <div className='flex flex-wrap gap-1'>")
                    for api in module['imported_apis'][:10]:  # Show first 10
                        badge_color = "variant='outline'" if api['is_builtin'] else "variant='secondary'"
                        mdx_lines.append(f"              <Badge {badge_color} className='text-xs'>{api['module_name']}</Badge>")
                    if len(module['imported_apis']) > 10:
                        mdx_lines.append(f"              <Badge variant='ghost' className='text-xs'>+{len(module['imported_apis']) - 10} more</Badge>")
                    mdx_lines.append("            </div>")
                    mdx_lines.append("          </div>")
                
                mdx_lines.append(f"        </AccordionContent>")
                mdx_lines.append(f"      </AccordionItem>")
            
            mdx_lines.append("    </Accordion>")
            mdx_lines.append("  </TabsContent>")
            
            # Classes tab
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
