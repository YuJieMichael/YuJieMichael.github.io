/**
 * 开场动画结束的信号：首页的入场时间线等它 resolve 再开始。
 * 没有开场动画（本次会话看过了、或减少动态效果）时，Preloader 会立刻 resolve。
 */
let resolveIntro: () => void
export const introDone = new Promise<void>((r) => (resolveIntro = r))
export const finishIntro = () => resolveIntro()
