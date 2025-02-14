# How to configure the editor and whether it can be reused

## Question

How to configure the editor and whether it can be reused?

## Answer

VTable provides several ways to configure and reuse editors:
1. Editor configuration
2. Editor reuse strategies
3. Custom editor implementation
4. Editor lifecycle management

## Code Example

```typescript
// Method 1: Basic editor configuration
const columns = [
  {
    field: 'text',
    title: 'Text Editor',
    width: 150,
    editor: {
      type: 'text',
      reusable: true, // Enable editor reuse
      options: {
        autoSelect: true,
        autoValidate: true
      }
    }
  },
  {
    field: 'select',
    title: 'Select Editor',
    width: 150,
    editor: {
      type: 'select',
      reusable: true,
      options: {
        values: ['Option 1', 'Option 2', 'Option 3']
      }
    }
  }
];

// Create table with reusable editors
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global editor configuration
  editor: {
    enabled: true,
    reusable: true,
    defaultOptions: {
      autoCommit: true,
      autoSelect: true
    }
  }
});

// Method 2: Editor manager for reuse
class EditorManager {
  constructor(table) {
    this.table = table;
    this.editors = new Map();
    this.setupEditorHandling();
  }
  
  setupEditorHandling() {
    this.table.on('before-edit', (event) => {
      const editor = this.getEditor(event.cell);
      if (editor) {
        event.editor = editor;
      }
    });
    
    this.table.on('editor-dispose', (event) => {
      this.removeEditor(event.editor);
    });
  }
  
  getEditor(cell) {
    const key = this.getEditorKey(cell);
    if (this.editors.has(key)) {
      return this.editors.get(key);
    }
    
    const editor = this.createEditor(cell);
    if (editor) {
      this.editors.set(key, editor);
    }
    
    return editor;
  }
  
  getEditorKey(cell) {
    return `${cell.column.field}-${cell.column.editor.type}`;
  }
  
  createEditor(cell) {
    const { editor } = cell.column;
    if (!editor || !editor.reusable) return null;
    
    return {
      type: editor.type,
      options: editor.options,
      element: this.createEditorElement(editor)
    };
  }
  
  createEditorElement(editor) {
    // Create and configure editor element
    switch (editor.type) {
      case 'text':
        return this.createTextEditor(editor.options);
      case 'select':
        return this.createSelectEditor(editor.options);
      default:
        return null;
    }
  }
  
  createTextEditor(options) {
    const input = document.createElement('input');
    input.type = 'text';
    Object.assign(input.style, {
      width: '100%',
      height: '100%',
      padding: '4px',
      border: 'none',
      outline: 'none'
    });
    return input;
  }
  
  createSelectEditor(options) {
    const select = document.createElement('select');
    options.values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.text = value;
      select.appendChild(option);
    });
    return select;
  }
  
  removeEditor(editor) {
    for (const [key, value] of this.editors.entries()) {
      if (value === editor) {
        this.editors.delete(key);
        break;
      }
    }
  }
  
  dispose() {
    this.editors.clear();
  }
}

// Initialize editor manager
const editorManager = new EditorManager(table);

// Method 3: Custom reusable editor
class CustomEditor {
  constructor(options) {
    this.element = this.createElement();
    this.configure(options);
  }
  
  createElement() {
    const container = document.createElement('div');
    container.className = 'custom-editor';
    // Add editor elements
    return container;
  }
  
  configure(options) {
    // Apply configuration
  }
  
  getValue() {
    // Return editor value
  }
  
  setValue(value) {
    // Set editor value
  }
  
  focus() {
    // Focus editor
  }
  
  dispose() {
    // Clean up
  }
}

// Register custom editor
table.registerEditor('custom', CustomEditor);
```

## Related Links

- [VTable Editor Documentation](https://visactor.io/vtable/guide/basic_concept/editor)
- [Editor Configuration Guide](https://visactor.io/vtable/guide/basic_concept/editor_config)
- [Custom Editor Examples](https://visactor.io/vtable/examples/editor/custom)