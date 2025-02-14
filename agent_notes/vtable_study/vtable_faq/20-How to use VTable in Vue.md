# How to use VTable in Vue

## Question

How to use VTable in Vue?

## Answer

VTable can be integrated into Vue applications through:
1. Component wrapper
2. Direct instantiation
3. Vue lifecycle hooks
4. Two-way data binding

## Code Example

```typescript
// VTable.vue
<template>
  <div ref="tableContainer"></div>
</template>

<script>
import { VTable } from '@visactor/vtable';

export default {
  name: 'VTableComponent',
  props: {
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      tableInstance: null
    };
  },
  mounted() {
    this.initTable();
  },
  methods: {
    initTable() {
      this.tableInstance = new VTable.ListTable({
        container: this.$refs.tableContainer,
        columns: this.columns,
        records: this.data,
        ...this.options
      });

      // Emit events
      this.tableInstance.on('click', (event) => {
        this.$emit('cell-click', event);
      });

      this.tableInstance.on('selection-change', (event) => {
        this.$emit('selection-change', event);
      });
    }
  },
  watch: {
    // Watch for data changes
    data: {
      handler(newData) {
        if (this.tableInstance) {
          this.tableInstance.setRecords(newData);
        }
      },
      deep: true
    },
    // Watch for column changes
    columns: {
      handler(newColumns) {
        if (this.tableInstance) {
          this.tableInstance.updateColumns(newColumns);
        }
      },
      deep: true
    }
  },
  beforeDestroy() {
    // Cleanup
    if (this.tableInstance) {
      this.tableInstance.dispose();
    }
  }
};
</script>

// Usage in parent component
<template>
  <div>
    <v-table
      :columns="columns"
      :data="tableData"
      :options="tableOptions"
      @cell-click="handleCellClick"
      @selection-change="handleSelectionChange"
    />
  </div>
</template>

<script>
import VTable from './components/VTable.vue';

export default {
  components: {
    VTable
  },
  data() {
    return {
      columns: [
        { field: 'name', title: 'Name' },
        { field: 'age', title: 'Age' }
      ],
      tableData: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ],
      tableOptions: {
        width: 800,
        height: 400,
        selection: {
          enabled: true
        }
      }
    };
  },
  methods: {
    handleCellClick(event) {
      console.log('Cell clicked:', event);
    },
    handleSelectionChange(event) {
      console.log('Selection changed:', event);
    }
  }
};
</script>
```

## Related Links

- [VTable Vue Integration Guide](https://visactor.io/vtable/guide/integration/vue)
- [Vue Component Examples](https://visactor.io/vtable/examples/vue/basic)
- [Vue Data Binding](https://visactor.io/vtable/guide/integration/vue_binding)