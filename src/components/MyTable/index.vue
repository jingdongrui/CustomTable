<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch, onBeforeUnmount } from "vue";
import { ElTable } from "element-plus";
import type { TypeProps, ColumnProps } from "./interface/index";
import Sortable from "sortablejs";
import { v4 as uuidv4 } from "uuid";
import { ElMessage } from "element-plus";
import { useVirtualized } from "./hooks/useVirtualizedTable";
import type { TableColumnCtx } from "element-plus";

import TableColumn from "./components/TableColumn.vue";

defineOptions({
  inheritAttrs: false
});

export interface MyTableProps {
  columns: ColumnProps[]; // 列配置项  ==> 必传
  data: any[]; // 列配置项  ==> 必传
  mergeConfig?: { rowMerge: string[]; colMerge: string[] }; // 合并配置项 ==> 非必传
  rowKey?: string; // 行数据的 Key，用来优化 Table 的渲染，当表格数据多选时，所指定的 id ==> 非必传（默认为 id）
}

// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<MyTableProps>(), {
  columns: () => [],
  data: () => [],
  mergeConfig: () => ({ rowMerge: [], colMerge: [] }),
  rowKey: "id"
});

// table 实例
const tableRef = ref<InstanceType<typeof ElTable>>();

// 生成组件唯一id
const componentId = ref("id-" + uuidv4());

// 列的类型
const columnTypes: TypeProps[] = ["selection", "radio", "index", "expand", "sort"];

// 接收 columns 设置为响应式
const tableColumns = reactive<ColumnProps[]>(props.columns);

//  表格数据
const usedData = ref<any[]>(props.data);

// 单选值
const radio = ref("");

// 扁平化 columns
const flatColumns = computed(() => flatColumnsFunc(tableColumns));

// // 定义 emit 事件
// const emit = defineEmits<{
//   dragSort: [{ newIndex?: number; oldIndex?: number }];
// }>();

const { scrollContainerEl, updateRenderedItemCache, updateOffset, getDom, getItemHeightFromCache, saveDATA } = useVirtualized();

// 表格拖拽排序
const dragSort = () => {
  const tbody = document.querySelector(`#${componentId.value} tbody`) as HTMLElement;
  Sortable.create(tbody, {
    handle: ".move",
    animation: 300,
    onEnd({ newIndex, oldIndex }) {
      const [removedItem] = saveDATA.value.splice(oldIndex!, 1);
      usedData.value.splice(newIndex!, 0, removedItem);
      // emit("dragSort", { newIndex, oldIndex });
      ElMessage.success("拖动变更行位置成功");
      getSpanArr(usedData.value);
    }
  });
};

// 扁平化 columns 的方法
const flatColumnsFunc = (columns: ColumnProps[], flatArr: ColumnProps[] = []) => {
  columns.forEach(async (col) => {
    if (col._children?.length) flatArr.push(...flatColumnsFunc(col._children));
    flatArr.push(col);
  });
  return flatArr.filter((item) => !item._children?.length);
};

// 控制单选多选
const switchSingleMultipleChoice = () => {
  tableColumns[0].type === "selection"
    ? tableColumns.splice(0, 1, { ...tableColumns[0], type: "radio" })
    : tableColumns.splice(0, 1, { ...tableColumns[0], type: "selection" });

  // ElMessage.success("单选多选切换成功");
};

// 是否显示序号
const isSerialNumber = ref(true);
const handleIndex = () => {
  isSerialNumber.value ? tableColumns.splice(1, 1) : tableColumns.splice(1, 0, { type: "index", label: "序号", width: 80 });
  isSerialNumber.value = !isSerialNumber.value;

  // ElMessage.success("序号切换成功");
};

// 合并
interface SpanMethodProps {
  row: any;
  column: TableColumnCtx<any>;
  rowIndex: number;
  columnIndex: number;
}
const mergeConfig = props.mergeConfig;

const spanArr = ref<{ [key: string]: number[] }>({});
const pos = ref<{ [key: string]: number }>({});
// 计算数据行合并
const getSpanArr = (data: any) => {
  // console.log(mergeConfig);

  spanArr.value = {};
  pos.value = {};
  mergeConfig.rowMerge.forEach((field) => {
    spanArr.value[field] = Array(data.length).fill(1); // 初始化合并数组
    pos.value[field] = 0;

    // for (let i = 0; i < data.length; i++) {
    //   // 当为第一行时
    //   if (i === 0) {
    //     spanArr.value.push(1); // 1：独自占一行
    //     pos.value = 0; // 合并的起始行
    //   } else {
    //     // 判断当前值是否与上一行的值相等，相等则进行合并
    //     if (data[i][field] === data[i - 1][field]) {
    //       spanArr.value[pos.value] += 1; // 合并单元格：合并的行数 +1
    //       spanArr.value.push(0); // 0代表单元格是不需要显示, 已经被合并的单元格
    //     } else {
    //       spanArr.value.push(1); // 1代表当前这行的数据需要被显示
    //       pos.value = i; // 存放需要合并行的索引
    //     }
    //   }
    // }

    for (let i = 1; i < data.length; i++) {
      if (data[i][field] === data[i - 1][field]) {
        spanArr.value[field][pos.value[field]] += 1; // 让起始行增加 rowspan
        spanArr.value[field][i] = 0; // 当前行不显示
      } else {
        pos.value[field] = i; // 记录新合并起点
      }
    }
  });
};
// 👇合并行和列 示例：第1列的“行”合并 & 第3列和第4列如果金额相等就“列”合并
const arraySpanMethod = ({ row, column, rowIndex, columnIndex }: SpanMethodProps) => {
  // console.log(column);
  // 合并列方法
  // if (columnIndex === 9) {
  //   if (row.address1 === row.address2) {
  //     return [1, 2];
  //   }
  // }
  // if (columnIndex === 10) {
  //   if (row.address1 === row.address2) {
  //     return [0, 0];
  //   }
  // }
  // console.log(flatColumns.value);
  const mergeColIndexs: number[] = [];
  mergeConfig.colMerge.forEach((i) => {
    const a = flatColumns.value.findIndex((ele) => ele.prop == i);
    mergeColIndexs.push(a);
  });

  if (columnIndex === mergeColIndexs[0]) {
    const field = column.property; // 获取当前列绑定的字段名
    const nextField = mergeConfig.colMerge[mergeConfig.colMerge.indexOf(field) + 1];
    if (row[field] === row[nextField]) {
      return [1, 2];
    }
  }
  if (columnIndex === mergeColIndexs[1]) {
    const field = column.property; // 获取当前列绑定的字段名
    const nextField = mergeConfig.colMerge[mergeConfig.colMerge.indexOf(field) - 1];
    if (row[field] === row[nextField]) {
      return [0, 0];
    }
  }

  // 处理列合并
  // if (mergeConfig.colMerge.includes(field)) {
  //   // console.log(field);
  //   const nextField = mergeConfig.colMerge[mergeConfig.colMerge.indexOf(field) + 1];
  //   // console.log(nextField);
  //   if (nextField && row[field] === row[nextField]) {
  //     return { rowspan: 1, colspan: 2 };
  //   }
  //   // // console.log(flatColumns.value);
  //   // // console.log(nextField);
  //   // const index = flatColumns.value.findIndex((i) => {
  //   //   // console.log( i.prop);
  //   //   return i.prop === nextField;
  //   // });
  //   // console.log();
  //   // console.log(index,columnIndex);
  //   // if (columnIndex === 10) {
  //   //   return [0, 0];
  //   // }
  // }

  // 处理行合并
  if (mergeConfig.rowMerge.includes(column.property)) {
    const rowspan = spanArr.value[column.property]?.[rowIndex] ?? 1;
    return { rowspan, colspan: rowspan > 0 ? 1 : 0 };
  }
};


// 初始化表格
onMounted(async () => {
  dragSort();
  await nextTick();
  saveDATA.value = props.data;
  getDom();
  scrollContainerEl.value?.addEventListener("scroll", handleScroll);
});

// 滚动相关
const sIndxe = ref(1);
// 更新实际渲染数据
const updateRenderData = (scrollTop: number) => {
  let startIndex = 0;
  let offsetHeight = 0;
  for (let i = 0; i < saveDATA.value.length; i++) {
    offsetHeight += getItemHeightFromCache(i);
    if (offsetHeight >= scrollTop) {
      startIndex = i;
      break;
    }
  }
  // 计算得出的渲染数据
  usedData.value = saveDATA.value.slice(startIndex, startIndex + 40);
  // 缓存最新的列表项高度
  updateRenderedItemCache(startIndex);
  // 更新偏移值
  updateOffset(offsetHeight - getItemHeightFromCache(startIndex));

  // console.log(startIndex);
  sIndxe.value = startIndex;

  getSpanArr(usedData.value);
};
// 滚动事件
const handleScroll = (e: Event) => {
  // 渲染正确的数据
  const target = e.target as HTMLElement
  updateRenderData(target.scrollTop);
};
// 移除滚动事件
onBeforeUnmount(() => {
  // console.log("移除滚动事件")

  scrollContainerEl.value?.removeEventListener("scroll", handleScroll);
});

watch(
  () => props.data,
  (val) => {
    saveDATA.value = val;
    updateRenderData(0);
  },
  { deep: true, immediate: true }
);

defineExpose({
  element: tableRef,
  tableData: usedData
});
</script>

<template>
  <div class="table-main">
    <!-- 头部操作按钮 -->
    <!-- 表格头部 操作按钮 -->
    <div class="table-header">
      <div class="header-button-lf">
        <el-button type="primary" @click="switchSingleMultipleChoice">单选/多选</el-button>
        <el-button type="primary" @click="handleIndex">有序号/无序号</el-button>
        <slot name="tableHeader" />
      </div>
    </div>
    <!-- 表格 -->
    <el-table
      ref="tableRef"
      class="t_table_use_virtual"
      v-bind="$attrs"
      :id="componentId"
      :data="usedData"
      :row-key="rowKey"
      style="width: 100%"
      :span-method="arraySpanMethod"
    >
      <!-- <slot /> -->
      <template v-for="item in tableColumns" :key="item">
        <!-- selection || radio || index || expand || sort -->
        <el-table-column
          v-if="item.type && columnTypes.includes(item.type)"
          v-bind="item"
          :index="(i:number)=>i+1+sIndxe"
          :align="item.align ?? 'center'"
          :fixed="item.fixed"
        >
          <template #default="scope">
            <!-- radio -->
            <el-radio v-if="item.type == 'radio'" v-model="radio" :label="scope.row[rowKey]" class="tableRadio">
              <i></i>
            </el-radio>
            <!-- sort -->
            <el-tag v-if="item.type == 'sort'" class="move" :disable-transitions="true">
              <el-icon> <DCaret /></el-icon>
            </el-tag>
          </template>
        </el-table-column>

        <!-- other -->
        <TableColumn v-else :column="item">
          <template v-for="slot in Object.keys($slots)" #[slot]="scope">
            <slot :name="slot" v-bind="scope" />
          </template>
        </TableColumn>
      </template>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
// 解决单选的label元素影响单选框
.tableRadio {
  :deep(.el-radio__label) {
    display: none;
  }
}
// 解决单选多选框cell高度不一致导致的切换抖动
:deep(.el-table__body-wrapper .el-table-column--selection > .cell) {
  height: 32px;
}
</style>
