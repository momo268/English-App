# 前端面试知识点问答（4 年经验 · 杭州）

> 配套文件：`english-project-upgrade-plan.md`
>
> **使用方式**
> - **P0**：必须背熟，能用自己的话讲 2 分钟，手写题能默写。
> - **P1**：能讲清概念 + 项目里用过；被追问不慌。
> - **P2**：按目标岗位选（AI / 可视化），不要全背。
> - **P3**：了解即可，遇到 JD 再补。
>
> **答题结构**：定义 → 原理 → 使用场景 → 注意点/坑 →（可选）项目例子。
> 面试时不要背课文，先给结论，再展开 2-3 点，最后落到项目。

---

## 目录

1. JavaScript（P0）
2. TypeScript（P1）
3. CSS（P0）
4. 浏览器与网络（P0）
5. Vue3（P0）
6. React（P1）
7. 工程化与性能（P0/P1）
8. Node / NestJS / 后端（P1）
9. Docker / CI-CD / 运维（P1）
10. 测试（P1）
11. AI / Agent（P2）
12. 可视化 / Three.js / Electron（P2/P3）
13. 算法与手写题（P0）
14. 项目与 HR 问题（P0）

---

## 1. JavaScript（P0）

### 1.1 var、let、const 有什么区别？

**答：**

- **作用域**：`var` 是函数作用域，`let/const` 是块级作用域（`{}`、`for`、`if` 内）。
- **变量提升**：`var` 会提升到作用域顶部并初始化为 `undefined`；`let/const` 也会提升，但存在**暂时性死区（TDZ）**，声明前访问会抛 `ReferenceError`。
- **重复声明**：`var` 可以重复声明；`let/const` 同一作用域不能重复声明。
- **全局对象**：浏览器里 `var` 声明的全局变量会成为 `window` 的属性；`let/const` 不会。
- **const**：必须初始化，且不能重新赋值；但引用类型内部属性可以改（`const obj = {}; obj.a = 1` 合法）。

**加分点：** `for` 循环里 `var` 和 `let` 的经典差异（`let` 每轮创建新绑定，`setTimeout` 输出 0-4；`var` 输出 5 个 5）。

**坑：** `typeof` 一个未声明的变量不会报错（返回 `"undefined"`），但访问 TDZ 中的 `let` 会报错。

---

### 1.2 JavaScript 有哪些数据类型？怎么判断？

**答：**

- **原始类型（7 种）**：`string`、`number`、`boolean`、`null`、`undefined`、`symbol`、`bigint`。
- **引用类型**：`object`（包括数组、函数、Date、RegExp、Map、Set 等）。

**判断方式：**

- `typeof`：适合判断原始类型和函数；`typeof null === "object"`、`typeof [] === "object"` 是坑。
- `instanceof`：判断引用类型（基于原型链），跨 iframe 会失效。
- `Object.prototype.toString.call(x)`：最通用，返回 `[object Array]` 这种。
- `Array.isArray()`：判断数组最稳。
- `Number.isNaN()`：判断 NaN（`NaN !== NaN`）。

**手写一个通用判断：**

```js
const getType = (v) =>
  Object.prototype.toString.call(v).slice(8, -1).toLowerCase()
```

---

### 1.3 深拷贝和浅拷贝的区别？手写深拷贝

**答：**

- **浅拷贝**：只复制第一层，引用类型共享同一块内存。`Object.assign`、展开运算符、`slice` 都是浅拷贝。
- **深拷贝**：递归复制所有层级，互不影响。

**手写深拷贝（要能处理循环引用、Date、RegExp、Map、Set）：**

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target
  if (target instanceof Date) return new Date(target)
  if (target instanceof RegExp) return new RegExp(target)
  if (map.has(target)) return map.get(target)

  const clone = Array.isArray(target) ? [] : {}
  map.set(target, clone)

  if (target instanceof Map) {
    target.forEach((v, k) => clone.set(deepClone(k, map), deepClone(v, map)))
    return clone
  }
  if (target instanceof Set) {
    target.forEach((v) => clone.add(deepClone(v, map)))
    return clone
  }

  // 只拷贝自有可枚举属性，Symbol 也可以带上
  Reflect.ownKeys(target).forEach((key) => {
    clone[key] = deepClone(target[key], map)
  })
  return clone
}
```

**加分点：**

- `structuredClone` 是浏览器原生深拷贝，支持 Map/Set/Date，但不支持函数、DOM、原型链。
- `JSON.parse(JSON.stringify())` 的坑：丢失 `undefined`/函数/Symbol、Date 变字符串、循环引用报错、NaN/Infinity 变 null。

---

### 1.4 什么是闭包？有哪些应用和坑？

**答：**

闭包 = **函数 + 函数定义时的词法作用域**。函数在外层作用域之外执行时，仍能访问外层变量。

**应用：**

- 私有变量/模块模式；
- 防抖、节流、柯里化；
- 循环里保存每轮变量（`let` 之前用 IIFE）；
- 缓存（memo）。

**坑：**

- 闭包引用的变量不会被回收；大量闭包或 DOM 引用会导致内存泄漏。
- 循环里用 `var` + `setTimeout` 拿到的是最后一个值。

**例子：**

```js
function createCounter() {
  let count = 0
  return () => ++count
}
const counter = createCounter()
counter() // 1
counter() // 2
```

---

### 1.5 this 的指向规则？箭头函数有什么不同？

**答：**

`this` 在函数**调用时**确定，优先级从高到低：

1. `new` 调用：指向新创建的对象。
2. `call/apply/bind`：指向传入的对象。
3. 方法调用 `obj.fn()`：指向 `obj`。
4. 普通函数调用：非严格模式指向 `window`，严格模式 `undefined`。
5. 箭头函数：**没有自己的 this**，继承定义时外层作用域的 this，且不能被 `call/apply/bind` 改变。

**坑：**

- 回调里 `this` 丢失（`setTimeout(obj.method, 0)`），用箭头函数或 `bind`。
- 箭头函数不能作为构造函数（没有 `prototype`、没有 `arguments`）。

---

### 1.6 原型、原型链是什么？instanceof 原理？

**答：**

- 每个对象都有 `__proto__`（内部 `[[Prototype]]`），指向构造函数的 `prototype`。
- 访问对象属性时，先找自身，找不到沿 `__proto__` 向上找，直到 `Object.prototype`，再往上为 `null`，这条链就是**原型链**。
- `instanceof` 判断构造函数的 `prototype` 是否在对象的原型链上。

```js
function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left)
  const prototype = right.prototype
  while (proto) {
    if (proto === prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}
```

**加分点：** `Object.create(null)` 创建没有原型链的对象；`class` 本质也是原型继承的语法糖。

---

### 1.7 new 操作符做了什么？手写 new

**答：**

`new Foo(...args)` 做了四件事：

1. 创建一个新对象；
2. 把新对象的 `__proto__` 指向 `Foo.prototype`；
3. 以新对象为 `this` 执行 `Foo`；
4. 如果构造函数返回对象，则返回该对象；否则返回新对象。

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('not a constructor')
  const obj = Object.create(Ctor.prototype)
  const result = Ctor.apply(obj, args)
  return result !== null && (typeof result === 'object' || typeof result === 'function')
    ? result
    : obj
}
```

---

### 1.8 call、apply、bind 的区别？手写 bind

**答：**

- `call(thisArg, a, b)`：立即调用，参数逐个传。
- `apply(thisArg, [a, b])`：立即调用，参数用数组。
- `bind(thisArg, a)`：返回一个新函数，不立即调用；可以分次传参；`new` 调用时 `this` 失效。

```js
Function.prototype.myBind = function (context, ...args) {
  const fn = this
  function Bound(...rest) {
    // new 调用时 this 指向实例，而不是 context
    const isNew = this instanceof Bound
    return fn.apply(isNew ? this : context, [...args, ...rest])
  }
  Bound.prototype = Object.create(fn.prototype)
  return Bound
}
```

---

### 1.9 事件循环（Event Loop）是什么？async/await 执行顺序怎么分析？

**答：**

- JS 是单线程，靠**调用栈 + 任务队列**调度。
- **宏任务**：`script` 整体、`setTimeout`、`setInterval`、I/O、UI 渲染。
- **微任务**：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`。
- 每执行完一个宏任务，会清空**所有微任务**，再取下一个宏任务。
- `async` 函数同步执行到第一个 `await`，`await` 后面的代码相当于 `then` 回调，进入微任务。

**经典题：**

```js
console.log(1)
setTimeout(() => console.log(2), 0)
Promise.resolve().then(() => console.log(3))
console.log(4)
// 1 4 3 2
```

**加分点：** `await` 一个非 Promise 值也会让出一次（微任务）；`process.nextTick`（Node）优先于 Promise 微任务。

---

### 1.10 Promise 有哪些状态和方法？手写 Promise.all

**答：**

- 状态：`pending` → `fulfilled` / `rejected`，一旦落定不可变。
- 实例方法：`then`、`catch`、`finally`。
- 静态方法：`all`、`allSettled`、`race`、`any`、`resolve`、`reject`。

```js
function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const result = []
    let count = 0
    if (list.length === 0) return resolve(result)
    list.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        result[index] = value
        if (++count === list.length) resolve(result)
      }, reject)
    })
  })
}
```

**区别：**

- `all`：有一个失败就失败；
- `allSettled`：等全部结束，返回状态数组；
- `race`：第一个落定的结果（成功或失败）；
- `any`：第一个成功，全部失败才失败。

---

### 1.11 防抖和节流有什么区别？手写

**答：**

- **防抖（debounce）**：事件触发后等 `wait` 时间，期间再触发就重新计时；适合搜索框、窗口 resize。
- **节流（throttle）**：固定时间内最多执行一次；适合滚动、拖拽、鼠标移动。

```js
function debounce(fn, wait = 300, immediate = false) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    if (immediate && !timer) fn.apply(this, args)
    timer = setTimeout(() => {
      timer = null
      if (!immediate) fn.apply(this, args)
    }, wait)
  }
}

function throttle(fn, wait = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn.apply(this, args)
    }
  }
}
```

**加分点：** 节流还有“定时器版”（保证最后一次执行）；防抖需要 `cancel`/`flush` 方法。

---

### 1.12 数组常用方法有哪些？手写 flatten

**答：**

- 改变原数组：`push/pop/shift/unshift/splice/sort/reverse/fill`。
- 不改变：`map/filter/reduce/find/findIndex/some/every/includes/slice/concat/flat/flatMap`。
- `reduce` 最强，可以实现 map/filter/groupBy。

```js
function flatten(arr, depth = Infinity) {
  return arr.reduce((acc, cur) => {
    if (Array.isArray(cur) && depth > 0) {
      acc.push(...flatten(cur, depth - 1))
    } else {
      acc.push(cur)
    }
    return acc
  }, [])
}
```

**坑：** `sort` 默认按字符串排序，数字要传比较函数；`forEach` 不能中断（用 `some/every` 或 `for`）。

---

### 1.13 柯里化和组合函数是什么？

**答：**

- **柯里化**：把多参数函数变成“一次传一个参数”的函数链。
- **组合（compose/pipe）**：把多个函数组合成一个，`compose(f,g)(x) = f(g(x))`，`pipe` 方向相反。

```js
const curry = (fn) => {
  const arity = fn.length
  return function curried(...args) {
    if (args.length >= arity) return fn(...args)
    return (...rest) => curried(...args, ...rest)
  }
}

const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x)
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x)
```

**应用：** 中间件、日志、权限校验、Redux 的 `applyMiddleware`。

---

### 1.14 发布订阅/EventEmitter 怎么实现？

**答：**

维护一个 `events` 对象：`{ eventName: [handler, ...] }`，提供 `on/off/once/emit`。

```js
class EventEmitter {
  constructor() {
    this.events = new Map()
  }
  on(name, fn) {
    const list = this.events.get(name) || []
    list.push(fn)
    this.events.set(name, list)
    return () => this.off(name, fn)
  }
  off(name, fn) {
    const list = this.events.get(name)
    if (!list) return
    this.events.set(name, list.filter((item) => item !== fn))
  }
  once(name, fn) {
    const wrapper = (...args) => {
      fn(...args)
      this.off(name, wrapper)
    }
    this.on(name, wrapper)
  }
  emit(name, ...args) {
    const list = this.events.get(name)
    if (!list) return
    ;[...list].forEach((fn) => fn(...args))
  }
}
```

**应用：** 组件通信、埋点、跨模块解耦；Vue 的 `$emit` 也是这个思路。

---

### 1.15 LRU 缓存怎么实现？

**答：**

`Map` 保持插入顺序，`get` 时删掉再 `set` 到末尾，`set` 超出容量删掉第一个 key，`get/set` 都是 O(1)。

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }
  get(key) {
    if (!this.map.has(key)) return -1
    const value = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value)
    }
  }
}
```

**加分点：** 面试官可能要求用“哈希表 + 双向链表”实现，思路一样，`Map` 是简化版。

---

### 1.16 ES6+ 常用新特性有哪些？

**答：**

- `let/const`、箭头函数、模板字符串、解构、默认参数、剩余/展开。
- `Promise`、`async/await`、`Symbol`、`Map/Set/WeakMap/WeakSet`。
- 模块化 `import/export`、可选链 `?.`、空值合并 `??`。
- `Object.entries/values/fromEntries`、`Array.flat/flatMap`、`String.padStart`。
- `Proxy/Reflect`（Vue3 响应式基础）。

**加分点：** `WeakMap` 的 key 必须是对象，且是弱引用，适合做缓存/私有数据，不影响 GC。

---

### 1.17 垃圾回收和内存泄漏

**答：**

- V8 用**分代回收**：新生代 Scavenge（复制算法），老生代 Mark-Sweep/Mark-Compact。
- 常见内存泄漏：
  - 未清除的定时器、事件监听；
  - 闭包引用大对象；
  - 脱离 DOM 的引用（detached DOM）；
  - 全局变量、缓存无上限；
  - `Map/Set` 强引用不释放。
- 排查：Chrome DevTools Memory（Heap Snapshot、Allocation Timeline）、Performance Monitor。

**项目例子：** Three.js 场景切换要 `dispose()` 几何体/材质/纹理，移除 `requestAnimationFrame`；Vue 组件卸载要清 `setInterval`、`addEventListener`。

---

### 1.18 事件冒泡、捕获、委托

**答：**

- 事件流：捕获（window → target）→ 目标 → 冒泡（target → window）。
- `addEventListener(type, fn, true)` 捕获；默认冒泡。
- `stopPropagation()` 阻止继续传播；`preventDefault()` 阻止默认行为。
- **事件委托**：把监听器挂在父元素，通过 `e.target` 判断子元素；减少监听器数量，支持动态元素。

**坑：** `stopPropagation` 会影响其他委托逻辑；`e.target` 可能是子元素，需要 `closest`。

---

## 2. TypeScript（P1）

### 2.1 type 和 interface 有什么区别？

**答：**

- `interface` 主要用于对象结构，支持**声明合并**、`extends`；`type` 支持联合、交叉、映射、条件类型等更复杂的类型。
- `interface` 更适合公开 API/组件 props；`type` 更适合工具类型、联合类型。
- 性能上 `interface` 通常更易缓存，但差距可忽略；团队统一即可。

**加分点：** 两者都能描述函数/数组；`interface` 不能写 `type A = string | number`。

---

### 2.2 泛型是什么？怎么用？

**答：**

泛型 = 类型参数，让函数/组件在调用时决定类型，保证输入输出类型关联。

```ts
function identity<T>(value: T): T {
  return value
}

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => (result[key] = obj[key]))
  return result
}
```

**加分点：** 泛型约束 `T extends object`、默认值 `<T = string>`、泛型在 React 组件/Hooks 里的使用。

---

### 2.3 常用工具类型有哪些？

**答：**

- `Partial<T>`：全部可选；`Required<T>`：全部必填。
- `Pick<T, K>`：挑属性；`Omit<T, K>`：排除属性。
- `Record<K, V>`：构造对象类型。
- `Exclude<T, U>` / `Extract<T, U>`：联合类型排除/提取。
- `ReturnType<T>` / `Parameters<T>`：函数返回值/参数类型。
- `Awaited<T>`：取 Promise 的 resolve 类型。
- `Readonly<T>`：只读。

**手写：**

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyPick<T, K extends keyof T> = { [P in K]: T[P] }
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never
```

---

### 2.4 类型收窄（narrowing）怎么做？

**答：**

- `typeof`、`instanceof`、`in`、字面量/判别式（discriminated union）。
- 自定义类型守卫：`function isUser(x: any): x is User`。
- 断言函数：`function assertIsUser(x: any): asserts x is User`。
- 非空断言 `!`、可选链 `?.`、空值合并 `??`。

```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'rect'; w: number; h: number }
function area(s: Shape) {
  if (s.kind === 'circle') return Math.PI * s.r ** 2
  return s.w * s.h
}
```

---

### 2.5 any、unknown、never、void 的区别？

**答：**

- `any`：放弃类型检查，能赋值给任何类型，也能接收任何类型（尽量少用）。
- `unknown`：未知类型，使用前必须收窄/断言，比 `any` 安全。
- `never`：永不存在的值；用于穷尽检查、抛错函数。
- `void`：函数无返回值；`undefined` 是它的值。

**加分点：** `never` 可以用来做 `switch` 的穷尽检查：`const _exhaustive: never = shape`。

---

### 2.6 装饰器是什么？NestJS 里怎么用？

**答：**

装饰器是特殊函数，用于类/方法/属性/参数，运行时通过 `Reflect` 元数据增强。NestJS 大量使用：

- `@Module`、`@Controller`、`@Injectable`、`@Inject`；
- `@Get/@Post` 路由；
- `@Body/@Query/@Param` 参数；
- `@UseGuards`、`@UseInterceptors`、`@UsePipes`。

**注意：** 需要 `experimentalDecorators` + `emitDecoratorMetadata`；装饰器执行顺序：属性 → 方法 → 类（从下到上/从内到外，具体看类型）。

---

## 3. CSS（P0）

### 3.1 标准盒模型和 IE 盒模型有什么区别？

**答：**

- `content-box`（标准）：`width` 只包含内容，实际宽度 = width + padding + border。
- `border-box`（IE）：`width` 包含 content + padding + border。
- 通常全局设置 `box-sizing: border-box`，布局更好算。

**加分点：** `box-sizing` 不影响 margin；`width: 100%` 在 `border-box` 下不会溢出。

---

### 3.2 什么是 BFC？怎么触发？有什么作用？

**答：**

BFC（块级格式化上下文）是独立的渲染区域，内部布局不影响外部。

**触发：** `overflow` 非 `visible`、`display: flow-root`、`float`、`position: absolute/fixed`、`display: flex/grid` 的子项。

**作用：**

- 阻止 margin 塌陷；
- 包含浮动元素（清除浮动）；
- 防止元素被浮动元素覆盖；
- 自适应两栏布局。

**推荐：** `display: flow-root` 触发 BFC，无副作用。

---

### 3.3 flex 常用属性？`flex: 1` 是什么意思？

**答：**

- 容器：`display: flex`、`flex-direction`、`justify-content`、`align-items`、`flex-wrap`、`gap`。
- 子项：`flex-grow`、`flex-shrink`、`flex-basis`、`align-self`、`order`。
- `flex: 1` = `flex: 1 1 0%`：可放大、可缩小、基础尺寸 0，常用于均分剩余空间。

**坑：** `flex: 1` 与 `width` 同时存在时，`flex-basis: 0` 会覆盖宽度参与分配；`min-width: auto` 可能导致子项撑破，需 `min-width: 0`。

---

### 3.4 水平垂直居中有哪些方案？

**答：**

- flex：`display:flex; justify-content:center; align-items:center`。
- grid：`display:grid; place-items:center`。
- 绝对定位 + transform：`top:50%; left:50%; transform:translate(-50%,-50%)`。
- 绝对定位 + `inset:0; margin:auto`（需宽高）。
- 单行文本：`line-height = height; text-align:center`。

**加分点：** 未知宽高用 flex/grid/transform；多行文本用 flex。

---

### 3.5 position 有哪些值？sticky 怎么用？

**答：**

- `static`（默认）、`relative`（相对自身偏移，不脱离文档流）、`absolute`（相对最近的定位祖先）、`fixed`（相对视口）、`sticky`（滚动到阈值后固定）。
- `sticky` 需要 `top/bottom/left/right` 之一，且祖先不能有 `overflow: hidden/auto`（否则失效）。

**坑：** `absolute` 的包含块是最近的 `position != static` 祖先；没有则相对初始包含块。

---

### 3.6 z-index 和层叠上下文

**答：**

- `z-index` 只在**定位元素**（relative/absolute/fixed/sticky）或 flex/grid 子项上生效。
- 层叠上下文由 `position + z-index`、`opacity < 1`、`transform`、`filter`、`will-change` 等创建。
- 同一层叠上下文内按：背景/边框 → 负 z-index → 块级 → 浮动 → 行内 → z-index:0/auto → 正 z-index 排序。

**坑：** 父元素创建了层叠上下文，子元素 z-index 再大也超不过父元素的层级。

---

### 3.7 重排（reflow）和重绘（repaint）？怎么优化？

**答：**

- 重排：几何属性变化（宽高、位置、字体、display），浏览器重新计算布局。
- 重绘：外观变化（颜色、背景、visibility），不改变布局。
- 优化：
  - 用 `transform/opacity` 做动画（走合成层）；
  - 批量修改 DOM（`DocumentFragment`、先 `display:none` 再改）；
  - 避免频繁读取 `offsetWidth` 等（强制同步布局）；
  - 使用 `will-change` 谨慎提升图层。

---

### 3.8 移动端适配方案有哪些？

**答：**

- `viewport` + `rem`（`html` 字体大小随屏幕宽度变化）。
- `vw/vh` + `clamp()`。
- 媒体查询断点。
- `postcss-px-to-viewport` 自动转换。
- 1px 边框：`transform: scaleY(0.5)`、`box-shadow`、`border-image`。
- 安全区：`env(safe-area-inset-bottom)`。
- 图片：`srcset`、`picture`、懒加载。

**加分点：** 移动端 300ms 点击延迟（现代浏览器加 `width=device-width` 后基本没有）；`touch-action` 优化滚动。

---

### 3.9 CSS 变量、预处理器有什么区别？

**答：**

- CSS 变量（`--color` + `var()`）是运行时、可继承、可被 JS 修改，适合主题切换。
- Sass/Less 是编译时，支持嵌套、mixin、函数、循环，产出静态 CSS。
- 两者可以一起用；主题切换优先 CSS 变量。

---

### 3.10 选择器优先级怎么算？

**答：**

- 行内样式（1000）> ID（100）> class/属性/伪类（10）> 元素/伪元素（1）> 通配符（0）。
- `!important` 最高；同优先级后写的覆盖先写的。
- `:not()`、`:is()` 取参数中最高优先级；`where()` 优先级为 0。

**加分点：** 避免用 `!important` 和过深选择器；用 BEM/scope 降低耦合。

## 4. 浏览器与网络（P0）

### 4.1 从输入 URL 到页面展示发生了什么？

**答：**

1. **URL 解析**：判断是搜索还是地址，补全协议。
2. **DNS 解析**：域名 → IP（浏览器缓存 → 系统缓存 → hosts → DNS 服务器）。
3. **TCP 连接**：三次握手；HTTPS 还要 TLS 握手。
4. **发送 HTTP 请求**：请求行、请求头、请求体。
5. **服务器处理并返回响应**：状态码、响应头、HTML。
6. **浏览器解析**：HTML → DOM，CSS → CSSOM，遇到 JS 阻塞解析（`defer/async` 可优化）。
7. **构建渲染树**：DOM + CSSOM → Render Tree，计算样式、布局（Layout）。
8. **绘制与合成**：Paint → Composite，显示到屏幕。
9. **加载子资源**：图片、字体、JS、CSS，可能触发重排/重绘。

**加分点：** 首屏优化就是优化这条链路的每一段：DNS 预解析、CDN、HTTP 缓存、资源压缩、关键 CSS 内联、JS 延迟、图片懒加载。

---

### 4.2 HTTP 缓存有哪些？强缓存和协商缓存怎么配合？

**答：**

- **强缓存**：不发请求，直接读本地缓存。
  - `Cache-Control: max-age=31536000`（相对时间，优先级高）
  - `Expires`（绝对时间，受本地时钟影响）
- **协商缓存**：发请求带标识，服务器判断是否 304。
  - `ETag` / `If-None-Match`（内容指纹，精度高）
  - `Last-Modified` / `If-Modified-Since`（文件修改时间，秒级）
- 命中强缓存返回 200（from cache）；协商命中返回 304，不传 body。

**实践：**

- HTML：`no-cache`（每次都协商），保证发版后能拿到新 HTML。
- 带 hash 的 JS/CSS/图片：`max-age=31536000, immutable`。
- 接口：按业务设置，敏感数据 `no-store`。

---

### 4.3 HTTP/1.1、HTTP/2、HTTP/3 有什么区别？

**答：**

- **HTTP/1.1**：文本协议，keep-alive 复用连接，但队头阻塞；浏览器同域并发 6 个左右。
- **HTTP/2**：二进制分帧、多路复用（一个连接并发多个流）、HPACK 头压缩、服务端推送（已弱化）；解决 HTTP 队头阻塞，但 TCP 层仍可能阻塞。
- **HTTP/3**：基于 QUIC（UDP），0-RTT 建连、连接迁移、解决 TCP 队头阻塞；适合弱网。

**加分点：** HTTP/2 下不必再做域名分片/雪碧图；HTTP/3 需要 CDN/服务器支持。

---

### 4.4 HTTPS 的握手过程？为什么安全？

**答：**

- 客户端发 `ClientHello`（支持的 TLS 版本、加密套件、随机数）。
- 服务端回 `ServerHello` + 证书（公钥、域名、CA 签名）。
- 客户端验证证书链，生成预主密钥，用服务端公钥加密后发送。
- 双方用随机数 + 预主密钥派生对称密钥（会话密钥）。
- 之后用对称加密通信（AES 等），MAC 保证完整性。

**为什么安全：** 非对称加密解决密钥交换，对称加密解决性能，证书解决身份认证，MAC/AEAD 解决篡改。

---

### 4.5 什么是同源策略？跨域怎么解决？

**答：**

同源 = 协议 + 域名 + 端口都相同。浏览器的同源策略限制：Cookie、DOM、AJAX 读取。

**解决：**

- **CORS**：服务端返回 `Access-Control-Allow-Origin`、`Allow-Methods`、`Allow-Headers`、`Allow-Credentials`；非简单请求先发 `OPTIONS` 预检。
- **代理**：开发环境 Vite/Webpack proxy，生产 Nginx 反向代理（同源）。
- **JSONP**：只支持 GET，已过时。
- **postMessage**：跨窗口通信。
- **WebSocket**：不受同源策略限制（服务端校验 Origin）。

**坑：** 带 Cookie 时 `Allow-Origin` 不能是 `*`，要具体域名 + `Allow-Credentials: true`；预检结果可缓存 `Access-Control-Max-Age`。

---

### 4.6 Cookie、localStorage、sessionStorage、IndexedDB 的区别？

**答：**

| 特性 | Cookie | localStorage | sessionStorage | IndexedDB |
|---|---|---|---|---|
| 容量 | ~4KB | 5-10MB | 5-10MB | 很大（几百 MB+） |
| 生命周期 | 可设置过期 | 永久，除非删除 | 标签页关闭 | 永久 |
| 随请求发送 | 是 | 否 | 否 | 否 |
| API | 同步 | 同步 | 同步 | 异步 |
| 作用域 | 域名/路径 | 同源 | 同源 + 标签页 | 同源 |

**安全：** 登录态优先 `HttpOnly + Secure + SameSite` Cookie；localStorage 易受 XSS 读取。

---

### 4.7 XSS 和 CSRF 的原理与防御？

**答：**

**XSS（跨站脚本）**：攻击者把脚本注入页面执行。

- 存储型（评论/昵称入库）、反射型（URL 参数）、DOM 型（`innerHTML`）。
- 防御：输出转义（HTML/JS/URL）、`textContent` 代替 `innerHTML`、DOMPurify 清洗、CSP、`HttpOnly` Cookie。

**CSRF（跨站请求伪造）**：攻击者诱导已登录用户向目标站发请求。

- 防御：CSRF Token、`SameSite=Lax/Strict`、校验 `Origin/Referer`、关键操作二次验证、不用 GET 做写操作。

**加分点：** XSS 是“偷数据/执行代码”，CSRF 是“借你的登录态发请求”；两者防御手段不同。

---

### 4.8 CSP 是什么？怎么配置？

**答：**

CSP（内容安全策略）限制页面能加载/执行哪些资源，降低 XSS 影响。

- 响应头：`Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-xxx'; img-src 'self' https:;`
- 常用指令：`default-src`、`script-src`、`style-src`、`img-src`、`connect-src`、`frame-ancestors`。
- `nonce`/`hash` 允许内联脚本；`report-uri` 收集违规报告。

**坑：** 内联脚本/样式、`eval`、第三方 SDK 容易被 CSP 拦截；上线前用 `Content-Security-Policy-Report-Only` 观察。

---

### 4.9 SSE 和 WebSocket 有什么区别？怎么选？

**答：**

- **SSE**：基于 HTTP，服务器单向推送文本流，`text/event-stream`；自带断线重连、`Last-Event-ID`；实现简单，适合 AI 流式输出、通知、日志。
- **WebSocket**：独立协议，全双工，支持二进制；需要服务端/网关支持，心跳、重连要自己做；适合聊天室、协同编辑、游戏。

**选型：** 只需要服务器推 → SSE；需要双向高频 → WebSocket；AI 对话通常 SSE 足够。

**坑：** SSE 是单向的，客户端要发消息得另发 POST；HTTP/1.1 下同域并发连接数有限，HTTP/2 更好。

---

### 4.10 Web Vitals 有哪些？怎么优化？

**答：**

- **LCP**（最大内容绘制）< 2.5s：优化首屏图片/字体、CDN、预加载、SSR。
- **INP**（交互到下一次绘制）< 200ms：减少长任务、拆分 JS、`requestIdleCallback`、Web Worker。
- **CLS**（布局偏移）< 0.1：图片/广告预留尺寸、字体 `font-display`、避免动态插入内容。
- 辅助：TTFB、FCP、TBT。

**工具：** Lighthouse、Performance 面板、`web-vitals` 库、Sentry。

---

### 4.11 浏览器渲染流程？JS 会阻塞什么？

**答：**

- HTML 解析 → DOM；CSS 解析 → CSSOM；两者合成 Render Tree → Layout → Paint → Composite。
- `<script>` 默认阻塞 HTML 解析和后续渲染；`<script defer>` 延迟到解析完执行（按顺序）；`async` 下载完立即执行（顺序不定）。
- CSS 不阻塞 DOM 解析，但阻塞渲染和 JS 执行（JS 可能读样式）。
- 优化：关键 CSS 内联、非关键 CSS 异步加载、JS 放底部/`defer`、避免强制同步布局。

---

### 4.12 常见 HTTP 状态码

**答：**

- 200 OK、201 Created、204 No Content。
- 301 永久重定向、302 临时重定向、304 Not Modified、307 临时重定向（保持方法）。
- 400 参数错误、401 未认证、403 无权限、404 不存在、405 方法不允许、429 限流。
- 500 服务器错误、502 网关错误、503 服务不可用、504 网关超时。

**加分点：** 401 通常触发刷新 Token；403 是已登录但没权限；304 要和缓存头配合。

---

## 5. Vue3（P0）

### 5.1 Vue3 响应式原理是什么？

**答：**

- 用 `Proxy` 代理对象，拦截 `get/set/deleteProperty/has/ownKeys`。
- `get` 时通过 `track` 收集依赖（`effect` → `depsMap`）。
- `set` 时通过 `trigger` 触发依赖更新。
- `ref` 对原始值用 `get value/set value` 的存取器实现；对象内部仍用 `reactive`。
- `effect` 是副作用函数，`computed` 是惰性 effect，`watch` 是带调度器的 effect。

**加分点：** Vue3 能监听新增/删除属性、数组索引；Vue2 的 `Object.defineProperty` 做不到，需要 `$set`。

---

### 5.2 ref 和 reactive 有什么区别？

**答：**

- `ref`：可包装任意类型，模板自动解包，JS 里用 `.value`；适合原始值和单值。
- `reactive`：只能传对象/数组/Map/Set，返回 Proxy；解构会丢失响应式。
- `shallowRef/shallowReactive`：只代理第一层，适合大对象/第三方实例。
- `toRefs`：把 reactive 的属性转成 ref，方便解构。

**坑：** `const { name } = reactive(obj)` 后 `name` 不是响应式；用 `toRefs` 或直接 `obj.name`。

---

### 5.3 computed、watch、watchEffect 的区别？

**答：**

- `computed`：有缓存，依赖不变不重新计算；适合派生状态。
- `watch`：显式指定监听源，可拿到新旧值，支持 `deep/immediate`；适合副作用（请求、埋点）。
- `watchEffect`：自动收集依赖，立即执行，拿不到旧值；适合简单副作用。

**坑：** `watch` 监听 reactive 对象默认深层；监听 `ref` 对象要 `deep: true`；异步回调里注意取消请求。

---

### 5.4 Vue3 生命周期有哪些？

**答：**

- `setup` → `onBeforeMount` → `onMounted` → `onBeforeUpdate` → `onUpdated` → `onBeforeUnmount` → `onUnmounted`。
- `onActivated/onDeactivated`：配合 `keep-alive`。
- `onErrorCaptured`：捕获子组件错误。
- `onServerPrefetch`：SSR。

**对比 Vue2：** `beforeCreate/created` 用 `setup` 替代；`beforeDestroy/destroyed` 改为 `onBeforeUnmount/onUnmounted`。

---

### 5.5 Vue3 组件通信有哪些方式？

**答：**

- 父 → 子：`props`、`v-model`、`provide/inject`（跨层级）。
- 子 → 父：`emit`、`expose` + 模板 ref。
- 兄弟：共同父组件、Pinia、`mitt` 事件总线。
- 跨层级：`provide/inject`、Pinia。
- `attrs`：透传非 props 属性（class/style/事件）。

**加分点：** `defineProps/defineEmits/defineExpose` 是 `<script setup>` 的编译宏；`v-bind="$attrs"` 做属性透传。

---

### 5.6 v-model 的原理？

**答：**

- 默认绑定 `modelValue` prop + `update:modelValue` 事件。
- 自定义组件：`props: ['modelValue']`，`emit('update:modelValue', value)`。
- 多个 v-model：`v-model:title="title"` 对应 `title` prop + `update:title`。
- 修饰符：`.lazy`、`.number`、`.trim`。

**加分点：** Vue3 支持多个 v-model，Vue2 只能一个（`.sync` 是替代）。

---

### 5.7 Vue3 的 diff 算法和 key 的作用？

**答：**

- 同层比较，不跨层级；先处理头部/尾部相同节点，再用最长递增子序列（LIS）减少移动。
- `key` 帮助识别节点身份；用 index 做 key 在列表插入/删除时会导致复用错位、状态错乱。
- Vue3 编译时生成 `PatchFlag`、静态提升、Block Tree，跳过静态节点，提升 diff 性能。

**坑：** 列表项有输入框/组件状态时，index key 会出现“删 A 显示 B 的值”；用唯一 id。

---

### 5.8 nextTick 的原理？

**答：**

Vue 的 DOM 更新是异步批量的：数据变化后把更新任务推入队列，在微任务（`Promise.then`）中统一刷新。`nextTick` 返回一个 Promise，在 DOM 更新完成后执行回调。

**用法：**

```js
await nextTick()
// 此时 DOM 已更新
```

**场景：** 修改数据后立刻获取元素尺寸、滚动到底部、聚焦输入框。

---

### 5.9 keep-alive 的作用和生命周期？

**答：**

- 缓存组件实例，切换时保留状态，避免重复渲染。
- `include/exclude` 按组件名过滤，`max` 限制缓存数量（LRU）。
- 被缓存组件触发 `activated/deactivated`，而不是 `mounted/unmounted`。

**坑：** 缓存页面里用 `onMounted` 只执行一次，刷新数据要用 `onActivated`；表单页缓存后要手动重置。

---

### 5.10 Vue Router 的守卫有哪些？怎么做权限？

**答：**

- 全局：`beforeEach`、`beforeResolve`、`afterEach`。
- 路由独享：`beforeEnter`。
- 组件内：`beforeRouteEnter`、`beforeRouteUpdate`、`beforeRouteLeave`。

**权限流程：**

1. `beforeEach` 判断是否有 token；
2. 无 token 且不是白名单 → 跳登录；
3. 有 token 但没用户信息 → 拉用户信息/权限；
4. 动态路由 `addRoute` 或过滤路由表；
5. `next()` 放行。

**坑：** 动态路由要在登出时重置；`next()` 只能调用一次；白名单要包含 404/登录页。

---

### 5.11 Pinia 和 Vuex 有什么区别？

**答：**

- Pinia 没有 mutations，action 直接改 state；Vuex 要 `commit`。
- Pinia 对 TS 支持更好，模块天然扁平，不需要命名空间。
- Pinia 支持 composition API 风格（setup store）和 options 风格。
- 都支持 devtools、持久化插件。

**选型：** 新项目直接用 Pinia；老项目 Vuex 不必重写。

---

### 5.12 Vue3 性能优化有哪些手段？

**答：**

- 路由懒加载、组件异步加载（`defineAsyncComponent`）。
- `v-memo`、`v-once`、`shallowRef/shallowReactive`、`markRaw`。
- `keep-alive` 缓存、虚拟列表、图片懒加载。
- 避免大对象深层响应式；避免在模板里做复杂计算（用 computed）。
- 生产构建开启压缩、CDN、gzip/brotli。
- 用 `performance` 面板定位长任务。

---

### 5.13 Vue2 和 Vue3 的区别？

**答：**

- 响应式：`Object.defineProperty` vs `Proxy`。
- API：Options API vs Composition API。
- diff：Vue2 双端比较 vs Vue3 最长递增子序列 + 编译优化。
- 性能：Vue3 更快、包更小、支持 tree shaking。
- 新特性：Fragment、Teleport、Suspense、多个 v-model。
- TS 支持：Vue3 更好。

---

### 5.14 Vue3 常见坑有哪些？

**答：**

- 解构 `reactive` 丢响应式（用 `toRefs`）。
- `ref` 在 JS 里忘写 `.value`。
- `watch` 监听对象默认浅层/深层要分清。
- `v-if` 和 `v-for` 同用优先级问题（Vue3 `v-if` 更高，尽量拆开）。
- `keep-alive` 缓存页面 `onMounted` 不重新执行。
- 路由参数变化组件复用，要 `watch route.params`。
- `v-model` 自定义组件要 `defineEmits`。

---

## 6. React（P1）

### 6.1 Hooks 的原理和规则？

**答：**

- Hooks 用链表/数组按调用顺序存储状态；每个组件 Fiber 上有 `memoizedState` 链表。
- 规则：只能在函数组件顶层调用，不能在条件/循环/嵌套函数里调用；因为 React 靠调用顺序匹配 Hook。
- `useState` 返回当前值和 setter；setter 触发重新渲染。

**加分点：** Hooks 不能替代 class 的 `this`；闭包陷阱、依赖数组是常见问题。

---

### 6.2 useState 和 useEffect 怎么用？依赖数组要注意什么？

**答：**

- `useState`：状态不可变更新；函数式更新 `setCount(c => c + 1)` 避免拿到旧值。
- `useEffect`：渲染后执行副作用；返回清理函数；依赖数组控制执行时机。
- 空数组：只执行一次（挂载/卸载）；不传：每次渲染都执行；`[a,b]`：a/b 变化才执行。
- `useLayoutEffect`：DOM 更新后、浏览器绘制前同步执行，适合测量布局。

**坑：** 依赖数组漏项导致闭包旧值；对象/函数依赖每次新建导致死循环（用 `useMemo/useCallback` 或移到 effect 内）。

---

### 6.3 useMemo、useCallback、memo 的区别？

**答：**

- `useMemo`：缓存计算结果，避免重复计算。
- `useCallback`：缓存函数引用，配合 `memo` 避免子组件重渲染。
- `memo`：高阶组件，浅比较 props，相同则跳过渲染。

**注意：** 不要滥用；缓存本身有成本，先定位性能瓶颈。`useMemo` 不能替代 `shouldComponentUpdate` 的深度比较。

---

### 6.4 React 闭包陷阱是什么？

**答：**

`useEffect`/事件回调捕获的是当次渲染的 state/props；如果依赖数组为空，回调里永远是初始值。

```js
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000) // count 永远是 0
  return () => clearInterval(id)
}, []) // 修复：依赖 count，或用 setCount(c => c + 1)
```

**修复：** 补依赖、函数式更新、`useRef` 保存最新值。

---

### 6.5 Fiber 是什么？

**答：**

Fiber 是 React 16 的协调引擎数据结构，把渲染任务拆成可中断的小单元，支持优先级调度（Concurrent Mode）。

- 每个 Fiber 节点对应一个组件/DOM，保存 `return/child/sibling`、`stateNode`、`memoizedState`。
- 渲染分 render 阶段（可中断）和 commit 阶段（不可中断）。
- 双缓存树：current 和 workInProgress，commit 时切换。

**加分点：** 时间切片、优先级（Lane）、`startTransition/useDeferredValue` 都是基于 Fiber 调度。

---

### 6.6 React 状态管理怎么选？

**答：**

- 组件内：`useState/useReducer`。
- 跨层级少量：Context（注意 Provider 值变化导致重渲染）。
- 中大型：Redux Toolkit、Zustand、Jotai、MobX。
- 服务端状态：React Query/SWR（缓存、重试、失效）。

**选型：** 小项目 Context + hooks；中大型 Redux Toolkit/Zustand；接口缓存用 React Query。

---

### 6.7 受控组件和非受控组件？

**答：**

- 受控：表单值由 state 控制，`value + onChange`；可校验、可联动，但每次输入都渲染。
- 非受控：用 `ref` 直接读 DOM 值，`defaultValue`；适合简单表单/文件上传。
- 推荐：复杂表单用受控 + 表单库（React Hook Form）；文件 input 用非受控。

---

### 6.8 React 18 有哪些新特性？性能怎么优化？

**答：**

- 自动批处理（setState 合并）、Concurrent Rendering、`startTransition`、`useDeferredValue`、Suspense/SSR 流式。
- 性能：`memo/useMemo/useCallback`、虚拟列表、代码分割（`React.lazy`）、避免内联对象/函数、`key` 稳定。
- 用 React DevTools Profiler 定位重渲染。

## 7. 工程化与性能（P0/P1）

### 7.1 Vite 和 Webpack 有什么区别？

**答：**

- **Webpack**：先打包再启动 dev server，把所有模块打成 bundle；生态成熟，配置灵活，但大项目启动慢。
- **Vite**：开发环境基于浏览器原生 ESM，按需编译，启动快；依赖用 esbuild 预构建；生产用 Rollup 打包。
- Vite 的 HMR 更快；Webpack 的 loader/plugin 生态更全。
- 选型：新项目 Vite；老项目/复杂构建 Webpack；库打包可以用 Rollup/tsup。

**加分点：** Vite 开发时不是“不打包”，而是“按需编译 + 预构建依赖”；生产仍然打包。

---

### 7.2 Webpack 的 loader 和 plugin 有什么区别？

**答：**

- **loader**：处理模块源码，把非 JS 文件转成 JS（`babel-loader`、`css-loader`、`ts-loader`）；在 `module.rules` 配置，链式从右到左。
- **plugin**：扩展构建流程，监听生命周期钩子（`HtmlWebpackPlugin`、`MiniCssExtractPlugin`、`DefinePlugin`）；在 `plugins` 配置。
- 简单记：loader 管“文件怎么转”，plugin 管“构建过程做什么”。

---

### 7.3 tree shaking 的原理？为什么有时不生效？

**答：**

- 基于 ESM 静态分析，标记未使用的导出，打包时删除（Webpack `usedExports` + Terser，Rollup 原生支持）。
- 不生效的常见原因：
  - 用 CommonJS（`require`）而不是 ESM；
  - 包有副作用且 `sideEffects` 没配置；
  - 顶层代码有副作用（立即执行、修改全局）；
  - 动态导入/字符串拼接导致无法静态分析。
- 实践：`package.json` 配 `"sideEffects": false`（或列出有副作用的文件）；按需引入组件库。

---

### 7.4 代码分割怎么做？

**答：**

- 动态 `import()`：`const Foo = () => import('./Foo.vue')`。
- 路由懒加载：Vue Router/React Router 的 `component: () => import(...)`。
- React `lazy + Suspense`。
- 第三方库拆包：`splitChunks`/`manualChunks`。
- 预加载：`<link rel="preload">`、`import(/* webpackPrefetch: true */)`。

**注意：** 拆得太碎会增加请求数；按路由/大依赖拆，配合 HTTP/2。

---

### 7.5 HMR 的原理？

**答：**

- 文件变化 → 构建工具重新编译 → 通过 WebSocket 通知浏览器 → 浏览器拉取新模块 → 替换模块并执行。
- Vue 的 HMR 会保留组件状态（通过 rerender）；React Fast Refresh 类似。
- 需要模块有 `module.hot.accept`（Vite 自动处理大部分）。

---

### 7.6 pnpm monorepo 有什么优缺点？

**答：**

- 优点：共享代码/类型/配置；统一依赖版本；一次安装；跨包重构方便；CI 可增量构建。
- 缺点：依赖管理复杂（peer deps、版本漂移）；构建顺序/缓存要处理；权限/发布流程复杂。
- pnpm 用硬链接 + 内容寻址存储，节省磁盘；`workspace:*` 引用本地包。
- 工具：`pnpm-workspace.yaml`、Turborepo/Nx（缓存/任务编排）、Changesets（版本发布）。

**项目例子：** `apps/web`、`server/apps/server`、`server/apps/ai`、`packages/common` 共享类型，避免前后端类型不一致。

---

### 7.7 首屏性能怎么优化？

**答：**

- **网络**：CDN、HTTP 缓存、gzip/brotli、DNS 预解析、减少请求数。
- **资源**：代码分割、路由懒加载、图片压缩/WebP/懒加载、字体子集化/`font-display`。
- **渲染**：关键 CSS 内联、SSR/SSG、骨架屏、避免白屏。
- **JS**：`defer/async`、减少主线程长任务、Web Worker、按需引入组件库。
- **指标**：LCP、FCP、TTFB、CLS；用 Lighthouse/Performance 量化。

---

### 7.8 虚拟列表的原理？怎么处理不定高？

**答：**

- 只渲染可视区域 + 少量缓冲区的列表项，用占位高度撑起滚动条；滚动时计算 `startIndex/endIndex`，复用 DOM。
- 定高：`itemHeight * index` 直接算。
- 不定高：先估算高度，渲染后测量并缓存，更新偏移；或使用 `IntersectionObserver`/第三方库（vue-virtual-scroller、react-window）。
- 注意：滚动事件节流、key 稳定、动态高度抖动。

---

### 7.9 大文件上传怎么做？

**答：**

- 切片：`File.slice(start, end)` 按固定大小（如 2MB）分片。
- 计算 hash（`spark-md5`，可放 Web Worker）用于秒传/断点续传。
- 并发上传（控制 3-5 个并发），失败重试。
- 服务端合并分片，校验 hash；已上传分片记录在 Redis/DB。
- 进度条：`onUploadProgress` 或 `XMLHttpRequest.upload.onprogress`。

---

### 7.10 前端监控、微前端、SSR 了解吗？

**答：**

- **监控**：错误（`window.onerror`、`unhandledrejection`、Sentry）、性能（Web Vitals）、行为/埋点、接口成功率；SourceMap 还原。
- **微前端**：qiankun/Module Federation，把多个独立应用组合；解决团队自治/技术栈异构，但带来隔离、通信、部署复杂度。
- **SSR/SSG**：首屏快、SEO 好；Nuxt/Next；注意 hydration 不一致、服务端压力、缓存。

---

## 8. Node / NestJS / 后端（P1）

### 8.1 Node 的事件循环和浏览器有什么不同？

**答：**

- Node 基于 libuv，事件循环分阶段：timers → pending callbacks → idle/prepare → poll → check → close callbacks。
- 每个阶段之间清空微任务（Promise、`queueMicrotask`）；`process.nextTick` 优先于 Promise。
- 浏览器只有宏任务/微任务，渲染相关；Node 有 I/O、`setImmediate`。
- `setTimeout(fn, 0)` 和 `setImmediate` 的执行顺序受上下文影响（I/O 回调里 `setImmediate` 先）。

---

### 8.2 CommonJS 和 ESM 的区别？

**答：**

- CJS：`require/module.exports`，运行时同步加载，值拷贝；Node 传统模块。
- ESM：`import/export`，静态分析、编译时确定依赖，值引用（live binding），支持 tree shaking、top-level await。
- 互操作：ESM 可以 import CJS（默认导出）；CJS require ESM 在 Node 新版本可用但有限制。
- `package.json` 的 `"type": "module"` 决定 `.js` 按 ESM 解析。

---

### 8.3 NestJS 的模块、控制器、服务、依赖注入是什么？

**答：**

- **Module**：组织代码，声明 `imports/providers/controllers/exports`。
- **Controller**：处理 HTTP 路由，调用 Service。
- **Service/Provider**：业务逻辑，通过构造函数注入。
- **DI**：Nest 维护 IoC 容器，根据类型/Token 注入实例；`@Injectable()` 标记可注入，`@Inject(token)` 注入自定义 Provider。
- 作用域：默认单例；还有 `REQUEST`、`TRANSIENT`。

**加分点：** 模块间通过 `exports/imports` 共享 Provider；全局模块 `@Global()`。

---

### 8.4 NestJS 的请求生命周期？Pipe、Guard、Interceptor、Filter 有什么区别？

**答：**

请求顺序：`Middleware → Guard → Interceptor（前）→ Pipe → Controller/Service → Interceptor（后）→ ExceptionFilter`。

- **Middleware**：最外层，处理日志、CORS、raw body。
- **Guard**：鉴权/权限，返回 boolean，决定是否放行。
- **Pipe**：参数转换/校验（`ValidationPipe`、`ParseIntPipe`）。
- **Interceptor**：切面，统一响应、耗时统计、缓存、事务。
- **Filter**：捕获异常，统一错误格式。

**项目例子：** JWT Guard 校验 token；ValidationPipe 校验 DTO；Interceptor 包 `{ code, data, message }`。

---

### 8.5 JWT 和 refresh token 怎么设计？

**答：**

- Access Token：短期（15-30 分钟），放内存/Authorization Header，权限校验用。
- Refresh Token：长期（7-30 天），存 `HttpOnly + Secure + SameSite` Cookie 或安全存储；只用于换新 access token。
- 刷新流程：401 → 前端单飞刷新（只发一个 refresh 请求）→ 队列重放其他请求 → 更新 token。
- 安全：Refresh Token 轮换（每次刷新换新）、黑名单/版本号、绑定设备、过期撤销。

**项目例子：** Axios 响应拦截器里用 `isRefreshing + requestQueue` 处理并发 401；要避免无限循环（刷新接口本身 401 不再刷新）。

---

### 8.6 数据库索引、事务、N+1 是什么？

**答：**

- **索引**：B+ 树，加速查询；联合索引遵循最左前缀；索引会增加写入成本，避免过多/低区分度索引。
- **事务**：ACID；隔离级别（读未提交/读已提交/可重复读/串行化）；注意长事务、死锁。
- **N+1**：循环里查关联表，产生 N+1 次查询；用 `include/join`、批量查询、DataLoader 解决。
- **Prisma**：`include/select` 控制字段，`$transaction` 事务，`explain` 看执行计划；迁移用 `prisma migrate`。

---

### 8.7 Redis 缓存常见问题：穿透、击穿、雪崩？

**答：**

- **穿透**：查不存在的数据，每次都打到 DB。解决：缓存空值（短 TTL）、布隆过滤器、参数校验。
- **击穿**：热点 key 过期瞬间大量请求打到 DB。解决：互斥锁/分布式锁、逻辑过期、热点永不过期。
- **雪崩**：大量 key 同时过期/Redis 宕机。解决：TTL 加随机值、多级缓存、限流降级、Redis 高可用。
- 其他：缓存一致性（先更新 DB 再删缓存/延迟双删）、分布式锁（SET NX PX + Lua 释放）。

---

### 8.8 BullMQ 是什么？延迟任务和 Job Scheduler 怎么用？

**答：**

- BullMQ 是基于 Redis 的 Node 队列，支持生产/消费、重试、延迟、优先级、并发、限流。
- `Queue.add(name, data, { delay })`：延迟任务；`Worker` 消费。
- `upsertJobScheduler(id, { pattern, tz }, { name, data })`：按 cron 周期调度，适合每日任务；同一 id 覆盖更新。
- 可靠性：`attempts + backoff` 重试、`removeOnComplete/removeOnFail`、幂等（jobId/业务唯一键）、死信队列。
- 注意：BullMQ 6 最低 Redis 5.0，推荐 6.2+；延迟任务依赖 Redis 有序集合。

**项目例子：** 每个用户一个 scheduler，按用户设置的时间发日报；`jobId` 按用户+日期去重，失败重试 3 次。

---

### 8.9 RESTful API 怎么设计？常见安全问题？

**答：**

- 资源用名词复数，GET/POST/PUT/PATCH/DELETE 对应查/增/改/删；状态码语义化；分页/过滤/排序参数统一。
- 版本化：`/api/v1`；错误格式统一 `{ code, message, data }`。
- 安全：密码哈希（bcrypt/argon2）、参数化查询防 SQL 注入、DTO 校验、限流、CORS、Helmet、HTTPS、权限校验（RBAC）。
- 幂等：POST 用幂等键，支付/订单回调验签 + 去重。

---

### 8.10 部署和高并发了解多少？

**答：**

- 部署：PM2/Docker、Nginx 反向代理、HTTPS、环境变量、日志、健康检查、滚动发布。
- 高并发：无状态服务 + 负载均衡、Redis 缓存、消息队列削峰、数据库连接池/读写分离、CDN、限流降级。
- Node 单进程 CPU 密集弱：用 `cluster`/多实例/Worker Threads；I/O 密集适合 Node。

---

## 9. Docker / CI-CD / 运维（P1）

### 9.1 镜像和容器的区别？镜像分层是什么？

**答：**

- 镜像：只读模板，包含文件系统 + 元数据；容器：镜像的运行实例，有可写层。
- 镜像分层：每条 Dockerfile 指令生成一层，层可复用/缓存；`RUN` 合并命令减少层数。
- 容器删除后可写层丢失；数据用 volume 持久化。

---

### 9.2 Dockerfile 常用指令？

**答：**

- `FROM`：基础镜像；多阶段构建 `AS builder`。
- `WORKDIR`、`COPY`、`ADD`（ADD 支持解压/URL，优先 COPY）。
- `RUN`：构建时执行；合并命令、清理缓存。
- `ENV/ARG`：环境变量/构建参数。
- `EXPOSE`：声明端口（不映射）。
- `CMD/ENTRYPOINT`：启动命令；CMD 可被覆盖，ENTRYPOINT 更固定。
- `USER`：非 root 运行；`HEALTHCHECK`：健康检查。

**多阶段示例：**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

---

### 9.3 docker compose 怎么用？

**答：**

- `docker-compose.yml` 定义 services、networks、volumes、ports、environment、depends_on、healthcheck。
- `docker compose up -d` 启动；`down` 停止；`logs -f` 看日志；`exec` 进容器。
- 服务之间用服务名互相访问（同一 network）。
- 数据持久化用 named volume；配置用 `.env` + `environment`。

**项目例子：** postgres/redis/minio/web/server/ai 六个服务，`depends_on` + healthcheck 保证启动顺序。

---

### 9.4 GitHub Actions 怎么写 CI？

**答：**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

**加分点：** 用 `cache` 加速依赖；`secrets` 存密钥；矩阵构建多 Node 版本；部署 job 用 SSH/云厂商 CLI。

---

### 9.5 Nginx 常用配置？

**答：**

- 静态资源：`root`、`index`、`try_files $uri $uri/ /index.html`（SPA history 路由）。
- 反向代理：`location /api { proxy_pass http://server:3000; }`。
- 负载均衡：`upstream` + `proxy_pass`。
- gzip/brotli、缓存头、HTTPS（`ssl_certificate`）、HTTP→HTTPS 跳转。
- 日志：`access_log/error_log`；限流：`limit_req_zone`。

---

### 9.6 Linux 常用命令和排查思路？

**答：**

- 进程：`ps -ef | grep node`、`top`、`kill -9`。
- 磁盘：`df -h`、`du -sh *`。
- 日志：`tail -f`、`grep`、`journalctl`。
- 网络：`curl -I`、`netstat -tunlp`、`ss -lntp`、`ping`、`traceroute`。
- 排查：先看日志/错误码 → 看进程/端口 → 看 CPU/内存/磁盘 → 看网络/依赖。

---

## 10. 测试（P1）

### 10.1 测试金字塔是什么？

**答：**

- 单元测试（最多）：函数/组件逻辑，快、稳定。
- 集成测试：模块/接口/组件组合。
- E2E（最少）：真实浏览器走主流程，慢但接近用户。
- 比例参考 70/20/10；核心工具函数单测，主流程 E2E。

---

### 10.2 Vitest/Jest 常用 API？

**答：**

- `describe/it/expect`；`beforeEach/afterEach`。
- 匹配器：`toBe/toEqual/toContain/toThrow/toHaveBeenCalledWith`。
- Mock：`vi.fn()`、`vi.mock()`、`vi.spyOn()`；Jest 对应 `jest.fn()`。
- 异步：`async/await`、`await expect(p).resolves/rejects`。
- 覆盖率：`--coverage`，看行/分支/函数。

---

### 10.3 Playwright 怎么写 E2E？

**答：**

```ts
import { test, expect } from '@playwright/test'

test('login and open learn page', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('手机号').fill('13800000000')
  await page.getByPlaceholder('密码').fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByText('我的课程')).toBeVisible()
  await page.goto('/learn')
  await expect(page.getByText('请根据释义和翻译拼写单词')).toBeVisible()
})
```

**加分点：** 用 `storageState` 复用登录态；`trace` 录屏排查；CI 里跑 headless。

---

### 10.4 怎么测组件和接口？覆盖率越高越好吗？

**答：**

- 组件：`@vue/test-utils` / React Testing Library，测渲染、交互、emit。
- 接口：supertest + Nest TestingModule，测状态码/响应体/权限。
- 覆盖率不是越高越好；核心逻辑/边界/回归场景覆盖到即可，别为了数字写无效测试。

## 11. AI / Agent（P2）

### 11.1 LLM 的基本概念有哪些？

**答：**

- **Token**：模型处理文本的最小单位，中文约 1 字 ≈ 1-2 token；上下文窗口有限。
- **Temperature**：随机性，0 更确定，1 更发散；客服/代码用低值，创意用高值。
- **Top-p**：从累计概率的前 p 里采样；和 temperature 二选一调。
- **上下文窗口**：一次请求能带的 token 上限，超了要截断/摘要/RAG。
- **幻觉**：模型编造事实；用 RAG、引用、结构化输出、校验降低。
- **流式**：逐 token 返回，降低首字延迟。

---

### 11.2 SSE 的原理？前端怎么实现流式输出？

**答：**

- 服务端返回 `Content-Type: text/event-stream`，按 `data: ...\n\n` 格式持续推送；HTTP 连接保持打开。
- 前端用 `EventSource`（只支持 GET）或 `fetch + ReadableStream`（支持 POST/Header，推荐）。
- `@microsoft/fetch-event-source` 封装了 POST SSE、重连、Abort。
- 事件格式：`event:` 自定义事件、`data:` 数据、`id:` 断点、`retry:` 重连时间。

**实现要点：**

```ts
const ctrl = new AbortController()
await fetchEventSource('/ai/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: ctrl.signal,
  onmessage(ev) {
    const data = JSON.parse(ev.data)
    // data.type: 'reasoning' | 'chat'
  },
  onerror(err) {
    // 不要静默吞掉；抛错可停止重试
    throw err
  },
  onclose() {
    // 正常结束
  },
})
// 取消：ctrl.abort()
```

**坑：** SSE 是单向的；要发消息另发 POST；Nginx 要关闭 buffering（`proxy_buffering off`）；心跳防超时；组件卸载要 abort。

---

### 11.3 Function Calling / Tool Use 是什么？

**答：**

- 给模型一组工具（JSON Schema 描述名称、参数、用途），模型根据用户问题决定调用哪个工具、传什么参数。
- 流程：用户提问 → 模型返回 `tool_calls` → 后端执行工具 → 把结果作为 `tool` 消息回传 → 模型继续生成 → 直到不再调用工具。
- 关键：工具描述要清晰、参数校验、超时/重试、最大循环次数、错误回传。

**例子：** `queryUserRecords(userId)`、`searchDictionary(word)`、`generateQuiz(wordList)`、`planReview(userId, days)`。

---

### 11.4 RAG 的完整流程？

**答：**

1. **入库**：文档 → 清洗 → 切分（chunk，按语义/固定长度/重叠）→ embedding → 存向量库。
2. **检索**：用户问题 → embedding → 向量相似度 Top-K（可加关键词/混合检索）→ 重排（rerank）。
3. **生成**：把检索到的片段 + 问题拼进 prompt，要求引用来源。
4. **评估**：召回率、准确率、引用正确性、延迟、成本。

**技术点：**

- 切分：按标题/段落/句子，chunk 300-800 token，重叠 10-20%。
- 向量库：pgvector、Milvus、Qdrant、Chroma。
- 检索：余弦相似度、HNSW 索引；多路召回 + rerank。
- 防幻觉：限制“只根据资料回答”、引用、无答案时明确说不知道。

---

### 11.5 Agent 是什么？ReAct 和循环怎么控制？

**答：**

- Agent = LLM + 工具 + 记忆 + 规划/循环，能根据目标自主决定下一步。
- **ReAct**：Reason（思考）→ Act（调工具）→ Observe（看结果）→ 循环，直到给出答案。
- 控制：最大步数、超时、工具白名单、参数校验、失败重试、终止条件、人工确认高风险操作。
- 记忆：短期（对话历史）、长期（用户画像/向量库）。
- 多 Agent：分工/辩论/评审，复杂度高，别为了炫技。

**面试表达：** 先说“Agent 不是万能，适合工具编排/多步任务”；再讲你的项目里“查询记录 → 分析 → 生成报告”的循环。

---

### 11.6 LangChain / LangGraph 是什么？

**答：**

- LangChain：LLM 应用开发框架，提供模型、Prompt、工具、链、记忆、检索等抽象。
- LangGraph：用图（节点/边/状态）编排有状态、多步骤的 Agent，支持循环、条件分支、checkpoint（持久化/恢复）。
- 本项目用 `createAgent` + `tool` 做工具调用；LangGraph 更适合复杂多步 Agent。

**注意：** 框架是工具，面试更看重你理解原理（工具调用、状态、循环），不是背 API。

---

### 11.7 AI 应用怎么控制成本、延迟和安全？

**答：**

- **成本**：选合适模型（小模型做分类/摘要）、控制上下文长度、缓存（相同问题/embedding）、批量、限流、token 统计。
- **延迟**：流式输出、首字优化、并行工具调用、预热连接、CDN/边缘。
- **安全**：Prompt 注入防护（分隔用户输入/系统提示）、PII 脱敏、输出审核、工具权限最小化、审计日志。

---

### 11.8 前端做 AI 应用的重点是什么？

**答：**

- 流式渲染：SSE/ReadableStream，增量 Markdown，`requestAnimationFrame` 批量更新，避免每个 token 都 setState。
- 取消/重试/重新生成：AbortController，保留上下文。
- 工具调用可视化：展示“正在查资料/调用工具”，而不是白屏。
- 错误处理：超时、限流、断线重连、降级提示。
- 引用/来源、复制、反馈、会话历史。
- 性能：长对话虚拟列表、代码高亮懒加载、XSS 清洗（DOMPurify）。

---

### 11.9 你的英语项目怎么讲成 AI 项目？

**答：**

- 定位：AI 英语学习平台，前端 Vue3 + TS + Vite，后端 NestJS + Prisma + PostgreSQL + Redis/BullMQ，AI 用 LangChain + DeepSeek。
- 亮点：
  - SSE 双通道流式（reasoning/content），支持中止/重连；
  - Agent 工具调用：查询用户单词记录，生成每日报告；
  - 按用户注册 BullMQ 定时任务，昨天有记录才发日报；
  - Token 无感刷新、monorepo、3D 登录页。
- 可升级（见配套文档）：RAG 单词知识库、多工具 Agent、流式工具调用、成本/评测、Docker/CI/监控。
- 面试官追问：为什么用 SSE 不用 WebSocket？Agent 怎么防死循环？RAG 怎么评估？你负责哪部分？

---

## 12. 可视化 / Three.js / Electron（P2/P3）

### 12.1 ECharts 怎么优化大数据量？

**答：**

- `dataZoom` 缩放、`sampling: 'lttb'` 降采样、`large: true`、`progressive` 分批渲染。
- 按需引入（`echarts/core` + 具体图表/组件），减小包体积。
- 避免频繁 `setOption`；用 `notMerge/lazyUpdate` 控制；图表实例 `dispose`。
- 大数据用 Canvas 渲染（默认），复杂场景考虑 WebGL/自定义系列。
- 大屏适配：`rem/vw` + `resize` 监听 + `devicePixelRatio`。

---

### 12.2 Canvas 和 SVG 的区别？

**答：**

- Canvas：位图，适合大量图形/像素操作/游戏/图表；性能好，但缩放失真、事件处理要自己算。
- SVG：矢量，DOM 节点，适合图标/少量图形/可交互/可访问；缩放清晰，但节点多时性能差。
- 选型：大数据可视化 Canvas/WebGL；图标/流程图 SVG。

---

### 12.3 Three.js 的核心概念？怎么优化？

**答：**

- 核心：`Scene`、`Camera`、`Renderer`、`Geometry`、`Material`、`Light`、`Texture`、`AnimationLoop`。
- 加载模型：`GLTFLoader`；控制：`OrbitControls`；拾取：`Raycaster`。
- 优化：`dispose()` 释放 geometry/material/texture；限制 `devicePixelRatio`；LOD；视锥剔除；压缩纹理（KTX2）；按需渲染（`renderer.setAnimationLoop` 停止）；移动端降级。
- 坑：内存泄漏（未 dispose）、resize 未更新相机/渲染器、动画循环未取消。

---

### 12.4 Electron 的主进程/渲染进程怎么通信？安全怎么做？

**答：**

- 主进程：Node 环境，创建窗口、系统 API；渲染进程：Chromium，跑前端。
- IPC：`ipcMain.handle` + `ipcRenderer.invoke`（请求/响应）；`ipcMain.on/send`（单向）；`webContents.send`。
- 安全：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`；通过 `contextBridge.exposeInMainWorld` 暴露最小 API；校验参数；禁止 `remote`。
- 打包：electron-builder；自动更新：electron-updater；签名/公证。

**项目例子：** 绑卡系统通过 WebSocket 与吐卡设备通信，主进程管理设备连接，渲染进程只调用暴露的 API。

---

### 12.5 大屏可视化怎么做适配？

**答：**

- 设计稿比例（如 1920×1080），用 `transform: scale` 整体缩放，保持比例；或 `vw/vh + rem`。
- 监听 `resize`，防抖；处理超宽/超窄留白。
- 字体/图表随比例缩放；ECharts `resize()`。
- 性能：动画用 CSS/Canvas，避免大量 DOM；数据更新节流。

---

### 12.6 Three.js 和 3D 岗位的关系？

**答：**

- 纯 3D 岗位（数字孪生/家装/游戏）要求图形学、shader、性能优化，门槛高。
- 前端岗位里的 3D 多是“会 Three.js 做展示/活动页”，基础即可。
- 建议：掌握 Scene/Camera/Renderer/GLTF/动画/性能，能讲清项目；不深挖 shader，除非明确投 3D 岗。

---

## 13. 算法与手写题（P0）

> 前端面试的算法通常不难：**JS 手写题 > LeetCode easy/medium**。先保证手写题能默写，再刷 60-80 道高频题。

### 13.1 手写题速查（必须能默写）

#### 13.1.1 防抖

```js
function debounce(fn, wait = 300, immediate = false) {
  let timer = null
  const debounced = function (...args) {
    if (timer) clearTimeout(timer)
    if (immediate && !timer) fn.apply(this, args)
    timer = setTimeout(() => {
      timer = null
      if (!immediate) fn.apply(this, args)
    }, wait)
  }
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}
```

#### 13.1.2 节流

```js
function throttle(fn, wait = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn.apply(this, args)
    }
  }
}
```

#### 13.1.3 深拷贝

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target
  if (target instanceof Date) return new Date(target)
  if (target instanceof RegExp) return new RegExp(target)
  if (map.has(target)) return map.get(target)

  const clone = Array.isArray(target) ? [] : {}
  map.set(target, clone)

  if (target instanceof Map) {
    target.forEach((v, k) => clone.set(deepClone(k, map), deepClone(v, map)))
    return clone
  }
  if (target instanceof Set) {
    target.forEach((v) => clone.add(deepClone(v, map)))
    return clone
  }
  Reflect.ownKeys(target).forEach((key) => {
    clone[key] = deepClone(target[key], map)
  })
  return clone
}
```

#### 13.1.4 手写 call / apply / bind

```js
Function.prototype.myCall = function (context, ...args) {
  context = context == null ? globalThis : Object(context)
  const key = Symbol('fn')
  context[key] = this
  const result = context[key](...args)
  delete context[key]
  return result
}

Function.prototype.myApply = function (context, args = []) {
  return this.myCall(context, ...args)
}

Function.prototype.myBind = function (context, ...args) {
  const fn = this
  function Bound(...rest) {
    const isNew = this instanceof Bound
    return fn.apply(isNew ? this : context, [...args, ...rest])
  }
  Bound.prototype = Object.create(fn.prototype)
  return Bound
}
```

#### 13.1.5 手写 new / instanceof

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('not a constructor')
  const obj = Object.create(Ctor.prototype)
  const result = Ctor.apply(obj, args)
  return result !== null && (typeof result === 'object' || typeof result === 'function')
    ? result
    : obj
}

function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left)
  while (proto) {
    if (proto === right.prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}
```

#### 13.1.6 手写 Promise.all / race / allSettled

```js
function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const result = []
    let count = 0
    if (!list.length) return resolve(result)
    list.forEach((item, i) => {
      Promise.resolve(item).then((v) => {
        result[i] = v
        if (++count === list.length) resolve(result)
      }, reject)
    })
  })
}

function promiseRace(list) {
  return new Promise((resolve, reject) => {
    list.forEach((item) => Promise.resolve(item).then(resolve, reject))
  })
}

function promiseAllSettled(list) {
  return Promise.all(
    list.map((item) =>
      Promise.resolve(item).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason })
      )
    )
  )
}
```

#### 13.1.7 并发控制 asyncPool

```js
async function asyncPool(limit, tasks) {
  const results = []
  const executing = new Set()
  for (const [index, task] of tasks.entries()) {
    const p = Promise.resolve().then(() => task())
    results[index] = p
    executing.add(p)
    const clean = () => executing.delete(p)
    p.then(clean, clean)
    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }
  return Promise.all(results)
}
```

#### 13.1.8 EventEmitter

```js
class EventEmitter {
  constructor() {
    this.events = new Map()
  }
  on(name, fn) {
    const list = this.events.get(name) || []
    list.push(fn)
    this.events.set(name, list)
    return () => this.off(name, fn)
  }
  off(name, fn) {
    const list = this.events.get(name)
    if (!list) return
    this.events.set(name, list.filter((item) => item !== fn))
  }
  once(name, fn) {
    const wrapper = (...args) => {
      fn(...args)
      this.off(name, wrapper)
    }
    this.on(name, wrapper)
  }
  emit(name, ...args) {
    ;(this.events.get(name) || []).slice().forEach((fn) => fn(...args))
  }
}
```

#### 13.1.9 数组扁平化

```js
function flatten(arr, depth = Infinity) {
  return arr.reduce((acc, cur) => {
    if (Array.isArray(cur) && depth > 0) {
      acc.push(...flatten(cur, depth - 1))
    } else {
      acc.push(cur)
    }
    return acc
  }, [])
}
```

#### 13.1.10 柯里化 / 组合

```js
const curry = (fn) => {
  const arity = fn.length
  return function curried(...args) {
    if (args.length >= arity) return fn(...args)
    return (...rest) => curried(...args, ...rest)
  }
}

const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x)
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x)
```

#### 13.1.11 LRU

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }
  get(key) {
    if (!this.map.has(key)) return -1
    const value = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value)
    }
  }
}
```

#### 13.1.12 手写浅比较 / 数组去重 / 千分位

```js
const unique = (arr) => [...new Set(arr)]

const thousands = (num) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

function shallowEqual(a, b) {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key]))
}
```

### 13.2 LeetCode 高频题（思路 + 复杂度）

1. **Two Sum**：哈希表存 `target - num`，O(n)/O(n)。
2. **三数之和**：排序 + 双指针，固定一个数，注意去重，O(n²)。
3. **有效括号**：栈，左括号入栈，右括号匹配，O(n)。
4. **合并区间**：按左端点排序，遍历合并，O(n log n)。
5. **Top K**：小顶堆 O(n log k) 或快速选择 O(n) 平均。
6. **二分查找**：注意 `left <= right` 和 `mid` 溢出，O(log n)。
7. **反转链表**：prev/curr/next 三指针，O(n)。
8. **合并两个有序链表**：双指针 + 哨兵节点，O(n+m)。
9. **二叉树最大深度**：递归 `1 + max(left,right)`，O(n)。
10. **层序遍历**：队列 BFS，记录每层长度，O(n)。
11. **爬楼梯**：`dp[i] = dp[i-1] + dp[i-2]`，滚动变量 O(n)/O(1)。
12. **最大子数组和**：Kadane，`cur = max(num, cur + num)`，O(n)。

### 13.3 复杂度速查

- 数组 push/pop O(1)，shift/unshift O(n)，sort O(n log n)。
- 哈希表/Set 平均 O(1)，最坏 O(n)。
- 二叉树遍历 O(n)，递归栈 O(h)。
- 排序：快排平均 O(n log n)/最坏 O(n²)，归并 O(n log n)/O(n)，堆 O(n log n)/O(1)。

### 13.4 算法复习节奏

- 第 1-3 周，每天 45 分钟；先手写题，再 LeetCode。
- 每题：10 分钟想 → 20 分钟写 → 10 分钟讲复杂度和边界；25 分钟没思路看答案，第二天重写。
- 目标 60-80 题；不做 hard；面试反馈不考就停。

---

## 14. 项目与 HR 问题（P0）

### 14.1 自我介绍怎么说？

**模板（1-2 分钟）：**

> 面试官好，我叫 XXX，4 年前端开发经验，目前在杭州。最近一份是在阿里巴巴淘天集团（外包驻场）做商家端活动开发，基于 Magix 框架和内部组件库，按阿里研发流程完成需求评审、开发、联调和发布，也用了 Qoder 做 AI 辅助编码。之前在一家软件公司独立负责培训、测评类系统的 0-1 交付，覆盖 PC 管理端、数据大屏、Electron 桌面端，能独立部署和现场联调。技术栈主要是 Vue3/React + TypeScript + Vite，熟悉 Node/NestJS、ECharts、Electron。个人做了一个 AI 英语学习平台，用 SSE 做流式对话、BullMQ 做定时任务。我想找一份能长期做的前端岗位，偏中后台/活动/可视化都可以。

**要点：** 4 年 + 最近公司 + 核心业务 + 技术栈 + 个人亮点 + 求职意向；不要背简历。

---

### 14.2 项目难点怎么讲？（STAR）

**S（背景）**：业务背景、规模、你的角色。
**T（任务）**：你要解决的问题、目标。
**A（行动）**：你的方案、技术选型、为什么这么做、遇到什么坑。
**R（结果）**：量化结果、上线效果、你的复盘。

**示例（阿里商家活动）：**

- S：淘天商家端活动，流量集中、时间紧、跨团队。
- T：10 个月交付多个商家活动，保证页面稳定和按时上线。
- A：基于 Magix + 内部组件库快速搭建；活动页配置化/组件复用；按阿里规范联调发布；用 Qoder 辅助编码和 Review。
- R：交付 X 个活动/需求，活动期间零事故/线上问题 X 个，形成可复用模板。

**注意：** 不要说“我们”，要说“我负责什么”；准备 2-3 个不同角度的故事（业务、技术、线上问题）。

---

### 14.3 为什么离开上一份/为什么有空窗？

**答：**

- 外包项目结束/合同到期是常见原因；如实说，不要抱怨。
- 空窗：诚实 + 产出 + 看机会。比如“项目结束后想沉淀一下，系统补了 AI 应用开发，做了英语学习平台，同时在看机会”。
- 不要编造在职经历；背调/社保容易查。

**话术：**

> 上一段是外包驻场，项目周期结束；这段经历让我熟悉了大厂研发流程和商家业务。之后我花时间把 AI 应用全栈项目做完整，也一直在看杭州的前端机会，想找能长期做、能独立负责的岗位。

---

### 14.4 外包经历会被歧视吗？怎么看？

**答：**

- 有些公司会过滤外包，但也有公司看重你在大厂体系里做过事。
- 面试时强调：**业务 + 流程 + 产出**，不要强调“外包”身份。
- 被问“为什么做外包”：说想进大厂体系、接触商家业务、学习规范；后来选择更完整的 0-1 交付。
- 不要贬低前公司/客户；保持职业。

---

### 14.5 期望薪资怎么谈？

**答：**

- 简历写 14-18K；被问期望，先问岗位预算/范围，再给区间。
- 底线 13K；有阿里最近经历可以争取 15-18K。
- 不要主动写 11-15K；不要第一句就报最低价。
- 谈总包：基本工资、绩效、年终、补贴、加班；试用期折扣。

**话术：**

> 我期望 15-18K，具体看岗位职责和整体包；我上一份是外包，薪资结构可能和贵司不同，我更看重长期发展和业务匹配。

---

### 14.6 你的优点和缺点？

**答：**

- 优点：独立负责、能 0-1 交付、跨团队沟通、学习能力强（Magix/Qoder/AI 项目）。
- 缺点：不要用“我太追求完美”；说一个真实但可改进的点，比如“之前偏业务实现，最近在系统补工程化/性能/测试”，并说明行动。

---

### 14.7 职业规划？

**答：**

- 短期（1 年）：扎根业务，独立负责模块，补工程化/性能/Node。
- 中期（2-3 年）：成为前端骨干/小 leader，能带项目/带人，往全栈/AI 应用方向延伸。
- 长期：技术专家/前端负责人；不要说“3 年当 CTO”这种空话。

---

### 14.8 你有什么想问的？

**答（选 2-3 个）：**

- 团队目前的前端技术栈和业务方向？
- 这个岗位最看重的能力/前 3 个月的目标？
- 团队的研发流程（需求、评审、测试、发布）？
- 有没有导师/代码 Review/技术分享？
- 加班和绩效机制？

**不要问：** 工资多少、能不能不加班、公司是不是要倒闭。

---

## 附：复习计划与自测

### 复习节奏（3 周）

- 第 1 周：JS + CSS + 浏览器/网络 + 手写题。
- 第 2 周：Vue3 + React + 工程化/性能 + 项目 STAR。
- 第 3 周：Node/后端 + Docker/CI + AI/可视化（按岗位）+ 模拟面试。

### 自测清单（能答出来再跳过）

- [ ] 能讲清事件循环并手写输出题
- [ ] 能手写防抖/节流/深拷贝/bind/new/Promise.all/LRU
- [ ] 能讲清 HTTP 缓存/CORS/XSS/CSRF
- [ ] 能讲清 Vue3 响应式/diff/nextTick
- [ ] 能讲清 React Hooks/Fiber/闭包陷阱
- [ ] 能讲清 Vite/Webpack/tree shaking/代码分割
- [ ] 能讲清 JWT 刷新/Redis 缓存/BullMQ
- [ ] 能讲清 SSE/Function Calling/RAG/Agent
- [ ] 能讲 3 个 STAR 项目故事
- [ ] 能回答离职/空窗/薪资/外包

### 面试答题技巧

1. 先给结论，再展开 2-3 点，不要背长文。
2. 不会就说“这块我了解不深，我的理解是……”，不要瞎编。
3. 主动关联项目：“这个点我在英语项目里用过，当时是……”
4. 面试结束记 3 个没答好的问题，48 小时内补掉。



