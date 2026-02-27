export function throttle(func: Function, delay: number) {
  let timeoutId: number | null = null
  let lastExecTime = 0
  
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = window.setTimeout(() => {
        func.apply(this, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}