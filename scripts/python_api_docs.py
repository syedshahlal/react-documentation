#!/usr/bin/env python3
"""
Complete Python API Documentation Generator
A single script that analyzes Python repositories and generates MDX documentation
with deep import analysis, similar to Sphinx, pydoc, and autodoc.
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
from typing import Dict, List, Any, Optional, Union, Set, Tuple
import re
from dataclasses import dataclass, asdict, field
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
    parameters: List[DocParameter] = field(default_factory=list)
    returns: Optional[DocReturn] = None
    raises: List[DocException] = field(default_factory=list)
    examples: List[DocExample] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    see_also: List[str] = field(default_factory=list)
    attributes: List[DocParameter] = field(default_factory=list)

@dataclass
class ImportedItem:
    """Represents an imported module, class, or function"""
    name: str
    module_path: str
    item_type: str  # 'module', 'class', 'function', 'constant'
    docstring: ParsedDocstring
    signature: Optional[str] = None
    source_file: Optional[str] = None
    is_builtin: bool = False
    is_third_party: bool = False

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
    decorators: List[str] = field(default_factory=list)
    source_file: str = ""

@dataclass
class ClassDoc:
    """Represents documentation for a class"""
    name: str
    docstring: ParsedDocstring
    line_number: int
    methods: List[FunctionDoc] = field(default_factory=list)
    properties: List[FunctionDoc] = field(default_factory=list)
    class_variables: List[DocParameter] = field(default_factory=list)
    inheritance: List[str] = field(default_factory=list)
    is_abstract: bool = False
    source_file: str = ""

@dataclass
class ModuleDoc:
    """Represents documentation for a module"""
    name: str
    file_path: str
    docstring: ParsedDocstring
    classes: List[ClassDoc] = field(default_factory=list)
    functions: List[FunctionDoc] = field(default_factory=list)
    constants: List[DocParameter] = field(default_factory=list)
    imported_items: List[ImportedItem] = field(default_factory=list)  # Changed from imports
    submodules: List[str] = field(default_factory=list)

@dataclass
class PackageDoc:
    """Represents documentation for a package"""
    name: str
    path: str
    docstring: ParsedDocstring
    modules: List[ModuleDoc] = field(default_factory=list)
    subpackages: List['PackageDoc'] = field(default_factory=list)
    imported_items: List[ImportedItem] = field(default_factory=list)  # Package-level imports
    version: Optional[str] = None
    author: Optional[str] = None
    license: Optional[str] = None

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

class ImportResolver:
    """Resolves and analyzes imported modules"""
    
    def __init__(self, base_path: Path, analyzed_modules: Set[str] = None):
        self.base_path = base_path
        self.analyzed_modules = analyzed_modules or set()
        self.docstring_parser = DocstringParser()
        self.sys_paths = sys.path.copy()
        
        # Add the base path to sys.path for imports
        if str(base_path) not in self.sys_paths:
            self.sys_paths.insert(0, str(base_path))
    
    def resolve_imports(self, import_nodes: List[Union[ast.Import, ast.ImportFrom]], 
                       current_module_path: Path) -> List[ImportedItem]:
        """Resolve import statements to actual imported items with documentation"""
        imported_items = []
        
        for node in import_nodes:
            try:
                if isinstance(node, ast.Import):
                    items = self._resolve_import(node, current_module_path)
                elif isinstance(node, ast.ImportFrom):
                    items = self._resolve_from_import(node, current_module_path)
                else:
                    continue
                
                imported_items.extend(items)
                
            except Exception as e:
                # If we can't resolve an import, create a basic item
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imported_items.append(ImportedItem(
                            name=alias.name,
                            module_path="",
                            item_type="module",
                            docstring=ParsedDocstring(summary=f"Could not resolve import: {e}"),
                            is_builtin=True
                        ))
                continue
        
        return imported_items
    
    def _resolve_import(self, node: ast.Import, current_module_path: Path) -> List[ImportedItem]:
        """Resolve 'import module' statements"""
        items = []
        
        for alias in node.names:
            module_name = alias.name
            
            try:
                # Try to find and load the module
                module_info = self._find_module(module_name, current_module_path)
                if module_info:
                    item = self._analyze_imported_module(module_info, module_name)
                    items.append(item)
                else:
                    # Create placeholder for unresolvable module
                    items.append(ImportedItem(
                        name=module_name,
                        module_path="",
                        item_type="module",
                        docstring=ParsedDocstring(summary="External or system module"),
                        is_builtin=True
                    ))
            
            except Exception as e:
                items.append(ImportedItem(
                    name=module_name,
                    module_path="",
                    item_type="module",
                    docstring=ParsedDocstring(summary=f"Import resolution failed: {str(e)}"),
                    is_builtin=True
                ))
        
        return items
    
    def _resolve_from_import(self, node: ast.ImportFrom, current_module_path: Path) -> List[ImportedItem]:
        """Resolve 'from module import item' statements"""
        items = []
        module_name = node.module or ""
        
        # Handle relative imports
        if node.level > 0:
            module_name = self._resolve_relative_import(module_name, node.level, current_module_path)
        
        if not module_name:
            return items
        
        try:
            # Find the source module
            module_info = self._find_module(module_name, current_module_path)
            if not module_info:
                # Create placeholders for unresolvable imports
                for alias in node.names:
                    items.append(ImportedItem(
                        name=alias.name,
                        module_path=module_name,
                        item_type="unknown",
                        docstring=ParsedDocstring(summary="External or system import"),
                        is_third_party=True
                    ))
                return items
            
            # Load the module and extract specific items
            for alias in node.names:
                item_name = alias.name
                
                if item_name == '*':
                    # Handle 'from module import *'
                    all_items = self._get_all_module_items(module_info)
                    items.extend(all_items)
                else:
                    # Handle specific imports
                    item = self._analyze_imported_item(module_info, item_name, module_name)
                    if item:
                        items.append(item)
        
        except Exception as e:
            # Create placeholder items
            for alias in node.names:
                items.append(ImportedItem(
                    name=alias.name,
                    module_path=module_name,
                    item_type="unknown",
                    docstring=ParsedDocstring(summary=f"Import failed: {str(e)}"),
                    is_third_party=True
                ))
        
        return items
    
    def _find_module(self, module_name: str, current_module_path: Path) -> Optional[Dict[str, Any]]:
        """Find a module by name and return its information"""
        
        # First try to find it as a local module
        local_module = self._find_local_module(module_name, current_module_path)
        if local_module:
            return local_module
        
        # Try to import it using importlib
        try:
            spec = importlib.util.find_spec(module_name)
            if spec and spec.origin:
                return {
                    'spec': spec,
                    'path': Path(spec.origin),
                    'is_package': spec.submodule_search_locations is not None,
                    'is_builtin': spec.origin == 'built-in',
                    'is_local': self._is_local_module(Path(spec.origin) if spec.origin != 'built-in' else None)
                }
        except (ImportError, AttributeError, ValueError):
            pass
        
        return None
    
    def _find_local_module(self, module_name: str, current_module_path: Path) -> Optional[Dict[str, Any]]:
        """Find a module within the current project"""
        parts = module_name.split('.')
        
        # Start from the base path
        search_path = self.base_path
        
        for i, part in enumerate(parts):
            # Try as a package (directory with __init__.py)
            package_path = search_path / part
            if package_path.is_dir() and (package_path / '__init__.py').exists():
                search_path = package_path
                if i == len(parts) - 1:  # Last part
                    return {
                        'path': package_path / '__init__.py',
                        'is_package': True,
                        'is_builtin': False,
                        'is_local': True
                    }
            
            # Try as a module (python file)
            module_path = search_path / f"{part}.py"
            if module_path.exists():
                if i == len(parts) - 1:  # Last part
                    return {
                        'path': module_path,
                        'is_package': False,
                        'is_builtin': False,
                        'is_local': True
                    }
            
            # If we can't find this part, stop searching
            else:
                break
        
        return None
    
    def _is_local_module(self, module_path: Optional[Path]) -> bool:
        """Check if a module is part of the local project"""
        if not module_path:
            return False
        
        try:
            return self.base_path in module_path.parents or module_path == self.base_path
        except (OSError, ValueError):
            return False
    
    def _resolve_relative_import(self, module_name: str, level: int, current_module_path: Path) -> str:
        """Resolve relative imports like 'from ..module import item'"""
        try:
            # Get the current package path
            current_package = current_module_path.parent
            
            # Go up 'level' directories
            for _ in range(level - 1):
                current_package = current_package.parent
                if current_package == self.base_path.parent:
                    break
            
            # Convert path to module name
            relative_path = current_package.relative_to(self.base_path)
            package_parts = list(relative_path.parts) if relative_path != Path('.') else []
            
            if module_name:
                package_parts.append(module_name)
            
            return '.'.join(package_parts)
            
        except (ValueError, OSError):
            return module_name
    
    def _analyze_imported_module(self, module_info: Dict[str, Any], module_name: str) -> ImportedItem:
        """Analyze an imported module and extract its documentation"""
        
        if module_info.get('is_builtin'):
            return ImportedItem(
                name=module_name,
                module_path=module_name,
                item_type="module",
                docstring=ParsedDocstring(summary="Built-in Python module"),
                is_builtin=True
            )
        
        module_path = module_info['path']
        
        # Avoid analyzing the same module multiple times
        if str(module_path) in self.analyzed_modules:
            return ImportedItem(
                name=module_name,
                module_path=str(module_path),
                item_type="module",
                docstring=ParsedDocstring(summary="Already analyzed module"),
                source_file=str(module_path),
                is_local=module_info.get('is_local', False)
            )
        
        self.analyzed_modules.add(str(module_path))
        
        try:
            # Read and parse the module
            with open(module_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            # Extract module docstring
            module_docstring = ParsedDocstring()
            if (tree.body and isinstance(tree.body[0], ast.Expr) and 
                isinstance(tree.body[0].value, ast.Constant) and 
                isinstance(tree.body[0].value.value, str)):
                module_docstring = self.docstring_parser.parse(tree.body[0].value.value)
            
            return ImportedItem(
                name=module_name,
                module_path=str(module_path),
                item_type="module",
                docstring=module_docstring,
                source_file=str(module_path),
                is_local=module_info.get('is_local', False),
                is_third_party=not module_info.get('is_local', False) and not module_info.get('is_builtin', False)
            )
            
        except Exception as e:
            return ImportedItem(
                name=module_name,
                module_path=str(module_path),
                item_type="module",
                docstring=ParsedDocstring(summary=f"Error analyzing module: {str(e)}"),
                source_file=str(module_path),
                is_local=module_info.get('is_local', False)
            )
    
    def _analyze_imported_item(self, module_info: Dict[str, Any], item_name: str, module_name: str) -> Optional[ImportedItem]:
        """Analyze a specific item imported from a module"""
        
        if module_info.get('is_builtin'):
            return ImportedItem(
                name=item_name,
                module_path=module_name,
                item_type="unknown",
                docstring=ParsedDocstring(summary=f"Built-in item from {module_name}"),
                is_builtin=True
            )
        
        module_path = module_info['path']
        
        try:
            # Read and parse the module
            with open(module_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            # Find the specific item in the module
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef) and node.name == item_name:
                    # Extract class docstring
                    docstring = ParsedDocstring()
                    if (node.body and isinstance(node.body[0], ast.Expr) and 
                        isinstance(node.body[0].value, ast.Constant) and 
                        isinstance(node.body[0].value.value, str)):
                        docstring = self.docstring_parser.parse(node.body[0].value.value)
                    
                    return ImportedItem(
                        name=item_name,
                        module_path=module_name,
                        item_type="class",
                        docstring=docstring,
                        source_file=str(module_path),
                        is_local=module_info.get('is_local', False),
                        is_third_party=not module_info.get('is_local', False) and not module_info.get('is_builtin', False)
                    )
                
                elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == item_name:
                    # Extract function docstring and signature
                    docstring = ParsedDocstring()
                    if (node.body and isinstance(node.body[0], ast.Expr) and 
                        isinstance(node.body[0].value, ast.Constant) and 
                        isinstance(node.body[0].value.value, str)):
                        docstring = self.docstring_parser.parse(node.body[0].value.value)
                    
                    signature = self._generate_signature(node)
                    
                    return ImportedItem(
                        name=item_name,
                        module_path=module_name,
                        item_type="function",
                        docstring=docstring,
                        signature=signature,
                        source_file=str(module_path),
                        is_local=module_info.get('is_local', False),
                        is_third_party=not module_info.get('is_local', False) and not module_info.get('is_builtin', False)
                    )
                
                elif isinstance(node, ast.Assign):
                    # Check for constants/variables
                    for target in node.targets:
                        if isinstance(target, ast.Name) and target.id == item_name:
                            return ImportedItem(
                                name=item_name,
                                module_path=module_name,
                                item_type="constant",
                                docstring=ParsedDocstring(summary=f"Constant from {module_name}"),
                                source_file=str(module_path),
                                is_local=module_info.get('is_local', False),
                                is_third_party=not module_info.get('is_local', False) and not module_info.get('is_builtin', False)
                            )
            
            # If we couldn't find the item, create a placeholder
            return ImportedItem(
                name=item_name,
                module_path=module_name,
                item_type="unknown",
                docstring=ParsedDocstring(summary=f"Item from {module_name} (not found in source)"),
                source_file=str(module_path),
                is_local=module_info.get('is_local', False),
                is_third_party=not module_info.get('is_local', False) and not module_info.get('is_builtin', False)
            )
            
        except Exception as e:
            return ImportedItem(
                name=item_name,
                module_path=module_name,
                item_type="unknown",
                docstring=ParsedDocstring(summary=f"Error analyzing item: {str(e)}"),
                source_file=str(module_path) if module_path else "",
                is_local=module_info.get('is_local', False)
            )
    
    def _get_all_module_items(self, module_info: Dict[str, Any]) -> List[ImportedItem]:
        """Get all items from a module for 'from module import *'"""
        items = []
        
        if module_info.get('is_builtin'):
            return [ImportedItem(
                name="*",
                module_path=module_info.get('path', ''),
                item_type="module",
                docstring=ParsedDocstring(summary="All items from built-in module"),
                is_builtin=True
            )]
        
        module_path = module_info['path']
        
        try:
            # Read and parse the module
            with open(module_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            # Extract all public items (not starting with _)
            for node in tree.body:
                if isinstance(node, ast.ClassDef) and not node.name.startswith('_'):
                    docstring = ParsedDocstring()
                    if (node.body and isinstance(node.body[0], ast.Expr) and 
                        isinstance(node.body[0].value, ast.Constant) and 
                        isinstance(node.body[0].value.value, str)):
                        docstring = self.docstring_parser.parse(node.body[0].value.value)
                    
                    items.append(ImportedItem(
                        name=node.name,
                        module_path=str(module_path),
                        item_type="class",
                        docstring=docstring,
                        source_file=str(module_path),
                        is_local=module_info.get('is_local', False)
                    ))
                
                elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith('_'):
                    docstring = ParsedDocstring()
                    if (node.body and isinstance(node.body[0], ast.Expr) and 
                        isinstance(node.body[0].value, ast.Constant) and 
                        isinstance(node.body[0].value.value, str)):
                        docstring = self.docstring_parser.parse(node.body[0].value.value)
                    
                    signature = self._generate_signature(node)
                    
                    items.append(ImportedItem(
                        name=node.name,
                        module_path=str(module_path),
                        item_type="function",
                        docstring=docstring,
                        signature=signature,
                        source_file=str(module_path),
                        is_local=module_info.get('is_local', False)
                    ))
        
        except Exception:
            pass
        
        return items
    
    def _generate_signature(self, node: Union[ast.FunctionDef, ast.AsyncFunctionDef]) -> str:
        """Generate function signature string"""
        args = []
        
        # Regular arguments
        for arg in node.args.args:
            arg_str = arg.arg
            if arg.annotation:
                try:
                    arg_str += f": {ast.unparse(arg.annotation)}"
                except:
                    arg_str += ": Any"
            args.append(arg_str)
        
        # Default arguments
        defaults = node.args.defaults
        if defaults:
            num_defaults = len(defaults)
            for i, default in enumerate(defaults):
                arg_index = len(args) - num_defaults + i
                if arg_index >= 0:
                    try:
                        args[arg_index] += f" = {ast.unparse(default)}"
                    except:
                        args[arg_index] += " = ..."
        
        # *args
        if node.args.vararg:
            vararg = f"*{node.args.vararg.arg}"
            if node.args.vararg.annotation:
                try:
                    vararg += f": {ast.unparse(node.args.vararg.annotation)}"
                except:
                    vararg += ": Any"
            args.append(vararg)
        
        # **kwargs
        if node.args.kwarg:
            kwarg = f"**{node.args.kwarg.arg}"
            if node.args.kwarg.annotation:
                try:
                    kwarg += f": {ast.unparse(node.args.kwarg.annotation)}"
                except:
                    kwarg += ": Any"
            args.append(kwarg)
        
        signature = f"{node.name}({', '.join(args)})"
        
        # Return annotation
        if node.returns:
            try:
                signature += f" -> {ast.unparse(node.returns)}"
            except:
                signature += " -> Any"
        
        return signature

class PythonDocAnalyzer:
    """Main analyzer class for Python documentation extraction"""
    
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()
        self.docstring_parser = DocstringParser()
        self.analyzed_files = set()
        self.analyzed_modules = set()
        
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
        package_imports = []
        
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
                
                # Analyze package-level imports
                import_nodes = [node for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom))]
                if import_nodes:
                    resolver = ImportResolver(self.repo_path, self.analyzed_modules)
                    package_imports = resolver.resolve_imports(import_nodes, init_file)
                
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
            imported_items=package_imports,
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
        imported_items = []
        
        # Collect import nodes
        import_nodes = [node for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom))]
        
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                class_doc = self._analyze_class(node, str(module_path))
                classes.append(class_doc)
            
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_doc = self._analyze_function(node, str(module_path))
                functions.append(func_doc)
            
            elif isinstance(node, ast.Assign):
                constants.extend(self._analyze_constants(node))
        
        # Analyze imports and resolve them to actual documentation
        if import_nodes:
            resolver = ImportResolver(self.repo_path, self.analyzed_modules)
            imported_items = resolver.resolve_imports(import_nodes, module_path)
        
        return ModuleDoc(
            name=module_name,
            file_path=str(module_path),
            docstring=module_docstring,
            classes=classes,
            functions=functions,
            constants=constants,
            imported_items=imported_items
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
                try:
                    inheritance.append(ast.unparse(base))
                except:
                    inheritance.append(str(base))
        
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
                        try:
                            var_value = ast.unparse(item.value) if hasattr(ast, 'unparse') else str(item.value)
                        except:
                            var_value = "..."
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
                try:
                    arg_str += f": {ast.unparse(arg.annotation)}"
                except:
                    arg_str += ": Any"
            args.append(arg_str)
        
        # Default arguments
        defaults = node.args.defaults
        if defaults:
            num_defaults = len(defaults)
            for i, default in enumerate(defaults):
                arg_index = len(args) - num_defaults + i
                if arg_index >= 0:
                    try:
                        args[arg_index] += f" = {ast.unparse(default)}"
                    except:
                        args[arg_index] += " = ..."
        
        # *args
        if node.args.vararg:
            vararg = f"*{node.args.vararg.arg}"
            if node.args.vararg.annotation:
                try:
                    vararg += f": {ast.unparse(node.args.vararg.annotation)}"
                except:
                    vararg += ": Any"
            args.append(vararg)
        
        # **kwargs
        if node.args.kwarg:
            kwarg = f"**{node.args.kwarg.arg}"
            if node.args.kwarg.annotation:
                try:
                    kwarg += f": {ast.unparse(node.args.kwarg.annotation)}"
                except:
                    kwarg += ": Any"
            args.append(kwarg)
        
        signature = f"{node.name}({', '.join(args)})"
        
        # Return annotation
        if node.returns:
            try:
                signature += f" -> {ast.unparse(node.returns)}"
            except:
                signature += " -> Any"
        
        return signature
    
    def _analyze_constants(self, node: ast.Assign) -> List[DocParameter]:
        """Analyze module-level constants"""
        constants = []
        
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id.isupper():
                const_name = target.id
                try:
                    const_value = ast.unparse(node.value) if hasattr(ast, 'unparse') else str(node.value)
                except:
                    const_value = "..."
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
        total_imports = sum(
            len(module.imported_items) for pkg in packages for module in pkg.modules
        ) + sum(len(pkg.imported_items) for pkg in packages)
        
        return {
            'total_packages': len(packages),
            'total_modules': total_modules,
            'total_classes': total_classes,
            'total_functions': total_functions,
            'total_methods': total_methods,
            'total_imports': total_imports,
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
    mdx_lines.append("<div className='grid grid-cols-2 md:grid-cols-6 gap-4 mb-6'>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-blue-600'>{summary['total_packages']}</div><div className='text-sm text-muted-foreground'>Packages</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-green-600'>{summary['total_modules']}</div><div className='text-sm text-muted-foreground'>Modules</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-purple-600'>{summary['total_classes']}</div><div className='text-sm text-muted-foreground'>Classes</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-orange-600'>{summary['total_functions']}</div><div className='text-sm text-muted-foreground'>Functions</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-red-600'>{summary['total_methods']}</div><div className='text-sm text-muted-foreground'>Methods</div></CardContent></Card>")
    mdx_lines.append(f"  <Card><CardContent className='p-4 text-center'><div className='text-2xl font-bold text-indigo-600'>{summary['total_imports']}</div><div className='text-sm text-muted-foreground'>Analyzed Imports</div></CardContent></Card>")
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
        
        # Package tabs
        if package['modules'] or package['imported_items']:
            tab_count = 0
            tabs = []
            
            if package['modules']:
                tabs.append(('modules', 'Modules'))
                if any(module['classes'] for module in package['modules']):
                    tabs.append(('classes', 'Classes'))
                if any(module['functions'] for module in package['modules']):
                    tabs.append(('functions', 'Functions'))
            
            if package['imported_items']:
                tabs.append(('imports', 'Package Imports'))
            
            if tabs:
                mdx_lines.append("<Tabs defaultValue='modules' className='mb-8'>")
                mdx_lines.append("  <TabsList>")
                for tab_id, tab_name in tabs:
                    mdx_lines.append(f"    <TabsTrigger value='{tab_id}'>{tab_name}</TabsTrigger>")
                mdx_lines.append("  </TabsList>")
                mdx_lines.append("")
                
                # Modules tab
                if ('modules', 'Modules') in tabs:
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
                        if module['imported_items']:
                            mdx_lines.append(f"              <Badge variant='outline' className='text-xs'>{len(module['imported_items'])} imports</Badge>")
                        mdx_lines.append(f"            </div>")
                        mdx_lines.append(f"          </div>")
                        mdx_lines.append(f"        </AccordionTrigger>")
                        mdx_lines.append(f"        <AccordionContent>")
                        
                        if module['docstring']['summary']:
                            mdx_lines.append(f"          <p className='mb-4'>{_escape_mdx(module['docstring']['summary'])}</p>")
                        
                        # Module items summary
                        if module['classes'] or module['functions'] or module['imported_items']:
                            mdx_lines.append("          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>")
                            
                            if module['classes']:
                                mdx_lines.append("            <div>")
                                mdx_lines.append("              <h5 className='font-semibold mb-2'>Classes</h5>")
                                mdx_lines.append("              <ul className='space-y-1'>")
                                for cls in module['classes'][:3]:  # Show first 3
                                    mdx_lines.append(f"                <li><code>{cls['name']}</code></li>")
                                if len(module['classes']) > 3:
                                    mdx_lines.append(f"                <li className='text-sm text-muted-fore
