# 秋招网申测评刷题站

一个适合 27 届秋招准备的在线刷题 Web App，内置北森、SHL 等常见网申测评平台题型，可直接部署到 GitHub Pages。

## 功能亮点

- **北森专项题库**：当前内置 1240 道北森题型模拟/复原练习题。
- **SHL 专项题库**：当前内置 1240 道 SHL 题型模拟/复原练习题，覆盖 Verbal、Numerical、Inductive、Deductive、SJT、Personality、English。
- **按平台专项练习**：支持北森、SHL、Aon、Talview/Mettl、通用校招筛选。
- **按题型专项练习**：支持言语理解、数字推理、资料分析、图形推理、逻辑推理、情境判断、性格测评、英语能力。
- **秋招比例套题**：按常见网申测评结构自动组卷，包括通用秋招 40 题、北森专项 50 题、SHL 专项 50 题。
- **交卷报告**：套题模式下先答题，交卷后统一展示得分、正确率、错题、未答题和分题型表现。
- **弱项推荐**：根据历史练习记录或本卷错题，自动推荐下一组薄弱题型强化练习。
- **本地进度记录**：使用浏览器 localStorage 保存答题次数、正确率和掌握程度。
- **掌握率可视化**：右侧图表展示不同题型的掌握情况。

> 说明：题目用于秋招网申测评练习和复盘，题库数据默认放在 `src/questions.ts`。公开发布时建议标注“练习题/复原题”，不要承诺为官方最新原题。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- lucide-react

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址即可。

## 构建

```bash
npm run build
```

构建产物会生成到 `dist/` 目录。

## 发布到 GitHub Pages：推荐方式

本项目已经内置 GitHub Actions 自动部署文件：

```text
.github/workflows/deploy.yml
```

发布步骤：

1. 在 GitHub 新建一个仓库，例如 `qiuzhao-assessment-practice`。
2. 把本项目代码上传到该仓库的 `main` 分支。
3. 进入仓库 **Settings → Pages**。
4. 在 **Build and deployment** 中将 Source 选择为 **GitHub Actions**。
5. 回到仓库首页，等待 Actions 自动构建和发布。
6. 发布成功后，访问地址通常是：

```text
https://你的GitHub用户名.github.io/仓库名/
```

例如：

```text
https://your-name.github.io/qiuzhao-assessment-practice/
```

## 发布到 GitHub Pages：手动方式

如果你更想本地手动发布，可以使用：

```bash
npm run deploy:gh-pages
```

首次手动发布前，需要确保本地已经登录 GitHub，并且仓库远程地址已经配置好。

## 修改题库

题库文件位于：

```text
src/questions.ts
```

每道题的结构类似：

```ts
{
  id: 'example-001',
  platform: '北森',
  category: '资料分析',
  difficulty: '中等',
  stem: '题干内容',
  options: ['A选项', 'B选项', 'C选项', 'D选项'],
  answer: 0,
  explanation: '解析内容',
  tip: '练习提示',
  sourceType: '模拟题'
}
```

如需继续扩充真实整理题，可以按这个结构追加到 `questions` 数组或对应生成函数中。

## 注意事项

- `dist/`、`node_modules/` 不需要上传到 GitHub，已经在 `.gitignore` 中忽略。
- 进度记录保存在用户自己的浏览器中，不会上传到服务器。
- 如果修改仓库名，一般不需要改 `vite.config.ts`，当前配置 `base: './'` 已兼容 GitHub Pages 子路径发布。
