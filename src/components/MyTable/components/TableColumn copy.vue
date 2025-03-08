<template>
  <el-table-column
    :prop="column.prop"
    :label="column.label"
    :fixed="column.fixed"
    :sortable="column.sortable"
    :width="column.width"
    :align="column.align ?? 'center'"
  >
    <!-- 如果有子列，递归渲染 -->
    <template v-if="column.children" #default="scope">
      {{ scope.row }}
      <TableColumn v-for="child in column.children" :key="child.prop" :column="child" />
    </template>
    <!-- <template #header="scope"> {{ scope.row }} </template> -->
  </el-table-column>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

interface TableColumn {
  prop: string;
  label: string;
  align: "left" | "center" | "right";
  fixed?: boolean | string;
  sortable?: boolean | string;
  width?: string | number;
  children?: TableColumn[];
}

const props = defineProps<{
  column: TableColumn;
}>();
</script>
