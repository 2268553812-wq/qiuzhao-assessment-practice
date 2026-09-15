# 题库维护说明

## 新增题目

在 `src/questions.ts` 的 `questions` 数组中追加：

```ts
{
  id: 'unique-id',
  platform: '北森',
  category: '资料分析',
  difficulty: '入门',
  stem: '题干',
  options: ['A', 'B', 'C', 'D'],
  answer: 0,
  explanation: '解析',
  tip: '练习提示'
}
```

## 字段规则

- `id` 必须唯一。
- `answer` 从 0 开始计数，0 表示 A，1 表示 B。
- `platform` 和 `category` 必须使用文件顶部已有枚举值。
- 如果题目来自经验帖或非官方来源，建议在解析里说明“用于题型练习，不代表官方原题”。
