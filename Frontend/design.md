好的！基于你的 `designToken.ts` 和所有组件文件，我为你整理出完整的设计规范文档。

---

# 🎨 ChunkMaster 设计系统规范

## 一、配色系统（Color System）

### 1.1 品牌主色

| 颜色名称 | 色值 | 用途 | 使用场景 |
|---------|------|------|----------|
| **Green** | `#58CC02` | 主要品牌色 | 主按钮、成功状态、进度条、激活指示器 |
| **Green Dark** | `#3D8F00` | 主色阴影 | 按钮阴影、按压状态 |
| **Blue** | `#1CB0F6` | 辅助品牌色 | 信息提示、示例边框、链接 |
| **Blue Dark** | `#0A7AB0` | 辅助色阴影 | 次要按钮阴影 |
| **Purple** | `#CE82FF` | 强调品牌色 | 特殊按钮、标签、分类标识 |
| **Purple Dark** | `#8A40CC` | 强调色阴影 | 紫色按钮阴影 |

### 1.2 功能色

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| **Orange** | `#FF9600` | 警告、提示、Streak 火焰 |
| **Red** | `#FF4B4B` | 错误状态、需要复习的标记 |

### 1.3 背景色（Background）

| 层级 | 色值 | 用途 |
|------|------|------|
| **Primary BG** | `#121212` | 全局主背景（`C.bg`） |
| **Surface 1** | `#2A2A2E` | 卡片背景、容器背景（`C.surface`） |
| **Surface 2** | `#1E1E22` | TabBar 背景、次级容器（`C.surface2`） |
| **Surface 3** | `#3A3A3E` | 按钮背景、输入框背景（`C.surface3`） |
| **Dim** | `#1A1A1E` | 阴影色、分隔线（`C.dim`） |

### 1.4 文字色（Text）

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| **White** | `#FFFFFF` | 主标题、重要文字 |
| **Gray** | `#A1A1AA` | 次要文字、辅助说明、占位符 |

---

## 二、字体系统（Typography）

### 2.1 字体家族

```css
font-family: 'Nunito', sans-serif;
```
- **权重范围**：400（常规）、600（半粗）、700（粗体）、800（特粗）、900（黑色）

### 2.2 字号与字重规范

| 层级 | 字号 | 字重 | 行高 | 使用场景 |
|------|------|------|------|----------|
| **H1** | 22px | 900 | 1.2 | 页面标题（如 "My Chunks"、"Settings"） |
| **H2** | 20px | 900 | 1.2 | App 品牌名称 |
| **H3** | 15px | 700 | 1.75 | 段落正文、卡片内描述 |
| **Body Large** | 14px | 700-800 | 1.6 | 按钮文字、列表项 |
| **Body** | 13px | 600-700 | 1.6 | 辅助文字、示例句子 |
| **Label** | 10-11px | 800-900 | 1.2 | 标签、分类标题、统计数字 |
| **Caption** | 9px | 800 | 1.2 | 极小的辅助信息 |

### 2.3 特殊字体样式

| 样式 | 属性 | 使用场景 |
|------|------|----------|
| **渐变文字** | `background: linear-gradient(135deg, color1, color2);`<br>`-webkit-background-clip: text;`<br>`-webkit-text-fill-color: transparent;` | 主标题、数字强调（如 Goal 数字） |
| **大写字母** | `text-transform: uppercase;`<br>`letter-spacing: 0.12em;` | Label 组件、统计标签 |
| **短语大字** | 30px / 900 / 1.2 | ChunkCard 中的目标短语 |

---

## 三、间距系统（Spacing）

### 3.1 内边距（Padding）

| 层级 | 数值 | 使用场景 |
|------|------|----------|
| **XS** | 4px 10px | 分类标签内边距 |
| **SM** | 6px 12px / 7px 12px | 小按钮、Streak 标签 |
| **MD** | 10px 14px / 13px 16px | 输入框、标准按钮 |
| **LG** | 13px 22px | 大按钮 |
| **XL** | 17px 28px | 超大按钮 |
| **Card** | 20px | 卡片内边距 |

### 3.2 外边距（Margin）

| 层级 | 数值 | 使用场景 |
|------|------|----------|
| **XS** | 8px | 组件内小间距 |
| **SM** | 10px | 行内元素间距 |
| **MD** | 12px | 模块间距 |
| **LG** | 14-16px | 区块间距 |
| **XL** | 20-28px | 页面边距、大区块间距 |

### 3.3 常用间距组合

```
页面水平边距：20px
卡片间距：12px
组件内间距：8-12px
列表项间距：8px
图标与文字间距：5-10px
```

---

## 四、组件样式规范（Component Styles）

### 4.1 按钮（Button）

| 属性 | 值 |
|------|-----|
| **圆角** | `16px` |
| **字体** | Nunito, 900 |
| **默认阴影** | `0 5px 0 {shadowColor}` |
| **按压状态** | `transform: translateY(5px); box-shadow: none;` |
| **禁用状态** | `opacity: 0.45; cursor: not-allowed;` |

**按钮尺寸：**

| 尺寸 | 字号 | 内边距 |
|------|------|--------|
| XS | 11px | 6px 12px |
| SM | 13px | 9px 18px |
| MD | 15px | 13px 22px |
| LG | 18px | 17px 28px |
| XL | 21px | 20px 0 |

**颜色变体：**

| 变体 | 背景色 | 阴影色 | 文字色 |
|------|--------|--------|--------|
| Primary | `C.green` | `C.greenDark` | `C.white` |
| Secondary | `C.purple` | `C.purpleDk` | `C.white` |
| Ghost | `C.surface` | `C.dim` | `C.gray` |

---

### 4.2 卡片（Card）

| 属性 | 值 |
|------|-----|
| **背景色** | `C.surface` |
| **圆角** | `20px` |
| **内边距** | `20px` |
| **阴影** | `0 6px 0 ${C.dim}` |

---

### 4.3 开关（Toggle）

| 属性 | 值 |
|------|-----|
| **尺寸** | 56px × 30px |
| **圆角** | 15px |
| **滑块尺寸** | 22px × 22px |
| **开启状态** | 背景 `C.green`，阴影 `C.greenDark` |
| **关闭状态** | 背景 `C.surface3`，阴影 `C.dim` |
| **过渡动画** | `0.22s cubic-bezier(.34,1.56,.64,1)` |

---

### 4.4 TabBar（底部导航）

| 属性 | 值 |
|------|-----|
| **高度** | 68px |
| **背景** | `C.surface2` |
| **顶部边框** | `1px solid rgba(255,255,255,0.07)` |
| **阴影** | `0 -8px 28px rgba(0,0,0,0.55)` |
| **激活指示器** | 宽40px，高3px，颜色 `C.green`，带发光效果 |

---

### 4.5 进度条（ProgressBar）

| 属性 | 值 |
|------|-----|
| **高度** | 10px |
| **圆角** | 10px |
| **背景** | `C.surface3` |
| **填充** | `linear-gradient(90deg, color, colorCC)` |
| **发光** | `0 0 10px color66` |

---

### 4.6 输入框（Search / Input）

| 属性 | 值 |
|------|-----|
| **背景** | `C.surface` |
| **圆角** | `14px` |
| **内边距** | `10px 14px` |
| **阴影** | `0 3px 0 ${C.dim}` |
| **边框** | 激活时 `1.5px solid ${C.purple}88` |
| **文字色** | `C.white` |
| **占位符色** | `C.gray` |

---

### 4.7 标签（Label）

| 属性 | 值 |
|------|-----|
| **字号** | 10px |
| **字重** | 900 |
| **字母间距** | `0.12em` |
| **大写** | `uppercase` |
| **下边距** | 12px |

---

### 4.8 分类标签（Pill）

| 属性 | 值 |
|------|-----|
| **圆角** | 24px |
| **内边距** | 7px 14px |
| **字号** | 13px |
| **字重** | 800 |
| **激活状态** | 边框 2px 色值，背景 `cat.bg`，文字 `cat.color`，阴影 `0 4px 0 color33` |
| **非激活状态** | 背景 `C.surface`，文字 `C.gray`，阴影 `0 3px 0 ${C.dim}` |

---

### 4.9 步骤按钮（StepBtn）

| 属性 | 值 |
|------|-----|
| **尺寸** | 48px × 48px |
| **圆角** | 13px |
| **背景** | `C.surface3` |
| **阴影** | `0 4px 0 ${C.dim}` |
| **按压状态** | `transform: translateY(4px); box-shadow: none;` |
| **字号** | 24px |

---

### 4.10 选项按钮（OptionBtn）

| 属性 | 值 |
|------|-----|
| **圆角** | 13px |
| **内边距** | 13px 16px |
| **字号** | 14px |
| **字重** | 800 |
| **正确状态** | 背景 `#1A3A1A`，边框 `C.green`，文字 `C.green` |
| **错误状态** | 背景 `#3A1A1A`，边框 `C.red`，文字 `C.red` |
| **默认状态** | 背景 `C.surface3`，阴影 `0 3px 0 ${C.dim}` |

---

## 五、阴影规范（Shadow）

| 层级 | 值 | 使用场景 |
|------|-----|----------|
| **Light** | `0 3px 0 ${C.dim}` | 小按钮、标签、输入框 |
| **Medium** | `0 4px 0 ${C.dim}` | 卡片、Toggle、步进按钮 |
| **Heavy** | `0 6px 0 ${C.dim}` | 主卡片 |
| **TabBar** | `0 -8px 28px rgba(0,0,0,0.55)` | 底部导航 |
| **Glow** | `0 0 10px color66` | 进度条发光 |
| **Button** | `0 5px 0 shadowColor` | 主按钮 |

---

## 六、圆角规范（Border Radius）

| 层级 | 值 | 使用场景 |
|------|-----|----------|
| **Small** | 6-10px | 小徽章、内联标签 |
| **Medium** | 10-13px | 按钮、输入框、选项 |
| **Large** | 14-16px | 卡片、大按钮、输入框 |
| **X-Large** | 20px | 主卡片 |
| **Full** | 50% | 头像、圆点 |

---

## 七、动效规范（Animation）

### 7.1 过渡时间

| 速度 | 值 | 使用场景 |
|------|-----|----------|
| **Instant** | 0.08s | 按钮按压反馈 |
| **Fast** | 0.15-0.2s | 分类标签切换、卡片展开 |
| **Medium** | 0.22-0.3s | Toggle 切换、卡片出现 |
| **Slow** | 0.4-0.5s | 进度条过渡 |

### 7.2 缓动函数

```css
/* 默认使用 */
transition: all 0.22s cubic-bezier(.34, 1.56, .64, 1);

/* 按钮按压 */
transition: transform 0.08s ease, box-shadow 0.08s ease;
```

### 7.3 入场动画

```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 八、快速参考卡

### 颜色速查

```typescript
C.green      // #58CC02 - 主色
C.greenDark  // #3D8F00 - 主色阴影
C.blue       // #1CB0F6 - 辅助色
C.purple     // #CE82FF - 强调色
C.red        // #FF4B4B - 错误
C.orange     // #FF9600 - 警告
C.bg         // #121212 - 背景
C.surface    // #2A2A2E - 卡片
C.white      // #FFFFFF - 主文字
C.gray       // #A1A1AA - 辅助文字
```

### 常用组件导入

```typescript
import { Button, Card, Toggle, ProgressBar, Label, Pill, TabBar } from '@/components/ui';
import { C } from '@/constants/designTokens';
```

### 间距速查

```typescript
// 内边距
padding: "20px"           // 卡片
padding: "13px 22px"      // 标准按钮
padding: "10px 14px"      // 输入框

// 外边距
gap: 12px                 // 组件间距
marginBottom: 12px        // 区块间距
padding: "0 20px"         // 页面水平边距
```

---

src/
├── components/
│   ├── ui/
│   │   └── Button/
│   │       ├── button.tsx
│   │       ├── optionBtn.tsx
│   │       ├── stepBtn.tsx
│   │       └── index.ts
│   ├── business/
│   │   ├── ChunkCard/
│   │   │   ├── chunkCard.tsx
│   │   │   └── index.ts
│   │   ├── EmptyState/
│   │   │   ├── emptyState.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── pages/
│   ├── Home/
│   │   ├── homeScreen.tsx
│   │   └── index.ts
│   ├── Library/
│   │   ├── libraryScreen.tsx
│   │   └── index.ts
│   ├── Settings/
│   │   ├── settingsScreen.tsx
│   │   └── index.ts
│   └── index.ts
├── constants/
│   ├── categories.ts
│   ├── weekData.ts
│   └── designTokens.ts
├── hooks/
│   └── usePress.ts
├── utils/
│   ├── array.ts
│   └── category.ts
├── types/
│   └── chunk.ts
├── api/
│   └── ... (已有)
└── App.tsx  ✅ 现在只有 100 行！