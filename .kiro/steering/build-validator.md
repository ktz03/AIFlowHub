---
inclusion: manual
---

# 构建验证器 (Build Validator)

当用户说 "验证构建" 或 "@build-validator" 时，执行以下检查：

## 验证步骤

### 1. TypeScript 编译检查
```bash
cd Flowise && pnpm run build
```
- 检查是否有编译错误
- 记录所有 TypeScript 类型错误

### 2. ESLint 检查
```bash
cd Flowise && pnpm run lint
```
- 检查代码风格问题
- 记录所有 lint 警告和错误

### 3. 依赖检查
```bash
cd Flowise && pnpm install --frozen-lockfile
```
- 确保依赖版本一致
- 检查是否有缺失的依赖

### 4. 数据库迁移检查
```bash
cd Flowise && pnpm run migration:run
```
- 确保迁移脚本可以正常执行

## 输出格式

```
🔍 构建验证报告
================
✅ TypeScript 编译: 通过/失败
✅ ESLint 检查: 通过/失败 (X 警告, Y 错误)
✅ 依赖安装: 通过/失败
✅ 数据库迁移: 通过/失败

总结: X/4 项检查通过
```

## 失败处理

如果任何检查失败：
1. 详细列出错误信息
2. 提供修复建议
3. 询问是否需要自动修复
