<script setup lang="tsx">
import { ref, reactive } from "vue";
import MyTable from "./components/MyTable/index.vue";
import type { ColumnProps } from "./components/MyTable/interface/index";
import { ElMessage } from "element-plus";
import * as XLSX from "xlsx";

const columns = reactive<ColumnProps<any>[]>([
  // fixed: "left",
  { type: "radio", width: 70 },
  // ,
  { type: "index", label: "序号", width: 80 },
  { type: "sort", label: "Sort", width: 80 },
  {
    prop: "username",
    label: "用户名",
    width: 120,
    render: (scope) => {
      return (
        <el-tag type="primary" disable-transitions={true}>
          {scope.row.username}
        </el-tag>
      );
    }
  },
  {
    prop: "base",
    label: "基本信息",
    _children: [
      { prop: "age", label: "年龄" },
      { prop: "dep", label: "部门", width: 120 },
      {
        prop: "details",
        label: "详细信息",
        _children: [
          { prop: "edu", label: "学历", width: 100 },
          { prop: "tel", label: "电话", width: 120 },
          { prop: "date", label: "出生日期", width: 120 },
          { prop: "address1", label: "地址1", width: 120 },
          { prop: "address2", label: "地址2", width: 120 }
        ]
      }
    ]
  }
]);

// myTable 实例
// const myTable = ref<MyTableInstance>();

const loading = ref(false);

const mergeConfig = reactive({
  rowMerge: ["age", "dep"], // 需要行合并的列
  colMerge: ["address1", "address2"] // 需要列合并的列
});

// 表格数据
const tableData = ref<any[]>([]);
const errorMessage = ref<string | null>(null);
// 处理 Excel 文件上传
const handleFileUpload = async (uploadFile: any) => {
  const file = uploadFile.raw; // 这里获取真正的 File 对象
  if (!file) {
    ElMessage.error("请上传有效的 Excel 文件");
    return;
  }
  loading.value = true;

  try {
    const data = await readExcelFile(file); // 解析 Excel
    if (!data.length) {
      errorMessage.value = "Excel 文件为空";
      return;
    }

    // 提取表头
    const headers = data[0] as string[];

    // 解析数据
    const parsedData = data.map((row: any[]) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || "";
      });
      return rowData;
    });
    // 去除表头
    const res = parsedData.slice(1);

    // 数据校验
    if (!validateData(res)) {
      errorMessage.value = "导入失败！数据格式错误，请检查 Excel 内容";
      return;
    }
    loading.value = false;
    // 更新表格数据
    tableData.value = res;
    errorMessage.value = null;
  } catch (error) {
    errorMessage.value = "解析 Excel 失败";
    ElMessage.error("解析 Excel 失败，请检查文件格式");
  } finally {
    loading.value = false;
  }
};

const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("文件读取失败"));
  });
};

// 数据校验
const validateData = (data: any[]): boolean => {
  for (let i = 0; i < data.length; i++) {
    if (!data[i]["username"]) {
      ElMessage.error(`导入失败！username不能为空,错误位置数据第${i + 1}行`);
      return false;
    }
    if (!validatePhone(data[i]["tel"])) {
      ElMessage.error(`导入失败！手机号格式错误,错误位置数据第${i + 1}行`);
      return false;
    }
  }

  return true;
};

const validatePhone = (phone: string) => {
  // 先移除所有非数字字符（如空格、横线等）
  const cleaned = phone.replace(/\D/g, "");

  return /^1[3-9]\d{9}$/.test(cleaned);
};

// // 初始化数据
// const initData = () => {
//   for (let i = 0; i < 20; i++) {
//     tableData.value.push({
//       id: i,
//       username: `王小虎${i}`,
//       age: i,
//       dep: '大专',
//       edu: '大专',
//       tel: `123${i}`,
//       date: `654${i}`,
//     });

//   }
// };
// initData()
</script>

<template>
  <div>
    <div class="title">表格组件封装</div>
    <div class="box">
      <div class="table-box" v-loading="loading">
        <MyTable class="errr" ref="myTable" :columns="columns" :data="tableData" :merge-config="mergeConfig" border>
          <!-- <MyTable class="errr" ref="myTable" :columns="columns" :data="tableData" border @drag-sort="sortTable"> -->
          <template #tableHeader="">
            <!-- <el-button type="primary" @click="switchSingleMultipleChoice">单选/多选</el-button>
            <el-button type="primary" @click="handleIndex">有序号/无序号</el-button> -->
            <el-upload action="" :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" @change="handleFileUpload">
              <el-button type="primary">导入 Excel</el-button>
            </el-upload>
          </template>
        </MyTable>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.title{
  text-align: center;
  padding: 20px;
}
.box {
  width: 80%;
  margin: 0 auto;
  border: 1px solid #dcdfe6;
  height: 600px;
  padding: 20px;
  border-radius: 8px;
  box-sizing: border-box;
}
// .table-box {

// }
</style>
